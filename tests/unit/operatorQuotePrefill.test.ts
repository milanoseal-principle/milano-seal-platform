import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  provenanceForCurrentValues,
  resolveOperatorPrefill,
  sanitizeRouteEvidence,
  type ClientExecutionRequest,
} from "@/lib/pricing/operatorQuotePrefill";
import { clientExecutionRequestFromNotes } from "@/lib/intake/requestedVsConfirmed";
import { composeGovernedQuote } from "@/lib/pricing/governedQuotePreview";
import { DOCUMENT_ORIGIN_ROUTING_MATRIX } from "@/lib/international-execution/operationalGovernance";

// Deterministic fixture mirroring the recorded facts of QA Matter MS-2026-8329
// (Client B): Affidavit → United States, requested domestic in-person notary,
// public intake (provisional execution truth), pricing pending review, unpaid.
// No origin state, issuing authority, notarial act or execution location was
// recorded, so none may be invented. The real Matter is never touched.
const CATEGORIES = DOCUMENT_ORIGIN_ROUTING_MATRIX.map((rule) => rule.category);
const provisionalTruth = {
  execution_method: "review_required",
  notarization_requirement: "review_required",
  notarial_act: "review_required",
  authentication_requirement: "review_required",
};
const clientB: ClientExecutionRequest = {
  executionPreference: "in_person",
  notarizationPreference: "required",
  authenticationPreference: "review_required",
  requestedNotarialAct: "review_required",
  mobileFlag: false,
};

test("Client B: intake requests are hints, never confirmed values; unrecorded facts stay missing", () => {
  const p = resolveOperatorPrefill({ executionTruth: provisionalTruth, routeEvidence: null, matterPricingType: null, quoteApproved: false, clientRequest: clientB });
  // 11/13: domestic in-person intent is shown as the client's request, and is not
  // displayed as "no new execution" or as a confirmed method.
  assert.equal(p.executionMethod, "review_required");
  assert.equal(p.provenance.execution_method.status, "from_intake");
  assert.match(p.provenance.execution_method.detail, /in person/);
  assert.equal(p.notarizationRequirement, "review_required");
  assert.equal(p.provenance.notarization_requirement.status, "from_intake");
  // 12: authentication stays review required until an operator confirms it.
  assert.equal(p.authenticationRequirement, null);
  assert.equal(p.provenance.authentication_requirement.status, "missing");
  assert.equal(p.notarialAct, "review_required");
  assert.equal(p.provenance.notarial_act.status, "missing");
  // 9/10: no recorded evidence → category auto-classified (suggested), authority missing.
  assert.equal(p.documentCategory, null);
  assert.equal(p.provenance.document_category.status, "suggested");
  assert.equal(p.issuingAuthority, null);
  assert.equal(p.provenance.issuing_authority.status, "missing");
  // Phase 4: no stored Matter base → the existing engine derives it; never defaulted to authentication.
  assert.equal(p.matterBase, "");
});

test("the legacy mobile flag is a hint, not a confirmed in-person execution", () => {
  const p = resolveOperatorPrefill({ executionTruth: provisionalTruth, routeEvidence: null, matterPricingType: null, quoteApproved: false, clientRequest: { executionPreference: null, notarizationPreference: null, authenticationPreference: null, requestedNotarialAct: null, mobileFlag: true } });
  assert.equal(p.executionMethod, "review_required");
  assert.equal(p.provenance.execution_method.status, "from_intake");
});

test("recorded execution truth wins over intake; a disagreement is flagged as a conflict", () => {
  const truth = { execution_method: "ron", notarization_requirement: "required", notarial_act: "jurat", authentication_requirement: "not_required" };
  const p = resolveOperatorPrefill({ executionTruth: truth, routeEvidence: null, matterPricingType: null, quoteApproved: false, clientRequest: clientB });
  assert.equal(p.executionMethod, "ron", "5/19: confirmed decision is never replaced by the client request");
  assert.equal(p.provenance.execution_method.status, "conflict");
  assert.equal(p.notarizationRequirement, "required");
  assert.equal(p.provenance.notarization_requirement.status, "confirmed");
  assert.equal(p.notarialAct, "jurat");
  assert.equal(p.authenticationRequirement, "not_required");
  assert.equal(p.provenance.authentication_requirement.status, "confirmed");
  const already = resolveOperatorPrefill({ executionTruth: { ...truth, execution_method: "already_notarized" }, routeEvidence: null, matterPricingType: null, quoteApproved: false, clientRequest: null });
  assert.equal(already.executionMethod, "already_notarized", "already-notarized truth round-trips instead of collapsing to review");
});

