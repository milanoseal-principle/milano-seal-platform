import assert from "node:assert/strict";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isolatedCanonicalDatabase } from "../scripts/certification/shared.mjs";
import {
  RECEIVING_REQUIREMENTS, evaluateReceivingRequirements, isHttpsUrl, normalizeCategory,
  type ReceivingRequirementRule,
} from "@/lib/receiving-authority/requirements";
import {
  ReceivingRequirementError, loadReceivingRequirements, recordReceivingRequirement, supersedeReceivingRequirement,
} from "@/lib/receiving-authority/requirementsStore";

// B10: receiving-authority requirements are sourced statements. Fixtures are synthetic; the
// example.invalid sources are placeholders, not real guidance.

type Db = Awaited<ReturnType<typeof isolatedCanonicalDatabase>>;
const migrations = () => fs.readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql")).sort();
const NOW = new Date("2026-11-13T12:00:00Z");
const SOURCE = "https://authority.example.invalid/requirements";
const authority = { id: "a1", routing_status: "ACTIVE", manual_review_required: false };

let seq = 0;
function rule(over: Partial<ReceivingRequirementRule>): ReceivingRequirementRule {
  return {
    id: `r${++seq}`, authority_id: "a1", document_category: "*", requirement: "TRANSLATION", status: "REQUIRED", detail: null,
    source_url: SOURCE, source_type: "RECEIVING_AUTHORITY", source_title: null, verified_at: "2026-11-01T00:00:00Z", verified_by: "u1",
    review_due_at: "2027-03-01T00:00:00Z", superseded_at: null, created_at: "2026-11-01T00:00:00Z", ...over,
  };
}
const complete = (over: Partial<ReceivingRequirementRule> = {}) => RECEIVING_REQUIREMENTS.map((requirement) => rule({ requirement, status: "NOT_REQUIRED", ...over }));
const finding = (rules: ReceivingRequirementRule[], requirement: string, documentCategory?: string) =>
  evaluateReceivingRequirements({ authority, rules, documentCategory, now: NOW }).findings.find((f) => f.requirement === requirement)!;

test("an authority with no statements is entirely unknown and blocks the final route", () => {
  const result = evaluateReceivingRequirements({ authority, rules: [], now: NOW });
  assert.equal(result.decision, "REVIEW_REQUIRED");
  assert.equal(result.finalRouteAllowed, false);
  assert.equal(result.findings.length, 10);
  assert.ok(result.findings.every((f) => f.state === "UNKNOWN"), "an absent statement is never read as required or not required");
  assert.equal(result.blockers.length, 10);
});

test("the route is allowed only when every requirement has a current sourced statement", () => {
  const all = complete();
  assert.equal(evaluateReceivingRequirements({ authority, rules: all, now: NOW }).decision, "REQUIREMENTS_VERIFIED");
  const missingOne = all.filter((r) => r.requirement !== "WITNESSES");
  const result = evaluateReceivingRequirements({ authority, rules: missingOne, now: NOW });
  assert.equal(result.finalRouteAllowed, false);
  assert.deepEqual(result.findings.filter((f) => f.state === "UNKNOWN").map((f) => f.requirement), ["WITNESSES"]);
});

test("a statement that cannot be relied on is unknown: no source, wrong source type, stale, future-dated, unverified, undescribed condition", () => {
  const cases: [Partial<ReceivingRequirementRule>, RegExp][] = [
    [{ source_url: null }, /no official source/],
    [{ source_url: "http://authority.example.invalid/x" }, /no official source/],
    [{ source_type: "COMMERCIAL_BLOG" }, /not the receiving authority/],
    [{ source_type: null }, /not the receiving authority/],
    [{ verified_by: null }, /no verifying operator/],
    [{ review_due_at: "2026-11-13T12:00:00Z" }, /passed its review date/],
    [{ review_due_at: null }, /missing/],
    [{ verified_at: "2026-12-01T00:00:00Z" }, /in the future/],
    [{ verified_at: "not-a-date" }, /missing/],
    [{ status: "CONDITIONAL", detail: "  " }, /condition is not described/],
    [{ status: "UNKNOWN" }, /recorded as unknown/],
    [{ status: "MAYBE" }, /not recognised/],
  ];
  for (const [over, reason] of cases) {
    const f = finding([rule(over)], "TRANSLATION");
    assert.equal(f.state, "UNKNOWN", JSON.stringify(over));
    assert.match(String(f.reason), reason);
  }
  assert.equal(finding([rule({ status: "CONDITIONAL", detail: "Sworn translator only" })], "TRANSLATION").state, "CONDITIONAL");
});

