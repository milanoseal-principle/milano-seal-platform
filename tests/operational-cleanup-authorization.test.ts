import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

// Operational cleanup: these operator surfaces authorized against a `profiles` table that does not
// exist, used VA task columns and states that do not exist, and turned failed reads into zeros.

const read = (file: string) => fs.readFileSync(file, "utf8");
const code = (file: string) => read(file).replace(/^\s*\/\/.*$/gm, "");
const migrations = fs.readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql")).map((f) => read(`supabase/migrations/${f}`)).join("\n");

test("there is no profiles table, and the repaired surfaces no longer authorize against one", () => {
  assert.doesNotMatch(migrations, /create\s+table\s+(if\s+not\s+exists\s+)?(public\.)?profiles\b/i, "no profiles table is created: do not add one");
  for (const file of [
    "app/api/dashboard/quick-actions/route.ts",
    "app/api/dashboard/witness-network/route.ts",
    "app/dashboard/revenue/page.tsx",
    "app/dashboard/execution-qa/page.tsx",
    "app/dashboard/witness-network/page.tsx",
  ]) {
    assert.doesNotMatch(code(file), /from\(["']profiles["']\)/, file);
  }
  for (const file of ["app/api/dashboard/quick-actions/route.ts", "app/api/dashboard/witness-network/route.ts"]) {
    const source = code(file);
    assert.match(source, /requireOperatorApiAccess\(\)/, file);
    assert.match(source, /if \(!access\.ok\) return access\.response;/, file);
  }
  const witness = code("app/api/dashboard/witness-network/route.ts");
  assert.equal(witness.match(/ADMIN_ROLES\.has\(access\.role\)/g)?.length, 2, "read and write both keep the founder/admin restriction");
  assert.match(witness, /approved_by: access\.userId/);
  for (const file of ["app/dashboard/revenue/page.tsx", "app/dashboard/execution-qa/page.tsx", "app/dashboard/witness-network/page.tsx"]) {
    assert.match(code(file), /ADMIN_ROLES\.has\(await resolveServerRole\(user\)\)\) redirect\("\/dashboard"\)/, file);
  }
});

test("quick-actions uses the VA ledger's real columns and states, exact counts, and never a false zero", () => {
  const source = code("app/api/dashboard/quick-actions/route.ts");
  const ledger = read("supabase/migrations/20261112120000_va_task_ledger.sql");
  assert.match(ledger, /due_at\s+timestamptz/);
  assert.doesNotMatch(ledger, /due_date/);
  assert.doesNotMatch(source, /due_date|"assigned"|"complete"\b/);
  for (const state of ["pending", "in_progress", "review", "escalated", "completed", "cancelled"]) {
    assert.match(ledger, new RegExp(`'${state}'`));
    assert.match(source, new RegExp(state));
  }
  assert.equal(source.match(/count: "exact", head: true/g)?.length, 4, "every query is an exact head count, so no row limit can truncate it");
  assert.doesNotMatch(source, /Count: 0|no_data: true|role: 'founder_admin'/, "a failure is never reported as zeros or as a founder session");
  assert.match(source, /QUICK_ACTION_DATA_UNAVAILABLE/);
  assert.match(source, /status: 503/);
  assert.match(source, /vaTaskCount: vaTasksAvailable \? vaOpen\.count : null/);
  const menu = code("components/dashboard/QuickActionIntelligenceMenu.tsx");
  assert.match(menu, /vaTaskCount: number \| null/);
});

test("a failed read or an unrecorded attachment is reported, not shown as empty or confirmed", () => {
  const witness = code("app/api/dashboard/witness-network/route.ts");
  assert.match(witness, /WITNESS_NETWORK_UNAVAILABLE/);
  assert.doesNotMatch(witness, /partners: \[\], no_data: true/);
  assert.match(code("components/execution-qa/WitnessNetworkPanel.tsx"), /This is not an empty list/);

  const upload = code("app/api/intake/upload/route.ts");
  const insert = upload.indexOf('.from("files")');
  const guard = upload.indexOf("if (recordError || !row)");
  assert.ok(insert > 0 && guard > insert && guard < upload.indexOf("persistUploadedVersion("), "the record error is checked before the attachment is treated as stored");
  assert.match(upload, /error: recordError/);
  assert.match(upload, /status:errors\.length&&!uploaded\.length\?503:200/, "nothing confirmed and an error present is not a 200");
  assert.match(upload, /Your request was received, but this attachment was not confirmed\./);
  assert.match(upload, /Do not submit a second request\./);
});
