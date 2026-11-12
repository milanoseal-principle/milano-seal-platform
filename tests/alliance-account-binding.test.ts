import assert from "node:assert/strict";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isolatedCanonicalDatabase } from "../scripts/certification/shared.mjs";
import { ALLIANCE_BINDING_ADMIN_ROLES, bindOperatorProfile, isUuid, listBindingAccounts, requireBindingAdmin, rotateReferralCode } from "@/lib/alliance/accountBinding";
import { resolveAlliancePartner } from "@/lib/alliance/partnerContext";

// B03: an administrator binds an Alliance account to its operator profile. The database
// functions are the only write path; fixtures are synthetic.

type Db = Awaited<ReturnType<typeof isolatedCanonicalDatabase>>;
const migrations = () => fs.readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql")).sort();

async function seed(db: Db) {
  const ids = { admin: randomUUID(), coordinator: randomUUID(), partnerUser: randomUUID(), otherUser: randomUUID(), disabledAdmin: randomUUID() };
  await db.query(
    `insert into auth.users(id, raw_app_meta_data) values ($1,'{"role":"founder_admin"}'),($2,'{"role":"execution_coordinator"}'),($3,'{"role":"alliance_partner"}'),($4,'{"role":"alliance_partner"}'),($5,'{"role":"admin","disabled":"true"}')`,
    [ids.admin, ids.coordinator, ids.partnerUser, ids.otherUser, ids.disabledAdmin]);
  const op = async (user: string | null, email: string) => (await db.query<{ id: string }>("insert into public.operators(user_id, email, role) values($1,$2,'alliance_partner') returning id", [user, email])).rows[0].id;
  const profile = async (email: string) => (await db.query<{ id: string }>("insert into public.operator_profiles(full_name, email) values('Synthetic Profile', $1) returning id", [email])).rows[0].id;
  return { ...ids, account: await op(ids.partnerUser, "p1@example.invalid"), other: await op(ids.otherUser, "p2@example.invalid"), noUser: await op(null, "p3@example.invalid"), profileA: await profile("a@example.invalid"), profileB: await profile("b@example.invalid") };
}
const bind = (db: Db, operator: string, profile: string | null, actor: string, reason: string | null = null) =>
  db.query<{ r: { profile_id: string | null; referral_code: string | null; changed: boolean } }>("select public.bind_operator_profile($1,$2,$3,$4) r", [operator, profile, actor, reason]);
const rotate = (db: Db, operator: string, actor: string, reason: string | null) => db.query<{ r: { referral_code: string } }>("select public.rotate_operator_referral_code($1,$2,$3) r", [operator, actor, reason]);
const account = async (db: Db, id: string) => (await db.query<{ profile_id: string | null; referral_code: string | null }>("select profile_id, referral_code from public.operators where id=$1", [id])).rows[0];
const audit = async (db: Db) => (await db.query<{ event_type: string; actor_id: string; metadata: Record<string, unknown> }>("select event_type, actor_id, metadata from public.audit_events where event_type like 'alliance.%' order by created_at, id")).rows;

test("only an active administrator can bind; refusals change nothing and write no audit row", async () => {
  const db = await isolatedCanonicalDatabase(migrations());
  try {
    const s = await seed(db);
    for (const actor of [s.coordinator, s.partnerUser, s.disabledAdmin, randomUUID()]) {
      await assert.rejects(() => bind(db, s.account, s.profileA, actor), /FORBIDDEN/);
      await assert.rejects(() => rotate(db, s.account, actor, "x"), /FORBIDDEN/);
    }
    assert.deepEqual(await account(db, s.account), { profile_id: null, referral_code: null });
    assert.deepEqual(await audit(db), []);
  } finally { await db.close(); }
});

