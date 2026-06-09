import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWiseSignature } from "@/lib/wise";
import { mapWiseTransferState, mapWiseBalanceEvent } from "@/lib/wise/status";
import { logActivity } from "@/lib/activity";
import { createHash } from "crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ok: true }, { status: 200 });
}

// Wise payment webhooks — https://docs.wise.com/api-docs/features/webhooks-notifications
// URL: https://themilanoseal.com/api/webhooks/wise  (NO query params — Wise requirement)
// Secured via RSA-SHA256 signature on X-Signature-SHA256 header.
// Deduplicated via X-Delivery-Id (unique per delivery attempt).

function isTestNotification(req: NextRequest): boolean {
  return req.headers.get("X-Test-Notification") === "true";
}

function allowTestNotifications(): boolean {
  return process.env.WISE_WEBHOOK_ALLOWED_TEST === "true";
}

function getEnvironment(): string {
  return process.env.WISE_ENV === "production" ? "production" : "sandbox";
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

  // 1. Signature verification — always first, using raw body
  const signature = req.headers.get("X-Signature-SHA256");
  const valid = await verifyWiseSignature(rawBody, signature);
  if (!valid) {
    console.warn("[wise-webhook] invalid signature — delivery:", deliveryId);
    // Store with signature_valid=false for audit, non-fatal
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
    } catch { /* non-fatal — table may not exist yet */ }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Block test notifications in production unless explicitly allowed
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
  const occurredAt = String((payload.data as Record<string, unknown> | undefined)?.occurred_at ?? payload.sent_at ?? new Date().toISOString());
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

  // 3. Deduplicate by X-Delivery-Id
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
    // Fallback dedup via SHA-256 of type + resource + state + time
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

  // 4. Store event immediately — return 2xx fast (Wise requires <5s response)
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

  // 5. Process — strict matching required before any payment confirmation
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

  // Determine preliminary payment status from event type + state
  let milanoStatus =
    eventType === "transfers#state-change"
      ? mapWiseTransferState(currentState)
      : mapWiseBalanceEvent(eventType);

  // Unrecognized event — store and skip
  const handledTypes = [
    "transfers#state-change",
    "balances#credit",
    "balances#update",
    "swift-in#credit",
    "transfers#payout-failure",
    "transfers#refund",
  ];
  if (!handledTypes.includes(eventType)) {
    return;
  }

  // Extract reference from resource — operator must set this on Wise payment request
  const reference = String(
    resource.reference ??
    (resource.details as Record<string, unknown> | undefined)?.reference ??
    (resource.metadata as Record<string, unknown> | undefined)?.reference ??
    ""
  ).trim();

  if (!reference) {
    // Cannot match — flag for review
    await flagForReview(supabase, eventRowId, "no_reference", null);
    return;
  }

  // Match deal by wise_reference or deal_id
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
    return; // idempotent
  }

  // Amount match — must be >= amount_due if amount is present in event
  const rawAmount =
    resource.amount ??
    resource.sourceAmount ??
    resource.targetAmount ??
    resource.value;
  const eventAmount =
    typeof rawAmount === "number"
      ? rawAmount
      : typeof rawAmount === "object" && rawAmount !== null
        ? Number((rawAmount as Record<string, unknown>).value ?? 0)
        : 0;

  const amountDue = Number(deal.amount_due ?? 0);
  const amountMismatch = eventAmount > 0 && amountDue > 0 && eventAmount < amountDue;
  if (amountMismatch) {
    milanoStatus = "PAYMENT_REVIEW_REQUIRED";
  }

  // Currency match — if event provides currency, must be USD
  const eventCurrency = String(
    resource.currency ??
    resource.sourceCurrency ??
    (typeof rawAmount === "object" && rawAmount !== null
      ? (rawAmount as Record<string, unknown>).currency
      : null) ??
    "USD"
  ).toUpperCase();
  if (eventCurrency && eventCurrency !== "USD") {
    milanoStatus = "PAYMENT_REVIEW_REQUIRED";
  }

  // Environment match — sandbox events must not touch production deals
  const envMismatch =
    env === "production" && testNotification && !allowTestNotificationsGlobal();
  if (envMismatch) {
    milanoStatus = "PAYMENT_REVIEW_REQUIRED";
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

  // PAYMENT_CONFIRMED path — all checks passed
  // Final guard: amount_paid must reach amount_due before scheduling unlocks
  const confirmedAmount = eventAmount > 0 ? eventAmount : amountDue;
  const willUnlockScheduling = confirmedAmount >= amountDue && amountDue > 0;

  // 1. Update payment record
  // 2. Update amount_paid
  // 3. Update payment_status
  await supabase
    .from("deals")
    .update({
      payment_status: "paid",
      payment_method: "wise",
      payment_reference: reference,
      payment_amount_received: confirmedAmount,
      amount_paid: confirmedAmount,
      payment_confirmed_at: new Date().toISOString(),
      invoice_status: "paid",
      // 6. Unlock scheduling only — do NOT jump beyond "scheduled"
      // Status remains unchanged here; scheduling is unlocked by the gate check
      // when operator initiates it. Never auto-advance to in_execution or beyond.
      updated_at: new Date().toISOString(),
    })
    .eq("id", deal.id);

  // 4. Write Wise webhook event row as processed
  if (eventRowId) {
    await supabase
      .from("wise_webhook_events")
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq("id", eventRowId);
  }

  // 5. Write Operational Ledger event
  await logActivity({
    deal_id: deal.deal_id ?? deal.id,
    actor: "wise-webhook",
    action: "payment_confirmed",
    detail: `Wise payment confirmed — $${confirmedAmount} USD via reference ${reference}`,
    meta: {
      event_type: eventType,
      wise_reference: reference,
      amount_confirmed: confirmedAmount,
      amount_due: amountDue,
      scheduling_unlocked: willUnlockScheduling,
      delivery_id: eventRowId,
    },
  });

  // Non-scheduling ledger note if amount doesn't cover due
  if (!willUnlockScheduling && amountDue > 0) {
    await logActivity({
      deal_id: deal.deal_id ?? deal.id,
      actor: "wise-webhook",
      action: "payment_updated",
      detail: `Partial payment: $${confirmedAmount} received of $${amountDue} due — scheduling remains locked`,
      meta: { amount_paid: confirmedAmount, amount_due: amountDue },
    });
  }
}

async function flagForReview(
  supabase: ReturnType<typeof createAdminClient>,
  eventRowId: string | null,
  reason: string,
  reference: string | null,
  dealId?: string
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

  if (dealId) {
    await supabase
      .from("deals")
      .update({ payment_status: "failed", updated_at: new Date().toISOString() })
      .eq("id", dealId);

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
