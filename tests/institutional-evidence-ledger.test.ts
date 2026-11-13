import assert from "node:assert/strict";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isolatedCanonicalDatabase } from "../scripts/certification/shared.mjs";
import {
  INSTITUTIONAL_EVENTS, INSTITUTIONAL_LEDGER_SOURCE, InstitutionalLedgerError, decideInstitutionalRoute, loadInstitutionalState,
  recordInstitutionalEvidence, recordInstitutionalReview, type EvidenceInput, type ReviewInput,
} from "@/lib/institutional/evidenceLedger";
import { INSTITUTIONAL_PATHWAY_EVIDENCE, INSTITUTIONAL_PATHWAYS, type InstitutionalPathway } from "@/lib/institutional/institutionalDocument";
import { deriveInternationalExecutionPath } from "@/lib/control-plane/internationalDocumentExecutionProfile";

// B09: institutional evidence persisted in the canonical Matter evidence ledger and reviewed by
// operators. Runs against the replayed repository schema; fixtures are synthetic.

type Db = Awaited<ReturnType<typeof isolatedCanonicalDatabase>>;
const migrations = () => fs.readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql")).sort();

// The real API returns timestamps as ISO strings; the in-memory driver returns Date objects.
const iso = (row: unknown) => Object.fromEntries(Object.entries(row as Record<string, unknown>).map(([k, v]) => [k, v instanceof Date ? v.toISOString() : v]));

// Minimal stand-in for the Supabase client over the real database. Explicitly typed on purpose.
function client(db: Db, opts: { failRead?: boolean } = {}): SupabaseClient {
  const from = (table: string) => {
    const filters: [string, unknown][] = [];
    const orders: string[] = [];
    let cols = "*", limit = "", inserted: Record<string, unknown> | null = null;
    const run = async () => {
      if (opts.failRead && !inserted) return { data: null, error: { message: "boom" } };
      try {
        if (inserted) {
          const keys = Object.keys(inserted);
          const values = keys.map((k) => (inserted![k] !== null && typeof inserted![k] === "object" ? JSON.stringify(inserted![k]) : inserted![k]));
          const r = await db.query("insert into public." + table + "(" + keys.join(",") + ") values(" + keys.map((_, i) => "$" + (i + 1)).join(",") + ") returning " + cols, values);
          return { data: r.rows.map(iso), error: null };
        }
        const where = filters.map(([k], i) => k + "=$" + (i + 1)).join(" and ") || "true";
        const r = await db.query("select " + cols + " from public." + table + " where " + where + (orders.length ? " order by " + orders.join(",") : "") + limit, filters.map(([, v]) => v));
        return { data: r.rows.map(iso), error: null };
      } catch (error) {
        return { data: null, error: { message: (error as Error).message } };
      }
    };
    const one = async () => { const r = await run(); return { data: r.data ? (r.data[0] ?? null) : null, error: r.error }; };
    const api: Record<string, unknown> = {};
    api.select = (c: string) => { cols = c; return api; };
    api.insert = (row: Record<string, unknown>) => { inserted = row; return api; };
    api.eq = (k: string, v: unknown) => { filters.push([k, v]); return api; };
    api.order = (k: string, o?: { ascending?: boolean }) => { orders.push(k + (o?.ascending === false ? " desc" : " asc")); return api; };
    api.limit = (n: number) => { limit = " limit " + n; return api; };
    api.maybeSingle = one;
    api.single = one;
    api.then = (resolve: (v: unknown) => void, reject: (e: unknown) => void) => run().then(resolve, reject);
    return api;
  };
  return { from } as unknown as SupabaseClient;
}

