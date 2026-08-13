import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dealRoute = fs.readFileSync(path.join(root, "app/api/deals/[id]/route.ts"), "utf8");
const scheduleRoute = fs.readFileSync(path.join(root, "app/api/deals/[id]/schedule/route.ts"), "utf8");
const confirmPaymentRoute = fs.readFileSync(path.join(root, "app/api/admin/matters/[id]/confirm-payment/route.ts"), "utf8");
const adminMoveRoute = fs.readFileSync(path.join(root, "app/api/admin/move/route.ts"), "utf8");
const intakeRoute = fs.readFileSync(path.join(root, "app/api/intake/route.ts"), "utf8");
const intakeCore = fs.readFileSync(path.join(root, "app/api/intake/core.ts"), "utf8");
const intake = `${intakeRoute}\n${intakeCore}`;
const dealPage = fs.readFileSync(path.join(root, "app/dashboard/deals/[id]/page.tsx"), "utf8");
const securePaymentCard = fs.readFileSync(path.join(root, "components/payments/SecurePaymentCard.tsx"), "utf8");
const pipelineEngine = fs.readFileSync(path.join(root, "lib/pipelineEngine.ts"), "utf8");
const orphanedPaymentActions = path.join(root, "components/dashboard/deal-detail-actions.tsx");

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
  const paymentGateEvaluation = scheduleRoute.indexOf("const schedulingGate = evaluateSchedulingGate({ matter: deal });");
  assert.ok(executionValidation > -1);
  assert.ok(executionBlock > executionValidation);
  assert.ok(paymentGateEvaluation > executionBlock);
});

test("legacy admin move pipeline cannot bypass execution or canonical scheduling gate", () => {
  assert.match(pipelineEngine, /validateExecutionTruth/);
  assert.match(pipelineEngine, /evaluateSchedulingGate/);
  assert.match(pipelineEngine, /EXECUTION_REVIEW_REQUIRED/);
  assert.doesNotMatch(pipelineEngine, /gatedStages\.includes\(stage\) && deal\.payment_status !== "paid"/);
  const executionCheck = pipelineEngine.indexOf("validateExecutionTruth");
  const paymentCheck = pipelineEngine.indexOf("evaluateSchedulingGate({ matter: deal })");
  assert.ok(executionCheck > -1);
  assert.ok(paymentCheck > executionCheck);
});

test("admin move route requires authenticated governed operator authority", () => {
  const authCheck = adminMoveRoute.indexOf("ssr.auth.getUser()");
  const roleCheck = adminMoveRoute.indexOf("resolveServerRole(user)");
  const mutation = adminMoveRoute.indexOf("moveDeal(deal_id, stage)");
  assert.ok(authCheck > -1);
  assert.ok(roleCheck > authCheck);
  assert.ok(mutation > roleCheck);
  assert.match(adminMoveRoute, /UNAUTHENTICATED/);
  assert.match(adminMoveRoute, /FORBIDDEN/);
});

test("founder manual payment-confirm endpoint is disabled", () => {
  assert.match(confirmPaymentRoute, /MANUAL_PAYMENT_CONFIRMATION_DISABLED/);
  assert.match(confirmPaymentRoute, /wise_reconciliation_authoritative/);
  assert.doesNotMatch(confirmPaymentRoute, /payment_confirmed:\s*true/);
  assert.doesNotMatch(confirmPaymentRoute, /payment_status:\s*"confirmed"/);
});

test("orphaned manual payment action surface is deleted", () => {
  assert.equal(fs.existsSync(orphanedPaymentActions), false);
});

test("review-required mobile capture preserves mileage", () => {
  const reviewStart = intake.indexOf("const reviewPayload = {");
  const reviewEnd = intake.indexOf("const { data: reviewDeal");
  const reviewPayload = intake.slice(reviewStart, reviewEnd);
  assert.match(reviewPayload, /mobile:\s*legacyExecution\.mobile/);
  assert.match(reviewPayload, /miles:[\s\S]*executionTruth\.execution_method === "mobile"[\s\S]*Number\(data\.miles \?\? raw\.miles \?\? 0\)/);
});

test("operator detail delegates Wise-only payment UX to SecurePaymentCard", () => {
  assert.doesNotMatch(dealPage, /Confirm Payment/);
  assert.doesNotMatch(dealPage, /Mark paid/);
  assert.doesNotMatch(dealPage, /Confirm Balance Payment/);
  assert.doesNotMatch(dealPage, /Mark balance paid/);
  assert.doesNotMatch(dealPage, /payment_status:\s*"paid"/);
  assert.doesNotMatch(dealPage, /balance_payment_status:\s*"paid"/);
  assert.match(dealPage, /SecurePaymentCard/);
  assert.match(dealPage, /deal\.payment_link/);
  assert.match(dealPage, /deal\.balance_payment_link/);
  assert.match(securePaymentCard, /Powered by Wise Business/);
  assert.match(securePaymentCard, /Wise verified only/);
  assert.match(securePaymentCard, /Scheduling unlocks automatically after verified payment/);
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
