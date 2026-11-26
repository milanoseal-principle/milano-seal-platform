import assert from "node:assert/strict";
import test from "node:test";
import { splitFiftyFifty, splitFiftyFiftyCents, toCents } from "@/lib/pricing/paymentSplit";
import { composeCanonicalPrivateQuote } from "@/lib/pricing/pricingComposer";
import { fiftyFiftySplit } from "@/lib/pricing/intakeIndicativeQuote";
import { generateInvoice } from "@/lib/invoice";

// The canonical 50/50 split (retainer before scheduling, final balance after
// apostille and before release) in integer cents. The previous payable path
// divided dollars before rounding: 16,405 of 500,000 totals produced a retainer
// one cent below the half-up rule (e.g. 1.15 → 0.57 instead of 0.58).

test("founder-specified examples", () => {
  const cases: [number, number, number][] = [
    [0.01, 0.01, 0.0],
    [1.15, 0.58, 0.57],
    [13.75, 6.88, 6.87],
    [975.0, 487.5, 487.5],
    [1125.0, 562.5, 562.5],
  ];
  for (const [total, retainer, finalBalance] of cases) {
    assert.deepEqual(splitFiftyFifty(total), { total, retainer, finalBalance }, String(total));
  }
});

test("500,000 totals: every split site agrees, reconciles exactly and rounds half up", () => {
  let checked = 0;
  for (let cents = 1; cents <= 500_000; cents += 1) {
    const total = cents / 100;
    const { retainerCents, finalBalanceCents } = splitFiftyFiftyCents(cents);
    assert.equal(retainerCents + finalBalanceCents, cents);
    assert.equal(retainerCents, Math.ceil(cents / 2));
    const dollars = splitFiftyFifty(total);
    assert.equal(toCents(dollars.retainer), retainerCents);
    assert.equal(toCents(dollars.finalBalance), finalBalanceCents);
    const indicative = fiftyFiftySplit(total);
    assert.equal(toCents(indicative.retainer), retainerCents);
    assert.equal(toCents(indicative.balance), finalBalanceCents);
    checked += 1;
  }
  assert.equal(checked, 500_000);
});

test("the issued invoice uses the same split", () => {
  for (const total of [0.01, 1.15, 13.75, 975, 1125, 2.07, 1234.57]) {
    const invoice = generateInvoice(total);
    const expected = splitFiftyFifty(total);
    assert.equal(invoice.retainer, expected.retainer, `retainer ${total}`);
    assert.equal(invoice.balance, expected.finalBalance, `balance ${total}`);
  }
});

test("the payable quote composer uses the same split and reconciles to its total", () => {
  for (const input of [
    { matterBase: "authentication" as const, documentCount: 1, apostilleCount: 1 },
    { matterBase: "signature" as const, executionMethod: "ron" as const, documentCount: 1, apostilleCount: 1 },
    { matterBase: "signature" as const, executionMethod: "in_person" as const, documentCount: 2, apostilleCount: 2 },
  ]) {
    const quote = composeCanonicalPrivateQuote(input as Parameters<typeof composeCanonicalPrivateQuote>[0]);
    const expected = splitFiftyFifty(quote.total);
    assert.equal(quote.depositAmount, expected.retainer);
    assert.equal(quote.balanceDue, expected.finalBalance);
    assert.equal(toCents(quote.depositAmount) + toCents(quote.balanceDue), toCents(quote.total));
  }
});

test("invalid amounts are refused, never split", () => {
  for (const bad of [-1, Number.NaN, Number.POSITIVE_INFINITY]) assert.throws(() => splitFiftyFifty(bad), /PAYMENT_SPLIT_INVALID_AMOUNT/);
  for (const bad of [-1, 1.5, Number.MAX_SAFE_INTEGER + 1]) assert.throws(() => splitFiftyFiftyCents(bad), /PAYMENT_SPLIT_INVALID_CENTS/);
});
