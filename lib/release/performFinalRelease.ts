import { createAdminClient } from "@/lib/supabase/admin";
import { appendLedger, CUSTODY_EVENTS } from "@/lib/custodyLedger";
import { assertPaymentConfirmed } from "@/lib/payments/paymentGate";
import { requiresCodiceFiscaleLockForRelease } from "@/lib/security/release-integrity";
import { loadCanonicalReleaseReadiness } from "@/lib/release/releaseReviewEvidence";
import { recordSecurityEvent } from "@/lib/security/security-events";

export interface ReleaseOutcome {
  status: number;
  body: Record<string, unknown>;
}

const ROUTE = "/api/deals/[id]/release";

// Single final-release authority. Caller MUST already be authenticated as
// founder_admin. Review tables are evidence only and cannot author release.
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

  const isPlatformFeeOnly = Number(deal.amount_due ?? 0) === 0;
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
          code: "FINAL_RELEASE_BLOCKED",
          message: "Final release is blocked until required safety checks are complete.",
          required_action: "Payment confirmation required before release.",
        },
      };
    }
  }

  // Full server-side release integrity gate. This consumes canonical execution,
  // apostille, settlement and identifier truth plus durable review evidence.
  // Browser-local checkbox state can never satisfy this gate.
  const readiness = await loadCanonicalReleaseReadiness(deal.id);
  if (!readiness.gate.canRelease) {
    await recordSecurityEvent({
      event_name: "FINAL_RELEASE_BLOCKED",
      severity: "high",
      actor: actorId,
      matter_id: deal.id,
      route: ROUTE,
      client_safe: false,
      metadata: {
        reason: "release_integrity_gate",
        deal_id: deal.deal_id ?? id,
        blocked_reasons: readiness.gate.blockedReasons,
        facts: readiness.facts,
      },
    });
    return {
      status: 409,
      body: {
        ok: false,
        blocked: true,
        code: "FINAL_RELEASE_BLOCKED",
        message: "Final release is blocked until required safety checks are complete.",
        required_action: "Complete the governed Final Seal Review and required execution evidence.",
      },
    };
  }

  // Settlement is fail-closed. The legacy override input is retained only for
  // compatibility/audit visibility; the full release-integrity gate above will
  // not pass until cleared funds exist for a paid Matter.
  const fundsCleared =
    deal.payment_settlement_status === "cleared" ||
    isPlatformFeeOnly ||
    Number(deal.amount_due ?? 0) === 0;

  if (!fundsCleared) {
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
        override_requested: overrideReason.length > 0,
        deal_id: deal.deal_id ?? id,
      },
    });
    return {
      status: 402,
      body: {
        ok: false,
        blocked: true,
        code: "FINAL_RELEASE_BLOCKED",
        message: "Final release is blocked until required safety checks are complete.",
        required_action: "Verified Wise settlement is required before final release.",
      },
    };
  }

  // Italy hard rule — Codice Fiscale Lock required. This is also represented in
  // the release-integrity result, and is rechecked here immediately before write.
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
          code: "FINAL_RELEASE_BLOCKED",
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
    metadata: {
      release_gate: "passed",
      review_evidence_updated_at: readiness.evidence?.updated_at ?? null,
    },
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
      payload: {
        previous_status: previousStatus,
        new_status: newStatus,
        release_gate: "passed",
      },
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
