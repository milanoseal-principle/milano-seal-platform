import { evaluatePaymentGate } from "@/lib/safety/payment-integrity";
import type { PaymentGateMatter } from "@/lib/payments/paymentGate";
import type { ComplimentaryAuthorization, ComplimentaryQuoteSnapshot } from "./complimentary-authorization";
import { isAuthorizationValidForQuote } from "./complimentary-authorization";

export const COMPLIMENTARY_SAFETY_RULES = [
  "Complimentary matters never set paymentStatus to paid.",
  "Complimentary matters never set paymentConfirmed to true.",
  "Complimentary matters never create Wise webhook, transfer, settlement, or payment reference records.",
  "Complimentary matters preserve original commercial value while verified revenue remains zero.",
  "All unpaid matters remain scheduling-locked; a complimentary authorization is not verified Wise settlement.",
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
  verifiedPaymentConfirmed: boolean; // Legacy display hint; never authority.
  verifiedPayment?: PaymentGateMatter;
  allOperationalRequirementsPassed: boolean;
}): ComplimentarySchedulingEvaluation {
  if (!params.allOperationalRequirementsPassed) {
    return { paymentRequirementSatisfied: false, paymentRequirementMethod: "not_satisfied", reason: "Operational requirements remain open." };
  }
  if (params.verifiedPayment && evaluatePaymentGate(params.verifiedPayment) === "PAYMENT_CONFIRMED") {
    return { paymentRequirementSatisfied: true, paymentRequirementMethod: "verified_payment", reason: "Satisfied by verified payment." };
  }
  if (params.authorization && isAuthorizationValidForQuote(params.authorization, params.quote)) {
    return { paymentRequirementSatisfied: false, paymentRequirementMethod: "not_satisfied", reason: "Complimentary authorization remains non-revenue context; verified Wise settlement is required for scheduling." };
  }
  return { paymentRequirementSatisfied: false, paymentRequirementMethod: "not_satisfied", reason: "Verified Wise settlement required." };
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
