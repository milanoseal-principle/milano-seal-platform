import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWiseSignature } from "@/lib/wise";
import { mapWiseTransferState, mapWiseBalanceEvent } from "@/lib/wise/status";
import { logActivity } from "@/lib/activity";
import { appendLedger, CUSTODY_EVENTS } from "@/lib/custodyLedger";
import { notifyClient } from "@/lib/notifications/orchestrator";
import { createHash } from "crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ok: true }, { status: 200 });
}

// Wise payment webhooks — canonical production endpoint only.
// URL: https://themilanoseal.com/api/webhooks/wise
// Secured via RSA-SHA256 signature on X-Signature-SHA256.
// Deduplicated via X-Delivery-Id with a deterministic hash fallback.

function isTestNotification(req: NextRequest): boolean {
  return req.headers.get("X-Test-Notification") === "true";
}

function allowTestNotifications(): boolean {
  return process.env.WISE_WEBHOOK_ALLOWED_TEST === "true";
}

function getEnvironment(): string {
  return process.env.WISE_ENV === "production" ? "production" : "sandbox";
}

function checkTestBypass(req: NextRequest): boolean {
  const bypassSecret = process.env.WISE_WEBHOOK_TEST_BYPASS;
  if (!bypassSecret) return false;
  if (process.env.WISE_ENV === "production") return false;
  return req.headers.get("X-Test-Bypass") === bypassSecret;
}

function toMinorUnits(value: number): number {
  return Math.round(value * 100);
}

function extractAmount(resource: Record<string, unknown>): number | null {
  const raw =
    resource.amount ??
    resource.sourceAmount ??
    resource.targetAmount ??
    resource.value;

  const candidate =
    typeof raw === "number"
      ? raw
      : typeof raw === "string"
        ? Number(raw)
        : typeof raw === "object" && raw !== null
          ? Number((raw as Record<string, unknown>).value)
          : Number.NaN;

  return Number.isFinite(candidate) && candidate > 0 ? candidate : null;
}

function extractCurrency(resource: Record<string, unknown>): string | null {
  const rawAmount =
    resource.amount ??
    resource.sourceAmount ??
    resource.targetAmount ??
    resource.value;

  const candidate =
    resource.currency ??
    resource.sourceCurrency ??
    resource.targetCurrency ??
    (typeof rawAmount === "object" && rawAmount !== null
      ? (rawAmount as Record<string, unknown>).currency
      : null);

  if (typeof candidate !== "string") return null;
  const normalized = candidate.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(normalized) ? normalized : null;
}

