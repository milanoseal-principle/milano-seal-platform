import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentClientDeal } from "@/lib/portalAuth";
import { notifyClient } from "@/lib/notifications/orchestrator";
import {
  sendPaymentObservedAlerts,
  sendPaymentClearedAlerts,
} from "@/lib/notifications/transactionalEmailAlerts";
import { reconcileWiseMatter } from "@/lib/wise/reconciliation";

export const runtime = "nodejs";

async function loadMatter(id: string) {
  const admin = createAdminClient();
  return admin
    .from("deals")
    .select("id,deal_id,client_name,email,payment_status,payment_settlement_status,payment_confirmed,payment_observed_at,payment_confirmed_at,amount_due,amount_paid,currency,wise_transaction_reference,payment_funding_method")
    .eq("id", id)
    .single();
}

function payload(row: Record<string, unknown>) {
  const paymentConfirmed = Boolean(row.payment_confirmed) || ["paid", "confirmed", "payment_confirmed"].includes(String(row.payment_status ?? "").toLowerCase());
  return {
    matterId: String(row.id ?? ""),
    displayId: String(row.deal_id ?? row.id ?? ""),
    paymentStatus: String(row.payment_status ?? "unpaid"),
    settlementStatus: String(row.payment_settlement_status ?? ""),
    paymentConfirmed,
    paymentObservedAt: row.payment_observed_at ?? null,
    paymentConfirmedAt: row.payment_confirmed_at ?? null,
    amountDue: Number(row.amount_due ?? 0),
    amountPaid: Number(row.amount_paid ?? 0),
    currency: String(row.currency ?? "USD"),
    providerEvidence: Boolean(row.wise_transaction_reference),
  };
}

async function maybeSendCleared(row: Record<string, unknown>) {
  const state = payload(row);
  if (!state.paymentConfirmed) return;
  await sendPaymentClearedAlerts({
    matterId: state.matterId,
    matterReference: state.displayId,
    clientEmail: typeof row.email === "string" ? row.email : null,
    amountPaid: state.amountPaid > 0 ? state.amountPaid : state.amountDue,
    currency: state.currency,
  });
}

export async function GET(req: NextRequest) {
  const requestedId = req.nextUrl.searchParams.get("deal_id");
  const ctx = await getCurrentClientDeal(requestedId);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ctx.deal) return NextResponse.json({ error: "Matter not found" }, { status: 404 });

  const { data, error } = await loadMatter(ctx.deal.id);
  if (error || !data) return NextResponse.json({ error: "Payment status unavailable" }, { status: 500 });
  const row = data as Record<string, unknown>;
  await maybeSendCleared(row);
  return NextResponse.json({ success: true, payment: payload(row) });
}

/**
 * PUT performs a real server-to-Wise reconciliation for the authenticated
 * client's Matter. It never trusts browser state and never marks paid unless
 * the canonical Wise settlement matcher confirms the corresponding balance
 * credit. An acquiring payment in progress is provider evidence and may
 * authorize scheduling/execution preparation without inventing cleared funds.
 */
