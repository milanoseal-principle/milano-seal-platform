import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { isPriceIssued } from "@/lib/pricing/priceIssued";

// PR #512 hid every invoice without quote_approved_at, but instant canonical pricing sets a final
// total, a Wise link and awaiting_payment with no operator approval step, so instantly priced
// clients lost their itemized invoice. An issued price is a real total with no pending review.

test("instant and approved prices are issued; missing totals and pending reviews are not", () => {
  assert.equal(isPriceIssued({ final_total: 350, quote_review_required: false }), true, "instant canonical price");
  assert.equal(isPriceIssued({ final_total: "350.00" }), true, "review flag absent (column default false)");
  assert.equal(isPriceIssued({ final_total: 0, quote_review_required: false }), true, "approved zero price is a real price");
  assert.equal(isPriceIssued({ final_total: null, quote_review_required: false }), false, "MS-2026-8869: no price");
  assert.equal(isPriceIssued({ final_total: 350, quote_review_required: true }), false, "review outstanding");
  assert.equal(isPriceIssued({ final_total: "not-a-number" }), false);
  assert.equal(isPriceIssued(null), false);
});

test("invoice API, founder alert and invoice page share the one rule", () => {
  const api = fs.readFileSync("app/api/portal/me/invoice/route.ts", "utf8");
  const cron = fs.readFileSync("app/api/cron/notification-reconcile/route.ts", "utf8");
  const page = fs.readFileSync("app/portal/invoice/page.tsx", "utf8");
  assert.match(api, /const approved = isPriceIssued\(invoiceRow\)/);
  assert.doesNotMatch(api, /Boolean\(invoiceRow\.quote_approved_at\)/, "approval timestamp alone must not gate instant pricing");
  assert.match(cron, /quoteApproved: isPriceIssued\(row\)/);
  assert.match(cron, /quote_review_required/);
  assert.match(page, /pricingStatus === "pending_review"/);
  // A superseded response (client switched Matters) must not hide the active Matter's invoice.
  assert.match(page, /if \(activeMatterId\.current !== requestedMatterId\) return;/);
  assert.match(page, /pricingPendingMatterId === deal\.id/);
  assert.match(page, /Pricing pending review/);
});
