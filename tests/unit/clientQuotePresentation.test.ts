import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

const invoice = read("lib/portalInvoice.ts");
const invoiceApi = read("app/api/portal/me/invoice/route.ts");
const summary = read("components/portal/ClientMatterQuoteSummary.tsx");
const payment = read("app/portal/payment/page.tsx");

test("client invoice prefers persisted canonical quote breakdown", () => {
  assert.match(invoice, /canonicalQuoteLines\(row\.quote_breakdown\)/);
  assert.match(invoiceApi, /"quote_breakdown"/);
  assert.match(invoiceApi, /"matter_pricing_type"/);
  assert.match(invoiceApi, /"quote_execution_method"/);
});

test("client Matter summary shows reviewed scope and 50\/50 payment without public rate matrix", () => {
  assert.match(summary, /Reviewed Matter Summary/);
  assert.match(summary, /50% deposit/);
  assert.match(summary, /Final balance/);
  assert.match(summary, /receiving authority/i);
  assert.doesNotMatch(summary, /pricingCatalog|MATTER_BASES|DOCUMENT_FEES|NOTARY_SIGNER_FEES/);
});

test("portal payment renders the reviewed Matter summary before payment controls", () => {
  const summaryIndex = payment.indexOf("<ClientMatterQuoteSummary");
  const paymentIndex = payment.indexOf("<SecurePaymentCard");
  assert.ok(summaryIndex >= 0);
  assert.ok(paymentIndex > summaryIndex);
});


test("unapproved smart pricing never publishes an invented zero-dollar invoice to the authenticated portal", () => {
  assert.match(invoiceApi, /quote_approved_at/);
  assert.match(invoiceApi, /invoice: approved \? buildClientInvoiceSnapshot\(invoiceRow\) : null/);
  assert.match(summary, /Pricing pending review/);
  assert.match(summary, /itemized Pro Forma and Wise payment instructions/);
});
