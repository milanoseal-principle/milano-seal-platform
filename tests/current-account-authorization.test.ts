import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import test, { before as setup } from "node:test";
import type { PGlite } from "@electric-sql/pglite";

// Shared with scripts/test-migration-replay.mjs (untyped .mjs, loaded as ESM).
const migrationFixture = async (): Promise<PGlite> =>
  (await import("../scripts/lib/migration-fixture.mjs" as string) as { migrationFixture: () => Promise<PGlite> }).migrationFixture();

// Regression for RLS policies that decided access from claims copied into the caller's JWT
// (app_metadata.role, email) instead of the account's current state. The database is the
// real repository chain replayed in order; the defect is reproduced on it first, then
// 20261126050000 is applied and the same calls are repeated. Synthetic identities only.

const MIGRATION_FILE = "20261126050000_current_account_authorization_hardening.sql";
const MIGRATION = fs.readFileSync(`supabase/migrations/${MIGRATION_FILE}`, "utf8");
const CLAIM = /auth\.jwt\(\)|request\.jwt\.claims|auth\.email\(\)/;

const uid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
type Person = { id: string; email: string | null; app: Record<string, unknown>; user?: Record<string, unknown>; banned?: boolean; jwtApp?: Record<string, unknown>; jwtEmail?: string; noAccount?: boolean };
const P: Record<string, Person> = {
  founder: { id: uid(1), email: "founder@example.invalid", app: { role: "founder_admin" } },
  disabledFounder: { id: uid(2), email: "disabled@example.invalid", app: { role: "founder_admin", disabled: true } },
  bannedAdmin: { id: uid(3), email: "banned@example.invalid", app: { role: "admin" }, banned: true },
  revokedStaff: { id: uid(4), email: "revoked@example.invalid", app: { role: "client" }, jwtApp: { role: "founder_admin" } },
  deleted: { id: uid(5), email: "deleted@example.invalid", app: { role: "founder_admin" }, noAccount: true },
  forged: { id: uid(6), email: "forged@example.invalid", app: { role: "client" }, user: { role: "founder_admin" } },
  inactiveBinding: { id: uid(7), email: "inactive@example.invalid", app: { role: "founder_admin" } },
  coordinator: { id: uid(8), email: "coordinator@example.invalid", app: { role: "translation_coordinator" } },
  va: { id: uid(9), email: "va@example.invalid", app: { role: "virtual_assistant" } },
  partner: { id: uid(10), email: "partner@example.invalid", app: { role: "alliance_partner" } },
  clientA: { id: uid(11), email: "client-a@example.invalid", app: { role: "client" } },
  clientB: { id: uid(12), email: "client-b@example.invalid", app: { role: "client" } },
  // Email changed on the server; the old token still carries client A's address.
  staleEmail: { id: uid(13), email: "moved@example.invalid", app: { role: "client" }, jwtEmail: "client-a@example.invalid" },
  disabledClientA: { id: uid(14), email: "client-a2@example.invalid", app: { role: "client", disabled: true } },
};

type Snapshot = Map<string, { cmd: string; roles: string; permissive: string; qual: string | null; check: string | null }>;

