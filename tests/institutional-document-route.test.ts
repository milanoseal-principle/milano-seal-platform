import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  INSTITUTIONAL_DOCUMENT_ORIGIN, INSTITUTIONAL_EVIDENCE, INSTITUTIONAL_PATHWAYS, INSTITUTIONAL_PATHWAY_EVIDENCE, INSTITUTIONAL_SOURCE,
  evaluateInstitutionalRoute, isInstitutionalOrigin, type EvidenceItem, type InstitutionalEvidenceKey, type InstitutionalPathway, type InstitutionalRouteInput,
} from "@/lib/institutional/institutionalDocument";
import { deriveInternationalExecutionPath } from "@/lib/control-plane/internationalDocumentExecutionProfile";
import { evaluateApostilleRelationship } from "@/lib/treaty/apostilleRelationship";

// B08: documents issued by supranational or intergovernmental organisations. The three HCCH 2017
// pathways are candidates only; a route exists only when every requirement is evidenced from an
// identified source and an operator has approved it. Fixtures are synthetic.

const AT = "2026-11-12";
const ok = (extra: Partial<EvidenceItem> = {}): EvidenceItem => ({ state: "verified", source: "https://authority.example.invalid/confirmation/1", verifiedAt: "2026-10-01", ...extra });
const evidenceFor = (pathway: InstitutionalPathway, change: Partial<Record<InstitutionalEvidenceKey, EvidenceItem | undefined>> = {}) =>
  ({ ...Object.fromEntries(INSTITUTIONAL_PATHWAY_EVIDENCE[pathway].map((key) => [key, ok()])), ...change }) as InstitutionalRouteInput["evidence"];
const base = (pathway: InstitutionalPathway, extra: Partial<InstitutionalRouteInput> = {}): InstitutionalRouteInput => ({
  documentOrigin: INSTITUTIONAL_DOCUMENT_ORIGIN, issuingOrganisation: "Synthetic Intergovernmental Organisation", hostState: "NL", destination: "IT",
  documentCategory: "certificate of employment", documentForm: "original", pathway, evidence: evidenceFor(pathway),
  operatorApproval: { approvedBy: "00000000-0000-4000-8000-000000000001", approvedAt: "2026-10-15" }, evaluationDate: AT, ...extra,
});

test("the three pathways and their source are the HCCH 2017 recommendations, described as candidates", () => {
  assert.deepEqual(Object.keys(INSTITUTIONAL_PATHWAYS), ["DIRECT_COMPETENT_AUTHORITY", "HOST_STATE_NOTARIAL_AUTHENTICATION", "DESIGNATED_GOVERNMENT_INTERMEDIARY"]);
  assert.equal(INSTITUTIONAL_SOURCE.date, "2017-12-01");
  assert.equal(INSTITUTIONAL_SOURCE.status, "recommendation");
  assert.ok(isInstitutionalOrigin(INSTITUTIONAL_DOCUMENT_ORIGIN) && !isInstitutionalOrigin("state") && !isInstitutionalOrigin(undefined));
  for (const keys of Object.values(INSTITUTIONAL_PATHWAY_EVIDENCE)) {
    for (const required of ["issuerIdentity", "competentAuthority", "receivingAuthority"] as const) assert.ok(keys.includes(required));
    for (const key of keys) assert.ok(INSTITUTIONAL_EVIDENCE[key]);
  }
  assert.ok(INSTITUTIONAL_PATHWAY_EVIDENCE.DIRECT_COMPETENT_AUTHORITY.includes("signatureSealSpecimen"));
  assert.ok(INSTITUTIONAL_PATHWAY_EVIDENCE.HOST_STATE_NOTARIAL_AUTHENTICATION.includes("hostStateNotary"));
  assert.ok(INSTITUTIONAL_PATHWAY_EVIDENCE.DESIGNATED_GOVERNMENT_INTERMEDIARY.includes("designatedIntermediary"));
});

test("each pathway is verified only with all evidence, sources and operator approval", () => {
  for (const pathway of Object.keys(INSTITUTIONAL_PATHWAYS) as InstitutionalPathway[]) {
    const verified = evaluateInstitutionalRoute(base(pathway));
    assert.equal(verified.decision, "VERIFIED_ROUTE", pathway);
    assert.equal(verified.routeActive, true);
    assert.deepEqual(verified.outstanding, []);
    assert.match(verified.notice, /never guarantees acceptance/);

    for (const key of INSTITUTIONAL_PATHWAY_EVIDENCE[pathway]) {
      const missing = evaluateInstitutionalRoute(base(pathway, { evidence: evidenceFor(pathway, { [key]: undefined }) }));
      assert.equal(missing.decision, "CONDITIONAL_REVIEW", `${pathway} without ${key}`);
      assert.equal(missing.routeActive, false);
      assert.deepEqual(missing.outstanding.map((o) => [o.key, o.problem]), [[key, "missing"]]);
    }
    const unapproved = evaluateInstitutionalRoute(base(pathway, { operatorApproval: null }));
    assert.equal(unapproved.decision, "CONDITIONAL_REVIEW");
    assert.deepEqual(unapproved.outstanding.map((o) => o.key), ["operatorApproval"]);
  }
});

