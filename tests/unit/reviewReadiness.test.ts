import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DOCUMENT_TITLE_REQUIRED,
  documentIdentityLabel,
  isQuoteReady,
  outstandingRequirements,
  serviceStateLabel,
} from "@/lib/intake/reviewReadiness";
import type { SmartIntakeClassification } from "@/lib/intake/smartClassification";

function classification(overrides: Partial<SmartIntakeClassification> = {}): SmartIntakeClassification {
  return {
    documentType: "Power of Attorney",
    documentCount: 2,
    originJurisdiction: "Florida",
    destinationCountry: "Colombia",
    signerCount: 1,
    notarization: "not_required",
    ron: "not_required",
    apostille: "required",
    apostilleQuantity: 2,
    authentication: "unknown",
    translation: "not_required",
    witness: "unknown",
    mobile: "unknown",
    courier: "unknown",
    shipping: "unknown",
    urgency: "normal",
    explicitNegatives: [],
    contradictions: [],
    missingCriticalFacts: [],
    manualReviewReasons: [],
    classificationConfidence: "high",
    routingConfidence: "high",
    ...overrides,
  } as SmartIntakeClassification;
}

test("documentIdentityLabel returns the real title when known", () => {
  assert.equal(documentIdentityLabel("Florida Birth Certificate"), "Florida Birth Certificate");
});

test("documentIdentityLabel never invents a generic category", () => {
  for (const generic of ["", "  ", "Other", "other", "Document", "documents", "Unspecified", "N/A"]) {
    assert.equal(documentIdentityLabel(generic), DOCUMENT_TITLE_REQUIRED);
  }
});

test("serviceStateLabel renders explicit negatives as a resolved instruction", () => {
  assert.equal(serviceStateLabel("not_required", "Notarization"), "Not required — based on your instruction");
});

test("serviceStateLabel renders required/completed/unknown correctly", () => {
  assert.equal(serviceStateLabel("required", "Apostille Coordination"), "Apostille Coordination");
  assert.equal(serviceStateLabel("already_completed", "Notarization"), "Already completed");
  assert.equal(serviceStateLabel("unknown", "Notarization"), "Will be confirmed from document review");
});

test("unknown notarization does not trap an apostille client in manual checkout edits", () => {
  const out = outstandingRequirements({
    classification: classification({ notarization: "unknown", ron: "unknown", mobile: "unknown" }),
    timeline: "standard",
    delivery: "international_courier",
    pricingApproved: false,
  });
  assert.ok(!out.includes("Notarization requirement"));
  assert.deepEqual(out, []);
});

test("required notarization still requires an execution method", () => {
  const out = outstandingRequirements({
    classification: classification({ notarization: "required", ron: "unknown", mobile: "unknown" }),
    timeline: "standard",
    delivery: "digital",
    pricingApproved: true,
  });
  assert.ok(out.includes("Execution method (remote or in-person)"));
});

test("outstandingRequirements is empty when every quote-critical fact is resolved", () => {
  assert.deepEqual(
    outstandingRequirements({
      classification: classification(),
      timeline: "standard",
      delivery: "international_courier",
      pricingApproved: true,
    }),
    [],
  );
});

test("outstandingRequirements flags a generic document identity", () => {
  const out = outstandingRequirements({
    classification: classification({ documentType: "Other" }),
    timeline: "standard",
    delivery: "digital",
    pricingApproved: true,
  });
  assert.ok(out.includes("Exact document title for each document"));
});

test("outstandingRequirements requires issuing authority only when apostille/authentication required", () => {
  const withApostille = outstandingRequirements({
    classification: classification({ originJurisdiction: undefined }),
    timeline: "standard",
    delivery: "digital",
    pricingApproved: true,
  });
  assert.ok(withApostille.includes("Issuing state / authority"));

  const noApostille = outstandingRequirements({
    classification: classification({ originJurisdiction: undefined, apostille: "not_required", authentication: "not_required" }),
    timeline: "standard",
    delivery: "digital",
    pricingApproved: true,
  });
  assert.ok(!noApostille.includes("Issuing state / authority"));
});

test("outstandingRequirements requires explicit timeline and delivery", () => {
  const out = outstandingRequirements({
    classification: classification(),
    timeline: "",
    delivery: "",
    pricingApproved: true,
  });
  assert.ok(out.includes("Preferred execution timeline"));
  assert.ok(out.includes("Delivery method"));
});

test("outstandingRequirements ignores pricing approval so review-only matters stay submittable", () => {
  const out = outstandingRequirements({
    classification: classification({ apostille: "not_required", authentication: "not_required", originJurisdiction: undefined }),
    timeline: "standard",
    delivery: "digital",
    pricingApproved: false,
  });
  assert.deepEqual(out, []);
});

test("isQuoteReady requires approved pricing AND nothing outstanding", () => {
  const ready = { classification: classification(), timeline: "standard" as const, delivery: "digital" as const, pricingApproved: true };
  assert.equal(isQuoteReady(ready), true);
  assert.equal(isQuoteReady({ ...ready, pricingApproved: false }), false);
  assert.equal(isQuoteReady({ ...ready, timeline: "" }), false);
});
