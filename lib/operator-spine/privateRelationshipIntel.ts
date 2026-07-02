import type { RelationshipIntelRecord } from "./types";

export function buildRelationshipIntel(records: readonly RelationshipIntelRecord[] = []) { return records.map((record) => ({ ...record, internalOnly: true })); }
export function getRelationshipNextAction(record: RelationshipIntelRecord) { return record.nextTouchLabel || (record.trustLevel === "new" ? "Schedule first trust-building touchpoint." : "Maintain relationship cadence."); }
export function getRelationshipStageLabel(stage: string) { return stage.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
export function sanitizeRelationshipIntelForClient(record: RelationshipIntelRecord) { return { id: record.id, name: record.name, type: record.type, communicationPreference: record.communicationPreference, nextTouchLabel: record.nextTouchLabel, internalOnly: false }; }
