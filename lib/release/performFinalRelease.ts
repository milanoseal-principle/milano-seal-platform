import { createAdminClient } from "@/lib/supabase/admin";
import { appendLedger, CUSTODY_EVENTS } from "@/lib/custodyLedger";
import { assertPaymentConfirmed } from "@/lib/payments/paymentGate";
import { requiresCodiceFiscaleLockForRelease } from "@/lib/security/release-integrity";
import { recordSecurityEvent } from "@/lib/security/security-events";

export interface ReleaseOutcome {
  status: number;
  body: Record<string, unknown>;
}

const ROUTE = "/api/deals/[id]/release";

// Shared final-release gate. Caller MUST have already authenticated the actor as
// founder_admin. This runs the substantive gates (payment, settlement clearance +
// founder override, Codice Fiscale lock) and writes the custody/audit/security
// ledger. Used by the live release route and the authenticated production test so
// both exercise identical logic.
export async function performFinalRelease(opts: {
  id: string;
  actorId: string;
  overrideReason?: string;
}): Promise<ReleaseOutcome> {
  const { id, actorId } = opts;
  const overrideReason = (opts.overrideReason ?? "").trim();
  const adminClient = createAdminClient();

  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const { data: deal, error: dealErr } = await adminClient
    .from("deals")
    .select(
      "id, deal_id, deal_status, payment_status, payment_confirmed, payment_confirmed_at, amount_due, amount_paid, destination_country, payment_settlement_status",
    )
    .eq(isUuid ? "id" : "deal_id", id)
    .single();

  if (dealErr || !deal) {
    return { status: 404, body: { error: "Deal not found" } };
  }

  // Treat a zero-charge matter as the no-payment (platform-fee / fee-waived) case.
  // This avoids selecting optional discount columns that may be absent on the live
  // DB (migration drift) — keeping the release gate robust and never crashing.
  const isPlatformFeeOnly = Number(deal.amount_due ?? 0) === 0;

  // Payment gate — broadened source of truth (boolean OR timestamp OR status OR amount).
  const amountDueNum = Number(deal.amount_due ?? 0);
  const paymentOk =
    isPlatformFeeOnly ||
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
        actor: actorId,
        matter_id: deal.id,
        route: ROUTE,
        client_safe: false,
        metadata: { reason: "payment_not_confirmed", deal_id: deal.deal_id ?? id },
      });
      return {
        status: 402,
        body: {
          ok: false,
          blocked: true,
          message: "Final release is blocked until required safety checks are complete.",
          required_action: "Payment confirmation required before release.",
        },
      };
    }
  }

  // Settlement clearance gate — cleared funds OR a recorded founder override.
  const fundsCleared =
    deal.payment_settlement_status === "cleared" ||
    isPlatformFeeOnly ||
    Number(deal.amount_due ?? 0) === 0;

  if (!fundsCleared) {
    if (overrideReason.length > 0) {
      await adminClient
        .from("deals")
        .update({
          founder_payment_override_at: new Date().toISOString(),
          founder_payment_override_by: actorId,
          founder_payment_override_reason: overrideReason,
        })
        .eq("id", deal.id);

      await appendLedger({
        deal_id: deal.id,
        event: CUSTODY_EVENTS.RELEASE_GATE_OVERRIDE,
        actor_type: "operator",
        actor_id: actorId,
        status: "override_approved",
        notes: `Founder override: release authorized on non-cleared funds | reason=${overrideReason} | settlement=${deal.payment_settlement_status ?? "unknown"}`,
        metadata: {
          override_by: actorId,
          override_reason: overrideReason,
          settlement_status: deal.payment_settlement_status ?? "unknown",
          payment_reference: deal.deal_id ?? deal.id,
        },
      });

      await recordSecurityEvent({
        event_name: "PAYMENT_RELEASE_OVERRIDE_APPROVED",
        severity: "warning",
        actor: actorId,
        matter_id: deal.id,
        route: ROUTE,
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
        actor: actorId,
        matter_id: deal.id,
        route: ROUTE,
        client_safe: false,
        metadata: {
          reason: "settlement_pending",
          settlement_status: deal.payment_settlement_status ?? "unknown",
          deal_id: deal.deal_id ?? id,
        },
      });
      return {
        status: 402,
        body: {
          ok: false,
          blocked: true,
          message: "Final release is blocked until required safety checks are complete.",
          required_action: "Payment must clear before release, or a founder override is required.",
        },
      };
    }
  }

  // Italy hard rule — Codice Fiscale Lock required.
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
        actor: actorId,
        matter_id: deal.id,
        route: ROUTE,
        client_safe: false,
        metadata: {
          reason: idLock ? "codice_fiscale_mismatch" : "codice_fiscale_lock_missing",
          destination_country: deal.destination_country ?? "italy",
        },
      });
      return {
        status: 403,
        body: {
          ok: false,
          blocked: true,
          message: "Final release is blocked until required safety checks are complete.",
          required_action: "Codice Fiscale exact-match lock required before Italy apostille release.",
        },
      };
    }
  }

  const previousStatus = deal.deal_status;
  const newStatus = "released";

  const result = await appendLedger({
    deal_id: deal.id,
    event: CUSTODY_EVENTS.DOC_RELEASE_CONFIRMED,
    actor_type: "operator",
    actor_id: actorId,
    notes: `Document release confirmed by founder | previous_status=${previousStatus} | new_status=${newStatus} | release_action=DOC_RELEASE_CONFIRMED | operator=${actorId}`,
  });

  if (!result) {
    return { status: 500, body: { error: "Failed to append custody ledger" } };
  }

  await recordSecurityEvent({
    event_name: "FINAL_RELEASE_APPROVED",
    severity: "info",
    actor: actorId,
    matter_id: deal.id,
    route: ROUTE,
    client_safe: false,
    metadata: { deal_id: deal.deal_id ?? id, destination_country: deal.destination_country ?? null },
  });

  let auditFailed = false;
  try {
    const { error: auditErr } = await adminClient.from("audit_logs").insert({
      event: "DOC_RELEASE_CONFIRMED",
      actor: actorId,
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
      notes: `audit_logs insert failed for DOC_RELEASE_CONFIRMED by ${actorId} — chain requires manual reconciliation`,
    });
  }

  return { status: 200, body: { ok: true, hash: result.hash, audit_ok: !auditFailed } };
}