test("binding issues a code, is idempotent, audited with old and new values, and enforces one-to-one", async () => {
  const db = await isolatedCanonicalDatabase(migrations());
  try {
    const s = await seed(db);
    const first = (await bind(db, s.account, s.profileA, s.admin)).rows[0].r;
    assert.equal(first.changed, true);
    assert.match(String(first.referral_code), /^MSA-[0-9A-F]{10}$/);
    assert.equal((await bind(db, s.account, s.profileA, s.admin)).rows[0].r.changed, false, "repeat is a no-op");
    assert.equal((await audit(db)).length, 1, "a no-op writes no second audit row");
    const [event] = await audit(db);
    assert.equal(event.event_type, "alliance.operator_profile_bound");
    assert.equal(event.actor_id, s.admin);
    assert.equal(event.metadata.old_profile_id, null);
    assert.equal(event.metadata.new_profile_id, s.profileA);
    assert.equal(event.metadata.referral_code_issued, true);

    await assert.rejects(() => bind(db, s.other, s.profileA, s.admin), /PROFILE_ALREADY_BOUND/);
    await assert.rejects(() => bind(db, s.noUser, s.profileB, s.admin), /OPERATOR_HAS_NO_USER/);
    await assert.rejects(() => bind(db, randomUUID(), s.profileB, s.admin), /OPERATOR_NOT_FOUND/);
    await assert.rejects(() => bind(db, s.other, randomUUID(), s.admin), /PROFILE_NOT_FOUND/);
    assert.equal((await account(db, s.other)).profile_id, null);

    // Rebinding to another profile keeps the code and records both profiles.
    const rebound = (await bind(db, s.account, s.profileB, s.admin)).rows[0].r;
    assert.equal(rebound.referral_code, first.referral_code);
    assert.equal((await audit(db))[1].metadata.old_profile_id, s.profileA);

    await assert.rejects(() => bind(db, s.account, null, s.admin), /REASON_REQUIRED/);
    await bind(db, s.account, null, s.admin, "Partner offboarded");
    assert.equal((await account(db, s.account)).profile_id, null);
    assert.equal((await audit(db))[2].event_type, "alliance.operator_profile_unbound");
    assert.equal((await audit(db))[2].metadata.reason, "Partner offboarded");
  } finally { await db.close(); }
});

test("a sign-in user mapped to two accounts cannot be bound", async () => {
  const db = await isolatedCanonicalDatabase(migrations());
  try {
    const s = await seed(db);
    await db.exec("drop index if exists public.operators_user_id_uidx");
    await db.query("insert into public.operators(user_id, email, role) values($1,'dup@example.invalid','alliance_partner')", [s.partnerUser]);
    await assert.rejects(() => bind(db, s.account, s.profileA, s.admin), /OPERATOR_USER_DUPLICATE/);
    assert.equal((await account(db, s.account)).profile_id, null);
  } finally { await db.close(); }
});

test("rotation needs a bound account and a reason, issues a unique code and keeps attribution", async () => {
  const db = await isolatedCanonicalDatabase(migrations());
  try {
    const s = await seed(db);
    await assert.rejects(() => rotate(db, s.account, s.admin, "x"), /OPERATOR_NOT_BOUND/);
    const issued = (await bind(db, s.account, s.profileA, s.admin)).rows[0].r.referral_code;
    await assert.rejects(() => rotate(db, s.account, s.admin, "  "), /REASON_REQUIRED/);
    const deal = randomUUID();
    await db.query("insert into public.deals(id, deal_id, status, email) values($1,$2,'intake_received','c@example.invalid')", [deal, "SIM-" + deal]);
    await db.query("insert into public.referral_ledger(matter_id, partner_id, referral_code, source_type, attribution_status) values($1,$2,$3,'partner_link','captured')", [deal, s.account, issued]);
    const rotated = (await rotate(db, s.account, s.admin, "Code shared publicly")).rows[0].r.referral_code;
    assert.notEqual(rotated, issued);
    assert.equal((await account(db, s.account)).referral_code, rotated);
    assert.equal((await db.query<{ partner_id: string }>("select partner_id from public.referral_ledger where matter_id=$1", [deal])).rows[0].partner_id, s.account, "attribution is by account, not code");
    const last = (await audit(db)).at(-1)!;
    assert.equal(last.event_type, "alliance.referral_code_rotated");
    assert.equal(last.metadata.old_referral_code, issued);
    assert.equal(last.metadata.new_referral_code, rotated);
  } finally { await db.close(); }
});

test("privileges: only the server role can execute; a client cannot write the binding columns", async () => {
  const db = await isolatedCanonicalDatabase(migrations());
  try {
    const s = await seed(db);
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`set role ${role}`);
      await assert.rejects(() => bind(db, s.account, s.profileA, s.admin), /permission denied/);
      await assert.rejects(() => rotate(db, s.account, s.admin, "x"), /permission denied/);
      await assert.rejects(() => db.query("update public.operators set profile_id=$1 where id=$2", [s.profileA, s.account]), /permission denied/);
      await db.exec("reset role");
    }
    await db.exec("set role service_role");
    assert.equal((await bind(db, s.account, s.profileA, s.admin)).rows[0].r.changed, true);
    await db.exec("reset role");
  } finally { await db.close(); }
});

