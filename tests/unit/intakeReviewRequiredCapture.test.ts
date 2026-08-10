import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  normalizeExecutionTruth,
  validateExecutionTruth,
} from "@/lib/matter/executionTruth";

// Locks the fix for the operator-intake regression: a Matter with unresolved
// execution facts must be CAPTURED (saved as intake_received / unpaid), not
// rejected with HTTP 409. Matter capture is separated from transaction
// authorization — no invoice or Wise request is created until execution review
// is cleared, and the Matter can never become scheduled/executed unpaid.

const root = process.cwd();
const intake = fs.readFileSync(
  path.join(root, "app/api/intake/route.ts"),
  "utf8",
);
const dashboard = fs.readFileSync(
  path.join(root, "app/dashboard/intake/page.tsx"),
  "utf8",
);

test("unresolved notarial act is review-required (screenshot case)", () => {
  const truth = normalizeExecutionTruth({
    notarization_requirement: "required",
    execution_method: "in_person",
    notarial_act: "review_required",
    authentication_requirement: "apostille",
    execution_location: "Miami, FL",
    assigned_notary: "Jane Notary",
  });
  const v = validateExecutionTruth(truth);
  assert.equal(v.reviewRequired, true);
  assert.ok(v.errors.includes("NOTARIAL_ACT_REVIEW_REQUIRED"));
});

test("intake no longer rejects review-required operator matters with 409", () => {
  assert.doesNotMatch(
    intake,
    /safeFailure\(\s*["']EXECUTION_REVIEW_REQUIRED["'][\s\S]*?409/,
  );
});

test("review-required operator matter is SAVED as intake_received / unpaid", () => {
  const branch = intake.slice(
    intake.indexOf("if (executionReviewRequired) {"),
    intake.indexOf('stage = "EXECUTION_VALIDATED";'),
  );
  assert.ok(branch.length > 0, "review branch present");
  assert.match(branch, /\.from\("deals"\)[\s\S]*\.insert\(\[reviewPayload\]\)/);
  assert.match(branch, /status: "intake_received"/);
  assert.match(branch, /payment_status: "unpaid"/);
  assert.match(branch, /payment_confirmed: false/);
  assert.match(branch, /quote_state: "review_required"/);
});

test("review-required save creates NO invoice and NO Wise payment request", () => {
  const reviewReturn = intake.indexOf('quote_state: "review_required"');
  const invoicePos = intake.indexOf("generateInvoice(effectiveTotal)");
  const wisePos = intake.indexOf("createWisePaymentRequest({");
  assert.ok(reviewReturn > -1);
  assert.ok(
    invoicePos > reviewReturn,
    "invoice is created only on the resolved path",
  );
  assert.ok(
    wisePos > reviewReturn,
    "Wise request is created only on the resolved path",
  );
  // The review payload carries no money / payment-authorization fields.
  const payload = intake.slice(
    intake.indexOf("const reviewPayload = {"),
    intake.indexOf("const { data: reviewDeal"),
  );
  assert.doesNotMatch(payload, /amount_due:/);
  assert.doesNotMatch(payload, /invoice_retainer:/);
  assert.doesNotMatch(payload, /payment_link/);
});

test("dashboard renders review-required success without dereferencing pricing", () => {
  assert.match(dashboard, /reviewRequired/);
  assert.match(dashboard, /success\.pricing \?/);
  assert.match(dashboard, /quote_state === "review_required"/);
});