test("disagreeing current statements are a conflict; a stale statement is not outvoted by a fresh one", () => {
  const conflict = finding([rule({ status: "REQUIRED" }), rule({ status: "NOT_REQUIRED", source_type: "OFFICIAL_GUIDANCE" })], "TRANSLATION");
  assert.equal(conflict.state, "CONFLICT");
  assert.equal(finding([rule({ status: "CONDITIONAL", detail: "A" }), rule({ status: "CONDITIONAL", detail: "B" })], "TRANSLATION").state, "CONFLICT");
  assert.equal(finding([rule({}), rule({ source_type: "OFFICIAL_GUIDANCE" })], "TRANSLATION").state, "REQUIRED", "agreeing statements stand");
  assert.equal(finding([rule({}), rule({ review_due_at: "2026-01-01T00:00:00Z" })], "TRANSLATION").state, "UNKNOWN");
  const blocked = evaluateReceivingRequirements({ authority, rules: [...complete(), rule({ requirement: "TRANSLATION", status: "REQUIRED" })], now: NOW });
  assert.equal(blocked.finalRouteAllowed, false, "a conflict blocks the final route");
});

test("a statement for the document category replaces the authority-wide one; superseded statements and other authorities are ignored", () => {
  const rules = [rule({ status: "NOT_REQUIRED" }), rule({ status: "REQUIRED", document_category: "power_of_attorney" })];
  assert.equal(finding(rules, "TRANSLATION", "Power of Attorney").state, "REQUIRED");
  assert.equal(finding(rules, "TRANSLATION", "diploma").state, "NOT_REQUIRED");
  assert.equal(finding(rules, "TRANSLATION").state, "NOT_REQUIRED");
  // A category-specific unknown is not rescued by the authority-wide statement.
  assert.equal(finding([rule({}), rule({ status: "UNKNOWN", document_category: "diploma" })], "TRANSLATION", "diploma").state, "UNKNOWN");
  assert.equal(finding([rule({ superseded_at: "2026-11-02T00:00:00Z" })], "TRANSLATION").state, "UNKNOWN");
  assert.equal(finding([rule({ authority_id: "other" })], "TRANSLATION").state, "UNKNOWN");
  assert.equal(normalizeCategory("  Power of  Attorney "), "power_of_attorney");
  assert.equal(normalizeCategory(null), "*");
});

test("an authority record that is itself unverified blocks even with complete statements; legacy booleans are never consulted", () => {
  for (const standing of [{ id: "a1", routing_status: "REVIEW_REQUIRED", manual_review_required: false }, { id: "a1", routing_status: "ACTIVE", manual_review_required: true }, { id: "a1", routing_status: "ACTIVE" }, { id: "a1" }]) {
    assert.equal(evaluateReceivingRequirements({ authority: standing, rules: complete(), now: NOW }).finalRouteAllowed, false);
  }
  const source = fs.readFileSync("lib/receiving-authority/requirements.ts", "utf8").replace(/^\s*\/\/.*$/gm, "");
  assert.doesNotMatch(source, /apostille_required|translation_required|ron_accepted|legalization_required/);
  assert.equal(isHttpsUrl("https://x.example/a"), true);
  for (const bad of ["http://x.example", "https://localhost", "javascript:alert(1)", "https://x.example/a b", "", null]) assert.equal(isHttpsUrl(bad), false);
});

// ---- database and store ------------------------------------------------------------------

