import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentClientDeal } from "@/lib/portalAuth";
import { notifyClient } from "@/lib/notifications/orchestrator";
import {
  sendPaymentObservedAlerts,
  sendPaymentClearedAlerts,
} from "@/lib/notifications/transactionalEmailAlerts";

export const runtime = "nodejs";

async function loadMatter(id: string) {
  const admin = createAdminClient();
  return admin
    .from("deals")
    .select("id,deal_id,client_name,email,payment_status,payment_settlement_status,payment_confirmed,payment_observed_at,payment_confirmed_at,amount_due,amount_paid,currency")
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
    .select("id,deal_id,client_name,email,payment_status,payment_settlement_status,payment_confirmed,payment_observed_at,payment_confirmed_at,amount_due,amount_paid,currency")
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
    message: "Wise payment submission recorded. Settlement remains pending until Wise confirms it.",
  });
}
