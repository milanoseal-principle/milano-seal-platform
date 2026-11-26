// Real parallel-session proof for public.authorize_complimentary_matter and
// public.revoke_complimentary_matter
// (supabase/migrations/20261126060000_atomic_complimentary_authorization.sql).
//
// Opens many independent PostgreSQL backends (one psql process each) against a
// freshly created, disposable LOCAL database and fires every call at once. A Matter
// may end with exactly one authorization and exactly one canonical event, however
// many requests race. Never connects to a hosted project.
//
// The schema is taken from the repository migrations themselves: the deals
// complimentary columns and complimentary_authorizations table from 043 and the
// matter_events table from 0745, then the migration under test exactly as written.
//
// Env: PUBLIC_LIMITS_PGHOST (or P23_CONCURRENCY_PGHOST in CI), *_PGPORT, *_PGUSER.
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { PsqlSession } from "./certification/psql-session.mjs";

const env = (name, fallback) => process.env[`PUBLIC_LIMITS_${name}`] ?? process.env[`P23_CONCURRENCY_${name}`] ?? fallback;
const host = env("PGHOST", "");
const port = Number(env("PGPORT", "5432"));
const user = env("PGUSER", "postgres");
const MIGRATION = "supabase/migrations/20261126060000_atomic_complimentary_authorization.sql";

if (!host) throw Error("PUBLIC_LIMITS_PGHOST_REQUIRED: a local socket directory or loopback host");
if (!host.startsWith("/") && !["localhost", "127.0.0.1", "::1"].includes(host)) throw Error("NON_LOCAL_DATABASE_REFUSED");
for (const key of ["PGHOST", "PGHOSTADDR", "DATABASE_URL", "SUPABASE_DB_URL", "POSTGRES_URL"]) {
  if (process.env[key] && /supabase|pooler|amazonaws|neon|render/i.test(process.env[key])) throw Error(`HOSTED_DATABASE_ENVIRONMENT_REFUSED:${key}`);
}

const between = (text, start, end) => {
  const i = text.indexOf(start);
  assert.ok(i >= 0, `fixture source missing: ${start}`);
  const j = text.indexOf(end, i);
  return text.slice(i, j + end.length);
};
const m043 = readFileSync("supabase/migrations/043_complimentary_matter_authorizations.sql", "utf8");
const m0745 = readFileSync("supabase/migrations/0745_operator_dispatch_prerequisites.sql", "utf8");
const schema = [
  // Columns the function touches that come from earlier migrations than 043.
  "create table public.deals (id uuid primary key default gen_random_uuid(), amount_due numeric(12,2), payment_confirmed_at timestamptz);",
  between(m043, "create table if not exists public.complimentary_authorizations", ");\n"),
  between(m043, "create unique index if not exists uniq_active_complimentary_authorization_per_matter", ";"),
  between(m043, "alter table public.deals\n  add column if not exists payment_disposition", ";"),
  between(m0745, "create table if not exists public.matter_events", ");"),
].join("\n");

const connect = async (database) => {
  const session = new PsqlSession({ host, port, user, database });
  await session.query("select 1 as ready");
  return session;
};