const SHA = (c: string) => c.repeat(64);
async function seed(db: Db) {
  const matter = randomUUID(), other = randomUUID(), operator = randomUUID(), approver = randomUUID();
  for (const id of [matter, other]) await db.query("insert into public.deals(id, deal_id, status, email) values($1,$2,'intake_received','client@example.invalid')", [id, "SIM-" + id]);
  const version = async (m: string, hash: string | null) => (await db.query<{ id: string }>(
    "insert into public.document_versions(matter_id, stage, file_hash, actor, source_file, version_number) values($1,'intake_upload',$2,'operator','synthetic.pdf',1) returning id", [m, hash ?? "unhashed"])).rows[0].id;
  return { matter, other, operator, approver, doc: await version(matter, SHA("a")), specimen: await version(matter, SHA("b")), foreignDoc: await version(other, SHA("c")), unhashed: await version(matter, null) };
}
const T = (iso: string) => new Date(iso);
const review = (pathway: InstitutionalPathway, extra: ReviewInput = {}): ReviewInput => ({ issuingOrganisation: "Synthetic Intergovernmental Organisation", issuingOfficial: "A. Registrar", officialCapacity: "Registrar", hostState: "Netherlands", destination: "Italy", documentCategory: "certificate of employment", documentForm: "original", pathway, ...extra });
const item = (key: string, extra: EvidenceInput = {}): EvidenceInput => ({ key, state: "verified", source: "https://authority.example.invalid/ref/" + key, verifiedAt: "2026-11-10", ...extra });
const code = async (fn: () => Promise<unknown>) => { try { await fn(); return "OK"; } catch (e) { assert.ok(e instanceof InstitutionalLedgerError, String(e)); return `${e.status}:${e.code}`; } };
async function fill(c: SupabaseClient, matter: string, operator: string, pathway: InstitutionalPathway, at: string, skip: string[] = []) {
  for (const key of INSTITUTIONAL_PATHWAY_EVIDENCE[pathway]) if (!skip.includes(key)) await recordInstitutionalEvidence(c, matter, operator, item(key), T(at));
}

test("each pathway stays conditional until every item is evidenced and approved; then it is a verified route", async () => {
  for (const pathway of Object.keys(INSTITUTIONAL_PATHWAYS) as InstitutionalPathway[]) {
    const db = await isolatedCanonicalDatabase(migrations());
    try {
      const s = await seed(db), c = client(db);
      assert.equal((await loadInstitutionalState(c, s.matter)).review, null);
      await recordInstitutionalReview(c, s.matter, s.operator, review(pathway, { documentVersionId: s.doc }), T("2026-11-12T08:00:00Z"));
      const keys = INSTITUTIONAL_PATHWAY_EVIDENCE[pathway];
      const special = keys.at(-1)!; // signature/seal specimen, host-State notary or designated intermediary
      await fill(c, s.matter, s.operator, pathway, "2026-11-12T09:00:00Z", [special]);
      let state = await loadInstitutionalState(c, s.matter, T("2026-11-12T10:00:00Z"));
      assert.equal(state.evaluation?.decision, "CONDITIONAL_REVIEW", pathway);
      assert.equal(state.review?.documentSha256, SHA("a"), "document lineage and hash persist");
      // Approval before the evidence is complete is refused and nothing is written.
      assert.equal(await code(() => decideInstitutionalRoute(c, s.matter, s.approver, "approve", null, T("2026-11-12T10:00:00Z"))), "409:APPROVAL_NOT_SUPPORTED");
      await recordInstitutionalEvidence(c, s.matter, s.operator, item(special, { documentVersionId: s.specimen }), T("2026-11-12T11:00:00Z"));
      state = await loadInstitutionalState(c, s.matter, T("2026-11-12T11:30:00Z"));
      assert.equal(state.evaluation?.decision, "CONDITIONAL_REVIEW", "complete evidence is still not a route without approval");
      assert.deepEqual(state.evaluation?.outstanding.map((o) => o.key), ["operatorApproval"]);
      assert.equal(state.evidence[special]?.sha256, SHA("b"));
      await decideInstitutionalRoute(c, s.matter, s.approver, "approve", "Authority confirmation on file", T("2026-11-12T12:00:00Z"));
      state = await loadInstitutionalState(c, s.matter, T("2026-11-12T13:00:00Z"));
      assert.equal(state.evaluation?.decision, "VERIFIED_ROUTE", pathway);
      assert.equal(state.approval?.by, s.approver);
      assert.equal(await code(() => decideInstitutionalRoute(c, s.matter, s.approver, "approve", null, T("2026-11-12T13:00:00Z"))), "409:ALREADY_APPROVED");
      // The Matter path: verified, yet no U.S. state or federal lane is invented.
      const path = deriveInternationalExecutionPath({ destinationHagueVerified: true, destinationHagueOperativeForMatter: true, documentOriginLevel: "institutional", institutionalRouteDecision: state.evaluation?.decision });
      assert.deepEqual([path.status, path.lane], ["READY_FOR_OPERATOR_ROUTING", "unresolved"]);
    } finally { await db.close(); }
  }
});

