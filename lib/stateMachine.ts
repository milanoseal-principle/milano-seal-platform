export type DealStatus =
  | "new"
  | "reviewing"
  | "quoted"
  | "awaiting_payment"
  | "scheduled"
  | "in_execution"
  | "apostille"
  | "shipped"
  | "completed"
  | "lost";

export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  new: ["reviewing", "lost"],
  reviewing: ["quoted", "lost"],
  quoted: ["awaiting_payment", "lost"],
  awaiting_payment: ["scheduled"],
  scheduled: ["in_execution"],
  in_execution: ["apostille"],
  apostille: ["shipped"],
  shipped: ["completed"],
  completed: [],
  lost: [],
};

export const STATUS_ORDER: DealStatus[] = [
  "new",
  "reviewing",
  "quoted",
  "awaiting_payment",
  "scheduled",
  "in_execution",
  "apostille",
  "shipped",
  "completed",
];

export function canTransition(from: string, to: string): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getStatusIndex(status: string): number {
  return STATUS_ORDER.indexOf(status as DealStatus);
}

export function isTerminal(status: string): boolean {
  return status === "completed" || status === "lost";
}

export const DEAL_STAGES = STATUS_ORDER;

export const SLA_HOURS: Record<string, number> = {
  new: 4,
  reviewing: 8,
  quoted: 24,
  awaiting_payment: 48,
  scheduled: 24,
  in_execution: 48,
  apostille: 96,
  shipped: 168,
};

export function isOpenStage(stage: string): boolean {
  return stage !== "completed" && stage !== "lost";
}

export function isClosedWon(stage: string): boolean {
  return stage === "completed";
}
