export interface MobileFingerprintPartnerRule {
  coverage: string;
  requiresOperatorReview: boolean;
  requiresPaymentBeforeScheduling: boolean;
  note: string;
}

export const MOBILE_FINGERPRINT_PARTNER_RULE: MobileFingerprintPartnerRule = {
  coverage: "Florida Mobile Coordination / Partner Provider Referral",
  requiresOperatorReview: true,
  requiresPaymentBeforeScheduling: true,
  note: "Mobile and group fingerprint requests require operator review and payment confirmation before scheduling.",
};

export function canScheduleMobile(paymentConfirmed: boolean, operatorReviewed: boolean): boolean {
  return paymentConfirmed && operatorReviewed;
}