test("nothing is auto-approved: the starting state of every pathway is conditional review", () => {
  for (const pathway of Object.keys(INSTITUTIONAL_PATHWAYS) as InstitutionalPathway[]) {
    const r = evaluateInstitutionalRoute(base(pathway, { evidence: {}, operatorApproval: null }));
    assert.equal(r.decision, "CONDITIONAL_REVIEW");
    assert.equal(r.outstanding.length, INSTITUTIONAL_PATHWAY_EVIDENCE[pathway].length + 1);
  }
});

test("evidence without an identified source, future-dated, stale or approved too early does not count", () => {
  const p: InstitutionalPathway = "DIRECT_COMPETENT_AUTHORITY";
  const problem = (item: EvidenceItem) => evaluateInstitutionalRoute(base(p, { evidence: evidenceFor(p, { competentAuthority: item }) })).outstanding.map((o) => [o.key, o.problem]);
  assert.deepEqual(problem(ok({ source: "  " })), [["competentAuthority", "no_source"]]);
  assert.deepEqual(problem(ok({ verifiedAt: null })), [["competentAuthority", "no_source"]]);
  assert.deepEqual(problem(ok({ verifiedAt: "2027-01-01" })), [["competentAuthority", "stale"], ["operatorApproval", "stale"]]);
  assert.deepEqual(problem(ok({ verifiedAt: "2025-01-01" })), [["competentAuthority", "stale"]]);
  assert.deepEqual(problem({ state: "unverified", source: "x", verifiedAt: "2026-10-01" }), [["competentAuthority", "missing"]]);
  // Evidence re-verified after the approval: the approval no longer covers it.
  const late = evaluateInstitutionalRoute(base(p, { evidence: evidenceFor(p, { issuerIdentity: ok({ verifiedAt: "2026-11-01" }) }) }));
  assert.equal(late.decision, "CONDITIONAL_REVIEW");
  assert.deepEqual(late.outstanding.map((o) => [o.key, o.problem]), [["operatorApproval", "stale"]]);
  assert.equal(evaluateInstitutionalRoute(base(p, { operatorApproval: { approvedBy: "", approvedAt: "2026-10-15" } })).decision, "CONDITIONAL_REVIEW");
  assert.equal(evaluateInstitutionalRoute(base(p, { operatorApproval: { approvedBy: "op", approvedAt: "2027-01-01" } })).decision, "CONDITIONAL_REVIEW");
});

test("unknown issuer, host State, document or pathway is UNKNOWN, never a route", () => {
  const p: InstitutionalPathway = "HOST_STATE_NOTARIAL_AUTHENTICATION";
  for (const extra of [{ issuingOrganisation: " " }, { hostState: null }, { hostState: "Atlantis" }, { documentCategory: "" }, { documentForm: null }, { pathway: null }, { pathway: "INVENTED" as InstitutionalPathway }, { evaluationDate: "soon" }] as Partial<InstitutionalRouteInput>[]) {
    const r = evaluateInstitutionalRoute(base(p, extra));
    assert.equal(r.decision, "UNKNOWN", JSON.stringify(extra));
    assert.equal(r.routeActive, false);
  }
  assert.equal(evaluateInstitutionalRoute(base(p, { documentOrigin: "state" })).decision, "UNKNOWN");
  // A well-known organisation name alone establishes nothing.
  const named = evaluateInstitutionalRoute({ documentOrigin: INSTITUTIONAL_DOCUMENT_ORIGIN, issuingOrganisation: "United Nations", evaluationDate: AT });
  assert.equal(named.decision, "UNKNOWN");
});

