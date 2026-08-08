import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyIntake } from "../smartClassification";
import { buildIntakeClarifications } from "../intakeClarifications";

const q = (text: string, structured: Parameters<typeof classifyIntake>[0]["structured"] = {}) =>
  buildIntakeClarifications(classifyIntake({ text, structured }));

const ids = (r: ReturnType<typeof buildIntakeClarifications>) => r.questions.map((x) => x.id);

test("Colorado birth certificate → Italy: asks nothing already known; no signer location", () => {
  const r = q("Colorado birth certificate going to Italy, apostille", { originState: "Colorado", destinationCountry: "Italy", apostille: true });
  assert.ok(!ids(r).includes("destination")); // destination known
  assert.ok(!ids(r).includes("document_origin")); // origin known (Colorado)
  assert.ok(!ids(r).includes("signer_location")); // civil record, no execution
  assert.ok(r.knownFacts.some((f) => f.startsWith("destination:Italy")));
});

test("mobile notary, two signers: signer count NOT re-asked; asks location only if missing", () => {
  const r = q("mobile notary tonight for 2 signers", { signerCount: 2 });
  assert.ok(!ids(r).some((id) => /signer_count|signers/.test(id))); // count known, not asked
  assert.ok(ids(r).includes("signer_location")); // mobile execution needs location, not provided
});

test("already notarized affidavit, apostille only: does not ask notarization", () => {
  const r = q("already notarized affidavit, only need the apostille for Italy", { destinationCountry: "Italy", apostille: true });
  assert.ok(!ids(r).some((id) => /notar/.test(id)));
});

test("no apostille, notarization required: does not ask apostille", () => {
  const r = q("No apostille, notarization required", { destinationCountry: "United States" });
  assert.ok(!ids(r).includes("apostille_needed"));
});

test("foreign destination, apostille unknown: asks apostille (route/price resolution)", () => {
  const r = q("birth certificate going to Italy", { destinationCountry: "Italy" });
  assert.ok(ids(r).includes("apostille_needed"));
});

test("contradiction is the first question", () => {
  const r = q("already notarized but need notarization");
  assert.equal(r.questions[0].kind, "contradiction");
});

test("origin_state is NOT universally required (execution doc without origin need)", () => {
  const r = q("power of attorney, remote notarization", { destinationCountry: "United States" });
  assert.ok(!ids(r).includes("document_origin")); // POA is signer-driven, not origin-driven
});

test("straightforward matter stays within 0–3 questions", () => {
  const r = q("Colorado birth certificate going to Italy, apostille", { originState: "Colorado", destinationCountry: "Italy", apostille: true });
  assert.ok(r.questions.length <= 3);
});

test("ordinary matter never produces more than 3 Step-2 questions", () => {
  // Everything unknown: destination, origin-driven doc, apostille unknown → many
  // potential unknowns, but no contradiction → capped at 3.
  const r = q("birth certificate", {});
  assert.ok(r.contradictions.length === 0);
  assert.ok(r.questions.length <= 3, `expected <=3, got ${r.questions.length}`);
});