async function replayBefore(): Promise<PGlite> {
  const db = await migrationFixture();
  const plan = JSON.parse(fs.readFileSync("supabase/migration-replay-plan.json", "utf8")) as { fresh_database_prerequisites: string[] };
  const files = fs.readdirSync("supabase/migrations").filter((n) => n.endsWith(".sql")).sort();
  for (const name of [...plan.fresh_database_prerequisites, ...files.filter((n) => !plan.fresh_database_prerequisites.includes(n))]) {
    if (name === MIGRATION_FILE) continue;
    await db.exec(fs.readFileSync(`supabase/migrations/${name}`, "utf8"));
  }
  for (const p of Object.values(P)) {
    if (p.noAccount) continue;
    await db.query("insert into auth.users(id, email, raw_app_meta_data, raw_user_meta_data, banned_until) values ($1, $2, $3, $4, $5)",
      [p.id, p.email, JSON.stringify(p.app), JSON.stringify(p.user ?? {}), p.banned ? "2999-01-01T00:00:00Z" : null]);
  }
  await db.query("insert into public.operators(user_id, email, role, is_active) values ($1, $2, 'founder_admin', false)", [P.inactiveBinding.id, P.inactiveBinding.email]);
  // Hosted Supabase grants table privileges to authenticated by default; RLS is the boundary.
  await db.exec(`
    grant select, insert, update, delete on public.discount_codes, public.translation_entries, public.notary_credentials to authenticated, service_role;
    grant select on public.client_profiles, storage.objects to authenticated, anon;
    alter table storage.objects enable row level security; -- always on in hosted Supabase
    insert into public.translation_entries(content_key, locale, source_hash, source_text, translated_text, translation_method, risk_level, review_status)
      values ('home.hero', 'it', 'h1', 'Hello', 'Ciao', 'ai', 'LOW', 'AUTO_TRANSLATED');
    insert into storage.buckets(id, name) values ('documents', 'documents');
  `);
  for (const owner of ["clientA", "clientB"] as const) {
    const deal = (await db.query<{ id: string }>("insert into public.deals(email) values ($1) returning id::text", [P[owner].email])).rows[0].id;
    await db.query("insert into storage.objects(bucket_id, name) values ('documents', $1)", [`${deal}/synthetic-${owner}.pdf`]);
    await db.query("insert into public.client_profiles(client_email) values ($1)", [P[owner].email]);
  }
  return db;
}

async function as<T>(db: PGlite, who: Person | "anon", fn: () => Promise<T>): Promise<T> {
  if (who === "anon") {
    await db.exec("set role anon; select set_config('request.jwt.claims', '{\"role\":\"anon\"}', false)");
  } else {
    const claims = { sub: who.id, role: "authenticated", email: who.jwtEmail ?? who.email, app_metadata: who.jwtApp ?? who.app, user_metadata: who.user ?? {} };
    await db.exec("set role authenticated");
    await db.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify(claims)]);
  }
  try {
    return await fn();
  } finally {
    await db.exec("reset role; select set_config('request.jwt.claims', '', false)");
  }
}

const insertCode = (db: PGlite, who: Person, code: string) =>
  as(db, who, async () => {
    try {
      await db.query("insert into public.discount_codes(code, type, value, discount_type, discount_value, internal_reason) values ($1, 'percentage', 10, 'percentage', 10, 'synthetic test')", [code]);
      return true;
    } catch (error) {
      assert.match(String((error as Error).message), /row-level security/, "denied by RLS, not by an unrelated error");
      return false;
    }
  });
const updateTranslation = (db: PGlite, who: Person) =>
  as(db, who, async () => (await db.query("update public.translation_entries set review_status = 'REVIEW_REQUIRED'")).affectedRows ?? 0);
const visibleDeals = (db: PGlite, who: Person | "anon") =>
  as(db, who, async () => (await db.query<{ email: string }>("select email from public.deals order by email")).rows.map((r) => r.email));
const visibleObjects = (db: PGlite, who: Person | "anon") =>
  as(db, who, async () => (await db.query<{ name: string }>("select name from storage.objects order by name")).rows.map((r) => r.name.split("/")[1]));
const visibleProfiles = (db: PGlite, who: Person | "anon") =>
  as(db, who, async () => (await db.query<{ client_email: string }>("select client_email from public.client_profiles")).rows.map((r) => r.client_email));

async function snapshot(db: PGlite): Promise<Snapshot> {
  const rows = (await db.query<{ k: string; cmd: string; roles: string; permissive: string; qual: string | null; with_check: string | null }>(
    "select schemaname || '.' || tablename || '.' || policyname k, cmd, roles::text roles, permissive, qual, with_check from pg_policies where schemaname in ('public', 'storage')",
  )).rows;
  return new Map(rows.map((r) => [r.k, { cmd: r.cmd, roles: r.roles, permissive: r.permissive, qual: r.qual, check: r.with_check }]));
}

