import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

// Regression for public.is_founder_or_admin() trusting client-editable user_metadata (production,
// verified 2026-11-14). The fixture installs the helper exactly as 035_discount_codes.sql defines
// it and the six production policies that call it, then proves the forward migration:
//   * refuses forged user_metadata.role = founder / admin / founder_admin;
//   * refuses client, partner, operator (non-founder), disabled and banned accounts;
//   * honours founders and admins from server-issued app_metadata;
//   * applies a revocation on the next query even while the JWT still carries the old role.

const MIGRATION = fs.readFileSync("supabase/migrations/20261114100000_founder_admin_server_identity.sql", "utf8");
const legacy = fs.readFileSync("supabase/migrations/035_discount_codes.sql", "utf8");
const LEGACY_HELPER = legacy.slice(legacy.indexOf("create or replace function public.is_founder_or_admin()"), legacy.indexOf("$$;", legacy.indexOf("create or replace function public.is_founder_or_admin()")) + 3);

const TABLES = ["client_discount_assignments", "compliance_incidents", "critical_identifier_snapshots", "discount_audit_log", "discount_redemptions", "incident_audit_log"];
const POLICY: Record<string, string> = {
  client_discount_assignments: "Founder and admin manage client discount assignments",
  compliance_incidents: "Founder and admin manage compliance incidents",
  critical_identifier_snapshots: "Founder and admin manage critical identifier snapshots",
  discount_audit_log: "Founder and admin manage discount audit log",
  discount_redemptions: "Founder and admin manage discount redemptions",
  incident_audit_log: "Founder and admin manage incident audit log",
};

type Identity = { id: string; app: Record<string, unknown>; user: Record<string, unknown>; banned?: boolean };
const uid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const PEOPLE: Record<string, Identity> = {
  founder: { id: uid(1), app: { role: "founder_admin" }, user: {} },
  admin: { id: uid(2), app: { role: "admin" }, user: {} },
  client: { id: uid(3), app: { role: "client" }, user: {} },
  partner: { id: uid(4), app: { role: "alliance_partner" }, user: {} },
  operator: { id: uid(5), app: { role: "ops_manager" }, user: {} },
  disabled: { id: uid(6), app: { role: "founder_admin", disabled: "true" }, user: {} },
  banned: { id: uid(7), app: { role: "admin" }, user: {}, banned: true },
  forgedFounder: { id: uid(8), app: { role: "client" }, user: { role: "founder" } },
  forgedAdmin: { id: uid(9), app: { role: "client" }, user: { role: "admin" } },
  forgedFounderAdmin: { id: uid(10), app: {}, user: { role: "founder_admin" } },
};
const UNAUTHORIZED = ["client", "partner", "operator", "disabled", "banned", "forgedFounder", "forgedAdmin", "forgedFounderAdmin"];
const FORGED = ["forgedFounder", "forgedAdmin", "forgedFounderAdmin"];

async function hostedFixture() {
  const db = new PGlite();
  await db.exec(`
    create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema auth; grant usage on schema auth to anon, authenticated, service_role;
    create table auth.users(id uuid primary key, raw_app_meta_data jsonb not null default '{}', raw_user_meta_data jsonb not null default '{}', banned_until timestamptz);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
    grant execute on all functions in schema auth to anon, authenticated, service_role;
  `);
  for (const p of Object.values(PEOPLE)) {
    await db.query("insert into auth.users(id, raw_app_meta_data, raw_user_meta_data, banned_until) values ($1, $2, $3, $4)",
      [p.id, JSON.stringify(p.app), JSON.stringify(p.user), p.banned ? "2999-01-01T00:00:00Z" : null]);
  }
  await db.exec(LEGACY_HELPER);
  await db.exec("grant execute on function public.is_founder_or_admin() to public, anon, authenticated, service_role;");
  for (const table of TABLES) {
    await db.exec(`create table public.${table}(id serial primary key, note text);
      alter table public.${table} enable row level security;
      grant all on public.${table} to anon, authenticated, service_role;
      grant usage on sequence public.${table}_id_seq to anon, authenticated, service_role;
      insert into public.${table}(note) values ('synthetic');
      create policy "${POLICY[table]}" on public.${table} for all to authenticated
        using (public.is_founder_or_admin()) with check (public.is_founder_or_admin());`);
  }
  return db;
}

// The JWT mirrors what the auth server would issue for the account at sign-in.
async function as<T>(db: PGlite, person: Identity, fn: () => Promise<T>, jwtApp: Record<string, unknown> = person.app): Promise<T> {
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claims', $2, false)",
    [person.id, JSON.stringify({ sub: person.id, role: "authenticated", app_metadata: jwtApp, user_metadata: person.user })]);
  try {
    return await fn();
  } finally {
    await db.exec("reset role; select set_config('request.jwt.claim.sub', '', false), set_config('request.jwt.claims', '', false)");
  }
}
const count = async (db: PGlite, table: string) => (await db.query<{ n: number }>(`select count(*)::int n from public.${table}`)).rows[0].n;

