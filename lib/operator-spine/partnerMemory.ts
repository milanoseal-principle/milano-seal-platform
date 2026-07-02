import type { PartnerMemoryRecord } from "./types";

export function buildPartnerMemory(records: readonly PartnerMemoryRecord[] = []) { return records; }
export function getPartnerReadinessStatus(record: PartnerMemoryRecord) { return record.readinessStatus; }
export function getPartnerNextAction(record: PartnerMemoryRecord) { if (record.readinessStatus === "approved") return record.nextAction; if (record.readinessStatus === "blocked") return "Do not dispatch; review blocker."; return "Continue vetting before any alliance dispatch."; }
export function getAllianceSafePartnerView(record: PartnerMemoryRecord) { return { id: record.id, partnerName: record.partnerName, partnerType: record.partnerType, geography: record.geography, readinessStatus: record.readinessStatus === "approved" ? "approved" : "staged_only", nextAction: getPartnerNextAction(record) }; }
