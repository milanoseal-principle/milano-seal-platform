export const CANONICAL_MATTER_STATES = [
  "intake_received",
  "under_review",
  "quoted",
  "awaiting_payment",
  "payment_confirmed",
  "scheduled",
  "in_execution",
  "apostille_processing",
  "in_transit",
  "delivered",
  "completed",
  "dormant",
] as const;

export type MatterStatus = (typeof CANONICAL_MATTER_STATES)[number];
export type DealStatus = MatterStatus;

export const LEGACY_STATUS_ALIASES: Record<string, MatterStatus> = {
  new: "intake_received",
  reviewing: "under_review",
  apostille: "apostille_processing",
  shipped: "in_transit",
  complete: "completed",
  execution_completed: "in_execution",
};

export function normalizeMatterStatus(status: string): MatterStatus | null {
  const raw = String(status ?? "").trim().toLowerCase();
  if ((CANONICAL_MATTER_STATES as readonly string[]).includes(raw)) {
    return raw as MatterStatus;
  }
  return LEGACY_STATUS_ALIASES[raw] ?? null;
}

export const ALLOWED_TRANSITIONS: Record<MatterStatus, MatterStatus[]> = {
  intake_received: ["under_review"],
  under_review: ["quoted"],
  quoted: ["awaiting_payment"],
  awaiting_payment: ["payment_confirmed"],
  payment_confirmed: ["scheduled"],
  scheduled: ["in_execution"],
  in_execution: ["apostille_processing", "in_transit"],
  apostille_processing: ["in_transit"],
  in_transit: ["delivered"],
  delivered: ["completed"],
  completed: [],
  dormant: [],
};

export const STATUS_ORDER: MatterStatus[] = [...CANONICAL_MATTER_STATES];
export const DEAL_STAGES = STATUS_ORDER;

export function canTransition(from: string, to: string): boolean {
  const normalizedFrom = normalizeMatterStatus(from);
  const normalizedTo = normalizeMatterStatus(to);
  if (!normalizedFrom || !normalizedTo) return false;
  if (normalizedFrom === normalizedTo) return true;
  return ALLOWED_TRANSITIONS[normalizedFrom].includes(normalizedTo);
}

export function getStatusIndex(status: string): number {
  const normalized = normalizeMatterStatus(status);
  return normalized ? STATUS_ORDER.indexOf(normalized) : -1;
}

export function isTerminal(status: string): boolean {
  return normalizeMatterStatus(status) === "completed";
}

export const SLA_HOURS: Record<MatterStatus, number> = {
  intake_received: 4,
  under_review: 8,
  quoted: 24,
  awaiting_payment: 48,
  payment_confirmed: 24,
  scheduled: 24,
  in_execution: 48,
  apostille_processing: 96,
  in_transit: 168,
  delivered: 24,
  completed: 0,
  dormant: 0,
};

export function isOpenStage(stage: string): boolean {
  return normalizeMatterStatus(stage) !== "completed";
}

export function isClosedWon(stage: string): boolean {
  return normalizeMatterStatus(stage) === "completed";
}