test("hosted fixture reproduces the escalation: forged user_metadata satisfies all six policies", async () => {
  const db = await hostedFixture();
  for (const who of FORGED) {
    for (const table of TABLES) assert.equal(await as(db, PEOPLE[who], () => count(db, table)), 1, `${who} reads ${table} before the fix`);
  }
  await as(db, PEOPLE.forgedFounder, () => db.query("update public.compliance_incidents set note = 'forged close'"));
  assert.equal((await db.query<{ note: string }>("select note from public.compliance_incidents")).rows[0].note, "forged close");
  await db.close();
});

test("after the fix, unauthorized and forged identities can neither read nor modify protected rows", async () => {
  const db = await hostedFixture();
  await db.exec(MIGRATION);
  for (const who of UNAUTHORIZED) {
    for (const table of TABLES) {
      assert.equal(await as(db, PEOPLE[who], () => count(db, table)), 0, `${who} cannot read ${table}`);
      const updated = await as(db, PEOPLE[who], () => db.query(`update public.${table} set note = 'tamper' returning id`));
      assert.equal(updated.rows.length, 0, `${who} cannot update ${table}`);
      const deleted = await as(db, PEOPLE[who], () => db.query(`delete from public.${table} returning id`));
      assert.equal(deleted.rows.length, 0, `${who} cannot delete ${table}`);
      await assert.rejects(() => as(db, PEOPLE[who], () => db.query(`insert into public.${table}(note) values ('forged')`)), /row-level security/, `${who} cannot insert ${table}`);
    }
  }
  for (const table of TABLES) assert.deepEqual((await db.query(`select note from public.${table}`)).rows, [{ note: "synthetic" }], `${table} untouched`);
  await db.close();
});

test("founders and admins keep full access through server-issued app_metadata", async () => {
  const db = await hostedFixture();
  await db.exec(MIGRATION);
  for (const who of ["founder", "admin"]) {
    for (const table of TABLES) {
      assert.equal(await as(db, PEOPLE[who], () => count(db, table)), 1, `${who} reads ${table}`);
      await as(db, PEOPLE[who], () => db.query(`update public.${table} set note = $1`, [`${who} review`]));
    }
  }
  await as(db, PEOPLE.founder, () => db.query("insert into public.incident_audit_log(note) values ('founder entry')"));
  assert.equal(await count(db, "incident_audit_log"), 2);
  await db.close();
});

test("revocation takes effect immediately even while the JWT still carries the old role", async () => {
  const db = await hostedFixture();
  await db.exec(MIGRATION);
  const admin = PEOPLE.admin;
  assert.equal(await as(db, admin, () => count(db, "compliance_incidents")), 1);
  await db.query("update auth.users set raw_app_meta_data = '{\"role\":\"client\"}' where id = $1", [admin.id]);
  assert.equal(await as(db, admin, () => count(db, "compliance_incidents"), { role: "admin" }), 0, "stale JWT role is ignored");
  await db.query("update auth.users set raw_app_meta_data = '{\"role\":\"admin\",\"disabled\":\"true\"}' where id = $1", [admin.id]);
  assert.equal(await as(db, admin, () => count(db, "compliance_incidents"), { role: "admin" }), 0, "disabled account is refused");
  await db.close();
});

test("helper is definer-scoped, not executable by anon, idempotent, and the policies are untouched", async () => {
  const db = await hostedFixture();
  await db.exec(MIGRATION);
  await db.exec(MIGRATION);
  const fn = (await db.query<{ secdef: boolean; config: string[] | null }>("select prosecdef secdef, proconfig config from pg_proc where proname = 'is_founder_or_admin'")).rows[0];
  assert.equal(fn.secdef, true);
  assert.deepEqual(fn.config, ['search_path=""']);
  const exec = async (role: string) => (await db.query<{ ok: boolean }>("select has_function_privilege($1, 'public.is_founder_or_admin()', 'execute') ok", [role])).rows[0].ok;
  assert.equal(await exec("anon"), false);
  assert.equal(await exec("authenticated"), true);
  assert.equal(await exec("service_role"), true);
  const policies = (await db.query<{ n: string }>("select tablename || '.' || policyname n from pg_policies where schemaname = 'public' order by 1")).rows.map((r) => r.n);
  assert.deepEqual(policies, TABLES.map((t) => `${t}.${POLICY[t]}`).sort());
  assert.doesNotMatch(MIGRATION.replace(/--.*$/gm, ""), /user_metadata|raw_user_meta_data|auth\.jwt\(\)/);
  assert.doesNotMatch(MIGRATION.replace(/--.*$/gm, ""), /\b(drop|delete|truncate|insert|update)\b/i);
  await db.close();
});
