import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dealRoute = fs.readFileSync(
  path.join(root, "app/api/deals/[id]/route.ts"),
  "utf8",
);
const scheduleRoute = fs.readFileSync(
  path.join(root, "app/api/deals/[id]/schedule/route.ts"),
  "utf8",
);
const confirmPaymentRoute = fs.readFileSync(
  path.join(root, "app/api/admin/matters/[id]/confirm-payment/route.ts"),
  "utf8",
);
const intakeRoute = fs.readFileSync(
  path.join(root, "app/api/intake/route.ts"),
  "utf8",
);
const dealPage = fs.readFileSync(
  path.join(root, "app/dashboard/deals/[id]/page.tsx"),
  "utf8",
);

test("generic deal PATCH cannot author paid settlement", () => {
  assert.match(dealRoute, /PAYMENT_CONFIRMATION_SERVER_ONLY/);
  assert.match(dealRoute, /body\.payment_status === "paid"/);
  assert.match(dealRoute, /body\.payment_confirmed === true/);
  assert.match(dealRoute, /body\.payment_amount_received !== undefined/);
  assert.match(dealRoute, /body\.payment_reference !== undefined/);
});

test("generic deal PATCH rejects Stripe and only accepts Wise", () => {
  assert.match(dealRoute, /body\.payment_method && body\.payment_method !== "wise"/);
  assert.doesNotMatch(dealRoute, /"stripe"/i);
});

test("generic deal PATCH cannot jump directly to scheduled or in_execution", () => {
  assert.match(dealRoute, /PROTECTED_STATE_TRANSITION/);
  assert.match(dealRoute, /body\.status === "scheduled"/);
  assert.match(dealRoute, /body\.status === "in_execution"/);
});

test("schedule route blocks unresolved execution truth before payment gate", () => {
  const executionCheck = scheduleRoute.indexOf("EXECUTION_REVIEW_REQUIRED");
  const paymentCheck = scheduleRoute.indexOf("evaluateSchedulingGate");
  assert.ok(executionCheck > -1);
  assert.ok(paymentCheck > executionCheck);
});

test("founder manual payment-confirm endpoint is disabled", () => {
  assert.match(confirmPaymentRoute, /MANUAL_PAYMENT_CONFIRMATION_DISABLED/);
  assert.match(confirmPaymentRoute, /wise_reconciliation_authoritative/);
  assert.doesNotMatch(confirmPaymentRoute, /payment_confirmed:\s*true/);
  assert.doesNotMatch(confirmPaymentRoute, /payment_status:\s*"confirmed"/);
});

test("review-required mobile capture preserves mileage", () => {
  const reviewStart = intakeRoute.indexOf("const reviewPayload = {");
  const reviewEnd = intakeRoute.indexOf("const { data: reviewDeal");
  const reviewPayload = intakeRoute.slice(reviewStart, reviewEnd);
  assert.match(reviewPayload, /mobile:\s*legacyExecution\.mobile/);
  assert.match(reviewPayload, /miles:[\s\S]*executionTruth\.execution_method === "mobile"[\s\S]*Number\(data\.miles \?\? raw\.miles \?\? 0\)/);
});

test("operator detail page no longer contains manual settlement controls", () => {
  assert.doesNotMatch(dealPage, /Confirm Payment/);
  assert.doesNotMatch(dealPage, /Mark paid/);
  assert.doesNotMatch(dealPage, /Confirm Balance Payment/);
  assert.doesNotMatch(dealPage, /Mark balance paid/);
  assert.doesNotMatch(dealPage, /payment_status:\s*"paid"/);
  assert.doesNotMatch(dealPage, /balance_payment_status:\s*"paid"/);
});