export async function PUT(req: NextRequest) {
  const server = await createClient();
  const { data: { user } } = await server.auth.getUser();
  if (!user?.id || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { deal_id?: unknown };
  const requestedId = typeof body.deal_id === "string" ? body.deal_id : null;
  const ctx = await getCurrentClientDeal(requestedId);
  if (!ctx?.deal) return NextResponse.json({ error: "Matter not found" }, { status: 404 });

  try {
    const before = await loadMatter(ctx.deal.id);
    const wasConfirmed = before.data ? payload(before.data as Record<string, unknown>).paymentConfirmed : false;
    const reconciliation = await reconcileWiseMatter(ctx.deal.id);
    const { data, error } = await loadMatter(ctx.deal.id);
    if (error || !data) {
      return NextResponse.json({ error: "Payment status unavailable" }, { status: 500 });
    }

    const row = data as Record<string, unknown>;
    const state = payload(row);
    if (!wasConfirmed && state.paymentConfirmed) {
      await notifyClient(state.matterId, "payment_confirmed");
      await maybeSendCleared(row);
    }

    const message = state.paymentConfirmed
      ? "Wise settlement verified. Paid state is confirmed."
      : reconciliation.providerEvidence
        ? reconciliation.providerStatus === "CANCELLED"
          ? "Wise reports this payment as cancelled. Please review the payment before continuing."
          : reconciliation.providerStatus === "REQUIRES_ATTENTION"
            ? "Wise reports that this payment requires attention. The Matter remains under payment review."
            : "Wise payment located. Provider evidence is recorded. Scheduling and execution preparation may continue while settlement clears; final release remains settlement-gated."
        : "Wise has not exposed a matching acquiring payment yet. Automatic reconciliation will continue.";

    return NextResponse.json({
      success: true,
      payment: state,
      provider: {
        matched: reconciliation.providerEvidence,
        status: reconciliation.providerStatus,
        settlementConfirmed: reconciliation.settlementConfirmed,
      },
      message,
    });
  } catch (error) {
    console.error("[wise-reconciliation] portal refresh failed", {
      matterId: ctx.deal.id,
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return NextResponse.json(
      {
        error: "Live Wise verification is temporarily unavailable. Your recorded payment submission remains intact and automatic reconciliation will continue.",
      },
      { status: 503 },
    );
  }
}

/**
 * POST records only the client's statement that they submitted payment in Wise.
 * It is intentionally not provider evidence and never authors paid state.
 */
export async function POST(req: NextRequest) {
  const server = await createClient();
  const { data: { user } } = await server.auth.getUser();
  if (!user?.id || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { deal_id?: unknown };
  const requestedId = typeof body.deal_id === "string" ? body.deal_id : null;
  const ctx = await getCurrentClientDeal(requestedId);
  if (!ctx?.deal) return NextResponse.json({ error: "Matter not found" }, { status: 404 });

  const { data: current, error: currentError } = await loadMatter(ctx.deal.id);
  if (currentError || !current) {
    return NextResponse.json({ error: "Payment status unavailable" }, { status: 500 });
  }
  const currentRow = current as Record<string, unknown>;
  const currentState = payload(currentRow);
  if (currentState.paymentConfirmed) {
    await maybeSendCleared(currentRow);
    return NextResponse.json({ success: true, payment: currentState });
  }
  if (currentState.amountDue <= 0) {
    return NextResponse.json({ error: "No payable Wise obligation is open for this Matter." }, { status: 409 });
  }

  const now = new Date().toISOString();
  const admin = createAdminClient();
  const { data: updated, error } = await admin
    .from("deals")
    .update({
      payment_settlement_status: "observed_pending",
      payment_observed_at: currentRow.payment_observed_at ?? now,
      updated_at: now,
    })
    .eq("id", ctx.deal.id)
    .eq("payment_confirmed", false)
    .select("id,deal_id,client_name,email,payment_status,payment_settlement_status,payment_confirmed,payment_observed_at,payment_confirmed_at,amount_due,amount_paid,currency,wise_transaction_reference,payment_funding_method")
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: "Payment observation could not be recorded." }, { status: 500 });
  }

  const row = updated as Record<string, unknown>;
  const state = payload(row);
  await notifyClient(state.matterId, "payment_observed");
  await sendPaymentObservedAlerts({
    matterId: state.matterId,
    matterReference: state.displayId,
    clientName: typeof row.client_name === "string" ? row.client_name : null,
    clientEmail: typeof row.email === "string" ? row.email : user.email,
    amountDue: state.amountDue,
    currency: state.currency,
  });

  return NextResponse.json({
    success: true,
    payment: state,
    message: "Wise payment submission recorded. Live Wise reconciliation will verify provider activity automatically.",
  });
}
