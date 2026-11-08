import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  canAuthorizeDeletion,
  notificationCompletionError,
  notificationDeadline,
  recordsReleaseBlockers,
  retentionDeletionBlockers,
  ronIncidentClosureBlockers,
  type RetentionRecordState,
} from "../lib/ron/governance";

const read = (path: string) => readFileSync(path, "utf8");
const migration = read("supabase/migrations/20261108100000_p5_ron_retention_incidents_records.sql");
const retentionRoute = read("app/api/dashboard/retention/route.ts");
const requestsRoute = read("app/api/dashboard/ron/records-requests/route.ts");
const requestRoute = read("app/api/dashboard/ron/records-requests/[id]/route.ts");
const incidentsRoute = read("app/api/dashboard/incidents/route.ts");

const expired = (overrides: Partial<RetentionRecordState> = {}): RetentionRecordState => ({
  deletion_status: "retained",
  policy_status: "resolved",
  retention_until: "2020-01-01T00:00:00.000Z",
  ron_lifecycle_state: "COMPLETED",
  active_holds: 0,
  open_records_requests: 0,
  open_incidents: 0,
  ...overrides,
});

test("P5 active retention blocks deletion", () => {
  assert.ok(retentionDeletionBlockers(expired({ retention_until: "2099-01-01T00:00:00.000Z" })).includes("RETENTION_ACTIVE"));
  assert.ok(retentionDeletionBlockers(expired({ retention_until: null })).includes("RETENTION_ACTIVE"));
  assert.match(migration, /'RETENTION_ACTIVE'/);
  assert.match(migration, /RETENTION_DELETION_BLOCKED/);
});

test("P5 hold blocks deletion and overrides expired retention", () => {
  assert.deepEqual(retentionDeletionBlockers(expired({ active_holds: 1 })), ["HOLD_ACTIVE"]);
  assert.match(migration, /'HOLD_ACTIVE'/);
  assert.match(migration, /RETENTION_HOLD_IMMUTABLE/);
});

test("P5 expired retention alone does not bypass authorization", () => {
  assert.deepEqual(retentionDeletionBlockers(expired()), []);
  assert.ok(canAuthorizeDeletion("execution_coordinator", expired(), "eligible").includes("DELETION_AUTHORITY_REQUIRED"));
  assert.ok(canAuthorizeDeletion("founder", expired(), "").includes("DELETION_AUTHORIZATION_MISSING"));
  assert.deepEqual(canAuthorizeDeletion("founder", expired(), "retention period elapsed; no holds"), []);
  assert.match(migration, /OLD\.deletion_status <> 'authorized'/);
  assert.match(retentionRoute, /DELETION_AUTHORIZATION_MISSING/);
  assert.match(retentionRoute, /PROVIDER_DELETION_EVIDENCE_REQUIRED/);
});

test("P5 unresolved policy and active dependencies fail closed", () => {
  assert.ok(retentionDeletionBlockers(expired({ policy_status: "review_required" })).includes("RETENTION_POLICY_UNRESOLVED"));
  assert.ok(retentionDeletionBlockers(expired({ ron_lifecycle_state: "EVIDENCE_PENDING" })).includes("EVIDENCE_DEPENDENCY_ACTIVE"));
  assert.ok(retentionDeletionBlockers(expired({ open_records_requests: 1 })).includes("RECORDS_REQUEST_OPEN"));
  assert.ok(retentionDeletionBlockers(expired({ open_incidents: 1 })).includes("INCIDENT_OPEN"));
});

test("P5 Matter close does not delete RON evidence; deletion evidence is preserved", () => {
  assert.match(migration, /RETENTION_EVIDENCE_IMMUTABLE/);
  assert.match(migration, /append_only_retention_deletion_events/);
  assert.match(migration, /register_ron_retention_records/);
  assert.match(migration, /'FL_RON_10Y'/);
  assert.doesNotMatch(migration, /\bdelete from\b|\bdrop table\b|\btruncate\b/i);
  for (const route of [retentionRoute, requestRoute]) assert.doesNotMatch(route, /from\('(ron_sessions|ron_documents|document_versions|retention_records)'\)\.delete/);
});

