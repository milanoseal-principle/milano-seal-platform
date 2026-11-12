import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

// Regression for hosted-only RLS policies that gave the PUBLIC role unrestricted access
// (P12 read-only catalog, 2026-11-12). The fixture reproduces the hosted conditions
// exactly: RLS enabled, Supabase-default anon/authenticated table privileges, and the
// six policies with the expressions identified by md5 match. It proves the migration
// closes anonymous and arbitrary-client access while service-role access and the
// repository-defined policies survive.

const MIGRATION = "supabase/migrations/20261112090000_revoke_unrestricted_public_rls_policies.sql";
const migration = fs.readFileSync(MIGRATION, "utf8");
const TABLES = ["payments", "activity_logs", "webhook_events", "rate_limits", "release_certificates", "receiving_authorities"];
const OPERATOR = "((auth.jwt() -> 'app_metadata') ->> 'role') in ('founder_admin','admin','operator')";

async function hostedFixture() {
  const db = new PGlite();
  await db.exec(`
    create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema auth; grant usage on schema auth to anon, authenticated, service_role;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
    grant execute on all functions in schema auth to anon, authenticated, service_role;
  `);
  for (const table of TABLES) {
    await db.exec(`create table public.${table}(id serial primary key, note text, status text default 'valid');
      alter table public.${table} enable row level security;
      grant all on public.${table} to anon, authenticated, service_role;
      grant usage on sequence public.${table}_id_seq to anon, authenticated, service_role;
      insert into public.${table}(note) values ('synthetic');`);
  }
  await db.exec(`
    create policy "Service role full access" on public.payments for all to public using (true) with check (true);
    create policy "Service role full access" on public.activity_logs for all to public using (true) with check (true);
    create policy "Service role full access" on public.webhook_events for all to public using (true) with check (true);
    create policy "Allow rate limit checks" on public.rate_limits for all to public using (true);
    create policy release_certificates_authenticated_write on public.release_certificates for all to public using (auth.uid() is not null);
    create policy receiving_authorities_authenticated_only on public.receiving_authorities for all to public using (auth.uid() is not null);
    -- Repository-defined policies that must survive.
    create policy release_certificates_operator_all on public.release_certificates for all to authenticated using (${OPERATOR}) with check (${OPERATOR});
    create policy release_certificates_public_read on public.release_certificates for select using (status = 'valid');
    create policy receiving_authorities_admin_all on public.receiving_authorities for all to authenticated using (${OPERATOR}) with check (${OPERATOR});
  `);
  return db;
}

async function as<T>(db: PGlite, role: string, claims: Record<string, unknown> | null, fn: () => Promise<T>): Promise<T> {
  await db.exec(`set role ${role}`);
  if (claims) {
    await db.query("select set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claims', $2, false)", [String(claims.sub), JSON.stringify(claims)]);
  }
  try {
    return await fn();
  } finally {
    await db.exec("reset role; select set_config('request.jwt.claim.sub', '', false), set_config('request.jwt.claims', '', false)");
  }
}
const count = async (db: PGlite, table: string) => (await db.query<{ n: number }>(`select count(*)::int n from public.${table}`)).rows[0].n;
const client = { sub: "00000000-0000-4000-8000-000000000001", app_metadata: { role: "client" } };
const operator = { sub: "00000000-0000-4000-8000-000000000002", app_metadata: { role: "founder_admin" } };

test("hosted fixture reproduces the exposure before the migration", async () => {
  const db = await hostedFixture();
  for (const table of ["payments", "activity_logs", "webhook_events", "rate_limits"]) {
    assert.equal(await as(db, "anon", null, () => count(db, table)), 1, `anon reads ${table}`);
  }
  await as(db, "anon", null, () => db.query("insert into public.payments(note) values ('forged')"));
  await as(db, "authenticated", client, () => db.query("update public.receiving_authorities set note = 'client rewrite'"));
  assert.equal((await db.query<{ note: string }>("select note from public.receiving_authorities")).rows[0].note, "client rewrite");
  await db.close();
});

test("migration removes anonymous and arbitrary-client access", async () => {
  const db = await hostedFixture();
  await db.exec(migration);
  for (const table of ["payments", "activity_logs", "webhook_events", "rate_limits"]) {
    assert.equal(await as(db, "anon", null, () => count(db, table)), 0, `anon cannot read ${table}`);
    assert.equal(await as(db, "authenticated", client, () => count(db, table)), 0, `client cannot read ${table}`);
    await assert.rejects(() => as(db, "anon", null, () => db.query(`insert into public.${table}(note) values ('forged')`)), /row-level security/, `anon cannot insert ${table}`);
  }
  // Signed-in clients can no longer rewrite authority truth or certificates.
  const updated = await as(db, "authenticated", client, () => db.query("update public.receiving_authorities set note = 'client rewrite' returning id"));
  assert.equal(updated.rows.length, 0);
  await assert.rejects(() => as(db, "authenticated", client, () => db.query("insert into public.release_certificates(note) values ('forged')")), /row-level security/);
  assert.equal(await count(db, "receiving_authorities"), 1);
  await db.close();
});

test("service role and repository-defined policies keep working", async () => {
  const db = await hostedFixture();
  await db.exec(migration);
  for (const table of TABLES) assert.equal(await as(db, "service_role", null, () => count(db, table)), 1, `service role reads ${table}`);
  await as(db, "authenticated", operator, () => db.query("update public.receiving_authorities set note = 'operator review'"));
  assert.equal((await db.query<{ note: string }>("select note from public.receiving_authorities")).rows[0].note, "operator review");
  // Public verification of valid certificates (read-only) is preserved.
  assert.equal(await as(db, "anon", null, () => count(db, "release_certificates")), 1);
  const remaining = (await db.query<{ name: string }>("select tablename || '.' || policyname as name from pg_policies order by 1")).rows.map((r) => r.name);
  assert.deepEqual(remaining, ["receiving_authorities.receiving_authorities_admin_all", "release_certificates.release_certificates_operator_all", "release_certificates.release_certificates_public_read"]);
  await db.close();
});

test("migration is idempotent and a no-op where the hosted-only tables are absent", async () => {
  const db = await hostedFixture();
  await db.exec(migration);
  await db.exec(migration);
  const fresh = new PGlite();
  await fresh.exec(migration);
  await fresh.close();
  await db.close();
});

test("migration drops only the six named policies", () => {
  const drops = [...migration.matchAll(/drop policy if exists ("[^"]+"|\w+) on public\.(\w+)/g)].map((m) => `${m[2]}.${m[1].replace(/"/g, "")}`);
  assert.deepEqual(drops, [
    "payments.Service role full access",
    "activity_logs.Service role full access",
    "webhook_events.Service role full access",
    "rate_limits.Allow rate limit checks",
    "release_certificates.release_certificates_authenticated_write",
    "receiving_authorities.receiving_authorities_authenticated_only",
  ]);
  assert.doesNotMatch(migration.replace(/--.*$/gm, ""), /\b(create|alter|grant|revoke|delete|update|insert|truncate)\b/i);
});
