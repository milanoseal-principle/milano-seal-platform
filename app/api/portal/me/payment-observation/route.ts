import { createHash, randomUUID } from "node:crypto";
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
import { appendMatterEvidence, readMatterEvidence } from "@/lib/matter/evidenceLedger";
import { evaluatePaymentGate } from "@/lib/payments/paymentGate";
import { hasCurrentWiseProviderEvidence, hasCurrentWiseSubmissionSnapshot, isInvalidWiseStatus } from "@/lib/wise/attemptEvidence";
import { requiredPolicyBlockers } from "@/lib/policy/acceptance";

export const runtime = "nodejs";

const WISE_HANDOFF_EVENT = "WISE_PAYMENT_HANDOFF_OPENED";
const HANDOFF_MAX_AGE_MS = 4 * 60 * 60 * 1000;

async function loadMatter(id: string) {
  const admin = createAdminClient();
  return admin
    .from("deals")
    .select("id,deal_id,client_name,email,payment_status,payment_settlement_status,payment_confirmed,payment_observed_at,payment_confirmed_at,amount_due,amount_paid,currency,wise_reference,wise_payment_url:payment_link,wise_transaction_reference,payment_funding_method,payment_attempt_id,payment_attempt_started_at,wise_provider_evidence,payment_observed_amount,payment_observed_currency,payment_observed_reference")
    .eq("id", id)
    .single();
}

function payload(row: Record<string, unknown>) {
  const paymentConfirmed = evaluatePaymentGate({ ...row, id: String(row.id) } as Parameters<typeof evaluatePaymentGate>[0]) === "PAYMENT_CONFIRMED";
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
    currency: String(row.currency ?? "USD").toUpperCase(),
    wiseReference: String(row.wise_reference ?? row.deal_id ?? "").trim(),
    submissionCurrent: hasCurrentWiseSubmissionSnapshot(row as unknown as Parameters<typeof hasCurrentWiseSubmissionSnapshot>[0]),
    providerEvidence: hasCurrentWiseProviderEvidence({ ...row, id: String(row.id) } as Parameters<typeof hasCurrentWiseProviderEvidence>[0]),
  };
}

function isWiseUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === "https:" && (
      host === "wise.com" || host.endsWith(".wise.com") ||
      host === "transferwise.com" || host.endsWith(".transferwise.com")
    );
  } catch {
    return false;
  }
}

