export interface FingerprintPartnerPolicy {
  referralOnlyAfterReview: boolean;
  noOriMissingSubmission: boolean;
  note: string;
}

export const FINGERPRINT_PARTNER_POLICY: FingerprintPartnerPolicy = {
  referralOnlyAfterReview: true,
  noOriMissingSubmission: true,
  note: "Partner referrals occur only after operator review. No submission when ORI is missing for employment/licensing routes.",
};

export function canReferPartner(operatorReviewed: boolean): boolean {
  return operatorReviewed;
}
