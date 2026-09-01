import type { PaymentGateMatter } from "@/lib/payments/paymentGate";
import { evaluatePaymentGate } from "@/lib/payments/paymentGate";

export type SchedulingPaymentRequirementMethod =
  | "verified_payment"
  | "wise_submission_observed"
  | "complimentary_authorization"
  | "not_satisfied";

export interface SchedulingGateResult {
  schedulingEligible: boolean;
  paymentRequirementSatisfied: boolean;
  paymentRequirementMethod: SchedulingPaymentRequirementMethod;
  reason: string;
}

export interface ComplimentaryGateMatter extends PaymentGateMatter {
  payment_confirmed?: boolean | null;
  payment_disposition?: string | null;
  payment_settlement_status?: string | null;
  payment_observed_at?: string | null;
  comp_authorized?: boolean | null;
  comp_authorization_id?: string | null;
  comp_authorized_at?: string | null;
  comp_revoked_at?: string | null;
  amount_due?: number | null;
  amount_paid?: number | null;
  verified_revenue?: number | null;
  currency?: string | null;
  wise_reference?: string | null;
  payment_observed_amount?: number | null;
  payment_observed_currency?: string | null;
  payment_observed_reference?: string | null;
}

type SubmissionState = "none" | "observed" | "superseded" | "projection_incomplete";

const OBSERVATION_INTEGRITY_FIELDS = [
  "amount_due",
  "currency",
  "wise_reference",
  "payment_observed_amount",
  "payment_observed_currency",
  "payment_observed_reference",
] as const;

function currentReference(matter: ComplimentaryGateMatter): string {
  return String(matter.wise_reference ?? matter.deal_id ?? "").trim();
}

function hasCompleteObservationProjection(matter: ComplimentaryGateMatter): boolean {
  return OBSERVATION_INTEGRITY_FIELDS.every((field) =>
    Object.prototype.hasOwnProperty.call(matter, field),
  );
}

function classifyObservedSubmission(matter: ComplimentaryGateMatter): SubmissionState {
  const settlement = String(matter.payment_settlement_status ?? "").trim().toLowerCase();
  const observed = Boolean(matter.payment_observed_at) && settlement === "observed_pending";
  if (!observed) return "none";
  if (!hasCompleteObservationProjection(matter)) return "projection_incomplete";

  const snapshotAmount = matter.payment_observed_amount;
  const snapshotCurrency = matter.payment_observed_currency;
  const snapshotReference = matter.payment_observed_reference;
  const hasSnapshot =
    snapshotAmount != null || (snapshotCurrency ?? "") !== "" || (snapshotReference ?? "") !== "";
  if (!hasSnapshot) return "observed";

  const amountMatches = snapshotAmount == null || Number(snapshotAmount) === Number(matter.amount_due ?? 0);
  const currencyMatches = !snapshotCurrency || snapshotCurrency.toUpperCase() === String(matter.currency ?? "USD").toUpperCase();
  const referenceMatches = !snapshotReference || snapshotReference === currentReference(matter);
  return amountMatches && currencyMatches && referenceMatches ? "observed" : "superseded";
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
    return { schedulingEligible: true, paymentRequirementSatisfied: true, paymentRequirementMethod: "verified_payment", reason: "Verified Wise settlement satisfies scheduling gate." };
  }

  const submission = classifyObservedSubmission(params.matter);
  if (submission === "observed") {
    return { schedulingEligible: true, paymentRequirementSatisfied: true, paymentRequirementMethod: "wise_submission_observed", reason: "Observed Wise submission authorizes scheduling while settlement remains pending." };
  }
  if (submission === "projection_incomplete") {
    return { schedulingEligible: false, paymentRequirementSatisfied: false, paymentRequirementMethod: "not_satisfied", reason: "Scheduling authority cannot be evaluated because the payment-observation integrity fields are missing from this Matter projection. Refresh through the canonical Matter read path." };
  }
  if (submission === "superseded") {
    return { schedulingEligible: false, paymentRequirementSatisfied: false, paymentRequirementMethod: "not_satisfied", reason: "The Matter's payable amount, currency or reference changed after the recorded submission. A new governed payment submission is required before scheduling." };
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

  return { schedulingEligible: false, paymentRequirementSatisfied: false, paymentRequirementMethod: "not_satisfied", reason: "Wise submission, verified settlement, or active complimentary authorization required." };
}