function urlFingerprint(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function currentPaymentSnapshot(row: Record<string, unknown>) {
  const state = payload(row);
  const reference = String(row.wise_reference ?? row.deal_id ?? "").trim();
  const paymentUrl = isWiseUrl(row.wise_payment_url) ? row.wise_payment_url : null;
  return {
    amountDue: state.amountDue,
    currency: state.currency,
    wiseReference: reference,
    paymentUrl,
    paymentUrlFingerprint: paymentUrl ? urlFingerprint(paymentUrl) : null,
  };
}

function metadataRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function sameSnapshot(metadata: Record<string, unknown>, snapshot: ReturnType<typeof currentPaymentSnapshot>) {
  return Number(metadata.amountDue) === snapshot.amountDue
    && String(metadata.currency ?? "").toUpperCase() === snapshot.currency
    && String(metadata.wiseReference ?? "") === snapshot.wiseReference
    && String(metadata.paymentUrlFingerprint ?? "") === String(snapshot.paymentUrlFingerprint ?? "");
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
 * PATCH records the server-derived Wise handoff snapshot before the browser may
 * leave Milano. It is evidence of a governed payment attempt, never evidence
 * that money was submitted, received or settled.
 */
export async function PATCH(req: NextRequest) {
  const server = await createClient();
  const { data: { user } } = await server.auth.getUser();
  if (!user?.id || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { deal_id?: unknown };
  const requestedId = typeof body.deal_id === "string" ? body.deal_id : null;
  const ctx = await getCurrentClientDeal(requestedId);
  if (!ctx?.deal) return NextResponse.json({ error: "Matter not found" }, { status: 404 });

  const { data, error } = await loadMatter(ctx.deal.id);
  if (error || !data) return NextResponse.json({ error: "Payment status unavailable" }, { status: 500 });
  const row = data as Record<string, unknown>;
  const state = payload(row);
  if (state.paymentConfirmed) {
    return NextResponse.json({ success: true, payment: state, alreadyConfirmed: true });
  }

  const snapshot = currentPaymentSnapshot(row);
  if (snapshot.amountDue <= 0 || !snapshot.wiseReference || !snapshot.paymentUrl) {
    return NextResponse.json({ error: "Secure Wise payment instructions are not ready for this Matter." }, { status: 409 });
  }

  const correlationId = randomUUID();
  const occurredAt = new Date().toISOString();
  const evidence = await appendMatterEvidence({
    matterId: ctx.deal.id,
    eventType: WISE_HANDOFF_EVENT,
    domain: "payment",
    actorType: "client",
    actorId: user.id,
    occurredAt,
    source: "portal-wise-payment-ritual",
    sourceReference: snapshot.wiseReference,
    correlationId,
    reason: "Client opened the governed Milano-to-Wise payment handoff.",
    metadata: {
      amountDue: snapshot.amountDue,
      currency: snapshot.currency,
      wiseReference: snapshot.wiseReference,
      paymentUrlFingerprint: snapshot.paymentUrlFingerprint,
    },
  });

  return NextResponse.json({
    success: true,
    handoff: { evidenceId: evidence.id, correlationId, occurredAt },
  });
}

/**
 * PUT performs a real server-to-Wise reconciliation for the authenticated
 * client's Matter. It never trusts browser state and never marks paid unless
 * the canonical Wise settlement matcher confirms the corresponding balance
 * credit.
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
      await notifyClient(state.matterId, "payment_cleared");
      await maybeSendCleared(row);
    }

    const message = state.paymentConfirmed
      ? "Wise settlement verified. Paid state is confirmed."
      : isInvalidWiseStatus(state.settlementStatus) || isInvalidWiseStatus(state.paymentStatus)
        ? "The prior Wise attempt is invalidated. Review the payment with your coordinator; a fresh governed handoff is required before any new submission."
        : reconciliation.providerEvidence
        ? reconciliation.providerStatus === "CANCELLED"
          ? "Wise reports this payment as cancelled. Please review the payment before continuing."
          : reconciliation.providerStatus === "REQUIRES_ATTENTION"
            ? "Wise reports that the payment requires attention. Your Matter remains preserved while it is reviewed."
            : "Payment submission is recorded. Scheduling requires a matching current submission; execution requires current Wise provider evidence."
        : state.paymentObservedAt
          ? "Payment submission is recorded. Your Matter remains active while settlement completes in the background."
          : "No payment submission has been recorded yet.";

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
        error: "Payment verification is temporarily unavailable. Your recorded submission remains intact and automatic checks will continue.",
      },
      { status: 503 },
    );
  }
}

/**
 * POST records only the client's statement that they completed the Wise flow.
 * A new observation requires a recent, server-recorded Milano → Wise handoff
 * with the same Matter reference, amount, currency and payment-link fingerprint.
 * It never authors paid state.
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

  // P8: policies the owner has published as required for this surface must be accepted server-side first.
  const policyBlockers = await requiredPolicyBlockers(createAdminClient(), ctx.deal.id, "wise_payment_submission");
  if (policyBlockers.length > 0) {
    return NextResponse.json({
      error: "Please review and accept the current policies before confirming payment.",
      code: "POLICY_ACCEPTANCE_REQUIRED",
      policies: policyBlockers,
      retry_safe: true,
      next_owner: "CLIENT",
    }, { status: 409 });
  }

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

  // Preserve already-observed Matters (including pre-hardening production data)
  // without forcing clients to manufacture a second payment handoff.
  if (currentState.paymentObservedAt && ["observed_pending", "observed_available"].includes(currentState.settlementStatus) &&
      hasCurrentWiseSubmissionSnapshot(currentRow as unknown as Parameters<typeof hasCurrentWiseSubmissionSnapshot>[0])) {
    return NextResponse.json({
      success: true,
      payment: currentState,
      message: "Payment submission is already recorded. You do not need to submit payment again.",
    });
  }

  const snapshot = currentPaymentSnapshot(currentRow);
  const evidenceRows = await readMatterEvidence(ctx.deal.id, 50);
  const handoff = evidenceRows.find((event) => {
    if (event.event_type !== WISE_HANDOFF_EVENT || event.actor_id !== user.id) return false;
    const occurred = Date.parse(String(event.occurred_at ?? ""));
    if (!Number.isFinite(occurred) || Date.now() - occurred > HANDOFF_MAX_AGE_MS) return false;
    return sameSnapshot(metadataRecord(event.metadata), snapshot);
  });

  if (!handoff) {
    return NextResponse.json(
      { error: "Open this Matter's secure Wise payment from The Milano Seal before confirming payment." },
      { status: 409 },
    );
  }

  const admin = createAdminClient();
  // The row lock, snapshot check, attempt rotation and evidence append commit
  // together. A failed write cannot emit a successful client observation.
  const { data: updated, error } = await admin.rpc("begin_wise_payment_attempt", {
    p_deal_id: ctx.deal.id,
    p_handoff_id: handoff.id,
    p_actor_id: user.id,
  });

  if (error || !updated) {
    return NextResponse.json({ error: "Payment submission could not be recorded." }, { status: 500 });
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

  // Attempt provider settlement immediately; failure does not erase the
  // governed submission observation and the cron continues independently.
  void reconcileWiseMatter(state.matterId).catch((error) => {
    console.warn("[wise-reconciliation] immediate post-submission check deferred", {
      matterId: state.matterId,
      error: error instanceof Error ? error.message : "unknown_error",
    });
  });

  return NextResponse.json({
    success: true,
    payment: state,
    message: "Payment submitted successfully. Your Matter remains active while Wise completes settlement in the background. You do not need to submit payment again.",
  });
}
