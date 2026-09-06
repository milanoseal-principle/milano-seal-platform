#!/usr/bin/env node
import { readFileSync } from "node:fs";

const migration = readFileSync("supabase/migrations/076_wise_provider_settlement_evidence_recovery.sql", "utf8");
const test = readFileSync("tests/wise-provider-settlement-recovery-p0.test.ts", "utf8");

const checks = [
  ["provider evidence table exists", /wise_provider_settlement_evidence/.test(migration)],
  ["recovery RPC exists", /confirm_wise_payment_from_provider_notification/.test(migration)],
  ["canonical Wise confirmation remains authority", /public\.confirm_wise_payment_for_deal\(/.test(migration)],
  ["no direct paid-state write", !/update\s+public\.deals[\s\S]*payment_confirmed\s*=\s*true/i.test(migration)],
  ["service role only", /grant execute on function public\.confirm_wise_payment_from_provider_notification[\s\S]*to service_role/i.test(migration)],
  ["reference guard", /WISE_REFERENCE_MISMATCH/.test(migration)],
  ["amount guard", /WISE_AMOUNT_MISMATCH/.test(migration)],
  ["currency guard", /WISE_CURRENCY_MISMATCH/.test(migration)],
  ["provider resource guard", /WISE_PROVIDER_RESOURCE_INVALID/.test(migration)],
  ["observed submission guard", /WISE_SUBMISSION_NOT_OBSERVED/.test(migration)],
  ["regression test present", /provider-notification recovery remains Wise-only/.test(test)],
  ["Stripe absent", !/stripe/i.test(migration)],
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
console.log(`Tiffany Wise provider settlement recovery: ${checks.length}/${checks.length} passed`);
