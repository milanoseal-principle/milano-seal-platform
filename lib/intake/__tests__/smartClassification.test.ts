import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyIntake } from "../smartClassification";

test("Colorado birth certificate → Italy: apostille not auto-added, no notarization", () => {
  const c = classifyIntake({ text: "Colorado birth certificate going to Italy", structured: { originState: "Colorado", destinationCountry: "Italy" } });
  assert.equal(c.documentFamily, "birth_certificate");
  assert.equal(c.originJurisdiction, "Colorado");
  assert.equal(c.destinationCountry, "Italy");
  assert.equal(c.apostille, "unknown"); // NOT required just because foreign
  assert.equal(c.notarization, "unknown");
});

test("already-notarized affidavit → Colombia, apostille only", () => {
  const c = classifyIntake({ text: "already notarized affidavit, only need the apostille", structured: { destinationCountry: "Colombia", apostille: true } });
  assert.equal(c.notarization, "already_completed");
  assert.equal(c.apostille, "required");
  assert.equal(c.documentFamily, "affidavit");
});

test("mobile notary for two signers: mobile + notarization required, apostille unknown", () => {
  const c = classifyIntake({ text: "I need a mobile notary tonight for 2 signers", structured: { signerCount: 2, signerLocation: "Tampa" } });
  assert.equal(c.mobile, "required");
  assert.equal(c.notarization, "required");
  assert.equal(c.signerCount, 2);
  assert.equal(c.signerLocation, "Tampa");
  assert.equal(c.urgency, "same_day");
  assert.notEqual(c.apostille, "required");
});

test("origin vs signer location are distinct", () => {
  const c = classifyIntake({ structured: { originState: "Colorado", signerLocation: "Florida", destinationCountry: "Italy" } });
  assert.equal(c.originJurisdiction, "Colorado");
  assert.equal(c.signerLocation, "Florida");
});

test("precedence: explicit structured selection outranks AI", () => {
  const c = classifyIntake({ structured: { apostille: false }, ai: { apostilleRequired: true } });
  assert.equal(c.apostille, "not_required"); // client's NO wins over AI's yes
});

test("precedence: explicit client text negative outranks AI positive", () => {
  const c = classifyIntake({ text: "no apostille needed", ai: { apostilleRequired: true } });
  assert.equal(c.apostille, "not_required");
});

test("AI fills an unknown only", () => {
  const c = classifyIntake({ text: "birth certificate for Italy", ai: { apostilleRequired: true } });
  assert.equal(c.apostille, "required"); // no explicit client apostille statement → AI fills
});

test("country alias Columbia → Colombia is recorded, not silent", () => {
  const c = classifyIntake({ structured: { destinationCountry: "Columbia" } });
  assert.equal(c.destinationCountry, "Colombia");
  assert.deepEqual(c.destinationNormalization, { from: "Columbia", to: "Colombia", confidence: "medium" });
});

test("contradiction is surfaced and marks the service contradictory", () => {
  const c = classifyIntake({ text: "already notarized but need notarization" });
  assert.ok(c.contradictions.includes("notarization"));
  assert.equal(c.notarization, "contradictory");
  assert.ok(c.manualReviewReasons.includes("contradictory_service_statements"));
});

test("missing critical facts + international-apostille-unknown flags manual review", () => {
  const c = classifyIntake({ structured: { destinationCountry: "Italy" } });
  assert.ok(c.missingCriticalFacts.includes("documentType"));
  assert.ok(c.manualReviewReasons.includes("apostille_undetermined_for_international_destination"));
});

test("no fabrication: apostille never implies notarization", () => {
  const c = classifyIntake({ text: "2 apostilles for Italy", structured: { destinationCountry: "Italy", apostille: true } });
  assert.equal(c.apostille, "required");
  assert.equal(c.apostilleQuantity, 2);
  assert.notEqual(c.notarization, "required");
});
