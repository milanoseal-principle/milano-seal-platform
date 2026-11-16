import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  declarationsFromLedger,
  resolveMatter,
  validateDeclarationSubmission,
  type ClientDeclarations,
  type MatterResolutionInput,
} from "@/lib/matter/matterResolution";
import { resolveOperatorPrefill } from "@/lib/pricing/operatorQuotePrefill";

// Deterministic fixture mirroring QA Matter MS-2026-8329 (Client B) as verified in
// production: Affidavit → United States, client requested in person, every execution
// fact review_required, no origin, no price, unpaid. The real Matter is never touched.
const provisionalTruth = {
  execution_method: "review_required",
  notarization_requirement: "review_required",
  notarial_act: "review_required",
  authentication_requirement: "review_required",
};
const clientB: MatterResolutionInput = {
  originState: null,
  executionTruth: provisionalTruth,
  intakeExecutionPreference: "in_person",
  intakeMobile: false,
  issuingAuthorityRecorded: false,
  quoteApproved: false,
  paymentActivity: false,
  declarations: {},
};
const at = "2026-11-16T01:00:00Z";
const answeredAll: ClientDeclarations = {
  signer_location: { value: "Miami, Florida", declaredAt: at },
  execution_location: { value: "Brickell, Miami, FL", declaredAt: at },
  document_origin: { value: "Florida", declaredAt: at },
  document_issuer: { value: "self_prepared", declaredAt: at },
  authentication_needed: { value: "none", declaredAt: at },
  receiving_instructions: { value: "Must be sworn before a notary", declaredAt: at },
};

test("Client B: asks only the facts that are missing, never the method already requested", () => {
  const r = resolveMatter(clientB);
  assert.equal(r.status, "needs_client_input");
  assert.deepEqual(r.questions.map((q) => q.fact), [
    "signer_location", "execution_location", "document_origin", "document_issuer", "authentication_needed", "receiving_instructions",
  ]);
  assert.ok(!r.questions.some((q) => q.fact === "execution_preference"), "in-person request from intake is reused");
  // Legal determinations are not offered to the client as choices.
  assert.ok(!JSON.stringify(r.questions).match(/acknowledgment|jurat/i));
});

test("answers are revalidated with the existing validator and never re-asked", () => {
  const r = resolveMatter({ ...clientB, declarations: answeredAll });
  assert.equal(r.status, "awaiting_milano_review");
  assert.equal(r.questions.length, 0);
  assert.ok(!r.provisionalBlockers.includes("EXECUTION_LOCATION_REQUIRED"), "declared location satisfies the location check provisionally");
  assert.ok(r.provisionalBlockers.length > 0, "legal determinations still need operator review");
  const partial = resolveMatter({ ...clientB, declarations: { signer_location: answeredAll.signer_location } });
  assert.ok(!partial.questions.some((q) => q.fact === "signer_location"));
});

test("recorded facts are never asked; closed once quoted or payment activity begins", () => {
  const recorded = resolveMatter({
    ...clientB,
    originState: "Florida",
    issuingAuthorityRecorded: true,
    executionTruth: { ...provisionalTruth, execution_method: "in_person", signer_location: "Miami", execution_location: "Miami", authentication_requirement: "not_required", notarial_act: "jurat", notarization_requirement: "required", review_confirmed_at: at },
  });
  assert.equal(recorded.questions.length, 0);
  assert.equal(recorded.status, "review_confirmed");
  assert.equal(resolveMatter({ ...clientB, quoteApproved: true }).status, "closed");
  assert.equal(resolveMatter({ ...clientB, paymentActivity: true }).questions.length, 0);
  const unknownMethod = resolveMatter({ ...clientB, intakeExecutionPreference: "review_required" });
  assert.ok(unknownMethod.questions.some((q) => q.fact === "execution_preference"));
  assert.ok(!unknownMethod.questions.some((q) => q.fact === "execution_location"), "location asked only once in person is known");
});

