import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const intakeRoute = readFileSync("app/api/intake/route.ts", "utf8");
const invoiceStudio = readFileSync("app/dashboard/invoices/page.tsx", "utf8");
const proForma = readFileSync("app/dashboard/pro-forma/[id]/page.tsx", "utf8");

test("intake fallbacks retain the server-approved quote snapshot", () => {
  assert.match(intakeRoute, /const quoteSnapshot = buildMatterQuoteSnapshot/);
  assert.match(intakeRoute, /const minimalPayload = \{[\s\S]*\.\.\.quoteSnapshot/);
  assert.match(intakeRoute, /persistedMatterHasQuote\(deal, quoteSnapshot\)/);
  assert.doesNotMatch(intakeRoute, /barePayload/);
});

test("Matter invoice surfaces prefer the persisted canonical total", () => {
  assert.match(invoiceStudio, /sel\?\.total_price \|\|/);
  assert.match(proForma, /matter\.total_price/);
  assert.match(proForma, /matter\.invoice_retainer/);
  assert.match(proForma, /matter\.invoice_balance/);
});