function client(db: Db, cap?:number): SupabaseClient {
  const from = (table: string) => {
    const state = { op: "select", cols: "*", where: [] as string[], params: [] as unknown[], row: null as Record<string, unknown> | null, order: "", limit: "" };
    const param = (value: unknown) => { state.params.push(value); return `$${state.params.length}`; };
    const run = async () => {
      try {
        const where = state.where.length ? ` where ${state.where.join(" and ")}` : "";
        let sql: string;
        if (state.op === "insert") {
          const keys = Object.keys(state.row!);
          sql = `insert into public.${table}(${keys.join(",")}) values(${keys.map((k) => param(state.row![k])).join(",")}) returning ${state.cols}`;
        } else if (state.op === "update") {
          const sets = Object.keys(state.row!).map((k) => `${k}=${param(state.row![k])}`).join(",");
          sql = `update public.${table} set ${sets}${where} returning ${state.cols}`;
        } else sql = `select ${state.cols} from public.${table}${where}${state.order}${state.limit || (cap ? " limit " + cap : "")}`;
        const rows = (await db.query<Record<string, unknown>>(sql, state.params)).rows.map((r) =>
          Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v instanceof Date ? v.toISOString() : v])));
        return { data: rows, error: null };
      } catch (error) {
        return { data: null, error: { message: (error as Error).message, code: (error as { code?: string }).code } };
      }
    };
    // Explicitly typed: a self-referential inferred builder makes the type-checker explode.
    const api: Record<string, unknown> = {};
    api.select = (cols: string) => { state.cols = cols; return api; };
    api.insert = (row: Record<string, unknown>) => { state.op = "insert"; state.row = row; return api; };
    api.update = (row: Record<string, unknown>) => { state.op = "update"; state.row = row; return api; };
    api.eq = (col: string, value: unknown) => { state.where.push(`${col}=${param(value)}`); return api; };
    api.gt = (col:string,value:unknown) => { state.where.push(`${col}>${param(value)}`); return api; };
    api.limit = (n:number) => {state.limit=" limit "+Math.min(n,cap??n);return api;};
    api.is = (col: string, value: null) => { void value; state.where.push(`${col} is null`); return api; };
    api.order = (col: string) => { state.order = ` order by ${col}`; return api; };
    const one = async () => { const r = await run(); return r.error ? r : { data: r.data![0] ?? null, error: null }; };
    api.single = one;
    api.maybeSingle = one;
    api.then = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) => run().then(resolve, reject);
    return api;
  };
  return { from } as unknown as SupabaseClient;
}

async function seed(db: Db) {
  const insert = async (name: string, active: boolean) => (await db.query<{ id: string }>(
    `insert into public.receiving_authorities(name, authority_name, authority_type, country, routing_status, manual_review_required) values($1,$1,'registry','Synthetica',$2,$3) returning id`,
    [name, active ? "ACTIVE" : "REVIEW_REQUIRED", !active])).rows[0].id;
  return { active: await insert("Synthetic Registry", true), other: await insert("Other Registry", true), actor: randomUUID() };
}
const sourced = (requirement: string, over: Record<string, unknown> = {}) => ({ requirement, status: "NOT_REQUIRED", sourceUrl: SOURCE, sourceType: "RECEIVING_AUTHORITY", reviewDueAt: "2027-03-01T00:00:00Z", ...over });

test("store: recording, evaluating and superseding statements against the replayed schema", async () => {
  const db = await isolatedCanonicalDatabase(migrations());
  try {
    const s = await seed(db);
    const c = client(db,2);
    let state = await loadReceivingRequirements(c, s.active, null, NOW);
    assert.equal(state.evaluation.finalRouteAllowed, false);
    assert.equal(state.rules.length, 0);

    for (const requirement of RECEIVING_REQUIREMENTS) await recordReceivingRequirement(c, s.active, s.actor, sourced(requirement), NOW);
    state = await loadReceivingRequirements(c, s.active, null, NOW);
    assert.equal(state.evaluation.decision, "REQUIREMENTS_VERIFIED");
    assert.ok(state.rules.every((r) => r.verified_by === s.actor && r.verified_at === NOW.toISOString()), "the verifier and time come from the server, not the request");
    assert.equal((await loadReceivingRequirements(c, s.other, null, NOW)).evaluation.finalRouteAllowed, false, "another authority is unaffected");

    // A second, disagreeing statement produces a conflict until one is superseded.
    const second = await recordReceivingRequirement(c, s.active, s.actor, sourced("TRANSLATION", { status: "REQUIRED", sourceType: "OFFICIAL_GUIDANCE" }), NOW);
    state = await loadReceivingRequirements(c, s.active, null, NOW);
    assert.equal(state.evaluation.findings.find((f) => f.requirement === "TRANSLATION")!.state, "CONFLICT");
    assert.equal(state.evaluation.finalRouteAllowed, false);
    await assert.rejects(() => supersedeReceivingRequirement(c, s.active, second.id, s.actor, "  ", NOW), /reason is required/);
    await assert.rejects(() => supersedeReceivingRequirement(c, s.other, second.id, s.actor, "wrong authority", NOW), (e: ReceivingRequirementError) => e.status === 404);
    await supersedeReceivingRequirement(c, s.active, second.id, s.actor, "Duplicate of the authority statement", NOW);
    await assert.rejects(() => supersedeReceivingRequirement(c, s.active, second.id, s.actor, "again", NOW), (e: ReceivingRequirementError) => e.status === 404);
    assert.equal((await loadReceivingRequirements(c, s.active, null, NOW)).evaluation.finalRouteAllowed, true);

    // Time alone lapses the verification.
    assert.equal((await loadReceivingRequirements(c, s.active, null, new Date("2027-03-02T00:00:00Z"))).evaluation.finalRouteAllowed, false);

    // An unknown for one category blocks that category only.
    await recordReceivingRequirement(c, s.active, s.actor, { requirement: "WITNESSES", status: "UNKNOWN", documentCategory: "Diploma" }, NOW);
    assert.equal((await loadReceivingRequirements(c, s.active, "diploma", NOW)).evaluation.finalRouteAllowed, false);
    assert.equal((await loadReceivingRequirements(c, s.active, "affidavit", NOW)).evaluation.finalRouteAllowed, true);
  } finally { await db.close(); }
});

