import type { WiseAttemptMatter } from "@/lib/wise/attemptEvidence";
import type { PaymentGateMatter } from "@/lib/payments/paymentGate";
import { evaluatePaymentGate } from "@/lib/payments/paymentGate";
export type SchedulingPaymentRequirementMethod = "verified_payment" | "not_satisfied";
export interface SchedulingGateResult { schedulingEligible:boolean; paymentRequirementSatisfied:boolean; paymentRequirementMethod:SchedulingPaymentRequirementMethod; reason:string; }
export interface ComplimentaryGateMatter extends PaymentGateMatter, WiseAttemptMatter {
 amount_due?:number|null;
 payment_disposition?:string|null;comp_authorized?:boolean|null;comp_authorization_id?:string|null;comp_authorized_at?:string|null;comp_revoked_at?:string|null;
 verified_revenue?:number|null;payment_observed_at?:string|null;payment_observed_amount?:number|null;payment_observed_currency?:string|null;payment_observed_reference?:string|null;
}
/** A submitted/processing payment, provider correlation, courtesy or stale flag is never settlement. */
export function evaluateSchedulingGate(params:{matter:ComplimentaryGateMatter;allOperationalRequirementsPassed?:boolean}):SchedulingGateResult {
 if(params.allOperationalRequirementsPassed===false)return {schedulingEligible:false,paymentRequirementSatisfied:false,paymentRequirementMethod:'not_satisfied',reason:'Operational requirements remain open.'};
 const verified=evaluatePaymentGate(params.matter)==='PAYMENT_CONFIRMED';
 return {schedulingEligible:verified,paymentRequirementSatisfied:verified,paymentRequirementMethod:verified?'verified_payment':'not_satisfied',reason:verified?'Verified Wise settlement satisfies scheduling gate.':'Verified Wise settlement is required before scheduling. Submitted or processing payment does not unlock scheduling.'};
}
/** Execution and signer-link release retain the verified settlement prerequisite. */
export function evaluateExecutionGate(matter:ComplimentaryGateMatter):SchedulingGateResult {return evaluateSchedulingGate({matter});}
