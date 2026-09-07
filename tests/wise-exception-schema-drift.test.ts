import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("lib/wise/reconciliation-exceptions.ts", "utf8");

test("Wise exception scanner does not query removed platform-fee column", () => {
  assert.doesNotMatch(source, /is_platform_fee_only/);
  assert.match(source, /wise_transaction_reference/);
  assert.match(source, /payment_funding_method/);
  assert.match(source, /payment_observed_at/);
});