test("evidence rules: source and real past date required, only pathway items, rejection needs a reason", async () => {
  const db = await isolatedCanonicalDatabase(migrations());
  try {
    const s = await seed(db), c = client(db), at = T("2026-11-12T09:00:00Z");
    assert.equal(await code(() => recordInstitutionalEvidence(c, s.matter, s.operator, item("issuerIdentity"), at)), "409:REVIEW_REQUIRED");
    await recordInstitutionalReview(c, s.matter, s.operator, review("DIRECT_COMPETENT_AUTHORITY"), at);
    const bad = (extra: EvidenceInput) => code(() => recordInstitutionalEvidence(c, s.matter, s.operator, item("competentAuthority", extra), at));
    assert.equal(await bad({ source: "  " }), "400:SOURCE_REQUIRED");
    assert.equal(await bad({ verifiedAt: "2026-02-30" }), "400:VERIFIED_DATE_INVALID");
    assert.equal(await bad({ verifiedAt: "2026-12-01" }), "400:VERIFIED_DATE_INVALID");
    assert.equal(await bad({ expiresAt: "2026-11-01" }), "400:EXPIRY_DATE_INVALID");
    assert.equal(await bad({ state: "pending" }), "400:EVIDENCE_STATE_INVALID");
    assert.equal(await bad({ state: "rejected", note: "" }), "400:REJECTION_REASON_REQUIRED");
    assert.equal(await code(() => recordInstitutionalEvidence(c, s.matter, s.operator, item("hostStateNotary"), at)), "400:EVIDENCE_KEY_NOT_REQUIRED");
    assert.equal(await code(() => recordInstitutionalEvidence(c, s.matter, s.operator, item("invented"), at)), "400:EVIDENCE_KEY_NOT_REQUIRED");
    assert.equal((await loadInstitutionalState(c, s.matter)).history.length, 0, "refused evidence writes nothing");
    // Review validation.
    assert.equal(await code(() => recordInstitutionalReview(c, s.matter, s.operator, review("DIRECT_COMPETENT_AUTHORITY", { issuingOrganisation: "" }), at)), "400:REVIEW_INCOMPLETE");
    assert.equal(await code(() => recordInstitutionalReview(c, s.matter, s.operator, review("DIRECT_COMPETENT_AUTHORITY", { hostState: "Atlantis" }), at)), "400:HOST_STATE_UNKNOWN");
    assert.equal(await code(() => recordInstitutionalReview(c, s.matter, s.operator, review("INVENTED" as InstitutionalPathway), at)), "400:PATHWAY_UNKNOWN");
    assert.equal(await code(() => recordInstitutionalReview(c, randomUUID(), s.operator, review("DIRECT_COMPETENT_AUTHORITY"), at)), "404:MATTER_NOT_FOUND");
    assert.equal(await code(() => loadInstitutionalState(c, "not-a-uuid")), "400:INVALID_MATTER_ID");
  } finally { await db.close(); }
});

test("wrong host State or blocked treaty relationship can never be approved", async () => {
  const db = await isolatedCanonicalDatabase(migrations());
  try {
    const s = await seed(db), c = client(db);
    const attempt = async (extra: ReviewInput, at: string) => {
      await recordInstitutionalReview(c, s.matter, s.operator, review("DIRECT_COMPETENT_AUTHORITY", extra), T(at + "T08:00:00Z"));
      await fill(c, s.matter, s.operator, "DIRECT_COMPETENT_AUTHORITY", at + "T09:00:00Z");
      const state = await loadInstitutionalState(c, s.matter, T(at + "T10:00:00Z"));
      return [state.evaluation?.decision, await code(() => decideInstitutionalRoute(c, s.matter, s.approver, "approve", null, T(at + "T10:00:00Z")))];
    };
    assert.deepEqual(await attempt({ hostState: "United Arab Emirates" }, "2026-11-10"), ["UNSUPPORTED", "409:APPROVAL_NOT_SUPPORTED"], "host State outside the Convention");
    assert.deepEqual(await attempt({ hostState: "Germany", destination: "India" }, "2026-11-11"), ["UNSUPPORTED", "409:APPROVAL_NOT_SUPPORTED"], "standing objection");
    assert.deepEqual(await attempt({ destination: "Thailand" }, "2026-11-12"), ["CONDITIONAL_REVIEW", "409:APPROVAL_NOT_SUPPORTED"], "future-effective destination");
    assert.equal((await loadInstitutionalState(c, s.matter)).decisions.length, 0, "no approval was ever written");
  } finally { await db.close(); }
});