// The exact substitution the migration makes, expressed on the deparsed text.
const ROLE_CLAIM = "((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text)";
const EMAIL_CLAIMS = ["((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'email'::text)", "(auth.jwt() ->> 'email'::text)", "auth.email()"];
const normaliseBefore = (e: string | null) => e === null ? null : EMAIL_CLAIMS.reduce((s, c) => s.split(c).join("<EMAIL>"), e.split(ROLE_CLAIM).join("<ROLE>"));
const normaliseAfter = (e: string | null) => e === null ? null
  : e.split("( SELECT current_account_role() AS current_account_role)").join("<ROLE>").split("( SELECT current_account_email() AS current_account_email)").join("<EMAIL>");

let db: PGlite;
let before: Snapshot;
setup(async () => {
  db = await replayBefore();
  before = await snapshot(db);
});

test("defect reproduced on the replayed chain: stale token claims keep access", async () => {
  assert.equal(await insertCode(db, P.disabledFounder, "DISABLED-BEFORE"), true, "disabled founder still creates discount codes");
  assert.equal(await insertCode(db, P.bannedAdmin, "BANNED-BEFORE"), true, "banned admin's unexpired token still writes");
  assert.equal(await insertCode(db, P.revokedStaff, "REVOKED-BEFORE"), true, "revoked role restored by the old token");
  assert.equal(await insertCode(db, P.deleted, "DELETED-BEFORE"), true, "deleted identity still writes");
  assert.equal(await updateTranslation(db, P.disabledFounder), 1, "disabled account still rewrites translations");
  assert.deepEqual(await visibleDeals(db, P.staleEmail), [P.clientA.email], "stale email reads the former owner's Matter");
  assert.deepEqual(await visibleObjects(db, P.staleEmail), ["synthetic-clientA.pdf"], "and the former owner's documents");
  assert.deepEqual(await visibleDeals(db, { ...P.disabledClientA, jwtEmail: P.clientA.email ?? undefined }), [P.clientA.email], "a disabled account presenting the owner's address");
  assert.ok([...before.values()].filter((p) => CLAIM.test(`${p.qual} ${p.check}`)).length >= 50, "the replayed catalog holds the claim-based policies");
});

test("migration rewrites only the claim expressions and leaves every policy otherwise identical", async () => {
  await db.exec(MIGRATION);
  const after = await snapshot(db);
  assert.deepEqual([...after.keys()].sort(), [...before.keys()].sort(), "no policy added or removed");
  let rewritten = 0;
  for (const [key, b] of before) {
    const a = after.get(key)!;
    assert.deepEqual([a.cmd, a.roles, a.permissive], [b.cmd, b.roles, b.permissive], `${key}: command, roles and mode unchanged`);
    assert.equal(normaliseAfter(a.qual), normaliseBefore(b.qual), `${key}: USING differs only by the claim substitution`);
    assert.equal(normaliseAfter(a.check), normaliseBefore(b.check), `${key}: WITH CHECK differs only by the claim substitution`);
    assert.doesNotMatch(`${a.qual} ${a.check}`, CLAIM, `${key}: reads no JWT claim`);
    if (a.qual !== b.qual || a.check !== b.check) rewritten += 1;
    if (/auth\.role\(\)/.test(`${b.qual} ${b.check}`) && !CLAIM.test(`${b.qual} ${b.check}`)) assert.deepEqual(a, b, `${key}: database-role policy untouched`);
  }
  assert.ok(rewritten >= 50, `rewrote ${rewritten} policies`);
  const fn = (await db.query<{ proname: string; prosecdef: boolean; config: string[] }>(
    "select proname, prosecdef, proconfig config from pg_proc where pronamespace = 'public'::regnamespace and proname in ('current_account_role', 'current_account_email') order by 1",
  )).rows;
  assert.deepEqual(fn.map((f) => [f.proname, f.prosecdef, f.config]), [["current_account_email", true, ["search_path=\"\""]], ["current_account_role", true, ["search_path=\"\""]]]);
});

