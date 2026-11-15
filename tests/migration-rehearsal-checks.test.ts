import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { isolatedCanonicalDatabase } from "../scripts/certification/shared.mjs";

// supabase/verification/migration_rehearsal_checks.sql verifies the postconditions of the eight
// production security/schema migrations. It is run read-only in the Supabase SQL editor after the
// hosted apply (and on any restored copy).
// It must pass once they are applied (in the approved priority order) and name every unmet one
// otherwise; it must never be satisfied by a database the migrations have not reached.

const CHECKS = fs.readFileSync("supabase/verification/migration_rehearsal_checks.sql", "utf8");
export const PRIORITY_ORDER = [
  "20261114100000_founder_admin_server_identity.sql",
  "20261112090000_revoke_unrestricted_public_rls_policies.sql",
  "20261112120000_va_task_ledger.sql",
  "20261112130000_alliance_operator_identity.sql",
  "20261112140000_operator_profile_binding.sql",
  "20261113150000_rejected_referral_not_convertible.sql",
  "20261114090000_restrict_authenticated_allow_all_policies.sql",
  "20261114110000_require_operator_unique_indexes.sql",
];
const files = () => fs.readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql")).sort();
type Checks = Record<string, unknown> & { failures: string[] };
const run = async (db: Awaited<ReturnType<typeof isolatedCanonicalDatabase>>) =>
  ((await db.exec(CHECKS)).at(-1)!.rows[0] as { migration_rehearsal_checks: Checks }).migration_rehearsal_checks;

test("the eight migrations exist in the repository", () => {
  for (const file of PRIORITY_ORDER) assert.ok(files().includes(file), file);
});

test("all postconditions hold after the eight migrations are applied in priority order", async () => {
  const db = await isolatedCanonicalDatabase(files().filter((f) => !PRIORITY_ORDER.includes(f)));
  try {
    const before = await run(db);
    for (const unmet of ["va_transition_rpc_present", "operator_binding_rpcs_present", "rejected_referral_guard_trigger_enabled",
      "partner_ownership_helper_present", "operator_unique_indexes_valid"]) assert.ok(before.failures.includes(unmet), unmet);
    for (const file of PRIORITY_ORDER) await db.exec(fs.readFileSync(`supabase/migrations/${file}`, "utf8"));
    const after = await run(db);
    assert.deepEqual(after.failures, []);
    assert.equal(after.founder_helper_reads_user_metadata, false);
    assert.equal(after.operator_unique_indexes_valid, 3);
  } finally {
    await db.close();
  }
});

test("a reintroduced founder metadata trust or allow-all policy is reported", async () => {
  const db = await isolatedCanonicalDatabase(files());
  try {
    await db.exec(`create or replace function public.is_founder_or_admin() returns boolean language sql stable as
        $$ select coalesce((auth.jwt() -> 'user_metadata' ->> 'role') in ('founder', 'admin'), false) $$;
      create policy drill_open on public.referral_ledger for select to authenticated using (true);`);
    const checks = await run(db);
    for (const failure of ["founder_helper_reads_user_metadata", "founder_helper_reads_app_metadata", "founder_helper_security_definer",
      "authenticated_allow_all_policies"]) assert.ok(checks.failures.includes(failure), failure);
    assert.deepEqual(checks.authenticated_allow_all_policies, ["referral_ledger:drill_open"]);
  } finally {
    await db.close();
  }
});

test("rehearsal checks are catalog-only and never write", () => {
  assert.doesNotMatch(CHECKS, /\b(insert|update|delete|truncate|alter|drop|create|grant|revoke)\b\s/i);
});
