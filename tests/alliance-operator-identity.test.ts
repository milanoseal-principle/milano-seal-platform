import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PGlite } from "@electric-sql/pglite";
import { partnerIdForReferralCode, resolveAlliancePartner } from "@/lib/alliance/partnerContext";
import { recordPartnerReferralAttribution, submitPartnerReferral } from "@/lib/alliance/referralLeads";

// Alliance partners use the canonical operator identity (operators.user_id -> operators.profile_id
// -> operator_profiles); there is no alliance_partners table, and partner referrals are canonical
// sales_leads. Fixtures are synthetic.

type Row = Record<string, unknown>;
type Tables = Record<string, Row[]>;
function stub(tables: Tables, opts: { failOn?: string } = {}) {
  const calls: { table: string; op: string; args: unknown[] }[] = [];
  const db = {
    from(table: string) {
      const filters: ((r: Row) => boolean)[] = [];
      let write: { op: "insert" | "update"; value: Row } | null = null;
      const fail = () => opts.failOn === table;
      const run = () => {
        if (fail()) return { data: null, error: { message: "boom" } };
        if (write?.op === "insert") { (tables[table] ??= []).push({ ...write.value }); return { data: null, error: null }; }
        const rows = (tables[table] ?? []).filter((r) => filters.every((f) => f(r)));
        if (write?.op === "update") { for (const r of rows) Object.assign(r, write.value); return { data: null, error: null }; }
        return { data: rows, error: null };
      };
      const api = {
        select: () => api,
        eq: (k: string, v: unknown) => (filters.push((r) => (k.includes("->>") ? (r[k.split("->>")[0]] as Row | undefined)?.[k.split("->>")[1]] : r[k]) === v), api),
        neq: (k: string, v: unknown) => (filters.push((r) => r[k] !== v), api),
        in: (k: string, v: unknown[]) => (filters.push((r) => v.includes(r[k])), api),
        ilike: (k: string, pattern: string) => {
          calls.push({ table, op: "ilike", args: [k, pattern] });
          const exact = pattern.replace(/\\([\\%_])/g, "$1");
          const wildcard = /(^|[^\\])[%_]/.test(pattern);
          filters.push((r) => wildcard ? true : String(r[k] ?? "").toLowerCase() === exact.toLowerCase());
          return api;
        },
        order: () => api,
        limit: () => api,
        insert: (value: Row) => ((write = { op: "insert", value }), api),
        update: (value: Row) => ((write = { op: "update", value }), api),
        maybeSingle: async () => { const r = run(); return { data: Array.isArray(r.data) ? r.data[0] ?? null : r.data, error: r.error }; },
        then: (resolve: (v: unknown) => void, reject: (e: unknown) => void) => Promise.resolve(run()).then(resolve, reject),
      };
      return api;
    },
  };
  return { db: db as unknown as SupabaseClient, calls };
}

const USER = "00000000-0000-4000-8000-0000000000a1", PROFILE = "00000000-0000-4000-8000-0000000000b1", ACCOUNT = "00000000-0000-4000-8000-0000000000c1";
const account = (extra: Row = {}) => ({ id: ACCOUNT, user_id: USER, email: "partner@example.invalid", full_name: "Synthetic Partner", role: "alliance_partner", is_active: true, profile_id: PROFILE, referral_code: "MSA-1", created_at: "2026-11-01T00:00:00Z", ...extra });
const bound = (extra: Row = {}): Tables => ({
  operators: [account(extra)],
  operator_profiles: [{ id: PROFILE, firm_name: "Synthetic Firm", full_name: "Profile Name", onboarding_status: "approved", state: "FL", secondary_states: ["GA"] }],
  operator_routing_eligibility: [{ operator_id: PROFILE, eligible: true }],
  operator_compliance_status: [{ operator_id: PROFILE, compliance_ready: true, data_handling_agreement: true }],
  operator_toolbelt_status: [{ id: "t1", operator_id: PROFILE, required: true, status: "verified" }],
  operator_capabilities: [{ operator_id: PROFILE, capability_type: "document_category", capability_value: "power_of_attorney", verified: true }, { operator_id: PROFILE, capability_type: "document_category", capability_value: "unverified", verified: false }],
});