test("submissions are limited to outstanding questions and offered choices", () => {
  const { questions } = resolveMatter(clientB);
  assert.deepEqual(validateDeclarationSubmission(questions, { signer_location: "  Miami,\\n\u0007 Florida " }), {
    ok: true,
    declarations: { signer_location: "Miami,\\n Florida" },
  });
  assert.deepEqual(validateDeclarationSubmission(questions, { execution_preference: "ron" }), { ok: false, error: "QUESTION_NOT_OUTSTANDING" });
  assert.deepEqual(validateDeclarationSubmission(questions, { authentication_needed: "maybe" }), { ok: false, error: "INVALID_ANSWER" });
  assert.deepEqual(validateDeclarationSubmission(questions, { signer_location: "x" }), { ok: false, error: "INVALID_ANSWER" });
  assert.deepEqual(validateDeclarationSubmission(questions, { signer_location: "y".repeat(301) }), { ok: false, error: "INVALID_ANSWER" });
  assert.deepEqual(validateDeclarationSubmission(questions, {}), { ok: false, error: "NO_ANSWERS" });
  assert.deepEqual(validateDeclarationSubmission(questions, ["a"]), { ok: false, error: "INVALID_ANSWERS" });
});

test("latest declaration per fact wins; unknown keys are ignored", () => {
  const d = declarationsFromLedger([
    { occurred_at: "2026-11-16T02:00:00Z", new_value: { declarations: { signer_location: "Tampa, FL" } } },
    { occurred_at: "2026-11-16T01:00:00Z", new_value: { declarations: { signer_location: "Miami, FL", injected: "x" } } },
    { occurred_at: "2026-11-16T03:00:00Z", new_value: { route_intelligence: {} } },
  ]);
  assert.equal(d.signer_location?.value, "Tampa, FL");
  assert.equal(Object.keys(d).length, 1);
});

test("operator prefill: client answers are labelled From client; legal facts stay unselected", () => {
  const p = resolveOperatorPrefill({
    executionTruth: provisionalTruth, routeEvidence: null, matterPricingType: null, quoteApproved: false,
    clientRequest: { executionPreference: "in_person", notarizationPreference: null, authenticationPreference: null, requestedNotarialAct: null },
    clientDeclarations: answeredAll, originState: null,
  });
  assert.equal(p.originState, "Florida");
  assert.equal(p.provenance.origin_state.status, "from_client");
  assert.equal(p.signerLocation, "Miami, Florida");
  assert.equal(p.executionLocation, "Brickell, Miami, FL");
  assert.equal(p.authenticationRequirement, null, "a client 'no apostille' answer never selects Not required");
  assert.equal(p.provenance.authentication_requirement.status, "from_intake");
  assert.equal(p.notarialAct, "review_required");
  assert.equal(p.provenance.notarial_act.status, "from_client");
  assert.match(p.provenance.notarial_act.detail, /sworn before a notary/);
  assert.equal(p.issuingAuthority, null);
  assert.equal(p.provenance.issuing_authority.status, "from_client");
  const recorded = resolveOperatorPrefill({
    executionTruth: { ...provisionalTruth, signer_location: "Orlando, FL" }, routeEvidence: null, matterPricingType: null,
    quoteApproved: false, clientRequest: null, clientDeclarations: answeredAll, originState: "Georgia",
  });
  assert.equal(recorded.originState, null, "a recorded Matter value is never replaced by a declaration");
  assert.equal(recorded.provenance.origin_state.status, "confirmed");
  assert.equal(recorded.signerLocation, null);
});

test("portal route: owned Matter only, ledger-only write of unverified declarations, no internal codes", () => {
  const route = fs.readFileSync("app/api/portal/me/clarifications/route.ts", "utf8");
  assert.match(route, /getCurrentClientDeal\(dealId\)/);
  assert.match(route, /validateDeclarationSubmission\(current\.resolution\.questions/);
  assert.match(route, /\.from\("matter_evidence_ledger"\)\.insert\(/);
  assert.match(route, /actor_type: "client"/);
  assert.match(route, /verified: false/);
  assert.doesNotMatch(route, /\.from\("deals"\)[^;]*\.(update|insert|upsert|delete)\(/, "never writes the Matter row");
  assert.doesNotMatch(route, /\.rpc\(/);
  assert.doesNotMatch(route.slice(route.indexOf("function clientView"), route.indexOf("export async function GET")), /provisionalBlockers/);
  const builder = fs.readFileSync("components/dashboard/OperatorQuoteBuilder.tsx", "utf8");
  assert.match(builder, /if \(value && !current\[key\] && !touched\.current\.has\(key\)\)/, "declarations fill only empty, untouched fields");
  const portal = fs.readFileSync("app/portal/page.tsx", "utf8");
  assert.match(portal, /<MatterClarificationsCard \/>/);
  const card = fs.readFileSync("components/portal/MatterClarificationsCard.tsx", "utf8");
  assert.match(card, /if \(active\.current !== requested\) return;/, "a response for a previous Matter is ignored");
});
