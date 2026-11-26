import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

// Tiffany's original report: "The link to check Wise settlement now is dead."
// The button exists (validate-tiffany-post-test-final-audit); these lock the
// remaining failure modes found in the 2026-11-26 audit.
const page = fs.readFileSync("app/portal/invoice/page.tsx", "utf8").replace(/\s+/g, " ");

test("a network failure during the settlement check never leaves 'Checking…' on screen", () => {
  const fn = page.slice(page.indexOf("async function checkWiseSettlement()"), page.indexOf("if (isLoading || loadingInvoice)"));
  assert.match(fn, /setSettlementCheckBusy\(true\)/);
  assert.match(fn, /\} catch \{ .*setPaymentMessage\("Settlement could not be checked right now\./);
  assert.match(fn, /\} finally \{ setSettlementCheckBusy\(false\); \}/);
  assert.match(page, /disabled=\{settlementCheckBusy\}/, "duplicate requests are blocked while checking");
});

test("an invoice-load failure is shown on its own, not inside the discount panel", () => {
  const load = page.slice(page.indexOf("const loadInvoice = async"), page.indexOf("const loadPaymentFlow = async"));
  assert.match(load, /setInvoiceError\(/);
  assert.doesNotMatch(load, /setDiscountError\(/);
  assert.match(page, /Your invoice could not be loaded/);
});

test("a verified payment is not described as release authority under the 50/50 model", () => {
  assert.doesNotMatch(page, /release controls may proceed/);
  assert.match(page, /international release requires the verified final balance and release clearance/);
  assert.match(page, /Check Wise settlement now/);
});
