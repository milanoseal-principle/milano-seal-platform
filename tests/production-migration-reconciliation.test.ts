import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test, { before } from "node:test";
import { DEFAULT_TARGETS, declaredPostconditions, migrationPostconditions, reconcile, unwrapSnapshot } from "../scripts/reconcile-production-migrations.mjs";

// B01: each migration's status comes from its actual effects in the hosted catalog, never from
// its filename or the migration-history table. Snapshots here are synthetic.

type Entry = { key: string } & Record<string, unknown>;
type Catalog = Record<string, Entry[]>;
type Post = Awaited<ReturnType<typeof migrationPostconditions>>;
let post: Post;
before(async () => { post = await migrationPostconditions(); });

// A hosted catalog in which the given migrations' effects are present and the rest are not.
function hosted(applied: string[], mutate: (c: Catalog) => void = () => {}) {
  const catalog: Catalog = {};
  const put = (id: string, entry: Entry) => { const [category] = id.split(":"); (catalog[category] ??= []).push(entry); };
  for (const m of post) {
    if (applied.includes(m.file)) for (const r of m.required) put(r.id, r.entry as Entry);
    else for (const id of m.removed) put(id, { key: id.slice(id.indexOf(":") + 1) });
  }
  mutate(catalog);
  return { inspection: "READ_ONLY_METADATA_HASHES_ONLY", observed_at: "2026-11-12T00:00:00Z", project_ref: "synthetic", catalog, migrations: [] as { version: string; name: string }[] };
}
const statuses = (snapshot: ReturnType<typeof hosted>) => Object.fromEntries(reconcile(snapshot, post).migrations.map((m: { file: string; status: string }) => [m.file.slice(0, 14), m.status]));

test("every target has observable postconditions, including hosted-only repairs", () => {
  assert.deepEqual(post.map((m) => m.file), DEFAULT_TARGETS);
  for (const m of post) assert.ok(m.required.length + m.removed.length > 0, m.file);
  const byFile = Object.fromEntries(post.map((m) => [m.file.slice(0, 14), m]));
  assert.equal(byFile["20261112090000"].removed.length, 6, "six unrestricted policies must be absent");
  assert.ok(byFile["20261112100000"].required.some((r) => r.id === "columns:public.files.file_path"));
  assert.ok(byFile["20261112110000"].required.some((r) => r.id === "columns:public.portal_otps.deal_id"));
  assert.ok(byFile["20261112120000"].required.some((r) => r.id === "tables:public.va_tasks"));
  assert.ok(byFile["20261112120000"].required.some((r) => r.id.startsWith("functions:public.va_task_transition(")));
  assert.ok(byFile["20261112130000"].required.some((r) => r.id === "columns:public.operators.profile_id"));
});

test("nothing applied: every migration is MISSING and the report fails", () => {
  const report = reconcile(hosted([]), post);
  assert.equal(report.status, "FAIL");
  assert.ok(report.migrations.every((m: { status: string }) => m.status === "MISSING"), "privileges absent only because the table is absent are not progress");
  assert.equal(report.mode, "READ_ONLY_SNAPSHOT_COMPARISON");
});

test("everything applied: PASS, regardless of the migration-history table", () => {
  const report = reconcile(hosted(DEFAULT_TARGETS), post);
  assert.equal(report.status, "PASS");
  assert.ok(report.migrations.every((m: { recorded_in_migration_history: boolean }) => m.recorded_in_migration_history === false));
});

test("a history row never substitutes for the effects", () => {
  const snapshot = hosted([]);
  snapshot.migrations = DEFAULT_TARGETS.map((f) => ({ version: f.split("_")[0], name: f.replace(/^\d+_/, "").replace(/\.sql$/, "") }));
  const report = reconcile(snapshot, post);
  assert.equal(report.status, "FAIL");
  assert.ok(report.migrations.every((m: { status: string; recorded_in_migration_history: boolean }) => m.status === "MISSING" && m.recorded_in_migration_history));
});

test("partial, still-present, drifted and changed-definition states are distinguished", () => {
  const drop = (id: string) => (c: Catalog) => { const [cat, key] = [id.slice(0, id.indexOf(":")), id.slice(id.indexOf(":") + 1)]; c[cat] = c[cat].filter((e) => e.key !== key); };
  assert.equal(statuses(hosted(DEFAULT_TARGETS, drop("columns:public.operators.referral_code")))["20261112130000"], "PARTIAL");
  assert.equal(statuses(hosted(DEFAULT_TARGETS, (c) => { (c.policies ??= []).push({ key: "public.payments.Service role full access" }); }))["20261112090000"], "PARTIAL");
  const fn = post[3].required.find((r) => r.id.startsWith("functions:public.va_task_transition("))!;
  const withFn = (change: Record<string, unknown>) => hosted(DEFAULT_TARGETS, (c) => { c.functions = c.functions.map((e) => (e.key === (fn.entry as Entry).key ? { ...e, ...change } : e)); });
  assert.equal(statuses(withFn({ definition_hash: "different" }))["20261112120000"], "REVIEW", "a replaced function with another hash is never auto-passed");
  assert.equal(statuses(withFn({ security_definer: false }))["20261112120000"], "DRIFTED");
  assert.equal(reconcile(withFn({ definition_hash: "different" }), post).status, "FAIL");
});

