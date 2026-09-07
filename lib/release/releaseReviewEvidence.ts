import { createAdminClient } from "@/lib/supabase/admin";
import {
  evaluateReleaseGate,
  requiresCodiceFiscaleLockForRelease,
  type ReleaseGateResult,
} from "@/lib/security/release-integrity";

export interface FinalReleaseReviewEvidence {
  deal_id: string;
  final_pdf_locked: boolean;
  pathway_reviewed: boolean;
  delivery_recipient_confirmed: boolean;
  founder_approved: boolean;
  compliance_hold: boolean;
  evidence: Record<string, unknown>;
  reviewed_by: string | null;
  reviewed_role: string | null;
  review_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface CanonicalReleaseFacts {
  fullPaymentReceived: boolean;
  ronCompleted: boolean;
  apostilleReturned: boolean;
  translationCompleted: boolean;
  identifierMatchPassed: boolean;
  finalPdfLocked: boolean;
  pathwayReviewed: boolean;
  deliveryRecipientConfirmed: boolean;
  founderApproved: boolean;
  complianceHold: boolean;
}

export interface CanonicalReleaseReadiness {
  gate: ReleaseGateResult;
  evidence: FinalReleaseReviewEvidence | null;
  facts: CanonicalReleaseFacts;
}

const RON_COMPLETE = new Set([
  "RON_COMPLETED",
  "SIGNED_DOCS_RETRIEVED",
  "READY_FOR_APOSTILLE",
]);

export async function loadCanonicalReleaseReadiness(dealId: string): Promise<CanonicalReleaseReadiness> {
  const admin = createAdminClient();
  const { data: deal, error } = await admin
    .from("deals")
    .select("id, destination_country, amount_due, amount_paid, payment_confirmed, payment_confirmed_at, payment_status, payment_settlement_status, execution_truth, execution_at, executed_at, apostille_at, apostille_required, requires_apostille, translation, delivery_at, delivery_timestamp, delivery_status")
    .eq("id", dealId)
    .single();

  if (error || !deal) throw new Error("MATTER_NOT_FOUND");

  const { data: review } = await admin
    .from("final_release_review_evidence")
    .select("*")
    .eq("deal_id", dealId)
    .maybeSingle();

  const executionTruth = (deal.execution_truth ?? {}) as Record<string, unknown>;
  const executionMethod = String(executionTruth.execution_method ?? "").toLowerCase();
  const ronRequired = executionMethod === "ron";

  let ronCompleted = !ronRequired;
  if (ronRequired) {
    const { data: session } = await admin
      .from("ron_sessions")
      .select("milano_ron_status")
      .eq("matter_id", dealId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    ronCompleted = !!session && RON_COMPLETE.has(String(session.milano_ron_status));
  }

  const apostilleRequired =
    deal.apostille_required === true ||
    (deal.apostille_required == null && deal.requires_apostille === true);
  const apostilleReturned = !apostilleRequired || deal.apostille_at != null;

  const reviewEvidence = (review?.evidence ?? {}) as Record<string, unknown>;
  const translationRequired = deal.translation === true;
  const translationCompleted = !translationRequired || reviewEvidence.translation_completed === true;

  let identifierMatchPassed = true;
  if (requiresCodiceFiscaleLockForRelease(deal.destination_country)) {
    const { data: idLock } = await admin
      .from("identifier_locks")
      .select("match_status")
      .eq("matter_id", dealId)
      .eq("identifier_type", "codice_fiscale")
      .maybeSingle();
    identifierMatchPassed =
      idLock?.match_status === "confirmed" || idLock?.match_status === "exact_match";
  }

  const amountDue = Number(deal.amount_due ?? 0);
  const fullPaymentReceived =
    amountDue === 0 ||
    (deal.payment_settlement_status === "cleared" &&
      (deal.payment_confirmed === true ||
        deal.payment_confirmed_at != null ||
        Number(deal.amount_paid ?? 0) >= amountDue));

  const facts: CanonicalReleaseFacts = {
    fullPaymentReceived,
    ronCompleted,
    apostilleReturned,
    translationCompleted,
    identifierMatchPassed,
    finalPdfLocked: review?.final_pdf_locked === true,
    pathwayReviewed: review?.pathway_reviewed === true,
    deliveryRecipientConfirmed: review?.delivery_recipient_confirmed === true,
    founderApproved: review?.founder_approved === true,
    complianceHold: review?.compliance_hold !== false,
  };

  const finalSealReviewPassed =
    facts.ronCompleted &&
    facts.apostilleReturned &&
    facts.translationCompleted &&
    facts.complianceHold === false;

  return {
    gate: evaluateReleaseGate({
      paymentConfirmed: facts.fullPaymentReceived,
      finalSealReviewPassed,
      identifierMatchPassed: facts.identifierMatchPassed,
      pathwayReviewed: facts.pathwayReviewed,
      deliveryRecipientConfirmed: facts.deliveryRecipientConfirmed,
      finalPdfLocked: facts.finalPdfLocked,
      founderApproved: facts.founderApproved,
    }),
    evidence: (review as FinalReleaseReviewEvidence | null) ?? null,
    facts,
  };
}
