import type { ComplimentaryAuthorization, ComplimentaryQuoteSnapshot } from "./complimentary-authorization";
import { isAuthorizationValidForQuote } from "./complimentary-authorization";

export const COMPLIMENTARY_SAFETY_RULES = [
  "Complimentary matters never set paymentStatus to paid.",
  "Complimentary matters never set paymentConfirmed to true.",
  "Complimentary matters never create Wise webhook, transfer, settlement, or payment reference records.",
  "Complimentary matters preserve original commercial value while verified revenue remains zero.",
  "Ordinary unpaid matters remain locked unless a same-matter active authorization satisfies the scheduling gate.",
  "Authorization is quote-version specific and must be reissued if scope or price changes.",
] as const;

export interface ComplimentarySchedulingEvaluation {
  paymentRequirementSatisfied: boolean;
  paymentRequirementMethod: "verified_payment" | "complimentary_authorization" | "not_satisfied";
  reason: string;
}

export function evaluateComplimentarySchedulingRequirement(params: {
  quote: ComplimentaryQuoteSnapshot;
  authorization: ComplimentaryAuthorization | null;
  verifiedPaymentConfirmed: boolean;
  allOperationalRequirementsPassed: boolean;
}): ComplimentarySchedulingEvaluation {
  if (!params.allOperationalRequirementsPassed) {
    return { paymentRequirementSatisfied: false, paymentRequirementMethod: "not_satisfied", reason: "Operational requirements remain open." };
  }
  if (params.verifiedPaymentConfirmed) {
    return { paymentRequirementSatisfied: true, paymentRequirementMethod: "verified_payment", reason: "Satisfied by verified payment." };
  }
  if (params.authorization && isAuthorizationValidForQuote(params.authorization, params.quote)) {
    return { paymentRequirementSatisfied: true, paymentRequirementMethod: "complimentary_authorization", reason: "Satisfied by Complimentary Authorization." };
  }
  return { paymentRequirementSatisfied: false, paymentRequirementMethod: "not_satisfied", reason: "Payment or valid complimentary authorization required." };
}

export function assertNoFakePaymentFields(snapshot: {
  amountPaid: number;
  verifiedRevenue: number;
  wisePaymentId: string | null;
  wiseTransferId: string | null;
  paymentConfirmedAt: string | null;
}): void {
  if (snapshot.amountPaid !== 0) throw new Error("Complimentary matter amountPaid must remain 0.");
  if (snapshot.verifiedRevenue !== 0) throw new Error("Complimentary matter verifiedRevenue must remain 0.");
  if (snapshot.wisePaymentId !== null || snapshot.wiseTransferId !== null) throw new Error("Complimentary matter cannot carry Wise identifiers.");
  if (snapshot.paymentConfirmedAt !== null) throw new Error("Complimentary matter cannot set paymentConfirmedAt.");
}
