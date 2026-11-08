// P5 governance rules for retention deletion, RON incidents and RON records requests.
// Mirrors the database enforcement in migration 20261108100000 (the DB remains authoritative).

export const RETENTION_DELETION_AUTHORITY_ROLES = new Set(["founder", "founder_admin", "admin"]);
export const RECORDS_REQUEST_DECISION_ROLES = new Set(["founder", "founder_admin", "admin", "admin_operator"]);

export interface RetentionRecordState {
  deletion_status: string;
  policy_status: string;
  retention_until: string | null;
  ron_lifecycle_state?: string | null;
  active_holds: number;
  open_records_requests: number;
  open_incidents: number;
}

export function retentionDeletionBlockers(record: RetentionRecordState, now = new Date()) {
  const blockers: string[] = [];
  if (record.deletion_status === "deleted") blockers.push("ALREADY_DELETED");
  if (record.policy_status !== "resolved") blockers.push("RETENTION_POLICY_UNRESOLVED");
  if (!record.retention_until || new Date(record.retention_until) > now) blockers.push("RETENTION_ACTIVE");
  if (record.active_holds > 0) blockers.push("HOLD_ACTIVE");
  if (record.ron_lifecycle_state !== undefined && !["COMPLETED", "FAILED", "CANCELLED"].includes(String(record.ron_lifecycle_state))) {
    blockers.push("EVIDENCE_DEPENDENCY_ACTIVE");
  }
  if (record.open_records_requests > 0) blockers.push("RECORDS_REQUEST_OPEN");
  if (record.open_incidents > 0) blockers.push("INCIDENT_OPEN");
  return blockers;
}

export function canAuthorizeDeletion(role: string, record: RetentionRecordState, reason: string, now = new Date()) {
  const blockers = retentionDeletionBlockers(record, now);
  if (!RETENTION_DELETION_AUTHORITY_ROLES.has(role)) blockers.push("DELETION_AUTHORITY_REQUIRED");
  if (!reason.trim()) blockers.push("DELETION_AUTHORIZATION_MISSING");
  return blockers;
}

export const RON_INCIDENT_CATEGORIES = [
  "ELECTRONIC_SEAL_COMPROMISE",
  "ELECTRONIC_SIGNATURE_COMPROMISE",
  "RON_CREDENTIAL_COMPROMISE",
  "JOURNAL_COMPROMISE",
  "RECORDING_COMPROMISE",
  "PROVIDER_CREDENTIAL_COMPROMISE",
  "UNAUTHORIZED_ACCESS",
  "EVIDENCE_LOSS_OR_CORRUPTION",
] as const;
export type RonIncidentCategory = (typeof RON_INCIDENT_CATEGORIES)[number];
const CREDENTIAL_CATEGORIES = new Set<string>([
  "ELECTRONIC_SEAL_COMPROMISE",
  "ELECTRONIC_SIGNATURE_COMPROMISE",
  "RON_CREDENTIAL_COMPROMISE",
  "PROVIDER_CREDENTIAL_COMPROMISE",
]);
export const NOTIFICATION_STATES = ["required", "not_required", "review_required", "completed"] as const;

export function notificationDeadline(detectedAt: string, stateNotification: string) {
  if (stateNotification !== "required" && stateNotification !== "completed") return null;
  return new Date(new Date(detectedAt).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
}

export function notificationCompletionError(notifiedAt: unknown, evidenceRef: unknown) {
  if (typeof notifiedAt !== "string" || Number.isNaN(Date.parse(notifiedAt))) return "NOTIFICATION_TIMESTAMP_REQUIRED";
  if (typeof evidenceRef !== "string" || !evidenceRef.trim()) return "NOTIFICATION_EVIDENCE_REQUIRED";
  return null;
}

export function ronIncidentClosureBlockers(incident: Record<string, unknown>) {
  const blockers: string[] = [];
  for (const field of ["law_enforcement_notification", "state_notification"]) {
    if (["required", "review_required"].includes(String(incident[field] ?? "review_required"))) blockers.push(`${field.toUpperCase()}_UNRESOLVED`);
  }
  if (!String(incident.containment_action ?? "").trim()) blockers.push("CONTAINMENT_ACTION_REQUIRED");
  if (!String(incident.remediation ?? "").trim()) blockers.push("REMEDIATION_REQUIRED");
  if (CREDENTIAL_CATEGORIES.has(String(incident.incident_category)) && !String(incident.credential_replacement_evidence_ref ?? "").trim()) {
    blockers.push("CREDENTIAL_REPLACEMENT_EVIDENCE_REQUIRED");
  }
  return blockers;
}

export interface RecordsRequestState {
  matter_id: string;
  decision: string;
  requester_verification_state: string;
  redaction_status: string;
  released_at: string | null;
}

export function recordsReleaseBlockers(
  request: RecordsRequestState,
  version: { matter_id: string; file_hash: string } | null,
  sha256: string,
) {
  const blockers: string[] = [];
  if (request.released_at) blockers.push("ALREADY_RELEASED");
  if (request.decision !== "approved") blockers.push("REQUEST_NOT_APPROVED");
  if (request.requester_verification_state !== "verified") blockers.push("REQUESTER_NOT_VERIFIED");
  if (!["not_required", "completed"].includes(request.redaction_status)) blockers.push("REDACTION_UNRESOLVED");
  if (!version) blockers.push("RELEASE_VERSION_REQUIRED");
  else {
    if (version.matter_id !== request.matter_id) blockers.push("RON_RECORDS_REQUEST_CROSS_MATTER");
    if (version.file_hash !== sha256) blockers.push("RON_RECORDS_RELEASE_VERSION_MISMATCH");
  }
  return blockers;
}
