import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity";

export type PaymentGateResult =
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_REQUIRED"
  | "PARTIAL_PAYMENT"
  | "PAYMENT_REVIEW_REQUIRED"
  | "PAYMENT_FAILED"
  | "PAYMENT_REFUNDED";

export class PaymentGateError extends Error {
  constructor(
    public readonly code: PaymentGateResult,
    message: string,
    public readonly matterId?: string
  ) {
    super(message);
    this.name = "PaymentGateError";
  }
}

export interface PaymentGateMatter {
  id: string;
  deal_id?: string | null;
  payment_status?: string | null;
  amount_due?: number | null;
  amount_paid?: number | null;
}

export function evaluatePaymentGate(matter: PaymentGateMatter): PaymentGateResult {
  const status = matter.payment_status ?? "unpaid";
  const due = Number(matter.amount_due ?? 0);
  const paid = Number(matter.amount_paid ?? 0);

  if (status === "paid" && paid >= due && due > 0) return "PAYMENT_CONFIRMED";
  if (status === "paid" && due === 0) return "PAYMENT_CONFIRMED";
  if (paid > 0 && paid < due) return "PARTIAL_PAYMENT";
  if (status === "failed") return "PAYMENT_FAILED";
  if (status === "refunded") return "PAYMENT_REFUNDED";
  return "PAYMENT_REQUIRED";
}

export function assertPaymentConfirmed(matter: PaymentGateMatter, attemptedAction: string): void {
  const result = evaluatePaymentGate(matter);
  if (result !== "PAYMENT_CONFIRMED") {
    // Audit event written async — do not await in hot path
    writePaymentGateAudit({
      matter_id: matter.id,
      attempted_action: attemptedAction,
      gate_status: result,
      amount_due: matter.amount_due,
      amount_paid: matter.amount_paid,
      payment_status: matter.payment_status,
      blocked_reason: result,
    }).catch(() => null);

    throw new PaymentGateError(
      result,
      `${result}: payment required before ${attemptedAction}`,
      matter.id
    );
  }
}

export function canSchedule(matter: PaymentGateMatter): boolean {
  return evaluatePaymentGate(matter) === "PAYMENT_CONFIRMED";
}

export function canExecute(matter: PaymentGateMatter): boolean {
  return evaluatePaymentGate(matter) === "PAYMENT_CONFIRMED";
}

export function canRelease(matter: PaymentGateMatter): boolean {
  return evaluatePaymentGate(matter) === "PAYMENT_CONFIRMED";
}

async function writePaymentGateAudit(params: {
  matter_id: string;
  attempted_action: string;
  gate_status: string;
  amount_due?: number | null;
  amount_paid?: number | null;
  payment_status?: string | null;
  blocked_reason?: string;
  actor_id?: string | null;
}): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from("payment_gate_audit").insert({
      matter_id: params.matter_id,
      attempted_action: params.attempted_action,
      gate_status: params.gate_status,
      amount_due: params.amount_due ?? null,
      amount_paid: params.amount_paid ?? null,
      payment_status: params.payment_status ?? null,
      blocked_reason: params.blocked_reason ?? null,
      actor_id: params.actor_id ?? null,
    });
  } catch {
    // non-fatal — table may not exist until migration 016 is applied
  }
}

// Writes a ledger event when payment gate is passed or blocked
export async function recordPaymentGateEvent(
  matter: PaymentGateMatter,
  action: string,
  passed: boolean,
  actor?: string
): Promise<void> {
  await logActivity({
    deal_id: matter.deal_id ?? matter.id,
    actor: actor ?? "system",
    action: passed ? "payment_confirmed" : "payment_updated",
    detail: passed
      ? `Payment gate passed for: ${action}`
      : `Payment gate blocked: ${action} — payment not confirmed`,
    meta: {
      gate_action: action,
      gate_passed: passed,
      amount_due: matter.amount_due,
      amount_paid: matter.amount_paid,
      payment_status: matter.payment_status,
    },
  });
}
