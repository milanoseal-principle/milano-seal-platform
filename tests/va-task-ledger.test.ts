import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { isolatedCanonicalDatabase } from "../scripts/certification/shared.mjs";

// VA task ledger: the hosted database never applied 003_va_tasks.sql, so every VA screen and
// action failed there. 20261112120000_va_task_ledger.sql restores the 003 contract and adds an
// atomic, ownership- and state-checked transition. Fixtures are synthetic.

const MIGRATION = fs.readFileSync("supabase/migrations/20261112120000_va_task_ledger.sql", "utf8");
type Db = Awaited<ReturnType<typeof isolatedCanonicalDatabase>>;
const migrations = () => fs.readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql")).sort();

async function seed(db: Db) {
  const deal = randomUUID(), va = randomUUID(), other = randomUUID(), operator = randomUUID();
  await db.query("insert into public.deals(id, deal_id, status, email) values($1, $2, 'intake_received', 'va-fixture@example.invalid')", [deal, "SIM-" + deal]);
  const task = (await db.query<{ id: string }>("insert into public.va_tasks(matter_id, assigned_to, assigned_by, task_type) values($1,$2,$3,'verify_upload') returning id", [deal, va, operator])).rows[0].id;
  return { deal, va, other, task };
}
const transition = (db: Db, task: string, actor: string, action: string, reason: string | null = null) =>
  db.query<{ id: string }>("select public.va_task_transition($1,$2,$3,$4) id", [task, actor, action, reason]);
const state = async (db: Db, task: string) => (await db.query<{ status: string }>("select status from public.va_tasks where id=$1", [task])).rows[0].status;
const events = async (db: Db, task: string) => (await db.query<{ event_type: string; actor_id: string; description: string }>("select event_type, actor_id, description from public.va_task_events where task_id=$1 order by created_at, id", [task])).rows;

test("replayed schema: migration is idempotent over 003 and transitions are owner- and state-checked", async () => {
  const db = await isolatedCanonicalDatabase(migrations());
  try {
    await db.exec(MIGRATION); // second application must be a no-op
    const { va, other, task } = await seed(db);

    await assert.rejects(() => transition(db, task, other, "complete"), /VA_TASK_NOT_ASSIGNED/);
    assert.equal(await state(db, task), "pending");
    assert.deepEqual(await events(db, task), [], "a refused transition writes nothing");

    await transition(db, task, va, "escalate", "Client document unreadable");
    assert.equal(await state(db, task), "escalated");
    await transition(db, task, va, "complete");
    assert.equal(await state(db, task), "completed");
    await assert.rejects(() => transition(db, task, va, "complete"), /VA_TASK_STATE_CONFLICT/, "completed tasks cannot be completed again");
    await assert.rejects(() => transition(db, task, va, "escalate", "late"), /VA_TASK_STATE_CONFLICT/);
    await assert.rejects(() => transition(db, task, va, "delete"), /VA_TASK_TRANSITION_INVALID/);

    const ledger = await events(db, task);
    assert.deepEqual(ledger.map((e) => e.event_type), ["VA_TASK_ESCALATED", "VA_TASK_COMPLETED"]);
    assert.ok(ledger.every((e) => e.actor_id === va));
    assert.equal(ledger[0].description, "Client document unreadable");
    assert.equal((await db.query<{ notes_public: string | null }>("select notes_public from public.va_tasks where id=$1", [task])).rows[0].notes_public, null, "escalation reason never becomes public");
  } finally {
    await db.close();
  }
});

test("RLS and privileges: anon denied, a VA reads only own tasks, clients cannot call the transition", async () => {
  const db = await isolatedCanonicalDatabase(migrations());
  try {
    const { va, other, task } = await seed(db);
    const as = async <T,>(role: string, sub: string | null, fn: () => Promise<T>) => {
      await db.exec(`set role ${role}`);
      if (sub) await db.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify({ sub, role })]);
      try { return await fn(); } finally { await db.exec("reset role; select set_config('request.jwt.claims', '', false)"); }
    };
    await assert.rejects(() => as("anon", null, () => db.query("select id from public.va_tasks")), /permission denied/);
    assert.equal((await as("authenticated", va, () => db.query("select id from public.va_tasks"))).rows.length, 1);
    assert.equal((await as("authenticated", other, () => db.query("select id from public.va_tasks"))).rows.length, 0);
    await assert.rejects(() => as("authenticated", va, () => db.query("update public.va_tasks set status='completed' where id=$1", [task])), /permission denied|row-level security/);
    await assert.rejects(() => as("authenticated", va, () => transition(db, task, va, "complete")), /permission denied/);
    assert.equal(await state(db, task), "pending");
  } finally {
    await db.close();
  }
});

test("hosted shape: database without 003 gains the ledger from the migration", async () => {
  // Hosted had deals but no va_tasks/va_task_events (read-only P12 catalog, 2026-11-12).
  const { PGlite } = await import("@electric-sql/pglite");
  const db = new PGlite();
  await db.exec(`create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema auth; create function auth.uid() returns uuid language sql as $$ select null::uuid $$;
    create table public.deals(id uuid primary key);`);
  await db.exec(MIGRATION);
  const tables = (await db.query<{ t: string }>("select table_name t from information_schema.tables where table_schema='public' and table_name like 'va_task%' order by 1")).rows.map((r) => r.t);
  assert.deepEqual(tables, ["va_task_events", "va_tasks"]);
  await db.exec(MIGRATION);
  await db.close();
});

test("VA task routes use the atomic transition and never disguise failures as empty results", () => {
  for (const file of ["app/api/va/tasks/[id]/complete/route.ts", "app/api/va/tasks/[id]/escalate/route.ts"]) {
    const source = fs.readFileSync(file, "utf8");
    assert.match(source, /admin\.rpc\("va_task_transition"/);
    assert.doesNotMatch(source, /\.from\("va_tasks"\)\s*\.update/, `${file}: no unconditional update`);
    assert.doesNotMatch(source, /notes_public/, `${file}: escalation reason stays internal`);
  }
  for (const file of ["app/api/va/tasks/route.ts", "app/api/va/checklists/route.ts", "app/api/va/ron/tasks/route.ts", "app/api/va/tasks/[id]/route.ts", "app/api/va/matters/route.ts", "app/api/va/matters/[id]/route.ts"]) {
    const source = fs.readFileSync(file, "utf8");
    assert.doesNotMatch(source, /migration_needed/, `${file}: no silent empty result`);
    assert.doesNotMatch(source, /42P01/, `${file}: every database error is unavailable, not only a missing table`);
    assert.match(source, /VA_TASK_STORE_UNAVAILABLE[^\n]*status: 503/, `${file}: failures are 503`);
  }
});