// Thin stand-in for the Supabase client: rpc() runs the real database function.
function client(db: Db, tables: Record<string, unknown[]> = {}, fail = false) {
  return {
    rpc: async (fn: string, args: Record<string, unknown>) => {
      try {
        const sql = fn === "bind_operator_profile" ? "select public.bind_operator_profile($1,$2,$3,$4) r" : "select public.rotate_operator_referral_code($1,$2,$3) r";
        const params = fn === "bind_operator_profile" ? [args.p_operator, args.p_profile, args.p_actor, args.p_reason] : [args.p_operator, args.p_actor, args.p_reason];
        return { data: (await db.query<{ r: unknown }>(sql, params)).rows[0].r, error: null };
      } catch (error) { return { data: null, error: { message: (error as Error).message } }; }
    },
    from: (table: string) => {
      const result = fail ? { data: null, error: { message: "boom" } } : { data: tables[table] ?? [], error: null };
      // Explicitly typed: a self-referential inferred builder makes the type-checker explode.
      const api: Record<string, unknown> = {};
      api.select = () => api;
      api.in = () => api;
      api.order = () => api;
      api.range = (from: number, to: number) => Promise.resolve(result.data ? { data: result.data.slice(from, to + 1), error: null } : result);
      return api;
    },
  } as unknown as SupabaseClient;
}

test("server helpers map database refusals to honest HTTP results and never report success on failure", async () => {
  const db = await isolatedCanonicalDatabase(migrations());
  try {
    const s = await seed(db);
    const c = client(db);
    const denied = await bindOperatorProfile(c, { operatorId: s.account, profileId: s.profileA, actorId: s.coordinator });
    assert.deepEqual([denied.ok, !denied.ok && denied.status, !denied.ok && denied.code], [false, 403, "FORBIDDEN"]);
    const ok = await bindOperatorProfile(c, { operatorId: s.account, profileId: s.profileA, actorId: s.admin });
    assert.ok(ok.ok && ok.changed && ok.referral_code);
    const taken = await bindOperatorProfile(c, { operatorId: s.other, profileId: s.profileA, actorId: s.admin });
    assert.ok(!taken.ok && taken.status === 409 && taken.code === "PROFILE_ALREADY_BOUND");
    const noReason = await rotateReferralCode(c, { operatorId: s.account, actorId: s.admin, reason: "" });
    assert.ok(!noReason.ok && noReason.status === 400);
    const outage = await bindOperatorProfile({ rpc: async () => ({ data: null, error: { message: "function does not exist" } }) } as unknown as SupabaseClient, { operatorId: s.account, profileId: s.profileA, actorId: s.admin });
    assert.ok(!outage.ok && outage.status === 503 && outage.code === "BINDING_UNAVAILABLE");
    const empty = await bindOperatorProfile({ rpc: async () => ({ data: null, error: null }) } as unknown as SupabaseClient, { operatorId: s.account, profileId: s.profileA, actorId: s.admin });
    assert.ok(!empty.ok && empty.status === 503);

    // The bound account now resolves for its own user, with the issued code; another user does not.
    const real = {
      from: (table: string) => {
        const filters: [string, unknown][] = [];
        const where = () => filters.map(([column], i) => column + "=$" + (i + 1)).join(" and ") || "true";
        const rows = async () => (await db.query("select * from public." + table + " where " + where(), filters.map(([, value]) => value))).rows;
        const api: Record<string, unknown> = {};
        api.select = () => api;
        api.eq = (column: string, value: unknown) => { filters.push([column, value]); return api; };
        api.neq = () => api;
        api.maybeSingle = async () => ({ data: (await rows())[0] ?? null, error: null });
        api.then = (resolve: (v: unknown) => void) => rows().then((data) => resolve({ data, error: null }));
        return api;
      },
    } as unknown as SupabaseClient;
    const partner = await resolveAlliancePartner(s.partnerUser, real);
    assert.equal(partner?.profile_id, s.profileA);
    assert.equal(partner?.referral_code, ok.ok ? ok.referral_code : null);
    assert.equal((await resolveAlliancePartner(s.otherUser, real))?.status, "unbound");
  } finally { await db.close(); }
});

