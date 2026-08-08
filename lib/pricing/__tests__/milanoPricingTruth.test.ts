import { test } from "node:test";
import assert from "node:assert/strict";
import { priceSmartIntake } from "../milanoPricingTruth";
import { classifyIntake } from "../../intake/smartClassification";

// Helper: classify text/structured, then price with an optional explicit lane.
function price(text: string, structured: Parameters<typeof classifyIntake>[0]["structured"] = {}, selectedLane?: "signature" | "priority" | "executive", commercialContext?: "consumer" | "government") {
  const classification = classifyIntake({ text, structured });
  return priceSmartIntake({ classification, selectedLane, commercialContext });
}

// ── Locked consumer canon math ──────────────────────────────────────────────

test("Matter B: Signature + 1 additional signer = $900", () => {
  const r = price("notarize this document for 2 signers", { signerCount: 2, destinationCountry: "United States" }, "signature");
  assert.equal(r.total, 900); // 750 + 150
  assert.equal(r.additionalSignerCount, 1);
});

test("Matter C: Priority + apostille = $1,225", () => {
  const r = price("notarize and apostille for Italy", { apostille: true, destinationCountry: "Italy" }, "priority");
  assert.equal(r.total, 1225); // 975 + 250
});

test("Matter D: Priority + apostille + rush = $1,625", () => {
  const r = price("notarize, apostille, same day for Italy", { apostille: true, destinationCountry: "Italy" }, "priority");
  assert.equal(r.authorizedAddOns.rush, 400);
  assert.equal(r.total, 1625); // 975 + 250 + 400
});

test("Matter E: Executive + apostille + 2 signers = $2,250", () => {
  const r = price("notarize and apostille for Italy, 2 signers", { apostille: true, destinationCountry: "Italy", signerCount: 2 }, "executive");
  assert.equal(r.total, 2250); // 1850 + 250 + 150
});

test("additional signer math: 3 signers => 2 additional => $300", () => {
  const r = price("notarize for 3 signers", { signerCount: 3 }, "signature");
  assert.equal(r.additionalSignerCount, 2);
  assert.equal(r.authorizedAddOns.additionalSigners, 300);
});

// ── Refuse to invent — apostille-only, mobile, government ────────────────────

test("Matter F: mobile unknown scope => quote after review, no invented fee", () => {
  const r = price("I need a mobile notary", {}, "signature");
  assert.equal(r.manualReviewRequired, true);
  assert.equal(r.total, null);
  assert.ok(r.manualReviewReasons.includes("mobile_deployment_quote_by_scope"));
  assert.equal(r.clientDisplay.mode, "quote_after_review");
});

test("Matter H: apostille-only (Colorado BC → Italy) => review, NOT $250 or $750+250", () => {
  const r = price("Colorado birth certificate going to Italy, apostille only", { apostille: true, destinationCountry: "Italy" });
  assert.equal(r.suggestedLane, "apostille_only");
  assert.equal(r.total, null);
  assert.ok(r.manualReviewReasons.includes("apostille_only_base_not_canonically_locked"));
});

test("Matter G: already notarized + apostille => no new notarization; apostille-only review", () => {
  const r = price("already notarized affidavit, only need the apostille for Italy", { apostille: true, destinationCountry: "Italy" });
  // notarization already_completed → not an execution lane; apostille-only path.
  assert.equal(r.suggestedLane, "apostille_only");
  assert.equal(r.manualReviewRequired, true);
});

test("Matter J: government context => government_quote, never consumer lane", () => {
  const r = price("notarize and apostille for Italy", { apostille: true, destinationCountry: "Italy" }, "priority", "government");
  assert.equal(r.suggestedLane, "government_quote");
  assert.equal(r.laneBase, null);
  assert.equal(r.total, null);
});

// ── No-fabrication invariants ───────────────────────────────────────────────

test("no-fabrication: foreign destination alone never adds apostille or a price", () => {
  const r = price("birth certificate for Italy", { destinationCountry: "Italy" });
  assert.notEqual(r.authorizedAddOns.apostille, 250); // apostille not auto-added
});

test("no-fabrication: apostille never adds notarization; execution lane not forced", () => {
  const r = price("2 apostilles for Italy, no notarization", { apostille: true, destinationCountry: "Italy" });
  assert.equal(r.suggestedLane, "apostille_only");
});

test("apostille quantity preserved, not multiplied into the +$250 add-on", () => {
  const r = price("notarize and 3 apostilles for Italy", { apostille: true, destinationCountry: "Italy" }, "signature");
  assert.equal(r.apostilleQuantity, 3);
  assert.equal(r.authorizedAddOns.apostille, 250); // flat, not 750
});

test("rush not applied from vague urgency (deadline exists but no same-day/rush word)", () => {
  const r = price("notarize for Italy by next month", { apostille: true, destinationCountry: "Italy" }, "priority");
  assert.equal(r.authorizedAddOns.rush, undefined);
});

test("payment gate + scheduling lock always asserted", () => {
  const r = price("notarize for 1 signer", { signerCount: 1 }, "signature");
  assert.equal(r.paymentGateRequired, true);
  assert.equal(r.schedulingLockedUntilPayment, true);
});