test("corrections are versioned, history is immutable, and a superseded or expired item voids the approval", async () => {
  const db = await isolatedCanonicalDatabase(migrations());
  try {
    const s = await seed(db), c = client(db), p: InstitutionalPathway = "HOST_STATE_NOTARIAL_AUTHENTICATION";
    await recordInstitutionalReview(c, s.matter, s.operator, review(p), T("2026-11-12T08:00:00Z"));
    await fill(c, s.matter, s.operator, p, "2026-11-12T09:00:00Z");
    await decideInstitutionalRoute(c, s.matter, s.approver, "approve", null, T("2026-11-12T10:00:00Z"));
    assert.equal((await loadInstitutionalState(c, s.matter, T("2026-11-12T11:00:00Z"))).evaluation?.decision, "VERIFIED_ROUTE");

    // A correction creates version 2; version 1 stays in the ledger and the approval no longer covers it.
    await recordInstitutionalEvidence(c, s.matter, s.operator, item("hostStateNotary", { source: "https://authority.example.invalid/ref/corrected", expiresAt: "2026-12-31" }), T("2026-11-13T09:00:00Z"));
    let state = await loadInstitutionalState(c, s.matter, T("2026-11-13T10:00:00Z"));
    assert.equal(state.evidence.hostStateNotary?.version, 2);
    assert.deepEqual(state.history.filter((h) => h.key === "hostStateNotary").map((h) => [h.version, h.current]), [[1, false], [2, true]]);
    assert.equal(state.evidence.hostStateNotary?.supersedes, state.history.find((h) => h.key === "hostStateNotary" && h.version === 1)?.eventId);
    assert.equal(state.approval, null);
    assert.match(String(state.approvalVoided), /recorded after the approval/);
    assert.equal(state.evaluation?.decision, "CONDITIONAL_REVIEW");
    await decideInstitutionalRoute(c, s.matter, s.approver, "approve", "Re-approved after correction", T("2026-11-13T11:00:00Z"));
    assert.equal((await loadInstitutionalState(c, s.matter, T("2026-11-13T12:00:00Z"))).evaluation?.decision, "VERIFIED_ROUTE");

    // After the stated expiry the item must be re-verified, and the approval is void until then.
    state = await loadInstitutionalState(c, s.matter, T("2027-01-02T00:00:00Z"));
    assert.equal(state.evidence.hostStateNotary?.expired, true);
    assert.equal(state.approval, null);
    assert.match(String(state.approvalVoided), /expired/);
    assert.equal(state.evaluation?.decision, "CONDITIONAL_REVIEW");
    assert.equal(await code(() => decideInstitutionalRoute(c, s.matter, s.approver, "approve", null, T("2027-01-02T00:00:00Z"))), "409:APPROVAL_NOT_SUPPORTED");

    // The ledger itself refuses mutation: evidence can only ever be appended.
    await assert.rejects(() => db.query("update public.matter_evidence_ledger set reason='tampered' where source=$1", [INSTITUTIONAL_LEDGER_SOURCE]));
    await assert.rejects(() => db.query("delete from public.matter_evidence_ledger where source=$1", [INSTITUTIONAL_LEDGER_SOURCE]));
    const rows = (await db.query<{ n: number; domains: string }>("select count(*)::int n, string_agg(distinct domain, ',') domains from public.matter_evidence_ledger where matter_id=$1 and source=$2", [s.matter, INSTITUTIONAL_LEDGER_SOURCE])).rows[0];
    assert.equal(rows.domains, "authority");
    assert.equal(rows.n, 1 + INSTITUTIONAL_PATHWAY_EVIDENCE[p].length + 1 + 2);
  } finally { await db.close(); }
});