const database = `comp_auth_${randomBytes(6).toString("hex")}`;
const admin = await connect("postgres");
const sessions = [];
let ok = false;
try {
  const addr = (await admin.query("select coalesce(inet_server_addr()::text, 'socket') as addr")).rows[0].addr;
  const dockerService =
    process.env.GITHUB_ACTIONS === "true" &&
    env("SERVICE_CONTAINER", "") === "true" &&
    /^172\.(1[6-9]|2\d|3[01])\./.test(addr);
  assert.ok(addr === "socket" || /^(127\.|::1)/.test(addr) || dockerService, `server address must be local, got ${addr}`);
  assert.equal((await admin.query("select count(*)::int as n from pg_namespace where nspname = 'supabase_migrations'")).rows[0].n, 0, "HOSTED_SUPABASE_CATALOG_REFUSED");
  await admin.query(`create database ${database}`);

  const db = await connect(database);
  sessions.push(db);
  for (const role of ["anon", "authenticated", "service_role"]) {
    await db.query(`do $$ begin if not exists (select 1 from pg_roles where rolname = '${role}') then create role ${role} nologin; end if; end $$`);
  }
  await db.query("create extension if not exists pgcrypto");
  for (const statement of schema.split(/;\s*\n/).map((s) => s.trim()).filter(Boolean)) await db.query(statement);
  await db.query("grant usage on schema public to service_role");
  await db.query("grant select, insert, update, delete on public.deals, public.complimentary_authorizations, public.matter_events to service_role");
  execFileSync("psql", ["-h", host, "-p", String(port), "-U", user, "-d", database, "-X", "-q", "-v", "ON_ERROR_STOP=1", "-f", MIGRATION], { stdio: ["ignore", "ignore", "inherit"] });

  const PARALLEL = 30;
  for (let i = 0; i < PARALLEL; i += 1) {
    const s = await connect(database);
    await s.query("set role service_role");
    sessions.push(s);
  }
  const workers = sessions.slice(1);
  const pids = new Set((await Promise.all(workers.map((s) => s.query("select pg_backend_pid() as pid")))).map((r) => r.rows[0].pid));
  assert.equal(pids.size, PARALLEL, "each worker is a distinct backend");

  const actor = randomUUID();
  const auth = (matterId, id = randomUUID()) => ({
    id, matter_id: matterId, quote_id: "q-1", quote_version: "q-1", original_subtotal: 450, original_add_ons: 0, original_total: 450,
    discount_amount: 450, final_amount_due: 0, currency: "USD", reason_code: "internal_quality_test", reason_detail: "Synthetic acceptance Matter for QA.",
    authorized_by_user_id: actor, authorized_by_role: "founder_admin", authorization_scope: "single_matter", status: "active",
    authorized_at: new Date().toISOString(), audit_event_id: randomUUID(),
  });
  const patch = (authId) => ({
    payment_disposition: "complimentary", amount_before_adjustment: 450, complimentary_adjustment_amount: 450, amount_due: 0, amount_paid: 0,
    verified_revenue: 0, wise_payment_id: null, wise_transfer_id: null, payment_confirmed_at: null, comp_authorized: true,
    comp_authorized_by: actor, comp_authorized_at: new Date().toISOString(), comp_reason_code: "internal_quality_test",
    comp_reason_detail: "Synthetic acceptance Matter for QA.", comp_authorization_id: authId,
  });
  const authorize = (s, a) => s.query("select * from public.authorize_complimentary_matter($1::jsonb, $2::jsonb, 'qa@example.invalid')", [a, patch(a.id)]);
  const settle = (calls) => Promise.allSettled(calls);
  const newMatter = async () => (await db.query("insert into public.deals(amount_due) values (450) returning id")).rows[0].id;
  const counts = async (matterId) => (await db.query(
    "select (select count(*)::int from public.complimentary_authorizations where matter_id = $1) as auths, (select count(*)::int from public.matter_events where matter_id = $1) as events",
    [matterId],
  )).rows[0];
  const checks = [];

  // 1. Distinct authorizations racing on one Matter: exactly one wins.
  {
    const matter = await newMatter();
    const results = await settle(workers.map((s) => authorize(s, auth(matter))));
    const won = results.filter((r) => r.status === "fulfilled");
    const lost = results.filter((r) => r.status === "rejected");
    assert.equal(won.length, 1, `exactly one authorization commits; first refusal: ${lost[0]?.reason?.message}`);
    assert.ok(lost.every((r) => /COMPLIMENTARY_ALREADY_AUTHORIZED|uniq_active_complimentary_authorization_per_matter/.test(r.reason.message)), lost.map((r) => r.reason.message).join("; "));
    assert.deepEqual(await counts(matter), { auths: 1, events: 1 });
    checks.push(`distinct authorizations: ${won.length}/${PARALLEL} committed, 1 authorization, 1 event`);
  }

  // 2. The same authorization retried in parallel: one creates, the rest are idempotent.
  {
    const matter = await newMatter();
    const a = auth(matter);
    const results = await settle(workers.map((s) => authorize(s, a)));
    assert.ok(results.every((r) => r.status === "fulfilled"), results.filter((r) => r.status === "rejected").map((r) => r.reason.message).join("; "));
    const rows = results.map((r) => r.value.rows[0]);
    assert.equal(rows.filter((r) => r.already_authorized === false).length, 1, "one call created it");
    assert.equal(new Set(rows.map((r) => r.matter_event_id)).size, 1, "every caller sees the same event");
    assert.deepEqual(await counts(matter), { auths: 1, events: 1 });
    checks.push(`same authorization retried: 1 created, ${PARALLEL - 1} idempotent, 1 event`);
  }

  // 3. Parallel revocation of one authorization: one revokes, the rest are idempotent.
  {
    const matter = await newMatter();
    const a = auth(matter);
    await authorize(workers[0], a);
    const results = await settle(workers.map((s) => s.query("select * from public.revoke_complimentary_matter($1, $2, 'Synthetic revocation for QA.', $3, 'qa@example.invalid')", [matter, a.id, actor])));
    assert.ok(results.every((r) => r.status === "fulfilled"), results.filter((r) => r.status === "rejected").map((r) => r.reason.message).join("; "));
    assert.equal(results.filter((r) => r.value.rows[0].already_revoked === false).length, 1);
    const deal = (await db.query("select comp_authorized, amount_due::float8 as amount_due, payment_disposition from public.deals where id = $1", [matter])).rows[0];
    assert.deepEqual(deal, { comp_authorized: false, amount_due: 450, payment_disposition: "standard_payment" });
    assert.deepEqual(await counts(matter), { auths: 1, events: 2 }, "one approval and one revocation event");
    checks.push(`parallel revocation: 1 revoked, ${PARALLEL - 1} idempotent, 1 revocation event`);
  }

  // 4. Only the service role may execute.
  for (const role of ["anon", "authenticated"]) {
    const rights = (await db.query(`select has_function_privilege('${role}', 'public.authorize_complimentary_matter(jsonb, jsonb, text)', 'EXECUTE') as a,
      has_function_privilege('${role}', 'public.revoke_complimentary_matter(uuid, uuid, text, uuid, text)', 'EXECUTE') as r`)).rows[0];
    assert.deepEqual(rights, { a: false, r: false }, role);
  }
  checks.push("anon and authenticated cannot execute");

  console.log(`PASS complimentary authorization concurrency (${PARALLEL} parallel backends):\n- ${checks.join("\n- ")}`);
  ok = true;
} finally {
  for (const s of sessions) await s.end().catch(() => undefined);
  await admin.query(`drop database if exists ${database} with (force)`).catch(() => undefined);
  await admin.end();
  if (!ok) process.exitCode = 1;
}
