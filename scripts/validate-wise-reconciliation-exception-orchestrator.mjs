#!/usr/bin/env node
import { readFileSync } from "node:fs";

const migration = readFileSync("supabase/migrations/077_wise_reconciliation_exception_orchestrator.sql", "utf8");
const orchestrator = readFileSync("lib/wise/reconciliation-exceptions.ts", "utf8");
const recoveryApi = readFileSync("app/api/admin/wise/reconciliation-exceptions/route.ts", "utf8");
const cron = readFileSync("app/api/cron/wise-payment-reconcile/route.ts", "utf8");

const checks = [
  ["durable Wise exception table", /wise_reconciliation_exceptions/.test(migration)],
  ["exception table service-role governed", /revoke all on public\.wise_reconciliation_exceptions from anon, authenticated/i.test(migration)],
  ["automatic stuck-payment scanner", /scanWiseReconciliationExceptions/.test(orchestrator)],
  ["scheduling authority preserved", /evaluateSchedulingGate/.test(orchestrator) && /scheduling_authorized/.test(orchestrator)],
  ["missing correlation is action-required", /provider_correlation_missing/.test(orchestrator)],
  ["provider-correlated settlement remains watch state", /settlement_pending_with_provider_evidence/.test(orchestrator)],
  ["no amount-time auto-paid guessing", /never infer paid state from amount or timing alone/i.test(orchestrator)],
  ["scanner cannot author paid truth", !/payment_confirmed:\s*true/.test(orchestrator) && !/payment_status:\s*["']paid["']/.test(orchestrator)],
  ["operator recovery is authenticated", /resolveServerRole/.test(recoveryApi) && /UNAUTHENTICATED/.test(recoveryApi) && /FORBIDDEN/.test(recoveryApi)],
  ["VA excluded from settlement recovery", !/virtual_assistant/.test(recoveryApi)],
  ["exact provider evidence delegated to governed recovery RPC", /confirm_wise_payment_from_provider_notification/.test(recoveryApi)],
  ["recovery route never directly writes paid fields", !/payment_confirmed\s*:/.test(recoveryApi) && !/payment_status\s*:/.test(recoveryApi)],
  ["minute reconciliation cron runs exception scanner", /scanWiseReconciliationExceptions/.test(cron)],
  ["Wise only", !/stripe/i.test(migration + orchestrator + recoveryApi + cron)],
];

let failed = 0;
for (const [label, ok] of checks) {
  if (ok) console.log(`PASS ${label}`);
  else {
    console.error(`FAIL ${label}`);
    failed += 1;
  }
}

if (failed) process.exit(1);
console.log(`Wise reconciliation exception orchestrator: ${checks.length}/${checks.length} passed`);
