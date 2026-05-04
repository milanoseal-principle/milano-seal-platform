import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWiseSignature, getWiseMode } from "@/lib/wise";
import { logActivity } from "@/lib/activity";

export const runtime = "nodejs";

/**
 * POST /api/webhook/wise
 *
 * Handles Wise webhook deliveries. Wise signs every body with HMAC-SHA256
 * using your `WISE_WEBHOOK_SECRET`; we verify that signature before
 * trusting the payload.
 *
 * Events we care about:
 *   - payment-request#paid       — payment request fully settled
 *   - balance#credit             — money landed in our balance
 *   - transfer#StateChange       — outgoing transfer reached terminal state
 *
 * Match logic: any event referencing a `deal_id` (via reference, message,
 * or metadata) marks that matter as paid. Idempotent — we only update
 * rows whose payment_status is still `pending`.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig = req.headers.get("x-signature-sha256");
  const mode = getWiseMode();

  // In test mode without a configured webhook secret, allow unsigned
  // calls so devs can poke the endpoint with curl. Production always
  // requires a verified signature.
  const requireSig =
    mode === "production" || Boolean(process.env.WISE_WEBHOOK_SECRET);
  if (requireSig) {
    const ok = await verifyWiseSignature(raw, sig);
    if (!ok) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Wise nests payload differently per event type — pull the deal_id
  // out of every plausible location instead of branching by type.
  const dealId = extractDealId(event);
  if (!dealId) {
    return NextResponse.json({ received: true, skipped: "no deal_id" });
  }

  // Determine if this event represents a settled / completed payment.
  const settled = isPaymentSettled(event);
  if (!settled) {
    return NextResponse.json({
      received: true,
      deal_id: dealId,
      skipped: "not a settlement event",
    });
  }

  const supabase = createAdminClient();
  const { data: deal, error } = await supabase
    .from("deals")
    .update({
      payment_status: "paid",
      payment_method: "wise",
      payment_reference: pickRef(event) ?? dealId,
      payment_amount_received: pickAmount(event),
    })
    .eq("deal_id", dealId)
    .neq("payment_status", "paid") // idempotent
    .select()
    .maybeSingle();

  if (error) {
    console.error("[wise/webhook] DB update error:", error);
    return NextResponse.json(
      { error: "DB update failed", detail: error.message },
      { status: 500 }
    );
  }

  if (!deal) {
    // Either the deal_id doesn't exist, or it was already paid.
    return NextResponse.json({
      received: true,
      deal_id: dealId,
      skipped: "no matching pending deal",
    });
  }

  // Activity feed entry
  void logActivity({
    deal_id: dealId,
    actor: "wise-webhook",
    action: "payment_confirmed",
    detail: `Wise webhook (${mode}) confirmed payment`,
    meta: { event_type: pickEventType(event) },
  });

  // Auto-advance to scheduled stage. /api/admin/move enforces the state
  // machine + payment gate, so this is safe to call even if the deal
  // is past awaiting_payment.
  try {
    const origin =
      req.nextUrl?.origin ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://themilanoseal.com";
    await fetch(`${origin}/api/admin/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deal_id: dealId, stage: "scheduled" }),
    });
  } catch (e) {
    console.error("[wise/webhook] auto-advance failed (non-fatal):", e);
  }

  return NextResponse.json({
    received: true,
    deal_id: dealId,
    action: "marked_paid",
    mode,
  });
}

// ── helpers ──────────────────────────────────────────────────────────

function extractDealId(event: Record<string, unknown>): string | null {
  const candidates: unknown[] = [];
  const data = event.data as Record<string, unknown> | undefined;
  const resource = data?.resource as Record<string, unknown> | undefined;
  const details = resource?.details as Record<string, unknown> | undefined;
  const meta = (event.metadata ?? data?.metadata) as
    | Record<string, unknown>
    | undefined;

  candidates.push(
    details?.reference,
    resource?.reference,
    data?.reference,
    event.reference,
    meta?.deal_id,
    meta?.dealId,
    details?.message,
    resource?.message
  );

  for (const c of candidates) {
    if (typeof c === "string") {
      const m = c.match(/MS-[A-Z0-9-]+/i);
      if (m) return m[0].toUpperCase();
    }
  }
  return null;
}

function isPaymentSettled(event: Record<string, unknown>): boolean {
  const type = pickEventType(event).toLowerCase();
  const data = event.data as Record<string, unknown> | undefined;
  const resource = data?.resource as Record<string, unknown> | undefined;
  const state = String(
    data?.current_state ?? resource?.current_state ?? ""
  ).toLowerCase();

  if (type.includes("payment-request") && type.includes("paid")) return true;
  if (type.includes("balance") && type.includes("credit")) return true;
  if (
    type.includes("transfer") &&
    (state === "outgoing_payment_sent" || state === "funds_converted")
  ) {
    return true;
  }
  return false;
}

function pickEventType(event: Record<string, unknown>): string {
  return String(
    event.event_type ??
      (event.data as Record<string, unknown> | undefined)?.event_type ??
      ""
  );
}

function pickRef(event: Record<string, unknown>): string | null {
  const data = event.data as Record<string, unknown> | undefined;
  const resource = data?.resource as Record<string, unknown> | undefined;
  const r =
    resource?.id ??
    (resource as Record<string, unknown> | undefined)?.transfer_id ??
    data?.id;
  return typeof r === "string" || typeof r === "number" ? String(r) : null;
}

function pickAmount(event: Record<string, unknown>): number | null {
  const data = event.data as Record<string, unknown> | undefined;
  const resource = data?.resource as Record<string, unknown> | undefined;
  const amount = (resource?.amount ?? data?.amount) as
    | { value?: number }
    | number
    | undefined;
  if (typeof amount === "number") return amount;
  if (amount && typeof amount === "object" && typeof amount.value === "number")
    return amount.value;
  return null;
}