test("admin gate and listing: role allow-list, duplicate users flagged, read failure is not an empty list", async () => {
  assert.deepEqual([...ALLIANCE_BINDING_ADMIN_ROLES].sort(), ["admin", "founder", "founder_admin", "owner"]);
  for (const role of ["execution_coordinator", "ops_manager", "finance", "alliance_partner", "va", ""]) {
    const r = await requireBindingAdmin({ ok: true, userId: "u", actor: "a", role });
    assert.ok(!r.ok && r.response.status === 403, role);
  }
  assert.ok((await requireBindingAdmin({ ok: true, userId: "u", actor: "a", role: "founder_admin" })).ok);
  const unauth = { ok: false as const, response: NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 }) };
  assert.equal(await requireBindingAdmin(unauth), unauth);
  assert.ok(isUuid("00000000-0000-4000-8000-000000000001") && !isUuid("1 or 1=1") && !isUuid(null));

  const tables = {
    operators: [
      { id: "o1", user_id: "u1", email: "a@example.invalid", full_name: null, role: "alliance_partner", is_active: true, profile_id: "p1", referral_code: "MSA-1" },
      { id: "o2", user_id: "u1", email: "b@example.invalid", full_name: null, role: "alliance", is_active: false, profile_id: null, referral_code: null },
      { id: "o3", user_id: null, email: "c@example.invalid", full_name: null, role: "alliance_member", is_active: true, profile_id: null, referral_code: null },
    ],
    operator_profiles: [{ id: "p1", full_name: "P One", firm_name: "Firm", email: "p1@example.invalid", state: "FL", onboarding_status: "approved" }, { id: "p2", full_name: "P Two", firm_name: null, email: null, state: null, onboarding_status: "invited" }],
  };
  const listed = await listBindingAccounts(client(null as unknown as Db, tables));
  assert.deepEqual(listed.accounts.map((a) => [a.id, a.duplicate_user, a.has_user, a.profile?.id ?? null]), [["o1", true, true, "p1"], ["o2", true, true, null], ["o3", false, false, null]]);
  assert.deepEqual(listed.profiles.map((p) => [p.id, p.bound]), [["p1", true], ["p2", false]]);
  await assert.rejects(() => listBindingAccounts(client(null as unknown as Db, tables, true)), /BINDING_ACCOUNTS_UNAVAILABLE/);

  // More rows than one API page: every page is read, so a bound profile on a later page still resolves.
  const many = {
    operators: Array.from({ length: 1001 }, (_, i) => ({ id: `o${i}`, user_id: `u${i}`, email: `${i}@example.invalid`, full_name: null, role: "alliance_partner", is_active: true, profile_id: i === 1000 ? "p1500" : null, referral_code: null })),
    operator_profiles: Array.from({ length: 2001 }, (_, i) => ({ id: `p${i}`, full_name: `P${i}`, firm_name: null, email: null, state: null, onboarding_status: "approved" })),
  };
  const paged = await listBindingAccounts(client(null as unknown as Db, many));
  assert.equal(paged.accounts.length, 1001);
  assert.equal(paged.profiles.length, 2001);
  assert.equal(paged.accounts[1000].profile?.id, "p1500", "bound profile beyond the first page is not shown as unbound");
  assert.equal(paged.profiles.filter((p) => p.bound).length, 1);
});

test("route contracts: admin gate first, actor from the session, no email matching, no direct column writes", () => {
  const routes = ["app/api/admin/operators/accounts/route.ts", "app/api/admin/operators/accounts/[id]/binding/route.ts", "app/api/admin/operators/accounts/[id]/referral-code/route.ts"].map((f) => fs.readFileSync(f, "utf8"));
  for (const source of routes) {
    assert.match(source, /const access = await requireBindingAdmin\(\);\s*\n\s*if \(!access\.ok\) return access\.response;/);
    assert.doesNotMatch(source, /\.update\(|\.insert\(|\.eq\("email"/);
  }
  assert.match(routes[1], /actorId: access\.userId/);
  assert.match(routes[2], /actorId: access\.userId/);
  const lib = fs.readFileSync("lib/alliance/accountBinding.ts", "utf8");
  assert.doesNotMatch(lib, /\.update\(|\.insert\(|\.eq\("email"|ilike/);
  const page = fs.readFileSync("app/dashboard/alliance/accounts/page.tsx", "utf8");
  assert.match(page, /ALLIANCE_BINDING_ADMIN_ROLES\.has\(role\)/);
  assert.match(page, /This is not an empty list/);
  const partnerRoute = fs.readFileSync("app/api/alliance/partner/route.ts", "utf8");
  assert.doesNotMatch(partnerRoute, /profile_id:|referral_code:/, "a partner can never set their own binding or code");
});
