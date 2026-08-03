export type PaymentDisposition =
  | "standard_payment"
  | "complimentary"
  | "internal_test"
  | "written_off"
  | "refunded";

export type PaymentRequirementMethod =
  | "verified_payment"
  | "complimentary_authorization"
  | "not_satisfied";

export interface PaymentDispositionSnapshot {
  paymentDisposition: PaymentDisposition;
  amountBeforeAdjustment: number;
  discountAmount: number;
  amountDue: number;
  amountPaid: number;
  verifiedRevenue: number;
  wisePaymentId: string | null;
  wiseTransferId: string | null;
  paymentConfirmedAt: string | null;
  compAuthorized: boolean;
  compAuthorizedBy: string | null;
  compAuthorizedAt: string | null;
  compReasonCode: string | null;
  compReasonDetail: string | null;
  compAuthorizationId: string | null;
}

export function buildStandardPaymentDisposition(params: {
  amountDue: number;
  amountPaid?: number;
  verifiedRevenue?: number;
  wisePaymentId?: string | null;
  wiseTransferId?: string | null;
  paymentConfirmedAt?: string | null;
}): PaymentDispositionSnapshot {
  return {
    paymentDisposition: "standard_payment",
    amountBeforeAdjustment: params.amountDue,
    discountAmount: 0,
    amountDue: params.amountDue,
    amountPaid: params.amountPaid ?? 0,
    verifiedRevenue: params.verifiedRevenue ?? 0,
    wisePaymentId: params.wisePaymentId ?? null,
    wiseTransferId: params.wiseTransferId ?? null,
    paymentConfirmedAt: params.paymentConfirmedAt ?? null,
    compAuthorized: false,
    compAuthorizedBy: null,
    compAuthorizedAt: null,
    compReasonCode: null,
    compReasonDetail: null,
    compAuthorizationId: null,
  };
}
