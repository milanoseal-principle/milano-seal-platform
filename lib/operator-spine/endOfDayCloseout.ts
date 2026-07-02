import type { DailyCloseoutSummary } from "./types";

const CHECKLIST = ["scheduled matters confirmed", "BlueNotary/RON status checked", "apostille packets updated", "courier releases checked", "blockers documented", "tomorrow priorities written"] as const;
export function buildDailyCloseout(input: Partial<DailyCloseoutSummary> = {}): DailyCloseoutSummary { return { dateLabel: input.dateLabel ?? "Today", completedItems: input.completedItems ?? [], openBlockers: input.openBlockers ?? [], paymentsToVerify: input.paymentsToVerify ?? [], quotesToSend: input.quotesToSend ?? [], releasesToConfirm: input.releasesToConfirm ?? [], tomorrowPriorities: input.tomorrowPriorities ?? getTomorrowPriorities(input), operatorNotes: input.operatorNotes }; }
export function getCloseoutChecklist() { return CHECKLIST; }
export function getTomorrowPriorities(input: Partial<DailyCloseoutSummary> = {}) { return [...(input.openBlockers ?? []), ...(input.paymentsToVerify ?? []), ...(input.quotesToSend ?? [])]; }
export function getCloseoutEmptyState() { return "Daily closeout has no connected items yet. Use it to record blockers and tomorrow priorities after live matter data is connected."; }
