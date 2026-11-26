import assert from "node:assert/strict";
import { test } from "node:test";
import { buildIntakeQuotePreview, intakeQuotePreviewSchema } from "@/lib/pricing/intakeQuotePreview";
import {
  fiftyFiftySplit, indicativeQuoteFromNotes, indicativeQuoteFromPreview, previewInputFromIntake,
} from "@/lib/pricing/intakeIndicativeQuote";

test("the odd-cent balance reconciles exactly to the estimate", () => {
  assert.deepEqual(fiftyFiftySplit(13.75), { total: 13.75, retainer: 6.88, balance: 6.87 });
});

test("submitted affidavit facts use the same engine and ignore client totals", () => {
  const inputs = {
    text: "Affidavit for Italy",
    structured: {
      documentType: "Affidavit", destinationCountry: "Italy", originState: "Florida",
      signerLocation: "Florida", documentCount: 1, signerCount: 1,
      notarization: true, apostille: true, translation: false, mobile: false,
    },
    selectedLane: "priority", timeline: "standard", delivery: "international_courier",
  };
  const server = intakeQuotePreviewSchema.parse(previewInputFromIntake({
    document_description: inputs.text, document_type: "Affidavit", destination_country: "Italy",
    state: "Florida", signer_location: "Florida", docs: 1, signers: 1, notarization_required: true,
    apostille: true, translation: false, mobile: false, tier: "priority",
    timeline_preference: "standard", delivery_method: "international_courier", client_quoted_total: 1,
  }));
  const preview = buildIntakeQuotePreview(server);
  assert.deepEqual(preview, buildIntakeQuotePreview(intakeQuotePreviewSchema.parse(inputs)));
  const estimate = indicativeQuoteFromPreview(preview, "2026-11-26T12:00:00.000Z");
  assert.ok(estimate && estimate.total > 1);
  assert.equal(estimate.total, estimate.retainer_estimate + estimate.final_balance_estimate);
  assert.deepEqual(indicativeQuoteFromNotes(JSON.stringify({
    quote_state: "review_required", indicative_quote: estimate, operator_notes: "private",
  })), estimate);
  assert.equal(indicativeQuoteFromNotes(JSON.stringify({
    quote_state: "issued", indicative_quote: estimate,
  })), null);
  assert.equal(indicativeQuoteFromNotes(JSON.stringify({
    quote_state: "review_required", indicative_quote: { ...estimate, retainer_estimate: 1 },
  })), null);
});

test("an unanswered destination stays absent and review-only previews carry no amount", () => {
  const input = intakeQuotePreviewSchema.parse(previewInputFromIntake({ destination_country: "", country: "United States" }));
  assert.equal(input.structured.destinationCountry, undefined);
  assert.equal(indicativeQuoteFromPreview({
    mode: "quote_after_review", summary: "", lineItems: [], amount: 100,
    paymentGateRequired: true, schedulingLockedUntilPayment: true,
  }, "2026-11-26T12:00:00.000Z"), null);
});

test("wizard preview facts preserve completed notarization and unresolved selections", () => {
  const structured = { destinationCountry: "Italy", notarization: "already_completed" };
  const ai = { documentType: "Affidavit" };
  const input = intakeQuotePreviewSchema.parse(previewInputFromIntake({
    document_description: "Affidavit for Italy",
    tier: "priority",
    notarization_required: false,
    translation: false,
    pricing_preview_facts: { structured, ai },
  }));
  assert.deepEqual(input.structured, structured);
  assert.deepEqual(input.ai, ai);
});
