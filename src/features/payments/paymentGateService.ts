import type { MilanoMatterLike, PaymentType } from "@/src/features/milano/types";

export interface PaymentGateResult {
  scheduling_unlocked: boolean;
  release_unlocked: boolean;
  next_required_payment: PaymentType | null;
  reason: string;
}

export function evaluatePaymentGates(matter: MilanoMatterLike): PaymentGateResult {
  const finalTotal = Number(matter.final_total ?? matter.original_total ?? 0);
  const depositRequired = Boolean(matter.deposit_required);
  const depositAmount = Number(matter.deposit_amount ?? (depositRequired ? finalTotal / 2 : finalTotal));
  const depositPaid = Number(matter.deposit_paid_amount ?? 0);
  const amountReceived = Number(matter.amount_received ?? 0);
  const paymentStatus = String(matter.payment_status ?? "unpaid");
  const mismatch = Boolean(matter.payment_mismatch_flag);

  if (mismatch || paymentStatus === "mismatch_review") {
    return { scheduling_unlocked: false, release_unlocked: false, next_required_payment: null, reason: "payment_mismatch_review" };
  }

  const schedulingUnlocked = depositRequired ? depositPaid >= depositAmount || amountReceived >= depositAmount : amountReceived >= finalTotal || paymentStatus === "paid";
  const releaseUnlocked = amountReceived >= finalTotal || String(matter.release_status ?? "") === "ready_for_release" || String(matter.release_status ?? "") === "released";
  const nextRequired: PaymentType | null = !schedulingUnlocked ? (depositRequired ? "deposit" : "full_payment") : !releaseUnlocked ? "final_balance" : null;

  return {
    scheduling_unlocked: schedulingUnlocked,
    release_unlocked: releaseUnlocked,
    next_required_payment: nextRequired,
    reason: releaseUnlocked ? "release_unlocked" : schedulingUnlocked ? "scheduling_unlocked" : "payment_required",
  };
}

export function assertSchedulingAllowed(matter: MilanoMatterLike): void {
  const gates = evaluatePaymentGates(matter);
  if (!gates.scheduling_unlocked) throw new Error("Scheduling is blocked until the required payment gate is confirmed.");
}

export function assertReleaseAllowed(matter: MilanoMatterLike): void {
  const gates = evaluatePaymentGates(matter);
  if (!gates.release_unlocked) throw new Error("Release is blocked until final payment is confirmed.");
}
