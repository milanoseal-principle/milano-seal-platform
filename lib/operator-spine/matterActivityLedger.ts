import type { MatterActivityEntry } from "./types";

const FINAL_EVENT_TYPES = new Set(["payment_confirmed", "paid_and_released", "release_event", "courier_event"]);
export function buildMatterActivityLedger(entries: readonly MatterActivityEntry[] = []) { return [...entries].sort((a, b) => a.timestampLabel.localeCompare(b.timestampLabel)); }
export function createMatterActivityEntry(input: MatterActivityEntry): MatterActivityEntry {
  if (input.actorRole === "virtual_assistant" && FINAL_EVENT_TYPES.has(input.actionType)) return { ...input, risk: "high", clientVisible: false, nextAction: "Escalate final payment, release, or custody event to operator." };
  return { ...input, label: input.label.replace(/document contents?:.*/i, "document detail redacted") };
}
export function filterClientVisibleEntries(entries: readonly MatterActivityEntry[]) { return entries.filter((entry) => entry.clientVisible); }
export function filterInternalOnlyEntries(entries: readonly MatterActivityEntry[]) { return entries.filter((entry) => !entry.clientVisible); }
export function getActivityLedgerEmptyState() { return "No matter activity connected yet. Ledger accepts client touchpoints, operator actions, payment, RON, apostille, courier, and release events once connected."; }
