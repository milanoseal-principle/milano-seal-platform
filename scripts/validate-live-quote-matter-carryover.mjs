import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const intake = read("app/api/intake/route.ts");
const quote = read("app/api/pricing/quote/route.ts");
const snapshot = read("lib/pricing/matterQuoteSnapshot.ts");
const detail = read("app/dashboard/deals/[id]/page.tsx");

assert.match(quote, /determineLaneAndPrice\(input\)/);
assert.match(intake, /determineLaneAndPrice\(pricingInput\)/);
assert.match(intake, /buildMatterQuoteSnapshot\(pricing, invoice\)/);
assert.match(intake, /\.\.\.quoteSnapshot/);
assert.match(intake, /INTAKE_QUOTE_PERSISTENCE_FAILED/);
assert.doesNotMatch(intake, /barePayload/);
assert.match(snapshot, /invoice_retainer: invoice\.retainer/);
assert.match(snapshot, /invoice_balance: invoice\.balance/);
assert.match(detail, /dashboard\/pro-forma/);

console.log("Live quote Matter carryover validation passed.");