test("recorded operator route evidence prefills category, authority, agency and receiving authority", () => {
  const row = {
    event_type: "canonical_quote_approved",
    occurred_at: "2026-11-15T20:00:00Z",
    new_value: { route_intelligence: { document_category: "notarized_affidavit", document_category_source: "operator", issuing_authority: "private", federal_agency: null, receiving_authority: "County clerk" } },
  };
  const evidence = sanitizeRouteEvidence(row, CATEGORIES);
  assert.ok(evidence);
  const p = resolveOperatorPrefill({ executionTruth: provisionalTruth, routeEvidence: evidence, matterPricingType: "signature", quoteApproved: true, clientRequest: null });
  assert.equal(p.documentCategory, "notarized_affidavit", "7: stored category does not disappear");
  assert.equal(p.provenance.document_category.status, "confirmed");
  assert.equal(p.issuingAuthority, "private", "8: authority does not revert to unknown");
  assert.equal(p.receivingAuthority, "County clerk");
  assert.equal(p.matterBase, "signature");
  assert.equal(p.provenance.matter_base.status, "confirmed");

  const held = sanitizeRouteEvidence({ ...row, event_type: "quote_route_review_required" }, CATEGORIES);
  const q = resolveOperatorPrefill({ executionTruth: provisionalTruth, routeEvidence: held, matterPricingType: "signature", quoteApproved: false, clientRequest: null });
  assert.equal(q.provenance.issuing_authority.status, "suggested", "a review-held attempt is never shown as confirmed");
  assert.equal(q.provenance.matter_base.status, "suggested");
});

test("route evidence is sanitized: heuristic categories, unknown authorities and invalid values are dropped", () => {
  const evidence = sanitizeRouteEvidence({
    event_type: "quote_route_review_required",
    new_value: { route_intelligence: { document_category: "notarized_affidavit", document_category_source: "heuristic", issuing_authority: "unknown", federal_agency: "", receiving_authority: "  " } },
  }, CATEGORIES);
  assert.deepEqual(
    { c: evidence?.documentCategory, a: evidence?.issuingAuthority, g: evidence?.issuingAgency, r: evidence?.receivingAuthority },
    { c: null, a: null, g: null, r: null },
  );
  assert.equal(sanitizeRouteEvidence({ new_value: { route_intelligence: { document_category: "made_up", document_category_source: "operator" } } }, CATEGORIES)?.documentCategory, null);
  assert.equal(sanitizeRouteEvidence(null, CATEGORIES), null);
  assert.equal(sanitizeRouteEvidence({ new_value: { subtotal: 1 } }, CATEGORIES), null);
});

test("client execution request is read from persisted intake metadata only", () => {
  const notes = `Intake\n[intake_metadata:${JSON.stringify({ customer_execution_request: { execution_preference: "in_person", notarization_preference: "required", authentication_preference: "review_required", requested_notarial_act: "<script>" } })}]`;
  assert.deepEqual(clientExecutionRequestFromNotes(notes), {
    executionPreference: "in_person",
    notarizationPreference: "required",
    authenticationPreference: "review_required",
    requestedNotarialAct: null,
  });
  assert.equal(clientExecutionRequestFromNotes("no metadata"), null);
  assert.equal(clientExecutionRequestFromNotes("[intake_metadata:{broken]"), null);
});

test("unresolved execution facts still block issuance in the unchanged governed composer", () => {
  // 14/15/16: the prefill sends no matter_base when derived; the composer still withholds a total.
  const { preview } = composeGovernedQuote({
    execution_method: "review_required", notarization_requirement: "required", notarial_act: "review_required",
    authentication_requirement: "review_required", destination_country: "United States", document_type: "Affidavit",
    document_count: 1, signer_count: 1,
  });
  assert.equal(preview.review_required, true);
  assert.equal(preview.total, null);
  assert.equal(preview.deposit_amount, null);
});