test("current-account staff authority: active roles keep their exact grants", async () => {
  assert.equal(await insertCode(db, P.founder, "FOUNDER-AFTER"), true, "active founder_admin manages discount codes");
  assert.equal(await updateTranslation(db, P.founder), 1);
  assert.equal(await updateTranslation(db, P.coordinator), 1, "translation_coordinator keeps its narrow translation grant");
  assert.equal(await insertCode(db, P.coordinator, "COORDINATOR-AFTER"), false, "but gains no discount authority");
});

test("disabled, banned, revoked, deleted, inactive-binding, forged, VA and partner accounts are denied", async () => {
  for (const who of ["disabledFounder", "bannedAdmin", "revokedStaff", "deleted", "inactiveBinding", "forged", "va", "partner", "clientA"] as const) {
    assert.equal(await insertCode(db, P[who], `${who.toUpperCase()}-AFTER`), false, `${who}: discount code insert denied`);
    assert.equal(await updateTranslation(db, P[who]), 0, `${who}: translation update denied`);
  }
});

test("client ownership follows the current account email; stale, disabled, cross-client and anon reads are empty", async () => {
  assert.deepEqual(await visibleDeals(db, P.clientA), [P.clientA.email]);
  assert.deepEqual(await visibleDeals(db, P.clientB), [P.clientB.email], "no cross-client Matter");
  assert.deepEqual(await visibleObjects(db, P.clientA), ["synthetic-clientA.pdf"]);
  assert.deepEqual(await visibleObjects(db, P.clientB), ["synthetic-clientB.pdf"], "no cross-client documents");
  assert.deepEqual(await visibleProfiles(db, P.clientA), [P.clientA.email]);
  assert.deepEqual(await visibleDeals(db, P.staleEmail), [], "a stale email claim restores nothing");
  assert.deepEqual(await visibleObjects(db, P.staleEmail), []);
  assert.deepEqual(await visibleDeals(db, { ...P.disabledClientA, jwtEmail: P.clientA.email ?? undefined }), [], "disabled account with the owner's address");
  await assert.rejects(visibleDeals(db, "anon"), /permission denied for table deals/, "anon holds no Matter privilege at all");
  assert.deepEqual(await visibleObjects(db, "anon"), []);
  assert.deepEqual(await visibleProfiles(db, "anon"), []);
});

test("authenticated still cannot write canonical Matters; service role is unaffected", async () => {
  await assert.rejects(as(db, P.clientA, () => db.query("update public.deals set email = email where email = $1", [P.clientA.email])), /permission denied/);
  await db.exec("set role service_role");
  try {
    await db.query("insert into public.discount_codes(code, type, value, discount_type, discount_value, internal_reason) values ('SERVICE-AFTER', 'percentage', 5, 'percentage', 5, 'synthetic test')");
    assert.equal((await db.query("select 1 from public.deals")).rows.length, 2);
  } finally {
    await db.exec("reset role");
  }
});

test("idempotent, and a no-op on a bare database", async () => {
  const once = await snapshot(db);
  await db.exec(MIGRATION);
  assert.deepEqual(await snapshot(db), once);
  await db.close();
  const fresh = await migrationFixture();
  await fresh.exec(MIGRATION);
  assert.equal((await fresh.query("select 1 from pg_policies")).rows.length, 0);
  await fresh.close();
  assert.doesNotMatch(MIGRATION.replace(/--.*$/gm, ""), /\b(delete\s+from|truncate\s|drop\s+table|drop\s+column|drop\s+policy|update\s+public|insert\s+into)/i, "no data or policy removal");
  assert.match(createHash("sha256").update(MIGRATION).digest("hex"), /^[0-9a-f]{64}$/);
});
