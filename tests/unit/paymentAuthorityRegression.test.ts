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
const pipelineEngine = fs.readFileSync(
  path.join(root, "lib/pipelineEngine.ts"),
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
  const executionValidation = scheduleRoute.indexOf("validateExecutionTruth");
  const executionBlock = scheduleRoute.indexOf("EXECUTION_REVIEW_REQUIRED");
  const paymentGateEvaluation = scheduleRoute.indexOf(
    "const schedulingGate = evaluateSchedulingGate({ matter: deal });",
  );

  assert.ok(executionValidation > -1);
  assert.ok(executionBlock > executionValidation);
  assert.ok(paymentGateEvaluation > executionBlock);
});

test("legacy admin move pipeline cannot bypass execution or canonical scheduling gate", () => {
  assert.match(pipelineEngine, /validateExecutionTruth/);
  assert.match(pipelineEngine, /evaluateSchedulingGate/);
  assert.match(pipelineEngine, /EXECUTION_REVIEW_REQUIRED/);
  assert.doesNotMatch(
    pipelineEngine,
    /gatedStages\.includes\(stage\) && deal\.payment_status !== "paid"/,
  );

  const executionCheck = pipelineEngine.indexOf("validateExecutionTruth");
  const paymentCheck = pipelineEngine.indexOf("evaluateSchedulingGate({ matter: deal })");
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

test("operator detail page is Wise read-only while preserving payment links", () => {
  assert.doesNotMatch(dealPage, /Confirm Payment/);
  assert.doesNotMatch(dealPage, /Mark paid/);
  assert.doesNotMatch(dealPage, /Confirm Balance Payment/);
  assert.doesNotMatch(dealPage, /Mark balance paid/);
  assert.doesNotMatch(dealPage, /payment_status:\s*"paid"/);
  assert.doesNotMatch(dealPage, /balance_payment_status:\s*"paid"/);
  assert.match(dealPage, /Wise Payment/);
  assert.match(dealPage, /Wise reconciliation is authoritative/);
  assert.match(dealPage, /deal\.payment_link/);
  assert.match(dealPage, /deal\.balance_payment_link/);
  assert.match(dealPage, /Operators cannot manually[\s\S]*mark this Matter paid/);
});

test("Matter detail restoration preserves non-payment operator UX", () => {
  assert.match(dealPage, /Create Shipping Label/);
  assert.match(dealPage, /Client Messages/);
  assert.match(dealPage, /Operational Ledger/);
  assert.match(dealPage, /Document Release/);
  assert.match(dealPage, /MilanoReleaseSeal/);
  assert.match(dealPage, /ShippoCustodyPanel/);
  assert.match(dealPage, /CertificatePanel/);
  assert.match(dealPage, /MatterRiskBadge/);
  assert.match(dealPage, /Conversion score/);
});
