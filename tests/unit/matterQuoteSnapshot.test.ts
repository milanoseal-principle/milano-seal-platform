import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildMatterQuoteSnapshot,
  persistedMatterHasQuote,
} from "@/lib/pricing/matterQuoteSnapshot";

const expected = buildMatterQuoteSnapshot({
  lane: "Priority",
  base_price: 975,
  witness_total: 0,
  total_price: 600,
  original_total: 1_200,
  eligible_subtotal: 1_200,
  non_discountable_total: 0,
  final_total: 600,
  discount_code: "TIFFTEST50",
  discount_value: 50,
  discount_amount: 600,
  invoice_retainer: 300,
  invoice_balance: 300,
  amount_due: 300,
});

test("quote snapshot locks unpaid Wise pre-payment truth", () => {
  assert.equal(expected.payment_status, "unpaid");
  assert.equal(expected.payment_confirmed, false);
  assert.equal(expected.payment_method, "wise");
  assert.equal(expected.amount_paid, 0);
  assert.equal(expected.invoice_retainer, expected.final_total / 2);
});

test("persisted quote integrity accepts numeric database values", () => {
  const persisted = Object.fromEntries(
    Object.entries(expected).map(([key, value]) => [
      key,
      typeof value === "number" ? String(value) : value,
    ]),
  );
  persisted.payment_confirmed = false;

  assert.equal(persistedMatterHasQuote(persisted, expected), true);
});

test("persisted quote integrity rejects changed totals or payment truth", () => {
  assert.equal(
    persistedMatterHasQuote({ ...expected, total_price: 0 }, expected),
    false,
  );
  assert.equal(
    persistedMatterHasQuote(
      { ...expected, payment_confirmed: true },
      expected,
    ),
    false,
  );
});
