import type { WiseAttemptMatter } from "@/lib/wise/attemptEvidence";
import type { PaymentGateMatter } from "@/lib/payments/paymentGate";
import { evaluatePaymentGate } from "@/lib/payments/paymentGate";

/**
 * Founder decision (2026-11-09): NO VERIFIED WISE SETTLEMENT -> NO SCHEDULING.
 * Exact verified cleared settlement is the only payment method that satisfies
 * the scheduling gate. A Wise submission (observed / processing) is reported
 * separately as `wiseSubmission` so surfaces can show "processing" and block
 * duplicate payment attempts, but it never authorizes scheduling or execution.
 */
export type SchedulingPaymentRequirementMethod =
  | "verified_payment"
  | "not_satisfied";

/** Display-only Wise submission state. Never a scheduling or execution authority. */
export type WiseSubmissionState = "none" | "processing" | "superseded" | "projection_incomplete";

export interface SchedulingGateResult {
  schedulingEligible: boolean;
  paymentRequirementSatisfied: boolean;
  paymentRequirementMethod: SchedulingPaymentRequirementMethod;
  wiseSubmission: WiseSubmissionState;
  reason: string;
}

export interface ComplimentaryGateMatter extends PaymentGateMatter, WiseAttemptMatter {
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

function classifyObservedSubmission(matter: ComplimentaryGateMatter): WiseSubmissionState {
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
  return amountMatches && currencyMatches && referenceMatches ? "processing" : "superseded";
}

/**
 * Display-only classification of a recorded Wise payment submission. A
 * "processing" submission blocks duplicate payment requests in the UI; it is
 * never scheduling, execution or release authority.
 */
export function evaluateWiseSubmissionState(matter: ComplimentaryGateMatter): WiseSubmissionState {
  const financiallyUnsettled = matter.payment_confirmed === false &&
    ["unpaid", "pending"].includes(String(matter.payment_status ?? "")) &&
    Number(matter.amount_paid ?? 0) === 0;
  return financiallyUnsettled ? classifyObservedSubmission(matter) : "none";
}

/** The one canonical exact-settlement predicate shared by scheduling and execution. */
export function hasExactVerifiedSettlement(matter: ComplimentaryGateMatter): boolean {
  const due = Number(matter.amount_due);
  const paid = Number(matter.amount_paid);
  return matter.payment_confirmed === true &&
    matter.payment_settlement_status === "cleared" &&
    Number.isFinite(due) && Number.isFinite(paid) && due > 0 &&
    Math.round(paid * 100) === Math.round(due * 100) &&
    evaluatePaymentGate(matter) === "PAYMENT_CONFIRMED";
}

function denied(wiseSubmission: WiseSubmissionState, reason: string): SchedulingGateResult {
  return { schedulingEligible: false, paymentRequirementSatisfied: false, paymentRequirementMethod: "not_satisfied", wiseSubmission, reason };
}

export function evaluateSchedulingGate(params: {
  matter: ComplimentaryGateMatter;
  allOperationalRequirementsPassed?: boolean;
}): SchedulingGateResult {
  const wiseSubmission = evaluateWiseSubmissionState(params.matter);
  const operational = params.allOperationalRequirementsPassed ?? true;
  if (!operational) return denied(wiseSubmission, "Operational requirements remain open.");

  if (hasExactVerifiedSettlement(params.matter)) {
    return { schedulingEligible: true, paymentRequirementSatisfied: true, paymentRequirementMethod: "verified_payment", wiseSubmission: "none", reason: "Verified Wise settlement satisfies scheduling gate." };
  }
  if (wiseSubmission === "processing") {
    return denied(wiseSubmission, "Wise payment submitted and processing. Scheduling unlocks only after exact verified Wise settlement.");
  }
  if (wiseSubmission === "projection_incomplete") {
    return denied(wiseSubmission, "Payment state cannot be evaluated because the payment-observation integrity fields are missing from this Matter projection. Refresh through the canonical Matter read path.");
  }
  if (wiseSubmission === "superseded") {
    return denied(wiseSubmission, "The Matter's payable amount, currency or reference changed after the recorded submission. A new governed payment submission and verified settlement are required before scheduling.");
  }
  // Neither courtesy authorization, a submission nor a paid flag substitutes for settlement.
  return denied(wiseSubmission, "Verified Wise settlement is required before scheduling.");
}

/**
 * Execution and signer-link release follow scheduling and therefore require the
 * same exact verified settlement. There is no submission-based execution path.
 */
export function evaluateExecutionGate(matter: ComplimentaryGateMatter): SchedulingGateResult {
  return evaluateSchedulingGate({ matter });
}
