import { createAdminClient } from "@/lib/supabase/admin";
import { evaluateReleaseGate, type ReleaseGateResult } from "@/lib/security/release-integrity";

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

export interface CanonicalReleaseReadiness {
  gate: ReleaseGateResult;
  evidence: FinalReleaseReviewEvidence | null;
  facts: {
    fullPaymentReceived: boolean;
    ronCompleted: boolean;
    apostilleReturned: boolean;
    translationCompleted: boolean;
    finalPdfLocked: boolean;
    pathwayReviewed: boolean;
    deliveryRecipientConfirmed: boolean;
    founderApproved: boolean;
    complianceHold: boolean;
  };
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
    .select("id, amount_due, amount_paid, payment_confirmed, payment_confirmed_at, payment_status, payment_settlement_status, execution_truth, execution_at, executed_at, apostille_at, apostille_required, requires_apostille, translation, delivery_at, delivery_timestamp, delivery_status")
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

  const apostilleRequired = deal.apostille_required === true || (deal.apostille_required == null && deal.requires_apostille === true);
  const apostilleReturned = !apostilleRequired || deal.apostille_at != null;

  const translationRequired = deal.translation === true;
  const reviewEvidence = (review?.evidence ?? {}) as Record<string, unknown>;
  const translationCompleted = !translationRequired || reviewEvidence.translation_completed === true;

  const amountDue = Number(deal.amount_due ?? 0);
  const fullPaymentReceived =
    amountDue === 0 ||
    (deal.payment_settlement_status === "cleared" &&
      (deal.payment_confirmed === true || deal.payment_confirmed_at != null || Number(deal.amount_paid ?? 0) >= amountDue));

  const facts = {
    fullPaymentReceived,
    ronCompleted,
    apostilleReturned,
    translationCompleted,
    finalPdfLocked: review?.final_pdf_locked === true,
    pathwayReviewed: review?.pathway_reviewed === true,
    deliveryRecipientConfirmed: review?.delivery_recipient_confirmed === true,
    founderApproved: review?.founder_approved === true,
    complianceHold: review?.compliance_hold !== false,
  };

  return {
    gate: evaluateReleaseGate(facts),
    evidence: (review as FinalReleaseReviewEvidence | null) ?? null,
    facts,
  };
}
