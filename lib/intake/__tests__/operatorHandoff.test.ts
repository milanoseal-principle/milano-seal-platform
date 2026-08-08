import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyIntake } from "../smartClassification";
import { priceCanonicalMatter } from "../../pricing/priceCanonicalMatter";
import { buildOperatorHandoff, clientProjection } from "../operatorHandoff";

function handoff(matterId = "MS-1") {
  const classification = classifyIntake({ text: "already notarized affidavit, apostille for Italy", structured: { destinationCountry: "Italy", apostille: true } });
  const pricing = priceCanonicalMatter({ executionTier: "Priority", destinationCountry: "Italy", apostilleStatus: "required" });
  return buildOperatorHandoff({ matterId, originalDescription: "already notarized affidavit, apostille for Italy", fileReferences: ["file:abc"], classification, pricing });
}

test("handoff pricing equals priceCanonicalMatter (no independent recompute)", () => {
  const h = handoff();
  const direct = priceCanonicalMatter({ executionTier: "Priority", destinationCountry: "Italy", apostilleStatus: "required" });
  assert.deepEqual(h.pricing, direct);
  assert.equal(h.recommendedLane, direct.suggestedLane);
});

test("explicit negatives and contradictions are retained", () => {
  const classification = classifyIntake({ text: "no apostille, notarization required" });
  const pricing = priceCanonicalMatter({ executionTier: "Signature" });
  const h = buildOperatorHandoff({ matterId: "MS-2", classification, pricing });
  assert.ok(h.explicitNegatives.some((n) => n.startsWith("apostille")));
});

test("already-completed service state is preserved (not collapsed to required)", () => {
  const h = handoff();
  assert.equal(h.serviceStates.notarization, "already_completed");
});

test("file references retained; no raw contents", () => {
  const h = handoff();
  assert.deepEqual(h.fileReferences, ["file:abc"]);
});

test("client projection excludes the operator packet + internal reasons", () => {
  const h = handoff();
  const client = clientProjection(h);
  const json = JSON.stringify(client);
  assert.ok(!/manualReviewReasons|serviceStates|classificationConfidence|audience/.test(json));
  assert.ok("clientDisplay" in client);
  assert.equal(client.paymentGateRequired, true);
});

test("handoff is operator-audience and deterministic for the same matter", () => {
  assert.equal(handoff("X").audience, "operator");
  assert.deepEqual(handoff("X"), handoff("X"));
});