test("store: invalid statements are refused before any write", async () => {
  const db = await isolatedCanonicalDatabase(migrations());
  try {
    const s = await seed(db);
    const c = client(db);
    const bad: [Record<string, unknown>, RegExp][] = [
      [sourced("NOT_A_REQUIREMENT"), /Unknown requirement/],
      [sourced("TRANSLATION", { status: "PROBABLY" }), /Unknown status/],
      [sourced("TRANSLATION", { sourceUrl: "http://authority.example.invalid" }), /https source/],
      [sourced("TRANSLATION", { sourceUrl: undefined }), /https source/],
      [sourced("TRANSLATION", { sourceType: "COMMERCIAL_BLOG" }), /receiving authority or official guidance/],
      [sourced("TRANSLATION", { status: "CONDITIONAL" }), /Describe the condition/],
      [sourced("TRANSLATION", { reviewDueAt: "2027-02-30" }), /review date is required/],
      [sourced("TRANSLATION", { reviewDueAt: undefined }), /review date is required/],
      [sourced("TRANSLATION", { reviewDueAt: "2026-11-13T12:00:00Z" }), /in the future/],
      [sourced("TRANSLATION", { reviewDueAt: "2028-01-01T00:00:00Z" }), /within 365 days/],
    ];
    for (const [input, message] of bad) await assert.rejects(() => recordReceivingRequirement(c, s.active, s.actor, input, NOW), message);
    await assert.rejects(() => recordReceivingRequirement(c, randomUUID(), s.actor, sourced("TRANSLATION"), NOW), (e: ReceivingRequirementError) => e.code === "AUTHORITY_NOT_FOUND");
    await assert.rejects(() => loadReceivingRequirements(c, "not-a-uuid", null, NOW), (e: ReceivingRequirementError) => e.status === 404);
    assert.equal((await db.query("select 1 from public.receiving_authority_requirements")).rows.length, 0);
  } finally { await db.close(); }
});