test("a new review version discards earlier evidence and approval; a rejection blocks until then", async () => {
  const db = await isolatedCanonicalDatabase(migrations());
  try {
    const s = await seed(db), c = client(db);
    await recordInstitutionalReview(c, s.matter, s.operator, review("DIRECT_COMPETENT_AUTHORITY"), T("2026-11-12T08:00:00Z"));
    await fill(c, s.matter, s.operator, "DIRECT_COMPETENT_AUTHORITY", "2026-11-12T09:00:00Z");
    await decideInstitutionalRoute(c, s.matter, s.approver, "approve", null, T("2026-11-12T10:00:00Z"));
    // Changing the pathway is a new version: nothing carries over.
    await recordInstitutionalReview(c, s.matter, s.operator, review("DESIGNATED_GOVERNMENT_INTERMEDIARY"), T("2026-11-12T11:00:00Z"));
    let state = await loadInstitutionalState(c, s.matter, T("2026-11-12T12:00:00Z"));
    assert.deepEqual([state.review?.version, state.history.length, state.approval, state.evaluation?.decision], [2, 0, null, "CONDITIONAL_REVIEW"]);

    assert.equal(await code(() => decideInstitutionalRoute(c, s.matter, s.approver, "reject", " ", T("2026-11-12T12:00:00Z"))), "400:REJECTION_REASON_REQUIRED");
    await recordInstitutionalEvidence(c, s.matter, s.operator, item("designatedIntermediary", { state: "rejected", note: "The host State has designated no intermediary." }), T("2026-11-12T12:30:00Z"));
    assert.equal((await loadInstitutionalState(c, s.matter, T("2026-11-12T12:40:00Z"))).evaluation?.decision, "UNSUPPORTED", "rejected evidence blocks the pathway");
    await decideInstitutionalRoute(c, s.matter, s.approver, "reject", "No designated intermediary exists.", T("2026-11-12T13:00:00Z"));
    state = await loadInstitutionalState(c, s.matter, T("2026-11-12T14:00:00Z"));
    assert.equal(state.evaluation?.decision, "UNSUPPORTED");
    assert.match(state.evaluation!.reasons[0], /operator rejected this pathway/);
    assert.equal(await code(() => decideInstitutionalRoute(c, s.matter, s.approver, "approve", null, T("2026-11-12T14:00:00Z"))), "409:PATHWAY_REJECTED");
    assert.equal(await code(() => recordInstitutionalEvidence(c, s.matter, s.operator, item("designatedIntermediary"), T("2026-11-12T14:00:00Z"))), "409:PATHWAY_REJECTED");
    // A new review version reopens the Matter with a clean slate.
    await recordInstitutionalReview(c, s.matter, s.operator, review("HOST_STATE_NOTARIAL_AUTHENTICATION"), T("2026-11-12T15:00:00Z"));
    state = await loadInstitutionalState(c, s.matter, T("2026-11-12T16:00:00Z"));
    assert.deepEqual([state.review?.version, state.rejection, state.evaluation?.decision], [3, null, "CONDITIONAL_REVIEW"]);
  } finally { await db.close(); }
});

test("Matter scoping: attachments must belong to the same Matter and carry a hash; one Matter never sees another's evidence", async () => {
  const db = await isolatedCanonicalDatabase(migrations());
  try {
    const s = await seed(db), c = client(db), at = T("2026-11-12T09:00:00Z");
    const custody = async () => (await db.query<{ v: number; c: number }>("select (select count(*)::int from public.document_versions) v, (select count(*)::int from public.custody_ledger) c")).rows[0];
    const before = await custody();
    assert.equal(await code(() => recordInstitutionalReview(c, s.matter, s.operator, review("DIRECT_COMPETENT_AUTHORITY", { documentVersionId: s.foreignDoc }), at)), "404:DOCUMENT_VERSION_NOT_IN_MATTER");
    assert.equal(await code(() => recordInstitutionalReview(c, s.matter, s.operator, review("DIRECT_COMPETENT_AUTHORITY", { documentVersionId: "1 or 1=1" }), at)), "400:INVALID_DOCUMENT_VERSION");
    await recordInstitutionalReview(c, s.matter, s.operator, review("DIRECT_COMPETENT_AUTHORITY"), at);
    assert.equal(await code(() => recordInstitutionalEvidence(c, s.matter, s.operator, item("signatureSealSpecimen", { documentVersionId: s.foreignDoc }), at)), "404:DOCUMENT_VERSION_NOT_IN_MATTER");
    assert.equal(await code(() => recordInstitutionalEvidence(c, s.matter, s.operator, item("signatureSealSpecimen", { documentVersionId: randomUUID() }), at)), "404:DOCUMENT_VERSION_NOT_IN_MATTER");
    assert.equal(await code(() => recordInstitutionalEvidence(c, s.matter, s.operator, item("signatureSealSpecimen", { documentVersionId: s.unhashed }), at)), "409:DOCUMENT_VERSION_UNHASHED");
    await recordInstitutionalEvidence(c, s.matter, s.operator, item("signatureSealSpecimen", { documentVersionId: s.specimen }), at);
    const mine = await loadInstitutionalState(c, s.matter), theirs = await loadInstitutionalState(c, s.other);
    assert.equal(mine.history.length, 1);
    assert.deepEqual([theirs.review, theirs.history.length], [null, 0]);
    // Custody is untouched: the review creates or changes no document version or custody entry.
    assert.deepEqual(await custody(), before);
  } finally { await db.close(); }
});

