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
  assert.match(page, /pendingPricing\?\.matterId === deal\.id/);
  assert.match(page, /Pricing pending review/);
});

// 2026-11-15 operator review of MS-2026-8329: the Matter header and pricing sidebar showed $0.00
// while the canonical quote said "Review required". Unpriced Matters never render as $0.00.
test("operator Matter page and the shared payment card show pending review, not $0.00, for unpriced Matters", () => {
  const page = fs.readFileSync("app/dashboard/deals/[id]/page.tsx", "utf8");
  const card = fs.readFileSync("components/payments/SecurePaymentCard.tsx", "utf8");
  assert.match(page, /const priceIssued = isPriceIssued\(deal\) \|\| isPaid \|\| isComplimentaryAuthorized;/);
  assert.match(page, /priceIssued \? formatCurrencyDetailed\(deal\.total_price\) : <span className="text-2xl">Review required<\/span>/);
  assert.match(page, /priceIssued \? formatCurrencyDetailed\(Number\(deal\.original_total \?\? deal\.total_price\)\) : "Pricing pending review"/);
  assert.match(page, /final_total: deal\.final_total \?\? null,/, "payment card must not see total_price as an issued final total");
  assert.match(page, /quote_review_required: deal\.quote_review_required \?\? null,/);
  assert.match(card, /isPriceIssued\(\{ final_total: deal\.final_total, quote_review_required: deal\.quote_review_required \}\)/);
  assert.match(card, /Pricing pending review/);
  assert.match(card, /!isSubmitted && !pricingPending && deal\.payment_link/, "no Wise link while pricing is pending");
});
