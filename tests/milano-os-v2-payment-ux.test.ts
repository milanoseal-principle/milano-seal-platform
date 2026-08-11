import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const securePayment = readFileSync("components/payments/SecurePaymentCard.tsx", "utf8");
const matterDetail = readFileSync("app/dashboard/deals/[id]/page.tsx", "utf8");
const portalPayment = readFileSync("app/portal/payment/page.tsx", "utf8");
const portalContext = readFileSync("components/portal/portal-context.tsx", "utf8");
const portalProjection = readFileSync("lib/portalProjection.ts", "utf8");
const portalAuth = readFileSync("lib/portalAuth.ts", "utf8");
const portalMe = readFileSync("app/api/portal/me/route.ts", "utf8");
const proForma = readFileSync("app/dashboard/pro-forma/[id]/page.tsx", "utf8");

test("SecurePaymentCard uses the canonical server discount route", () => {
  assert.ok(securePayment.includes("/apply-discount"));
  assert.ok(!securePayment.includes("/discount`"), "must not call the obsolete discount route");
  assert.ok(securePayment.includes("Partner or Courtesy Code"));
  assert.ok(securePayment.includes("Complete Secure Payment"));
  assert.ok(securePayment.includes("50% retainer to begin execution"));
});

test("discount application regenerates canonical Wise retainer instructions", () => {
  const discountIndex = securePayment.indexOf("/apply-discount");
  const payIndex = securePayment.indexOf("/pay`", discountIndex);
  const refreshIndex = securePayment.indexOf("onRefresh", payIndex);
  assert.ok(discountIndex > -1, "discount must use canonical apply-discount route");
  assert.ok(payIndex > discountIndex, "discount success must recreate canonical Wise payment instructions");
  assert.ok(securePayment.includes('paymentType: "retainer"'));
  assert.ok(refreshIndex > payIndex, "shared card must refresh only after Wise instruction regeneration is attempted");
});

test("Matter detail uses SecurePaymentCard and demotes complimentary authorization", () => {
  assert.ok(matterDetail.includes('import { SecurePaymentCard }'));
  assert.ok(matterDetail.includes("<SecurePaymentCard"));
  assert.ok(matterDetail.includes("More payment actions"));
  assert.ok(matterDetail.includes("<ComplimentaryMatterCard"));
  assert.ok(!matterDetail.includes("Read-only settlement state. Wise reconciliation is authoritative."));
});

test("portal payment reuses canonical secure payment UX", () => {
  assert.ok(portalPayment.includes('import { SecurePaymentCard }'));
  assert.ok(portalPayment.includes("<SecurePaymentCard"));
  assert.ok(portalPayment.includes("Partner or courtesy codes are validated by the server"));
});

test("portal verified payment states normalize to paid before rendering", () => {
  assert.ok(portalPayment.includes("deal.payment_confirmed"));
  assert.ok(portalPayment.includes('"confirmed"'));
  assert.ok(portalPayment.includes('"payment_confirmed"'));
  assert.ok(portalPayment.includes('? "paid"'));
  assert.ok(securePayment.includes('["paid", "confirmed", "payment_confirmed"]'));
});

test("Pro Forma payment review reuses canonical secure payment UX", () => {
  assert.ok(proForma.includes('import { SecurePaymentCard }'));
  assert.ok(proForma.includes("<SecurePaymentCard"));
  assert.ok(proForma.includes("current canonical Matter pricing"));
  assert.ok(proForma.includes("Scheduling remains locked until verified reconciliation"));
});

test("portal payment truth preserves canonical invoice, paid amount, and Wise fields", () => {
  for (const field of [
    "discount_code",
    "invoice_retainer",
    "invoice_balance",
    "amount_paid",
    "wise_payment_url",
  ]) {
    assert.ok(portalContext.includes(field), `portal context must preserve ${field}`);
  }
  assert.ok(portalContext.includes("raw.payment_link"), "Wise URL must fall back to canonical payment_link");
  assert.ok(portalContext.includes("raw.lane"), "portal lane must fall back to canonical lane");
  assert.ok(portalProjection.includes("payment_amount_received"), "portal projection must derive client-safe paid amount from verified receipt truth");
  assert.ok(portalAuth.includes("payment_amount_received"), "portal deal query must select verified paid amount");
  assert.ok(portalMe.includes('"amount_paid"'), "portal safe field allowlist must expose the derived paid amount");
});

test("Milano OS V2 payment surfaces remain Wise-only", () => {
  for (const [name, src] of [["secure payment", securePayment], ["portal payment", portalPayment], ["pro forma", proForma]] as const) {
    assert.ok(!/stripe/i.test(src), `${name} must not contain Stripe`);
    assert.ok(/Wise/.test(src), `${name} must preserve Wise payment authority`);
  }
});
