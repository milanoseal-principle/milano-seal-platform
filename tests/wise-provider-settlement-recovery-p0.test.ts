import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const migration = fs.readFileSync(
  path.join(root, "supabase/migrations/076_wise_provider_settlement_evidence_recovery.sql"),
  "utf8",
);

test("provider-notification recovery remains Wise-only and delegates paid truth to the canonical payment RPC", () => {
  assert.match(migration, /create table if not exists public\.wise_provider_settlement_evidence/);
  assert.match(migration, /wise_provider_notification/);
  assert.match(migration, /confirm_wise_payment_from_provider_notification/);
  assert.match(migration, /public\.confirm_wise_payment_for_deal\(/);
  assert.doesNotMatch(migration, /update\s+public\.deals[\s\S]*payment_confirmed\s*=\s*true/i);
  assert.doesNotMatch(migration, /stripe/i);
});

test("provider-notification recovery fails closed on reference, amount, currency, resource, timestamp and observed-submission mismatches", () => {
  for (const guard of [
    "WISE_REFERENCE_MISMATCH",
    "WISE_CURRENCY_MISMATCH",
    "WISE_AMOUNT_MISMATCH",
    "WISE_PROVIDER_AMOUNT_MATH_MISMATCH",
    "WISE_PROVIDER_RESOURCE_INVALID",
    "WISE_SETTLEMENT_TIMESTAMP_INVALID",
    "WISE_SUBMISSION_NOT_OBSERVED",
    "WISE_SETTLEMENT_PRECEDES_SUBMISSION",
    "WISE_PROVIDER_RESOURCE_ALREADY_BOUND",
  ]) {
    assert.match(migration, new RegExp(guard));
  }
});

test("provider evidence is service-role only and immutable in authority scope", () => {
  assert.match(migration, /enable row level security/);
  assert.match(migration, /revoke all on public\.wise_provider_settlement_evidence from anon, authenticated/);
  assert.match(migration, /grant select, insert, update on public\.wise_provider_settlement_evidence to service_role/);
  assert.match(
    migration,
    /revoke all on function public\.confirm_wise_payment_from_provider_notification[\s\S]*from public, anon, authenticated/,
  );
  assert.match(
    migration,
    /grant execute on function public\.confirm_wise_payment_from_provider_notification[\s\S]*to service_role/,
  );
});