test("declared postconditions are read from the migration text; comments are ignored", () => {
  const d = declaredPostconditions(`-- alter table public.x add column ghost text;
    alter table public.files add column if not exists file_path text;
    create table if not exists public.va_tasks (id uuid);
    drop policy if exists "Service role full access" on public.payments;`);
  assert.deepEqual(d.required, ["columns:public.files.file_path", "tables:public.va_tasks"]);
  assert.deepEqual(d.removed, ["policies:public.payments.Service role full access"]);
  const sec = declaredPostconditions(`alter table public.t enable row level security;
    create policy "own" on public.t for select using (true);
    revoke all on public.t, public.u from anon, authenticated;
    revoke all on function public.f(uuid, text) from public, anon;`);
  assert.deepEqual(sec.required, ["tables:public.t", "policies:public.t.own"]);
  assert.equal(sec.removed.length, 2 * 2 * 7);
  assert.ok(sec.removed.includes("table_grants:public.u.anon.INSERT"));
  assert.deepEqual(sec.revokedFunctions, [{ function: "f", role: "PUBLIC" }, { function: "f", role: "anon" }]);
});

test("security effects that a clean replay does not change are still required", () => {
  const va = post.find((m) => m.file.startsWith("20261112120000"))!;
  assert.deepEqual((va.required.find((r) => r.id === "tables:public.va_tasks")!.entry as Entry).rls, true);
  assert.ok(va.required.some((r) => r.id === "policies:public.va_tasks.va_own_task_read"));
  assert.ok(va.removed.includes("table_grants:public.va_tasks.anon.INSERT"));
  assert.ok(va.removed.includes("table_grants:public.va_task_events.authenticated.SELECT"));
  assert.ok(!va.removed.includes("table_grants:public.va_tasks.authenticated.SELECT"), "granted back by the migration");
  assert.ok(va.removed.some((id) => /^function_grants:public\.va_task_transition\(.*\)\.anon\.EXECUTE$/.test(id)));
  assert.ok(va.removed.some((id) => /^function_grants:public\.va_task_transition\(.*\)\.PUBLIC\.EXECUTE$/.test(id)));

  const VA = "20261112120000";
  const edit = (fn: (c: Catalog) => void) => statuses(hosted(DEFAULT_TARGETS, fn))[VA];
  assert.equal(edit((c) => { c.tables = c.tables.map((t) => (t.key === "public.va_tasks" ? { ...t, rls: false } : t)); }), "DRIFTED", "row level security disabled");
  assert.equal(edit((c) => { c.policies = c.policies.filter((p) => p.key !== "public.va_tasks.va_own_task_read"); }), "PARTIAL", "own-task policy missing");
  assert.equal(edit((c) => { (c.table_grants ??= []).push({ key: "public.va_tasks.anon.INSERT" }); }), "PARTIAL", "anonymous write privilege still present");
  assert.equal(edit((c) => { const fn = c.functions.find((f) => f.key.startsWith("public.va_task_transition("))!; (c.function_grants ??= []).push({ key: `${fn.key}.anon.EXECUTE` }); }), "PARTIAL", "anonymous execute still present");
});

test("repaired columns are checked for type, not just name", () => {
  const withType = (key: string, type: string) => hosted(DEFAULT_TARGETS, (c) => { c.columns = c.columns.map((col) => (col.key === key ? { ...col, type } : col)); });
  assert.equal(statuses(withType("public.files.file_path", "pg_catalog.int4"))["20261112100000"], "DRIFTED");
  assert.equal(statuses(withType("public.portal_otps.deal_id", "pg_catalog.text"))["20261112110000"], "DRIFTED");
  // Nullability and defaults on a repaired column are not asserted.
  const relaxed = hosted(DEFAULT_TARGETS, (c) => { c.columns = c.columns.map((col) => (col.key === "public.files.file_path" ? { ...col, nullable: "NO", default_hash: "other" } : col)); });
  assert.equal(statuses(relaxed)["20261112100000"], "APPLIED");
});

test("fails closed on an unreadable or malformed snapshot and never connects to a database", () => {
  assert.throws(() => unwrapSnapshot({}), /HOSTED_SNAPSHOT_FORMAT_INVALID/);
  assert.throws(() => unwrapSnapshot({ inspection: "SOMETHING_ELSE", catalog: {}, migrations: [], observed_at: "x" }), /HOSTED_SNAPSHOT_FORMAT_INVALID/);
  const run = (env: Record<string, string>) => spawnSync(process.execPath, ["scripts/reconcile-production-migrations.mjs"], { env: { ...process.env, P12_HOSTED_METADATA: undefined, ...env } as NodeJS.ProcessEnv, encoding: "utf8" });
  assert.equal(run({}).status, 2);
  const bad = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "b01-")), "bad.json");
  fs.writeFileSync(bad, "{}");
  const r = run({ P12_HOSTED_METADATA: bad });
  assert.equal(r.status, 2);
  assert.doesNotMatch(r.stdout + r.stderr, /PASS/);
  const source = fs.readFileSync("scripts/reconcile-production-migrations.mjs", "utf8");
  assert.doesNotMatch(source, /DATABASE_URL|createClient|SERVICE_ROLE|from 'pg'|postgres:\/\//, "snapshot comparison only");
  assert.match(execFileSync("git", ["check-ignore", "artifacts/certification/b01-migration-reconciliation.json"], { encoding: "utf8" }), /artifacts/);
  const audit = fs.readFileSync("supabase/verification/b01_operator_binding_audit.sql", "utf8").replace(/--.*$/gm, "");
  assert.doesNotMatch(audit, /\b(insert|update|delete|alter|drop|create|grant|truncate)\b/i, "audit SQL is read-only");
});
