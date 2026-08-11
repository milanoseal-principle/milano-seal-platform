import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import {
  buildMatterQuoteSnapshot,
  persistedMatterHasQuote,
} from "@/lib/pricing/matterQuoteSnapshot";

test("canonical Matter quote snapshot preserves discounted 50/50 payment truth", () => {
  const snapshot = buildMatterQuoteSnapshot({
    lane: "Priority",
    basePrice: 975,
    witnessTotal: 0,
    originalTotal: 1250,
    discountAmount: 625,
    finalTotal: 625,
    invoiceRetainer: 312.5,
    invoiceBalance: 312.5,
  });

  assert.deepEqual(snapshot, {
    lane: "Priority",
    base_price: 975,
    witness_total: 0,
    original_total: 1250,
    discount_amount: 625,
    final_total: 625,
    total_price: 625,
    invoice_retainer: 312.5,
    invoice_balance: 312.5,
    amount_due: 312.5,
    currency: "USD",
  });
});

test("persisted quote verifier accepts Supabase numeric strings and rejects monetary drift", () => {
  const expected = buildMatterQuoteSnapshot({
    lane: "Executive",
    basePrice: 1850,
    witnessTotal: 125,
    originalTotal: 2475,
    discountAmount: 247.5,
    finalTotal: 2227.5,
    invoiceRetainer: 1113.75,
    invoiceBalance: 1113.75,
  });

  const persisted = Object.fromEntries(
    Object.entries(expected).map(([key, value]) => [
      key,
      typeof value === "number" ? value.toFixed(2) : value,
    ]),
  );

  assert.equal(persistedMatterHasQuote(persisted, expected), true);
  assert.equal(
    persistedMatterHasQuote({ ...persisted, amount_due: "1113.74" }, expected),
    false,
  );
});

test("source validator locks intake carryover to persisted Matter truth", () => {
  assert.doesNotThrow(() =>
    execFileSync(process.execPath, ["scripts/validate-live-quote-matter-carryover.mjs"], {
      stdio: "pipe",
    }),
  );
});
