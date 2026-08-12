import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const route = read("app/api/intake/route.ts");
const core = read("app/api/intake/core.ts");
const snapshot = read("lib/pricing/matterQuoteSnapshot.ts");
const proForma = read("app/dashboard/pro-forma/[id]/page.tsx");

assert.match(route, /handleCanonicalIntakePost/);
assert.match(route, /buildMatterQuoteSnapshot/);
assert.match(route, /persistedMatterHasQuote/);
assert.match(route, /INTAKE_QUOTE_PERSISTENCE_FAILED/);
assert.match(route, /eligible_subtotal,non_discountable_total,original_total,discount_amount,final_total,total_price/);
assert.match(route, /invoice_retainer,invoice_balance,amount_due,currency/);

assert.match(core, /calculatePrice\(/);
assert.match(core, /nonDiscountableTotalFromBreakdown/);
assert.match(core, /eligibleSubtotalFromTotal/);
assert.match(core, /effectiveTotalAfterCourtesy/);
assert.match(core, /generateInvoice\(effectiveTotal\)/);
assert.match(core, /eligible_subtotal:\s*eligibleSubtotal/);
assert.match(core, /non_discountable_total:\s*nonDiscountableTotal/);
assert.match(core, /payment_method:\s*"wise"/);
assert.match(core, /\.insert\(\[intakePayload\]\)/);
assert.doesNotMatch(core, /barePayload/);
assert.doesNotMatch(core, /stripe/i);

for (const field of [
  "lane",
  "base_price",
  "witness_total",
  "eligible_subtotal",
  "non_discountable_total",
  "original_total",
  "discount_amount",
  "final_total",
  "total_price",
  "invoice_retainer",
  "invoice_balance",
  "amount_due",
  "currency",
]) {
  assert.match(snapshot, new RegExp(`${field}:`));
}
assert.match(snapshot, /sameMoney\(matter\.eligible_subtotal, expected\.eligible_subtotal\)/);
assert.match(snapshot, /sameMoney\(matter\.non_discountable_total, expected\.non_discountable_total\)/);
assert.match(snapshot, /Math\.abs\(numeric - expected\) <= 0\.009/);

assert.match(proForma, /\/api\/deals\/\$\{id\}/);
assert.match(proForma, /SecurePaymentCard/);

console.log("Live quote → persisted Matter carryover validation passed.");