test("resolver: no session, no account, inactive or non-Alliance accounts resolve to no partner", async () => {
  assert.equal(await resolveAlliancePartner(null, stub(bound()).db), null);
  assert.equal(await resolveAlliancePartner(USER, stub({ operators: [] }).db), null);
  assert.equal(await resolveAlliancePartner(USER, stub(bound({ is_active: false })).db), null);
  assert.equal(await resolveAlliancePartner(USER, stub(bound({ role: "client" })).db), null);
  assert.equal(await resolveAlliancePartner(USER, stub(bound({ role: "founder_admin" })).db), null);
  assert.equal(await resolveAlliancePartner("00000000-0000-4000-8000-0000000000ff", stub(bound()).db), null, "another user never resolves this partner");
});

test("resolver: a bound account projects verified profile data; unbound is never eligible", async () => {
  const p = await resolveAlliancePartner(USER, stub(bound()).db);
  assert.ok(p);
  assert.equal(p.id, ACCOUNT);
  assert.equal(p.firm_name, "Synthetic Firm");
  assert.equal(p.routing_eligible, true);
  assert.equal(p.compliance_verified, true);
  assert.equal(p.toolbelt_completed, true);
  assert.deepEqual(p.jurisdiction_codes, ["FL", "GA"]);
  assert.deepEqual(p.document_categories, ["power_of_attorney"], "only verified capabilities");

  const unbound = await resolveAlliancePartner(USER, stub({ ...bound({ profile_id: null }) }).db);
  assert.ok(unbound);
  assert.equal(unbound.status, "unbound");
  assert.equal(unbound.routing_eligible, false);
  assert.equal(unbound.toolbelt_completed, false);
});

test("resolver fails closed when the identity source cannot be read", async () => {
  await assert.rejects(() => resolveAlliancePartner(USER, stub(bound(), { failOn: "operators" }).db), /ALLIANCE_IDENTITY_UNAVAILABLE/);
  await assert.rejects(() => resolveAlliancePartner(USER, stub(bound(), { failOn: "operator_routing_eligibility" }).db), /ALLIANCE_IDENTITY_UNAVAILABLE/);
});

test("referral codes match exactly; LIKE wildcards cannot match another partner", async () => {
  const s = stub(bound());
  assert.equal(await partnerIdForReferralCode("msa-1", s.db), ACCOUNT, "case-insensitive exact match");
  assert.equal(await partnerIdForReferralCode("%", s.db), null);
  assert.equal(await partnerIdForReferralCode("MSA_1", s.db), null);
  assert.ok(s.calls.filter((c) => c.op === "ilike").every((c) => !/(^|[^\\])[%_]/.test(String(c.args[1]))), "wildcards are escaped before the query");
  assert.equal(await partnerIdForReferralCode("MSA-1", stub(bound({ is_active: false })).db), null);
});