export async function POST(req: NextRequest) {
  const deliveryId = req.headers.get("X-Delivery-Id") ?? null;
  const testNotification = isTestNotification(req);
  const env = getEnvironment();

  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: "Cannot read body" }, { status: 400 });
  }

  const signature = req.headers.get("X-Signature-SHA256");
  const valid = checkTestBypass(req) || (await verifyWiseSignature(rawBody, signature));
  if (!valid) {
    console.warn("[wise-webhook] invalid signature — delivery:", deliveryId);
    try {
      const supabase = createAdminClient();
      await supabase.from("wise_webhook_events").insert({
        delivery_id: deliveryId,
        event_type: "SIGNATURE_INVALID",
        signature_valid: false,
        test_notification: testNotification,
        environment: env,
        raw_payload: {},
        processed: false,
        processing_error: "signature_verification_failed",
      });
    } catch {
      // Non-fatal: preserve provider retry behavior even if audit storage is unavailable.
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (testNotification && env === "production" && !allowTestNotifications()) {
    console.info("[wise-webhook] test notification blocked in production — delivery:", deliveryId);
    return NextResponse.json({ received: true, skipped: true, reason: "test_notification_blocked" });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = String(payload.event_type ?? payload.type ?? "");
  const schemaVersion = String(payload.schema_version ?? "");
  const subscriptionId = String(payload.subscription_id ?? "");
  const occurredAt = String(
    (payload.data as Record<string, unknown> | undefined)?.occurred_at ??
      payload.sent_at ??
      new Date().toISOString(),
  );
  const data = (payload.data ?? {}) as Record<string, unknown>;
  const resource = (data.resource ?? payload.resource ?? {}) as Record<string, unknown>;
  const resourceType = String(data.resource_type ?? resource.type ?? "");
  const resourceId = String(resource.id ?? resource.profileId ?? "");
  const currentState = String(resource.currentState ?? resource.status ?? "");
  const previousState = String(resource.previousState ?? "");

  if (!eventType) {
    return NextResponse.json({ received: true, skipped: true, reason: "no_event_type" });
  }

  const supabase = createAdminClient();

  if (deliveryId) {
    const { data: existing } = await supabase
      .from("wise_webhook_events")
      .select("id")
      .eq("delivery_id", deliveryId)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ received: true, duplicate: true });
    }
  } else {
    const fallbackHash = createHash("sha256")
      .update(`${eventType}:${resourceId}:${currentState}:${occurredAt}`)
      .digest("hex");
    const { data: existing } = await supabase
      .from("wise_webhook_events")
      .select("id")
      .eq("idempotency_hash", fallbackHash)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ received: true, duplicate: true });
    }
  }

  const fallbackHash = createHash("sha256")
    .update(`${eventType}:${resourceId}:${currentState}:${occurredAt}`)
    .digest("hex");

  const { data: eventRow } = await supabase
    .from("wise_webhook_events")
    .insert({
      delivery_id: deliveryId,
      subscription_id: subscriptionId || null,
      event_type: eventType,
      schema_version: schemaVersion || null,
      signature_valid: true,
      test_notification: testNotification,
      environment: env,
      resource_type: resourceType || null,
      resource_id: resourceId || null,
      current_state: currentState || null,
      previous_state: previousState || null,
      occurred_at: occurredAt,
      raw_payload: payload,
      processed: false,
      idempotency_hash: fallbackHash,
    })
    .select("id")
    .single();

  const eventRowId = eventRow?.id ?? null;

  try {
    await processWiseEvent({
      eventType,
      resource,
      currentState,
      testNotification,
      env,
      eventRowId,
      supabase,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (eventRowId) {
      await supabase
        .from("wise_webhook_events")
        .update({ processing_error: message })
        .eq("id", eventRowId);
    }
    console.error("[wise-webhook] processing error:", message);
  }

  return NextResponse.json({ received: true, event_type: eventType });
}

async function processWiseEvent(opts: {
  eventType: string;
  resource: Record<string, unknown>;
  currentState: string;
  testNotification: boolean;
  env: string;
  eventRowId: string | null;
  supabase: ReturnType<typeof createAdminClient>;
}): Promise<void> {
  const { eventType, resource, currentState, testNotification, env, eventRowId, supabase } = opts;

  let milanoStatus =
    eventType === "transfers#state-change"
      ? mapWiseTransferState(currentState)
      : mapWiseBalanceEvent(eventType);

  const handledTypes = [
    "transfers#state-change",
    "balances#credit",
    "balances#update",
    "swift-in#credit",
    "transfers#payout-failure",
    "transfers#refund",
  ];
  if (!handledTypes.includes(eventType)) return;

  const reference = String(
    resource.reference ??
      (resource.details as Record<string, unknown> | undefined)?.reference ??
      (resource.metadata as Record<string, unknown> | undefined)?.reference ??
      "",
  ).trim();

  if (!reference) {
    await flagForReview(supabase, eventRowId, "no_reference", null);
    return;
  }

  const { data: deal } = await supabase
    .from("deals")
    .select("id, deal_id, payment_status, amount_due, amount_paid, wise_reference")
    .or(`wise_reference.eq.${reference},deal_id.eq.${reference}`)
    .maybeSingle();

  if (!deal) {
    await flagForReview(supabase, eventRowId, "no_matching_deal", reference);
    return;
  }

  if (deal.payment_status === "paid") {
    if (eventRowId) {
      await supabase
        .from("wise_webhook_events")
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq("id", eventRowId);
    }
    return;
  }

  const eventAmount = extractAmount(resource);
  const eventCurrency = extractCurrency(resource);
  const amountDue = Number(deal.amount_due ?? 0);

  // Payment can never be confirmed from an inferred amount or inferred currency.
  // Missing/malformed values are quarantined for reconciliation review.
  if (eventAmount === null) {
    await flagForReview(supabase, eventRowId, "missing_or_invalid_amount", reference, deal.id);
    return;
  }
  if (!eventCurrency) {
    await flagForReview(supabase, eventRowId, "missing_or_invalid_currency", reference, deal.id);
    return;
  }
  if (!Number.isFinite(amountDue) || amountDue <= 0) {
    await flagForReview(supabase, eventRowId, "missing_or_invalid_amount_due", reference, deal.id);
    return;
  }

  const eventMinor = toMinorUnits(eventAmount);
  const dueMinor = toMinorUnits(amountDue);
  if (eventMinor < dueMinor) {
    await flagForReview(supabase, eventRowId, "underpayment", reference, deal.id);
    return;
  }
  if (eventMinor > dueMinor) {
    await flagForReview(supabase, eventRowId, "overpayment", reference, deal.id);
    return;
  }
  if (eventCurrency !== "USD") {
    await flagForReview(supabase, eventRowId, "currency_mismatch", reference, deal.id);
    return;
  }

  const envMismatch = env === "production" && testNotification && !allowTestNotificationsGlobal();
  if (envMismatch) {
    await flagForReview(supabase, eventRowId, "environment_mismatch", reference, deal.id);
    return;
  }

  if (milanoStatus === "PAYMENT_REVIEW_REQUIRED") {
    await flagForReview(supabase, eventRowId, "requires_reconciliation", reference, deal.id);
    return;
  }

  if (milanoStatus === "PAYMENT_FAILED") {
    await supabase
      .from("deals")
      .update({ payment_status: "failed", updated_at: new Date().toISOString() })
      .eq("id", deal.id);
    await logActivity({
      deal_id: deal.deal_id ?? deal.id,
      actor: "wise-webhook",
      action: "payment_updated",
      detail: `Wise payment failed — state: ${opts.currentState}`,
      meta: { event_type: eventType, wise_reference: reference },
    });
    return;
  }

  if (milanoStatus === "PAYMENT_REFUNDED") {
    await supabase
      .from("deals")
      .update({ payment_status: "refunded", updated_at: new Date().toISOString() })
      .eq("id", deal.id);
    await logActivity({
      deal_id: deal.deal_id ?? deal.id,
      actor: "wise-webhook",
      action: "payment_updated",
      detail: "Wise payment refunded",
      meta: { event_type: eventType, wise_reference: reference },
    });
    return;
  }

  if (milanoStatus === "PAYMENT_PENDING") {
    await supabase
      .from("deals")
      .update({ payment_status: "unpaid", updated_at: new Date().toISOString() })
      .eq("id", deal.id);
    await logActivity({
      deal_id: deal.deal_id ?? deal.id,
      actor: "wise-webhook",
      action: "payment_updated",
      detail: "Wise payment pending",
      meta: { event_type: eventType, wise_reference: reference, state: opts.currentState },
    });
    return;
  }

  if (milanoStatus !== "PAYMENT_CONFIRMED") {
    await flagForReview(supabase, eventRowId, "non_confirmable_event", reference, deal.id);
    return;
  }

  // PAYMENT_CONFIRMED: payment + attached discount redemption commit atomically.
  const confirmedAmount = eventAmount;
  const willUnlockScheduling = eventMinor === dueMinor;
  const wiseTransactionReference = String(resource.id ?? resource.transferId ?? "").trim() || null;
  const { data: confirmation, error: confirmationError } = await supabase.rpc("confirm_wise_payment_for_deal", {
    p_deal_id: deal.id, p_payment_reference: reference, p_wise_transaction_reference: wiseTransactionReference,
    p_amount: confirmedAmount, p_currency: eventCurrency, p_actor: "wise-webhook",
  });
  if (confirmationError) {
    await flagForReview(supabase,eventRowId,`atomic_confirmation_failed:${confirmationError.message}`,reference,deal.id);
    return;
  }
  const redemptionId = confirmation && typeof confirmation === "object" && "redemption_id" in confirmation
    ? (confirmation as Record<string, unknown>).redemption_id ?? null : null;

  if (eventRowId) {
    await supabase
      .from("wise_webhook_events")
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq("id", eventRowId);
  }

  try {
    await appendLedger({
      deal_id: deal.id,
      event: CUSTODY_EVENTS.WISE_PAYMENT_CONFIRMED,
      actor_type: "system",
      actor_id: "wise-webhook",
      method: "wise",
      status: "cleared",
      notes: `Wise payment confirmed — $${confirmedAmount} ${eventCurrency} via reference ${reference}`,
      metadata: {
        event_type: eventType,
        wise_reference: reference,
        amount_confirmed: confirmedAmount,
        amount_due: amountDue,
        currency: eventCurrency,
        scheduling_unlocked: willUnlockScheduling,
        discount_redemption_id: redemptionId,
        delivery_id: eventRowId,
      },
    });
  } catch (err) {
    console.error(
      "[wise-webhook] custody ledger append failed:",
      err instanceof Error ? err.message : err,
    );
  }

  await logActivity({
    deal_id: deal.deal_id ?? deal.id,
    actor: "wise-webhook",
    action: "payment_confirmed",
    detail: `Wise payment confirmed — $${confirmedAmount} ${eventCurrency} via reference ${reference}`,
    meta: {
      event_type: eventType,
      wise_reference: reference,
      amount_confirmed: confirmedAmount,
      amount_due: amountDue,
      currency: eventCurrency,
      scheduling_unlocked: willUnlockScheduling,
      delivery_id: eventRowId,
    },
  });

  await notifyClient(deal.id, "payment_cleared");
}

async function flagForReview(
  supabase: ReturnType<typeof createAdminClient>,
  eventRowId: string | null,
  reason: string,
  reference: string | null,
  dealId?: string,
): Promise<void> {
  if (eventRowId) {
    await supabase
      .from("wise_webhook_events")
      .update({
        processed: false,
        processing_error: `PAYMENT_REVIEW_REQUIRED: ${reason}`,
      })
      .eq("id", eventRowId);
  }

  // A reconciliation exception is not the same as a failed payment. Preserve the
  // current deal payment_status and record the exception for operator review.
  if (dealId) {
    await logActivity({
      deal_id: dealId,
      actor: "wise-webhook",
      action: "payment_updated",
      detail: `Payment review required — ${reason}${reference ? ` · ref: ${reference}` : ""}`,
      meta: { reason, wise_reference: reference },
    });
  }
}

function allowTestNotificationsGlobal(): boolean {
  return process.env.WISE_WEBHOOK_ALLOWED_TEST === "true";
}