test("database: statements are append-only, sourced by constraint, and closed to client roles", async () => {
  const db = await isolatedCanonicalDatabase(migrations());
  try {
    const s = await seed(db);
    const insert = (cols: string, values: string) => db.query(`insert into public.receiving_authority_requirements(authority_id, requirement, ${cols}) values('${s.active}', 'TRANSLATION', ${values}) returning id`);
    await assert.rejects(() => insert("status", "'REQUIRED'"), /sourced_check/);
    await assert.rejects(() => insert("status, source_url, source_type, verified_at, verified_by, review_due_at", `'REQUIRED',NULL,'RECEIVING_AUTHORITY',now(),'${s.actor}',now() + interval '30 days'`), /sourced_check/);
    await assert.rejects(() => insert("status, source_url, source_type, verified_at, verified_by, review_due_at", `'REQUIRED','http://x.example.invalid','RECEIVING_AUTHORITY',now(),'${s.actor}',now() + interval '30 days'`), /sourced_check/);
    await assert.rejects(() => insert("status, source_url, source_type, verified_at, verified_by, review_due_at", `'REQUIRED','${SOURCE}','COMMERCIAL_BLOG',now(),'${s.actor}',now() + interval '30 days'`), /source_type_check/);
    await assert.rejects(() => insert("status, source_url, source_type, verified_at, verified_by, review_due_at", `'CONDITIONAL','${SOURCE}','RECEIVING_AUTHORITY',now(),'${s.actor}',now() + interval '30 days'`), /conditional_check/);
    await assert.rejects(() => db.query(`insert into public.receiving_authority_requirements(authority_id, requirement, status) values('${s.active}', 'COLOUR_OF_INK', 'UNKNOWN')`), /requirement_check/);
    const id = (await insert("status, source_url, source_type, verified_at, verified_by, review_due_at", `'REQUIRED','${SOURCE}','RECEIVING_AUTHORITY',now(),'${s.actor}',now() + interval '30 days'`)).rows[0] as { id: string };

    await assert.rejects(() => db.query("update public.receiving_authority_requirements set status='NOT_REQUIRED' where id=$1", [id.id]), /APPEND_ONLY/);
    await assert.rejects(() => db.query("update public.receiving_authority_requirements set superseded_at=now(), superseded_by=$2, supersede_reason='x', source_url='https://other.example.invalid' where id=$1", [id.id, s.actor]), /APPEND_ONLY/);
    await assert.rejects(() => db.query("delete from public.receiving_authority_requirements where id=$1", [id.id]), /APPEND_ONLY/);
    await assert.rejects(() => db.query("update public.receiving_authority_requirements set superseded_at=now() where id=$1", [id.id]), /supersede_check/);
    await db.query("update public.receiving_authority_requirements set superseded_at=now(), superseded_by=$2, supersede_reason='replaced' where id=$1", [id.id, s.actor]);
    await assert.rejects(() => db.query("update public.receiving_authority_requirements set supersede_reason='rewritten' where id=$1", [id.id]), /APPEND_ONLY/);
    await assert.rejects(() => db.query("delete from public.receiving_authorities where id=$1", [s.active]), /foreign key|violates/);

    const table = (await db.query<{ relrowsecurity: boolean }>("select relrowsecurity from pg_class where oid='public.receiving_authority_requirements'::regclass")).rows[0];
    assert.equal(table.relrowsecurity, true);
    const grants = (await db.query<{ grantee: string }>("select distinct grantee from information_schema.role_table_grants where table_schema='public' and table_name='receiving_authority_requirements' and grantee in ('anon','authenticated','PUBLIC')")).rows;
    assert.deepEqual(grants, []);
    const policies = (await db.query("select 1 from pg_policies where schemaname='public' and tablename='receiving_authority_requirements'")).rows;
    assert.equal(policies.length, 0, "no client policy: server role only");

    // The suspend action writes a status the table accepts (it previously wrote one the check constraint rejects).
    await assert.rejects(() => db.query("update public.receiving_authorities set routing_status='SUSPENDED' where id=$1", [s.other]), /routing_status_check/);
    await db.query("update public.receiving_authorities set routing_status='INACTIVE' where id=$1", [s.other]);
  } finally { await db.close(); }
});

test("store and route: storage that is not deployed is reported, never read as empty; writes are role-gated", async () => {
  const failing = (code: string) => {
    const api: Record<string, unknown> = {};
    const authorityRow = { data: { id: randomUUID(), name: "x", country: "y", routing_status: "ACTIVE", manual_review_required: false }, error: null };
    let table = "";
    api.select = () => api; api.eq = () => api; api.is = () => api;
    api.maybeSingle = () => Promise.resolve(authorityRow);
    api.order = api.limit = api.gt = () => api;
    api.then = (resolve: (value:unknown)=>unknown) => Promise.resolve(table === "receiving_authorities" ? authorityRow : { data: null, error: { code, message: "relation does not exist" } }).then(resolve);
    return { from: (t: string) => { table = t; return api; } } as unknown as SupabaseClient;
  };
  await assert.rejects(() => loadReceivingRequirements(failing("42P01"), randomUUID(), null, NOW), (e: ReceivingRequirementError) => e.code === "REQUIREMENTS_STORAGE_NOT_DEPLOYED" && e.status === 503);
  await assert.rejects(() => loadReceivingRequirements(failing("XX000"), randomUUID(), null, NOW), (e: ReceivingRequirementError) => e.status === 503);

  const route = fs.readFileSync("app/api/dashboard/receiving-authorities/[id]/requirements/route.ts", "utf8");
  assert.match(route, /requireOperatorApiAccess\(\)/);
  const post = route.slice(route.indexOf("export async function POST"));
  assert.ok(post.indexOf("WRITE_ROLES.has(access.role)") < post.indexOf("recordReceivingRequirement("), "role is checked before any write");
  assert.match(post, /recordReceivingRequirement\(db, id, access\.userId, body\)/, "the verifier is the session user");
  const store = fs.readFileSync("lib/receiving-authority/requirementsStore.ts", "utf8");
  assert.doesNotMatch(store, /from\("receiving_authorities"\)\s*\.(update|insert|delete)/, "the store never writes the authority record");
});