test("referrals are stored as canonical leads or fail; attribution is idempotent", async () => {
  const tables: Tables = { sales_leads: [], referral_ledger: [] };
  const s = stub(tables);
  const stored = await submitPartnerReferral(s.db, { client_email: "Client@Example.invalid", destination_country: "Italy", document_type: "Power of Attorney", matter_type: "international", referral_code: "MSA-1", context: {} }, ACCOUNT);
  const lead = tables.sales_leads[0];
  assert.equal(lead.lead_type, "alliance_referral");
  assert.equal(lead.email, "client@example.invalid");
  assert.equal((lead.details as Row).partner_id, ACCOUNT);
  assert.match(stored.reference, /^REF-[0-9A-F]{8}$/);
  await assert.rejects(() => submitPartnerReferral(stub({}, { failOn: "sales_leads" }).db, { client_email: "c@example.invalid", destination_country: "X", document_type: "Y", matter_type: "Z", context: {} }, ACCOUNT), /REFERRAL_NOT_STORED/);

  const matter = "00000000-0000-4000-8000-0000000000d1";
  assert.deepEqual(await recordPartnerReferralAttribution(s.db, String(lead.id), matter), { recorded: true, duplicate: false });
  assert.deepEqual(await recordPartnerReferralAttribution(s.db, String(lead.id), matter), { recorded: true, duplicate: true });
  assert.equal(tables.referral_ledger.length, 1);
  assert.equal(tables.referral_ledger[0].partner_id, ACCOUNT);
  tables.sales_leads.push({ id: "plain", lead_type: "pricing_request", details: { partner_id: ACCOUNT } });
  assert.deepEqual(await recordPartnerReferralAttribution(s.db, "plain", matter), { recorded: false }, "only partner referral leads carry attribution");
});

const MIGRATION = fs.readFileSync("supabase/migrations/20261112130000_alliance_operator_identity.sql", "utf8");
test("migration: hosted operators gain the binding; duplicate user_ids skip the unique index instead of failing", async () => {
  const db = new PGlite();
  await db.exec(`create table public.operator_profiles(id uuid primary key default gen_random_uuid(), email text unique not null);
    create table public.operators(id uuid primary key default gen_random_uuid(), user_id uuid, email text not null unique, full_name text, role text, is_active bool default true, created_at timestamptz default now(), updated_at timestamptz default now());
    insert into public.operators(user_id, email) values ('00000000-0000-4000-8000-000000000001','a@example.invalid'), ('00000000-0000-4000-8000-000000000001','b@example.invalid');`);
  await db.exec(MIGRATION);
  await db.exec(MIGRATION);
  const cols = (await db.query<{ c: string }>("select column_name c from information_schema.columns where table_name='operators' and column_name in ('profile_id','referral_code') order by 1")).rows.map((r) => r.c);
  assert.deepEqual(cols, ["profile_id", "referral_code"]);
  assert.equal((await db.query("select 1 from pg_indexes where indexname='operators_user_id_uidx'")).rows.length, 0, "existing duplicate data is never rewritten or rejected");
  assert.equal((await db.query<{ n: number }>("select count(*)::int n from public.operators")).rows[0].n, 2, "no rows touched");
  await db.close();
});

test("no legacy partner tables, no email or client-id partner identity", () => {
  const walk = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${dir}/${e.name}`) : /\.(ts|tsx)$/.test(e.name) ? [`${dir}/${e.name}`] : []));
  const files = ["app/alliance", "app/api/alliance", "lib/alliance", "app/dashboard/alliance"].flatMap(walk);
  for (const file of files) {
    const source = fs.readFileSync(file, "utf8").replace(/^\s*\/\/.*$/gm, "");
    assert.doesNotMatch(source, /from\("(alliance_partners|partner_observations|partner_commissions)"\)/, file);
  }
  const dashboard = fs.readFileSync("app/api/alliance/dashboard/route.ts", "utf8");
  assert.doesNotMatch(dashboard, /\.eq\("email"/, "dashboard never matches partners by email");
  const partner = fs.readFileSync("app/api/alliance/partner/route.ts", "utf8").replace(/^\s*\/\/.*$/gm, "");
  assert.doesNotMatch(partner, /partner_type|jurisdiction_codes|document_categories|role:/, "role and verified capabilities are not self-editable");
  const referrals = fs.readFileSync("app/api/alliance/referrals/route.ts", "utf8");
  assert.doesNotMatch(referrals, /return success anyway|partner_email/, "never reports an unstored referral; never attributes by typed email");
  const review = fs.readFileSync("app/api/alliance/referrals/review/route.ts", "utf8");
  assert.match(review, /canPerformProtectedMatterTransition\(access\.role\)/, "Matter creation keeps the protected-transition authority");
});
