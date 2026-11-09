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

  // No status, timestamp, amount, zero-charge value or founder reason can
  // replace the shared exact verified Wise settlement predicate.
  let fundsCleared=false;
  try {assertPaymentConfirmed(deal,'release');fundsCleared=true;}catch{}
  if(!fundsCleared){
    await recordSecurityEvent({event_name:'FINAL_RELEASE_BLOCKED',severity:'high',actor:actorId,matter_id:deal.id,route:ROUTE,client_safe:false,metadata:{reason:'verified_settlement_required',override_requested:Boolean(overrideReason)}});
    return {status:402,body:{ok:false,blocked:true,required_action:'Verified exact Wise settlement is required before release. A founder reason cannot bypass payment.'}};
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

  const versions=await adminClient.from('document_versions').select('id').eq('matter_id',deal.id).eq('stage','final_packet').eq('approval_status','release_ready').order('id').limit(101);
  if(versions.error||!versions.data?.length||versions.data.length>100)return {status:409,body:{ok:false,required_action:'Review and mark the exact final packet document versions release-ready before release.'}};
  const released=await adminClient.rpc('record_document_release',{p_actor:actorId,p_matter:deal.id,p_versions:versions.data.map(version=>version.id)});
  const result=released.error?null:released.data;

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
      payload: { previous_status: previousStatus, new_status: newStatus },
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
