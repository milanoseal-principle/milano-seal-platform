// Real parallel-session proof for public.consume_public_request_limit
// (supabase/migrations/20261125120000_public_request_limits.sql).
//
// Opens many independent PostgreSQL backends (one psql process each) against a
// freshly created, disposable LOCAL database and fires every request at once.
// Exactly `ceiling` requests per (scope, bucket, window) may be allowed, no
// matter how many arrive in parallel. Never connects to a hosted project.
//
// Env: PUBLIC_LIMITS_PGHOST (or P23_CONCURRENCY_PGHOST in CI), *_PGPORT, *_PGUSER.
import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import { PsqlSession } from "./certification/psql-session.mjs";

const env = (name, fallback) => process.env[`PUBLIC_LIMITS_${name}`] ?? process.env[`P23_CONCURRENCY_${name}`] ?? fallback;
const host = env("PGHOST", "");
const port = Number(env("PGPORT", "5432"));
const user = env("PGUSER", "postgres");
const MIGRATION = "supabase/migrations/20261125120000_public_request_limits.sql";

if (!host) throw Error("PUBLIC_LIMITS_PGHOST_REQUIRED: a local socket directory or loopback host");
if (!host.startsWith("/") && !["localhost", "127.0.0.1", "::1"].includes(host)) throw Error("NON_LOCAL_DATABASE_REFUSED");
for (const key of ["PGHOST", "PGHOSTADDR", "DATABASE_URL", "SUPABASE_DB_URL", "POSTGRES_URL"]) {
  if (process.env[key] && /supabase|pooler|amazonaws|neon|render/i.test(process.env[key])) throw Error(`HOSTED_DATABASE_ENVIRONMENT_REFUSED:${key}`);
}

const connect = async (database) => {
  const session = new PsqlSession({ host, port, user, database });
  await session.query("select 1 as ready");
  return session;
};

const database = `public_limits_${randomBytes(6).toString("hex")}`;
const admin = await connect("postgres");
const sessions = [];
let ok = false;
try {
  // Same isolation proof as scripts/certification/p23-concurrency.mjs: the server
  // must report a loopback/socket address for this session; a GitHub Actions
  // service container on the Docker bridge (172.16.0.0/12) is accepted only
  // inside Actions and only when the workflow declares the service.
  const addr = (await admin.query("select coalesce(inet_server_addr()::text, 'socket') as addr")).rows[0].addr;
  const dockerService =
    process.env.GITHUB_ACTIONS === "true" &&
    env("SERVICE_CONTAINER", "") === "true" &&
    /^172\.(1[6-9]|2\d|3[01])\./.test(addr);
  assert.ok(addr === "socket" || /^(127\.|::1)/.test(addr) || dockerService, `server address must be local, got ${addr}`);
  const hosted = (await admin.query("select count(*)::int as n from pg_namespace where nspname = 'supabase_migrations'")).rows[0].n;
  assert.equal(hosted, 0, "HOSTED_SUPABASE_CATALOG_REFUSED");
  await admin.query(`create database ${database}`);

  const db = await connect(database);
  sessions.push(db);
  for (const role of ["anon", "authenticated", "service_role"]) {
    await db.query(`do $$ begin if not exists (select 1 from pg_roles where rolname = '${role}') then create role ${role} nologin; end if; end $$`);
  }
  // Apply the migration file exactly as written (its own BEGIN/COMMIT).
  execFileSync("psql", ["-h", host, "-p", String(port), "-U", user, "-d", database, "-X", "-q", "-v", "ON_ERROR_STOP=1", "-f", MIGRATION], { stdio: ["ignore", "ignore", "inherit"] });

  const scope = () => createHash("sha256").update(randomBytes(16)).digest("hex");
  const consume = async (session, scopeHash, bucket) =>
    (await session.query("select * from public.consume_public_request_limit($1, $2)", [scopeHash, bucket])).rows[0];

  // Independent backends: genuine parallelism, not one serialized connection.
  const PARALLEL = 30;
  for (let i = 0; i < PARALLEL; i += 1) sessions.push(await connect(database));
  const workers = sessions.slice(1);
  const pids = new Set((await Promise.all(workers.map((s) => s.query("select pg_backend_pid() as pid")))).map((r) => r.rows[0].pid));
  assert.equal(pids.size, PARALLEL, "each worker is a distinct backend");

  const burst = async (scopeHash, bucket, perWorker) => {
    const results = await Promise.all(
      workers.flatMap((s) => Array.from({ length: perWorker }, () => consume(s, scopeHash, bucket))),
    );
    return { allowed: results.filter((r) => r.allowed).length, denied: results.filter((r) => !r.allowed), total: results.length };
  };

  const checks = [];
  for (const [bucket, ceiling, scopeHash, perWorker] of [
    ["intake_submit", 5, scope(), 2],
    ["intake_extract", 10, scope(), 2],
    ["assistant", 20, scope(), 3],
    ["intake_extract_global", 300, "global", 12],
  ]) {
    const r = await burst(scopeHash, bucket, perWorker);
    assert.equal(r.allowed, ceiling, `${bucket}: exactly ${ceiling} of ${r.total} parallel requests allowed`);
    assert.ok(r.denied.every((d) => d.retry_after_seconds >= 1), `${bucket}: every denial carries Retry-After`);
    const counted = (await db.query("select requests from public.public_request_windows where scope_hash = $1 and bucket = $2", [scopeHash, bucket])).rows[0].requests;
    assert.equal(counted, r.total, `${bucket}: every request counted exactly once`);
    checks.push(`${bucket}: ${r.allowed}/${r.total} allowed (ceiling ${ceiling})`);
  }

  // Scopes are independent: a different client is unaffected by an exhausted one.
  const exhausted = scope();
  await burst(exhausted, "intake_submit", 1);
  assert.equal((await consume(db, scope(), "intake_submit")).allowed, true);
  assert.equal((await consume(db, exhausted, "intake_submit")).allowed, false);
  checks.push("independent scopes");

  // Fail-closed validation and least privilege.
  const rejects = async (fn, pattern, label) => {
    await assert.rejects(fn, (e) => pattern.test(String(e.message ?? e)), label);
    checks.push(label);
  };
  await rejects(() => consume(db, scope(), "unknown_bucket"), /INVALID_RATE_BUCKET/, "unknown bucket refused");
  await rejects(() => consume(db, scope(), "assistant_global"), /GLOBAL_BUCKET_REQUIRES_GLOBAL_SCOPE/, "global bucket needs global scope");
  await rejects(() => consume(db, "global", "assistant"), /CLIENT_BUCKET_REQUIRES_SCOPE_HASH/, "client bucket needs a hash");
  await rejects(() => consume(db, "203.0.113.7", "assistant"), /CLIENT_BUCKET_REQUIRES_SCOPE_HASH/, "raw addresses are never stored");
  for (const role of ["anon", "authenticated"]) {
    await db.query(`set role ${role}`);
    await rejects(() => consume(db, scope(), "assistant"), /permission denied/, `${role} cannot execute`);
    await rejects(() => db.query("select * from public.public_request_windows"), /permission denied/, `${role} cannot read windows`);
    await db.query("reset role");
  }

  console.log(`PASS public request limits concurrency (${PARALLEL} parallel backends):\n- ${checks.join("\n- ")}`);
  ok = true;
} finally {
  for (const s of sessions) await s.end().catch(() => undefined);
  await admin.query(`drop database if exists ${database} with (force)`).catch(() => undefined);
  await admin.end();
  if (!ok) process.exitCode = 1;
}