test("database access: anonymous and client roles cannot read or write institutional evidence", async () => {
  const db = await isolatedCanonicalDatabase(migrations());
  try {
    const s = await seed(db);
    await recordInstitutionalReview(client(db), s.matter, s.operator, review("DIRECT_COMPETENT_AUTHORITY"), T("2026-11-12T09:00:00Z"));
    const insert = "insert into public.matter_evidence_ledger(matter_id,event_type,domain,actor_type,source,new_value) values($1,$2,'authority','operator',$3,'{}')";
    await db.exec("set role anon");
    await assert.rejects(() => db.query(insert, [s.matter, INSTITUTIONAL_EVENTS.approved, INSTITUTIONAL_LEDGER_SOURCE]));
    assert.equal((await db.query("select 1 from public.matter_evidence_ledger").catch(() => ({ rows: [] }))).rows.length, 0);
    await db.exec("reset role");
    await db.exec(`set request.jwt.claims = '{"sub":"${randomUUID()}","app_metadata":{"role":"client"}}'; set role authenticated`);
    await assert.rejects(() => db.query(insert, [s.matter, INSTITUTIONAL_EVENTS.approved, INSTITUTIONAL_LEDGER_SOURCE]));
    assert.equal((await db.query("select 1 from public.matter_evidence_ledger").catch(() => ({ rows: [] }))).rows.length, 0, "a client sees no ledger rows");
    await db.exec("reset role");
  } finally { await db.close(); }
});

test("a read failure is reported as unavailable, never as an empty review", async () => {
  const db = await isolatedCanonicalDatabase(migrations());
  try {
    const s = await seed(db);
    assert.equal(await code(() => loadInstitutionalState(client(db, { failRead: true }), s.matter)), "503:INSTITUTIONAL_LEDGER_UNAVAILABLE");
  } finally { await db.close(); }
});

test("route and module contracts: operator gate first, approval needs protected authority, actor from the session, no other state touched", () => {
  const route = fs.readFileSync("app/api/dashboard/matters/[id]/institutional/route.ts", "utf8");
  assert.equal((route.match(/const access = await requireOperatorApiAccess\(\);\s*\n\s*if \(!access\.ok\) return access\.response;/g) ?? []).length, 2);
  assert.match(route, /if \(!canPerformProtectedMatterTransition\(access\.role\)\) return NextResponse\.json\(\{ error: "FORBIDDEN"/);
  assert.ok(route.indexOf("canPerformProtectedMatterTransition(access.role)) return") < route.indexOf("decideInstitutionalRoute(db"), "authority is checked before the decision is written");
  assert.equal((route.match(/access\.userId/g) ?? []).length, 3, "the actor is always the session user");
  assert.doesNotMatch(route, /body\.(actor|userId|approvedBy|operator)/);
  const lib = fs.readFileSync("lib/institutional/evidenceLedger.ts", "utf8");
  const tables = [...lib.matchAll(/\.from\("([a-z_]+)"\)/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(tables)].sort(), ["deals", "document_versions", "matter_evidence_ledger"]);
  assert.deepEqual([...lib.matchAll(/\.from\("([a-z_]+)"\)\s*\.insert/g)].map((m) => m[1]), ["matter_evidence_ledger"], "the only write is an append to the canonical ledger");
  assert.doesNotMatch(lib, /\.update\(|\.delete\(|\.upsert\(|getPublicUrl|createSignedUrl|payment|wise|ron_sessions|deal_status/i);
});