test("unsupported: host State outside the Convention, blocked destination, rejected evidence, copy on the direct pathway", () => {
  const p: InstitutionalPathway = "DESIGNATED_GOVERNMENT_INTERMEDIARY";
  assert.equal(evaluateInstitutionalRoute(base(p, { hostState: "AE" })).decision, "UNSUPPORTED", "host State not a Contracting Party");
  assert.equal(evaluateInstitutionalRoute(base(p, { hostState: "TH" })).decision, "UNSUPPORTED", "host State not yet in force");
  assert.equal(evaluateInstitutionalRoute(base(p, { hostState: "DE", destination: "IN" })).decision, "UNSUPPORTED", "standing objection between host State and destination");
  assert.equal(evaluateInstitutionalRoute(base(p, { destination: "Egypt" })).decision, "UNSUPPORTED");
  const rejected = evaluateInstitutionalRoute(base(p, { evidence: evidenceFor(p, { designatedIntermediary: { state: "rejected" } }) }));
  assert.equal(rejected.decision, "UNSUPPORTED");
  assert.deepEqual(rejected.outstanding.map((o) => o.problem), ["rejected"]);
  assert.equal(evaluateInstitutionalRoute(base("DIRECT_COMPETENT_AUTHORITY", { documentForm: "certified_copy" })).decision, "UNSUPPORTED");
  assert.equal(evaluateInstitutionalRoute(base("HOST_STATE_NOTARIAL_AUTHENTICATION", { documentForm: "certified_copy" })).decision, "VERIFIED_ROUTE");
});

test("unsettled treaty relationship or missing destination keeps a fully evidenced pathway conditional", () => {
  const p: InstitutionalPathway = "DIRECT_COMPETENT_AUTHORITY";
  assert.equal(evaluateInstitutionalRoute(base(p, { destination: null })).decision, "CONDITIONAL_REVIEW");
  assert.equal(evaluateInstitutionalRoute(base(p, { destination: "Thailand" })).decision, "CONDITIONAL_REVIEW", "future-effective destination");
  assert.equal(evaluateInstitutionalRoute(base(p, { destination: "Aruba" })).decision, "CONDITIONAL_REVIEW");
});

test("Matter path: institutional origin stays in review until verified, and never picks a U.S. lane or bypasses other gates", () => {
  const facts = { destinationHagueVerified: true, destinationHagueOperativeForMatter: true, documentOriginLevel: "institutional" as const };
  for (const decision of [undefined, null, "UNKNOWN", "CONDITIONAL_REVIEW", "UNSUPPORTED"] as const) {
    const r = deriveInternationalExecutionPath({ ...facts, institutionalRouteDecision: decision });
    assert.equal(r.status, "REVIEW_REQUIRED", String(decision));
    assert.match(r.reasons.join(" "), /supranational or intergovernmental/);
  }
  const verified = deriveInternationalExecutionPath({ ...facts, institutionalRouteDecision: "VERIFIED_ROUTE" });
  assert.equal(verified.status, "READY_FOR_OPERATOR_ROUTING");
  assert.equal(verified.lane, "unresolved", "no state or federal lane is selected for a host-State apostille");
  assert.equal(deriveInternationalExecutionPath({ ...facts, institutionalRouteDecision: "VERIFIED_ROUTE", notarizationRequired: true, notarialActKnown: true }).lane, "unresolved");
  // A verified institutional route does not waive the other review reasons.
  assert.equal(deriveInternationalExecutionPath({ ...facts, institutionalRouteDecision: "VERIFIED_ROUTE", destinationHagueVerified: false }).status, "REVIEW_REQUIRED");
  assert.equal(deriveInternationalExecutionPath({ ...facts, institutionalRouteDecision: "VERIFIED_ROUTE", ronRequested: true, ronEligible: null }).status, "REVIEW_REQUIRED");
  // Existing origins are unaffected.
  assert.equal(deriveInternationalExecutionPath({ destinationHagueVerified: true, destinationHagueOperativeForMatter: true, documentOriginLevel: "state" }).lane, "state_apostille");
  assert.equal(deriveInternationalExecutionPath({ destinationHagueVerified: true, destinationHagueOperativeForMatter: true, documentOriginLevel: "federal" }).lane, "federal_authentication");
  assert.equal(evaluateApostilleRelationship({ origin: "NL", destination: "IT", evaluationDate: AT, documentOrigin: INSTITUTIONAL_DOCUMENT_ORIGIN }).status, "OFFICIAL_REVIEW_REQUIRED");
});

test("the module holds no organisation list, issues nothing and touches no payment or Matter state", () => {
  const source = fs.readFileSync("lib/institutional/institutionalDocument.ts", "utf8");
  assert.doesNotMatch(source, /supabase|createAdminClient|\.from\(|payment|wise|deal_status|fetch\(/i);
  assert.doesNotMatch(source.replace(/\/\/.*$/gm, ""), /United Nations|European Union|World Bank|WIPO|Interpol/i, "an organisation's name is never treated as authority");
  assert.match(source.replace(/\n\/\/ /g, " "), /does not authorize any of them/);
});
