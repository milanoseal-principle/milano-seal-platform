export type GateStatus = "injected" | "partial" | "staged_only";
export type GateRisk = "low" | "medium" | "high" | "payment_sensitive" | "custody_sensitive" | "compliance_sensitive";

export const EXECUTION_CHAIN = [
  "Intake",
  "Review",
  "Quote",
  "Payment",
  "Scheduling",
  "BlueNotary/RON or Mobile",
  "Apostille",
  "Courier",
  "Release",
  "Review",
] as const;

export const CROSS_SYSTEM_GATES = [
  {
    id: "intake_gate",
    label: "Intake Gate",
    status: "injected",
    risk: "identity_sensitive",
    rule: "A matter starts with intake and required document path details.",
  },
  {
    id: "quote_gate",
    label: "Quote Gate",
    status: "injected",
    risk: "medium",
    rule: "Operator review produces the quote before payment instructions.",
  },
  {
    id: "payment_gate",
    label: "Payment Gate",
    status: "injected",
    risk: "payment_sensitive",
    rule: "Scheduling requires payment_confirmed or paid_comped; VA and alliance users cannot mark paid.",
  },
  {
    id: "scheduling_gate",
    label: "Scheduling Gate",
    status: "injected",
    risk: "payment_sensitive",
    rule: "No execution scheduling without payment clearance.",
  },
  {
    id: "bluenotary_ron_gate",
    label: "BlueNotary / RON Gate",
    status: "partial",
    risk: "compliance_sensitive",
    rule: "BlueNotary completion does not auto-release packet.",
  },
  {
    id: "mobile_notary_gate",
    label: "Mobile Notary Gate",
    status: "staged_only",
    risk: "compliance_sensitive",
    rule: "Mobile coordination remains operator/founder controlled.",
  },
  {
    id: "apostille_gate",
    label: "Apostille Gate",
    status: "injected",
    risk: "compliance_sensitive",
    rule: "Apostille starts only after execution complete.",
  },
  {
    id: "courier_custody_gate",
    label: "Courier / Custody Gate",
    status: "partial",
    risk: "custody_sensitive",
    rule: "Courier handoff requires custody clearance and operator-controlled release readiness.",
  },
  {
    id: "paid_released_gate",
    label: "Paid & Released Gate",
    status: "injected",
    risk: "payment_sensitive",
    rule: "Paid & Released requires zero balance, paid or paid_comped status, and release or completed status.",
  },
  {
    id: "review_request_gate",
    label: "Review Request Gate",
    status: "injected",
    risk: "low",
    rule: "Review requests happen only after delivery or completion; no fake reviews or stars.",
  },
] as const;

export const CROSS_SYSTEM_GATE_RULES = [
  "VA cannot mark paid.",
  "Alliance members cannot mark paid.",
  "Scheduling requires payment_confirmed or paid_comped.",
  "BlueNotary completion does not auto-release packet.",
  "Mobile coordination is operator/founder controlled.",
  "Alliance dispatch is staged only.",
  "Apostille starts only after execution complete.",
  "Release requires payment and custody clearance.",
  "Paid & Released requires zero balance, paid or paid_comped, and release or completed status.",
  "Review requests happen only after delivery or completion.",
  "No fake reviews or stars.",
] as const;

export function getGateById(id: string) {
  return CROSS_SYSTEM_GATES.find((gate) => gate.id === id) ?? null;
}

export function canSchedule(paymentStatus: string): boolean {
  return paymentStatus === "payment_confirmed" || paymentStatus === "paid_comped";
}

export function canRenderPaidAndReleased(input: { balance: number; paymentStatus: string; matterStatus: string }): boolean {
  const paymentClear = input.paymentStatus === "paid" || input.paymentStatus === "paid_comped";
  const releaseClear = input.matterStatus === "release" || input.matterStatus === "completed";
  return input.balance === 0 && paymentClear && releaseClear;
}