test("P5 incident state is auditable", () => {
  assert.match(migration, /append_only_incident_audit_log/);
  assert.match(incidentsRoute, /from\("incident_audit_log"\)\.insert/);
  assert.match(incidentsRoute, /INCIDENT_UPDATED/);
  assert.doesNotMatch(incidentsRoute, /error: error\.message/);
});

test("P5 external notification cannot be marked complete without evidence", () => {
  assert.equal(notificationCompletionError(undefined, "ref"), "NOTIFICATION_TIMESTAMP_REQUIRED");
  assert.equal(notificationCompletionError("2026-11-08T00:00:00Z", ""), "NOTIFICATION_EVIDENCE_REQUIRED");
  assert.equal(notificationCompletionError("2026-11-08T00:00:00Z", "fl-dos:ack:123"), null);
  assert.match(migration, /compliance_incidents_notification_evidence_check/);
  assert.ok(ronIncidentClosureBlockers({ incident_category: "JOURNAL_COMPROMISE" }).includes("STATE_NOTIFICATION_UNRESOLVED"));
  assert.ok(ronIncidentClosureBlockers({ incident_category: "ELECTRONIC_SEAL_COMPROMISE", law_enforcement_notification: "not_required", state_notification: "completed", containment_action: "x", remediation: "y" }).includes("CREDENTIAL_REPLACEMENT_EVIDENCE_REQUIRED"));
  assert.match(migration, /RON_INCIDENT_NOTIFICATION_UNRESOLVED/);
});

test("P5 7-day notification target applies only where state notification is required", () => {
  assert.equal(notificationDeadline("2026-11-01T00:00:00.000Z", "required"), "2026-11-08T00:00:00.000Z");
  assert.equal(notificationDeadline("2026-11-01T00:00:00.000Z", "not_required"), null);
  assert.equal(notificationDeadline("2026-11-01T00:00:00.000Z", "review_required"), null);
  assert.match(migration, /interval '7 days'/);
  assert.match(migration, /state_notification text not null default 'review_required'/);
});

test("P5 records request requires authorization and has no public lookup", () => {
  for (const route of [requestsRoute, requestRoute, retentionRoute]) assert.match(route, /requireDashboardAccess\(\)/);
  assert.match(requestRoute, /DECISION_AUTHORITY_REQUIRED/);
  assert.match(requestRoute, /REQUESTER_NOT_VERIFIED/);
  assert.doesNotMatch(requestsRoute, /requester_email['"]?\s*,\s*['"`]|ilike|\.or\(/);
  assert.match(requestsRoute, /MATTER_ID_REQUIRED/);
  assert.match(migration, /revoke all on public\.%I from anon, authenticated/);
  assert.doesNotMatch(migration, /to anon/);
});

test("P5 records request cannot cross Matter boundaries", () => {
  const req = { matter_id: "m1", decision: "approved", requester_verification_state: "verified", redaction_status: "not_required", released_at: null };
  assert.ok(recordsReleaseBlockers(req, { matter_id: "m2", file_hash: "a" }, "a").includes("RON_RECORDS_REQUEST_CROSS_MATTER"));
  assert.match(migration, /RON_RECORDS_REQUEST_CROSS_MATTER/);
  assert.match(requestsRoute, /\.eq\('matter_id', matterId\)/);
});

test("P5 release artifact preserves custody and exact version", () => {
  const req = { matter_id: "m1", decision: "approved", requester_verification_state: "verified", redaction_status: "not_required", released_at: null };
  assert.deepEqual(recordsReleaseBlockers(req, { matter_id: "m1", file_hash: "a" }, "a"), []);
  assert.ok(recordsReleaseBlockers({ ...req, redaction_status: "required" }, { matter_id: "m1", file_hash: "a" }, "a").includes("REDACTION_UNRESOLVED"));
  assert.ok(recordsReleaseBlockers({ ...req, decision: "pending" }, { matter_id: "m1", file_hash: "a" }, "a").includes("REQUEST_NOT_APPROVED"));
  assert.ok(recordsReleaseBlockers(req, null, "").includes("RELEASE_VERSION_REQUIRED"));
  assert.match(requestRoute, /appendLedger/);
  assert.match(requestRoute, /release_custody_hash/);
  assert.match(migration, /RON_RECORDS_RELEASE_VERSION_MISMATCH/);
  assert.match(migration, /RON_RECORDS_RELEASE_IMMUTABLE/);
});
