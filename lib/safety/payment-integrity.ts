import type { PaymentGateMatter, PaymentGateResult } from "@/lib/payments/paymentGate";
// Payment Integrity Gate
// Hard rule: no scheduling or execution without exact, confirmed, cleared Wise settlement.
// platform_fee_only matters must suppress Wise.
// All confirmation events are idempotent and write to ledger.

export type PaymentStatus =
  | "awaiting_payment"
  | "payment_confirmed"
  | "scheduling_unlocked"
  | "platform_fee_only"
  | "manual_founder_confirmation";

export type PaymentIntegrityResult = {
  schedulingAllowed: boolean;
  executionAllowed: boolean;
  showWise: boolean;
  statusLabel: string;
  operatorNote: string | null;
};

export type PaymentLedgerEvent =
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_CONFIRMED_MANUAL"
  | "PAYMENT_INTEGRITY_REVIEWED";

// One client-safe settlement predicate, shared with the server audit wrapper.
export function evaluatePaymentGate(matter: PaymentGateMatter): PaymentGateResult {
  const status = matter.payment_status ?? "unpaid";
  const due = Number(matter.amount_due ?? 0);
  const paid = Number(matter.amount_paid ?? 0);

  const settlementVerified = matter.payment_confirmed === true &&
    status === "paid" &&
    matter.payment_settlement_status === "cleared" &&
    Number.isFinite(due) && Number.isFinite(paid) && due > 0 &&
    Math.round(paid * 100) === Math.round(due * 100);

  if (settlementVerified) return "PAYMENT_CONFIRMED";
  if (paid > 0 && paid < due) return "PARTIAL_PAYMENT";
  if (status === "failed") return "PAYMENT_FAILED";
  if (status === "refunded") return "PAYMENT_REFUNDED";
  return "PAYMENT_REQUIRED";
}


export interface PaymentIntegrityMatter {
 id?:string;payment_confirmed:boolean;is_platform_fee_only:boolean;payment_status?:string|null;
 payment_settlement_status?:string|null;amount_due?:number|null;amount_paid?:number|null;
}
export function evaluatePaymentIntegrity(matter:PaymentIntegrityMatter):PaymentIntegrityResult {
 const verified=evaluatePaymentGate({...matter,id:matter.id??'projection'})==='PAYMENT_CONFIRMED';
 return {schedulingAllowed:verified,executionAllowed:verified,showWise:!verified&&!matter.is_platform_fee_only,
 statusLabel:verified?'Payment Confirmed':matter.is_platform_fee_only?'Platform Fee Only':'Awaiting Payment',
 operatorNote:verified?null:'Verified Wise settlement is required. A flag, submission or courtesy authorization does not unlock scheduling or execution.'};
}
export function getClientPaymentStatusLabel(matter:PaymentIntegrityMatter):string{return evaluatePaymentIntegrity(matter).statusLabel;}

// Validates that a manual payment confirmation record has all required fields.
export function validatePaymentRecord(record: {
  matter_id?: string;
  amount?: number;
  currency?: string;
  reference?: string;
  payment_status?: string;
}): { valid: boolean; missing: string[] } {
  const required = ["matter_id", "amount", "currency", "reference", "payment_status"];
  const missing = required.filter((k) => !record[k as keyof typeof record]);
  return { valid: missing.length === 0, missing };
}
