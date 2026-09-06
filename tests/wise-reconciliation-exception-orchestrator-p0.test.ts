import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync("supabase/migrations/077_wise_reconciliation_exception_orchestrator.sql", "utf8");
const orchestrator = fs.readFileSync("lib/wise/reconciliation-exceptions.ts", "utf8");
const recoveryApi = fs.readFileSync("app/api/admin/wise/reconciliation-exceptions/route.ts", "utf8");
const cron = fs.readFileSync("app/api/cron/wise-payment-reconcile/route.ts", "utf8");

test("Wise stuck-payment exceptions are detected automatically without authoring paid state", () => {
  assert.match(orchestrator, /scanWiseReconciliationExceptions/);
  assert.match(orchestrator, /WISE_RECONCILIATION_EXCEPTION_AFTER_MINUTES/);
  assert.match(orchestrator, /provider_correlation_missing/);
  assert.match(orchestrator, /settlement_pending_with_provider_evidence/);
  assert.match(orchestrator, /payment_mismatch_review/);
  assert.match(orchestrator, /auto_payment_confirmation_attempted:\s*false/);
  assert.doesNotMatch(orchestrator, /payment_confirmed:\s*true/);
  assert.doesNotMatch(orchestrator, /payment_status:\s*["']paid["']/);
});

test("exception lane preserves immediate scheduling authority and refuses amount-time guessing", () => {
  assert.match(orchestrator, /evaluateSchedulingGate/);
  assert.match(orchestrator, /scheduling_authorized:\s*scheduling\.schedulingEligible/);
  assert.match(orchestrator, /never infer paid state from amount or timing alone/i);
  assert.match(migration, /this table never authors paid state/i);
  assert.match(migration, /settlement-dependent release remains fail-closed/i);
});

test("operator recovery is authenticated, role restricted, exact-evidence only, and delegates to canonical Wise authority", () => {
  assert.match(recoveryApi, /resolveServerRole/);
  assert.match(recoveryApi, /RECOVERY_ROLES/);
  assert.doesNotMatch(recoveryApi, /virtual_assistant/);
  assert.match(recoveryApi, /confirm_wise_payment_from_provider_notification/);
  assert.match(recoveryApi, /providerResourceId/);
  assert.match(recoveryApi, /grossAmount/);
  assert.match(recoveryApi, /netAmount/);
  assert.match(recoveryApi, /feeAmount/);
  assert.match(recoveryApi, /evidenceLocator/);
  assert.doesNotMatch(recoveryApi, /payment_confirmed\s*:/);
  assert.doesNotMatch(recoveryApi, /payment_status\s*:/);
});

test("automatic reconciliation cron also maintains the exception queue", () => {
  assert.match(cron, /scanWiseReconciliationExceptions/);
  assert.match(cron, /exceptionQueueOpenedOrUpdated/);
  assert.match(cron, /exceptionQueueResolved/);
});

test("exception storage is service-role governed", () => {
  assert.match(migration, /wise_reconciliation_exceptions/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /revoke all on public\.wise_reconciliation_exceptions from anon, authenticated/);
  assert.match(migration, /grant select, insert, update on public\.wise_reconciliation_exceptions to service_role/);
});
