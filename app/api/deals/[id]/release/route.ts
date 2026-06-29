import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { appendLedger, CUSTODY_EVENTS } from "@/lib/custodyLedger";
import { assertPaymentConfirmed } from "@/lib/payments/paymentGate";
import { isFounderAdmin } from "@/lib/security/access-control";
import { requiresCodiceFiscaleLockForRelease } from "@/lib/security/release-integrity";
import { recordSecurityEvent } from "@/lib/security/security-events";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Optional founder override for releasing on non-cleared (e.g. pending card
  // settlement) funds. Requires a written reason; always ledgered below.
  const body = (await req.json().catch(() => ({}))) as {
    override_reason?: string;
  };
  const overrideReason = (body.override_reason ?? "").trim();

  // Auth check — role from server-side token only, never client body
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    await recordSecurityEvent({
      event_name: "ADMIN_ACTION_DENIED",
      severity: "high",
      route: "/api/deals/[id]/release",
      client_safe: false,
      metadata: { reason: "unauthenticated" },
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Release requires founder_admin — not admin_operator
  const role = user.app_metadata?.role ?? user.user_metadata?.role;
  if (!isFounderAdmin(role)) {
    await recordSecurityEvent({
      event_name: "ADMIN_ACTION_DENIED",
      severity: "high",
      actor: user.email ?? user.id,
      route: "/api/deals/[id]/release",
      client_safe: false,
      metadata: { role: String(role ?? "none"), reason: "founder_only_action" },
    });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Resolve deal (id may be deal_id slug or UUID)
  const adminClient = createAdminClient();
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const { data: deal, error: dealErr } = await adminClient
    .from("deals")
    .select("id, deal_id, deal_status, payment_status, payment_confirmed, payment_confirmed_at, amount_due, amount_paid, destination_country, is_platform_fee_only, payment_settlement_status, payment_cleared_at")
    .eq(isUuid ? "id" : "deal_id", id)
    .single();

  if (dealErr || !deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  // Payment gate — must be confirmed before release. Source of truth is broadened
  // beyond the legacy payment_confirmed boolean to payment_confirmed_at, status,
  // and amount coverage so confirmation drift cannot silently block releases.
  const amountDueNum = Number(deal.amount_due ?? 0);
  const paymentOk =
    deal.is_platform_fee_only === true ||
    deal.payment_confirmed === true ||
    deal.payment_confirmed_at != null ||
    deal.payment_status === "paid" ||
    deal.payment_status === "confirmed" ||
    (amountDueNum > 0 && Number(deal.amount_paid ?? 0) >= amountDueNum);
  if (!paymentOk) {
    try {
      assertPaymentConfirmed(deal, "release");
    } catch {
      await recordSecurityEvent({
        event_name: "FINAL_RELEASE_BLOCKED",
        severity: "high",
        actor: user.email ?? user.id,
        matter_id: deal.id,
        route: "/api/deals/[id]/release",
        client_safe: false,
        metadata: { reason: "payment_not_confirmed", deal_id: deal.deal_id ?? id },
      });
      return NextResponse.json(
        {
          ok: false,
          blocked: true,
          message: "Final release is blocked until required safety checks are complete.",
          required_action: "Payment confirmation required before release.",
        },
        { status: 402 },
      );
    }
  }

  // Settlement clearance gate — final packet must not release on funds that are
  // only "observed" (visible but possibly pending settlement, e.g. card-funded
  // Wise). Release requires settled/cleared funds OR a recorded founder override.
  const fundsCleared =
    deal.payment_settlement_status === "cleared" ||
    deal.is_platform_fee_only === true ||
    Number(deal.amount_due ?? 0) === 0;

  if (!fundsCleared) {
    if (overrideReason.length > 0) {
      // Founder (already verified above) authorizes release on non-cleared funds.
      await adminClient
        .from("deals")
        .update({
          founder_payment_override_at: new Date().toISOString(),
          founder_payment_override_by: user.email ?? user.id,
          founder_payment_override_reason: overrideReason,
        })
        .eq("id", deal.id);

      await appendLedger({
        deal_id: deal.id,
        event: CUSTODY_EVENTS.RELEASE_GATE_OVERRIDE,
        actor_type: "operator",
        actor_id: user.email ?? user.id,
        status: "override_approved",
        notes: `Founder override: release authorized on non-cleared funds | reason=${overrideReason} | settlement=${deal.payment_settlement_status ?? "unknown"}`,
        metadata: {
          override_by: user.email ?? user.id,
          override_reason: overrideReason,
          settlement_status: deal.payment_settlement_status ?? "unknown",
          payment_reference: deal.deal_id ?? deal.id,
        },
      });

      await recordSecurityEvent({
        event_name: "PAYMENT_RELEASE_OVERRIDE_APPROVED",
        severity: "warning",
        actor: user.email ?? user.id,
        matter_id: deal.id,
        route: "/api/deals/[id]/release",
        client_safe: false,
        metadata: {
          deal_id: deal.deal_id ?? id,
          settlement_status: deal.payment_settlement_status ?? "unknown",
        },
      });
    } else {
      await recordSecurityEvent({
        event_name: "FINAL_RELEASE_BLOCKED",
        severity: "high",
        actor: user.email ?? user.id,
        matter_id: deal.id,
        route: "/api/deals/[id]/release",
        client_safe: false,
        metadata: {
          reason: "settlement_pending",
          settlement_status: deal.payment_settlement_status ?? "unknown",
          deal_id: deal.deal_id ?? id,
        },
      });
      return NextResponse.json(
        {
          ok: false,
          blocked: true,
          message: "Final release is blocked until required safety checks are complete.",
          required_action: "Payment must clear before release, or a founder override is required.",
        },
        { status: 402 },
      );
    }
  }

  // Italy hard rule — Codice Fiscale Lock required
  if (requiresCodiceFiscaleLockForRelease(deal.destination_country)) {
    const { data: idLock } = await adminClient
      .from("identifier_locks")
      .select("identifier_type, match_status")
      .eq("matter_id", deal.id)
      .eq("identifier_type", "codice_fiscale")
      .single();

    const lockConfirmed =
      idLock?.match_status === "confirmed" || idLock?.match_status === "exact_match";

    if (!lockConfirmed) {
      await recordSecurityEvent({
        event_name: "IDENTIFIER_MISMATCH_BLOCKED",
        severity: "high",
        actor: user.email ?? user.id,
        matter_id: deal.id,
        route: "/api/deals/[id]/release",
        client_safe: false,
        metadata: {
          reason: idLock ? "codice_fiscale_mismatch" : "codice_fiscale_lock_missing",
          destination_country: deal.destination_country ?? "italy",
        },
      });
      return NextResponse.json(
        {
          ok: false,
          blocked: true,
          message: "Final release is blocked until required safety checks are complete.",
          required_action: "Codice Fiscale exact-match lock required before Italy apostille release.",
        },
        { status: 403 },
      );
    }
  }

  const previousStatus = deal.deal_status;
  const newStatus = "released";

  const result = await appendLedger({
    deal_id: deal.id,
    event: CUSTODY_EVENTS.DOC_RELEASE_CONFIRMED,
    actor_type: "operator",
    actor_id: user.email ?? user.id,
    notes: `Document release confirmed by founder | previous_status=${previousStatus} | new_status=${newStatus} | release_action=DOC_RELEASE_CONFIRMED | operator=${user.email ?? user.id}`,
  });

  if (!result) {
    return NextResponse.json(
      { error: "Failed to append custody ledger" },
      { status: 500 },
    );
  }

  // Record FINAL_RELEASE_APPROVED in security log
  await recordSecurityEvent({
    event_name: "FINAL_RELEASE_APPROVED",
    severity: "info",
    actor: user.email ?? user.id,
    matter_id: deal.id,
    route: "/api/deals/[id]/release",
    client_safe: false,
    metadata: { deal_id: deal.deal_id ?? id, destination_country: deal.destination_country ?? null },
  });

  // Durable audit log — failure recorded in custody chain, never silently dropped
  let auditFailed = false;
  try {
    const { error: auditErr } = await adminClient.from("audit_logs").insert({
      event: "DOC_RELEASE_CONFIRMED",
      actor: user.email ?? user.id,
      resource: deal.deal_id ?? deal.id,
      detail: `previous_status=${previousStatus} new_status=${newStatus}`,
      created_at: new Date().toISOString(),
    });
    if (auditErr) auditFailed = true;
  } catch {
    auditFailed = true;
  }

  if (auditFailed) {
    await appendLedger({
      deal_id: deal.id,
      event: "AUDIT_PENDING_SYNC",
      actor_type: "system",
      actor_id: "system",
      notes: `audit_logs insert failed for DOC_RELEASE_CONFIRMED by ${user.email ?? user.id} — chain requires manual reconciliation`,
    });
  }

  return NextResponse.json({ ok: true, hash: result.hash, audit_ok: !auditFailed });
}

