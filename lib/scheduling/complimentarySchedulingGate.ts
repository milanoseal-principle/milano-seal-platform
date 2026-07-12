import type { PaymentGateMatter } from "@/lib/payments/paymentGate";
import { evaluatePaymentGate } from "@/lib/payments/paymentGate";

export type SchedulingPaymentRequirementMethod =
  | "verified_payment"
  | "complimentary_authorization"
  | "not_satisfied";

export interface SchedulingGateResult {
  schedulingEligible: boolean;
  paymentRequirementSatisfied: boolean;
  paymentRequirementMethod: SchedulingPaymentRequirementMethod;
  reason: string;
}

export interface ComplimentaryGateMatter extends PaymentGateMatter {
  payment_disposition?: string | null;
  comp_authorized?: boolean | null;
  comp_authorization_id?: string | null;
  comp_authorized_at?: string | null;
  comp_revoked_at?: string | null;
  amount_due?: number | null;
  amount_paid?: number | null;
  verified_revenue?: number | null;
}

export function evaluateSchedulingGate(params: {
  matter: ComplimentaryGateMatter;
  allOperationalRequirementsPassed?: boolean;
}): SchedulingGateResult {
  const operational = params.allOperationalRequirementsPassed ?? true;
  if (!operational) {
    return { schedulingEligible: false, paymentRequirementSatisfied: false, paymentRequirementMethod: "not_satisfied", reason: "Operational requirements remain open." };
  }

  if (evaluatePaymentGate(params.matter) === "PAYMENT_CONFIRMED") {
    return { schedulingEligible: true, paymentRequirementSatisfied: true, paymentRequirementMethod: "verified_payment", reason: "Verified payment satisfies scheduling gate." };
  }

  const compActive = params.matter.payment_disposition === "complimentary" &&
    params.matter.comp_authorized === true &&
    !!params.matter.comp_authorization_id &&
    !!params.matter.comp_authorized_at &&
    !params.matter.comp_revoked_at &&
    Number(params.matter.amount_due ?? 0) === 0 &&
    Number(params.matter.amount_paid ?? 0) === 0 &&
    Number(params.matter.verified_revenue ?? 0) === 0;

  if (compActive) {
    return { schedulingEligible: true, paymentRequirementSatisfied: true, paymentRequirementMethod: "complimentary_authorization", reason: "Satisfied by Complimentary Authorization." };
  }

  return { schedulingEligible: false, paymentRequirementSatisfied: false, paymentRequirementMethod: "not_satisfied", reason: "Verified payment or active complimentary authorization required." };
}
