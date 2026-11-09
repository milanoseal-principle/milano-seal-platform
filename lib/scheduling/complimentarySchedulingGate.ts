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
  wise_transaction_reference?: string | null;
  payment_funding_method?: string | null;
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
  const due = Number(matter.amount_due);
  const complete = snapshotAmount != null && Number.isFinite(Number(snapshotAmount)) &&
    Number.isFinite(due) && due > 0 && Boolean(String(matter.currency ?? '').trim()) &&
    Boolean(snapshotCurrency?.trim()) && Boolean(snapshotReference?.trim()) && Boolean(currentReference(matter));
  if (!complete) return "projection_incomplete";
  const amountMatches = Number(snapshotAmount) === due;
  const currencyMatches = snapshotCurrency!.trim().toUpperCase() === String(matter.currency).trim().toUpperCase();
  const referenceMatches = snapshotReference!.trim() === currentReference(matter);
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

  const due = Number(params.matter.amount_due);
  const paid = Number(params.matter.amount_paid);
  const settlementVerified = params.matter.payment_confirmed === true &&
    params.matter.payment_settlement_status === "cleared" &&
    Number.isFinite(due) && Number.isFinite(paid) && due > 0 &&
    Math.round(paid * 100) === Math.round(due * 100);
  if (settlementVerified && evaluatePaymentGate(params.matter) === "PAYMENT_CONFIRMED") {
    return { schedulingEligible: true, paymentRequirementSatisfied: true, paymentRequirementMethod: "verified_payment", reason: "Verified Wise settlement satisfies scheduling gate." };
  }

  const observationFinanciallyValid = params.matter.payment_confirmed === false &&
    ['unpaid', 'pending'].includes(String(params.matter.payment_status ?? '')) &&
    Number(params.matter.amount_paid ?? 0) === 0;
  const submission = observationFinanciallyValid ? classifyObservedSubmission(params.matter) : "none";
  if (submission === "observed") {
    return { schedulingEligible: true, paymentRequirementSatisfied: true, paymentRequirementMethod: "wise_submission_observed", reason: "Integrity-matched Wise submission authorizes scheduling only; payment remains unverified and execution requires stronger provider evidence." };
  }
  if (submission === "projection_incomplete") {
    return { schedulingEligible: false, paymentRequirementSatisfied: false, paymentRequirementMethod: "not_satisfied", reason: "Scheduling authority cannot be evaluated because the payment-observation integrity fields are missing from this Matter projection. Refresh through the canonical Matter read path." };
  }
  if (submission === "superseded") {
    return { schedulingEligible: false, paymentRequirementSatisfied: false, paymentRequirementMethod: "not_satisfied", reason: "The Matter's payable amount, currency or reference changed after the recorded submission. A new governed payment submission is required before scheduling." };
  }

  // Neither courtesy authorization nor a paid flag substitutes for settlement.
  return { schedulingEligible: false, paymentRequirementSatisfied: false, paymentRequirementMethod: "not_satisfied", reason: "Verified Wise settlement or an integrity-matched Wise submission is required before scheduling." };
}

/** Scheduling observation alone never authorizes execution or signer-link release. */
export function evaluateExecutionGate(matter: ComplimentaryGateMatter): SchedulingGateResult {
  const gate = evaluateSchedulingGate({ matter });
  if (!gate.schedulingEligible || gate.paymentRequirementMethod === 'verified_payment') return gate;
  const providerEvidence = Boolean(matter.wise_transaction_reference?.trim()) && matter.payment_funding_method === 'wise_acquiring_payment';
  return providerEvidence ? gate : { schedulingEligible: false, paymentRequirementSatisfied: false, paymentRequirementMethod: 'not_satisfied', reason: 'WISE_PROVIDER_EVIDENCE_REQUIRED: server-side Wise evidence is required before execution or signer-link release.' };
}
