export interface TranslationPartnerPolicy {
  partnerReferralOnlyAfterReview: boolean;
  requiresPaymentBeforeScheduling: boolean;
  note: string;
}

export const TRANSLATION_PARTNER_POLICY: TranslationPartnerPolicy = {
  partnerReferralOnlyAfterReview: true,
  requiresPaymentBeforeScheduling: true,
  note: "Translation partner coordination occurs only after operator review. Final acceptance remains subject to the receiving authority.",
};

export function canReferTranslationPartner(operatorReviewed: boolean): boolean {
  return operatorReviewed;
}
