import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
// @ts-ignore - the validator is intentionally dependency-free JavaScript
import { REQUIRED_CONTROLS, RUNBOOK_PATH, validateRunbook } from "../scripts/validate-tiff-15-step-production-certification.mjs";

const runbook = readFileSync(RUNBOOK_PATH, "utf8");
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const discountRoute = readFileSync("app/api/portal/me/discount/route.ts", "utf8");
const discountService = readFileSync("src/features/discounts/discountService.ts", "utf8");
const invoicePage = readFileSync("app/portal/invoice/page.tsx", "utf8");
const portalLedger = readFileSync("components/portal/PortalOrderLedger.tsx", "utf8");

test("TIFF certification validator is registered and accepts the controlling Gate 37 runbook", () => {
  assert.equal(packageJson.scripts["validate:tiff-15-step-production-certification"], "node scripts/validate-tiff-15-step-production-certification.mjs");
  assert.equal(validateRunbook(runbook), true);
  assert.ok(REQUIRED_CONTROLS.length >= 15);
});

test("TIFFTEST99 is entered on the client invoice and recalculates before Wise payment", () => {
  assert.match(runbook, /TIFFTEST99/);
  assert.match(runbook, /99% percentage discount applied to `matter_total`/);
  assert.match(runbook, /\$1,375\.00[\s\S]*\$13\.75[\s\S]*\$6\.88/);
  assert.match(invoicePage, /Discount \/ Courtesy Code/);
  assert.match(invoicePage, /\/api\/portal\/me\/discount/);
  assert.match(portalLedger, /Matter Order Ledger/);
});

test("discount mutation is fail-closed after Wise payment starts and never grants paid status", () => {
  assert.match(discountRoute, /applyDiscountToMatter/);
  assert.match(discountService, /assertNoPaymentInMotion/);
  assert.match(discountService, /Discount cannot change while a Wise payment is pending or confirmed/);
  assert.match(discountService, /Discount cannot be applied after payment has started/);
  assert.match(discountService, /payment_status:\s*"unpaid"/);
  assert.match(discountService, /payment_confirmed:\s*false/);
  assert.doesNotMatch(discountRoute, /payment_confirmed:\s*true/);
  assert.doesNotMatch(discountRoute, /payment_status:\s*["']paid["']/);
  assert.doesNotMatch(discountService, /payment_confirmed:\s*true/);
  assert.doesNotMatch(discountService, /payment_status:\s*["']paid["']/);
  assert.match(discountService, /buildPaymentLink/);
  assert.match(discountService, /redeemDiscountAfterWiseReconciliation/);
});

test("certification locks one Matter, payment gate, password recovery, and governed closeout", () => {
  for (const rule of [
    "MS-2026-4887",
    "scheduling remains blocked",
    "verified Wise settlement",
    "Forgot Password",
    "no duplicate Matter",
    "Execution / RON",
    "Apostille",
    "Release / Courier",
    "Delivery",
    "Complete",
  ]) {
    assert.ok(runbook.includes(rule), `missing regression lock: ${rule}`);
  }
});