test("builder, page and read route wiring: keyed per Matter, edits preserved, server-scoped evidence", () => {
  const builder = fs.readFileSync("components/dashboard/OperatorQuoteBuilder.tsx", "utf8");
  const page = fs.readFileSync("app/dashboard/deals/[id]/page.tsx", "utf8");
  const route = fs.readFileSync("app/api/deals/[id]/quote/route.ts", "utf8");
  assert.doesNotMatch(builder, /initial\?\.matterBase \?\? "authentication"/, "no silent authentication default");
  assert.doesNotMatch(builder, /<option value="none">No new execution<\/option>/);
  assert.match(builder, /matter_base: form\.matter_base \|\| undefined/);
  // 20: prefill never overwrites an operator edit.
  assert.match(builder, /touched\.current\.add\(key\)/);
  assert.match(builder, /!touched\.current\.has\(key\)/);
  // 21/18: a new Matter remounts the builder; a late response for another Matter is ignored.
  assert.match(page, /key=\{deal\.id\}\n\s+matterId=\{deal\.id\}/);
  assert.match(builder, /if \(!active \|\| !body\) return;/);
  assert.doesNotMatch(page, /executionMethod: deal\.mobile \? "in_person"/, "mobile flag is not a confirmed method");
  // Codex P2: the legacy apostille flag never fills an unresolved authentication requirement.
  assert.match(builder, /authentication_requirement: prefill\.authenticationRequirement \?\? "review_required",/);
  assert.doesNotMatch(builder, /apostilleCount \?\? 0\) > 0 \? "apostille"/);
  // 18: operator-only, one Matter, sanitized output; quote commit and lock unchanged.
  const get = route.slice(route.indexOf("export async function GET("), route.indexOf("export async function POST("));
  assert.match(get, /const operator = await operatorIdentity\(\);\n\s+if \(!operator\) return NextResponse\.json\(\{ error: "Unauthorized" \}, \{ status: 403 \}\);/);
  assert.match(get, /\.eq\("matter_id", id\)/);
  assert.match(get, /sanitizeRouteEvidence\(/);
  assert.doesNotMatch(get, /\.update\(|\.insert\(|\.rpc\(/, "read route performs no writes");
  assert.match(route, /approve_reviewed_matter_quote/);
  assert.match(builder, /isQuoteMutationLocked\(/);
});

test("already-notarized / third-party execution carries its recorded supporting facts", () => {
  // Codex P2: validateExecutionTruth requires notary_jurisdiction and certificate_type for
  // already_notarized; the builder must keep the recorded values and let the operator enter them.
  const builder = fs.readFileSync("components/dashboard/OperatorQuoteBuilder.tsx", "utf8");
  for (const key of ["notary_jurisdiction", "certificate_type", "assigned_notary"]) {
    assert.match(builder, new RegExp(`${key}: typeof truth\\?\\.${key} === "string" \\? truth\\.${key} : ""`));
    assert.match(builder, new RegExp(`${key}: form\\.${key} \\|\\| undefined`));
  }
  assert.match(builder, /<Field label="Notary jurisdiction">/);
  assert.match(builder, /<Field label="Certificate type">/);
  const recorded = { execution_method: "already_notarized", notarization_requirement: "not_required", notarial_act: "review_required", authentication_requirement: "apostille", notary_jurisdiction: "Florida", certificate_type: "acknowledgment" };
  const { executionReviewReasons } = composeGovernedQuote({ ...recorded, destination_country: "Italy", document_type: "Affidavit", document_count: 1, signer_count: 1 });
  assert.ok(!executionReviewReasons.includes("NOTARY_JURISDICTION_REQUIRED"));
  assert.ok(!executionReviewReasons.includes("CERTIFICATE_TYPE_REQUIRED"));
});

test("an operator edit replaces the source label with an unsaved-edit label", () => {
  // Codex P2: editing a value prefilled from an approved quote must not keep showing "Confirmed".
  const evidence = sanitizeRouteEvidence({
    event_type: "canonical_quote_approved",
    new_value: { route_intelligence: { issuing_authority: "state", document_category: "notarized_affidavit", document_category_source: "operator" } },
  }, CATEGORIES);
  const p = resolveOperatorPrefill({ executionTruth: provisionalTruth, routeEvidence: evidence, matterPricingType: null, quoteApproved: true, clientRequest: clientB });
  const prefilled = { issuing_authority: "state", execution_method: "review_required" };
  const unchanged = provenanceForCurrentValues(p.provenance, prefilled, prefilled);
  assert.equal(unchanged.issuing_authority.status, "confirmed");
  const edited = provenanceForCurrentValues(p.provenance, { issuing_authority: "federal", execution_method: "in_person" }, prefilled);
  assert.equal(edited.issuing_authority.status, "edited");
  assert.equal(edited.execution_method.status, "edited", "a resolved choice no longer shows From intake/Missing");
  assert.equal(edited.document_category.status, "confirmed", "fields without a current value keep their label");
  const builder = fs.readFileSync("components/dashboard/OperatorQuoteBuilder.tsx", "utf8");
  assert.match(builder, /provenanceForCurrentValues\(p, form, prefilled\.current\)/);
  assert.match(builder, /prefilled\.current\[key\] = value;/);
});
