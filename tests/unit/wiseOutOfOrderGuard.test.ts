import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { ignoreLatePendingEvent } from "@/lib/wise/outOfOrderGuard";

// Wise transfer state changes can arrive out of order. On the legacy (no payment
// attempt) path, a late exact-match "processing" event used to write
// payment_status='unpaid' onto a Matter already confirmed paid/cleared by
// confirm_wise_payment_for_deal, breaking settlement truth for portal and gates.

test("a late pending event never moves a confirmed or invalidated payment backwards", () => {
  for (const deal of [
    { payment_status: "paid", payment_confirmed: true },
    { payment_status: "paid", payment_confirmed: false },
    { payment_status: "confirmed", payment_confirmed: null },
    { payment_status: "unpaid", payment_confirmed: true },
    { payment_status: "failed" },
    { payment_status: "refunded" },
    { payment_status: " PAID " },
  ]) {
    assert.equal(ignoreLatePendingEvent(deal), true, JSON.stringify(deal));
  }
});

test("an unpaid Matter still records the pending state (no payment authority implied)", () => {
  assert.equal(ignoreLatePendingEvent({ payment_status: "unpaid", payment_confirmed: false }), false);
  assert.equal(ignoreLatePendingEvent({ payment_status: "pending" }), false);
  assert.equal(ignoreLatePendingEvent({}), false);
});

test("webhook uses the guard on the legacy path and reads payment_confirmed", () => {
  const route = fs.readFileSync("app/api/webhooks/wise/route.ts", "utf8");
  assert.match(route, /milanoStatus === "PAYMENT_PENDING" && ignoreLatePendingEvent\(deal\)/);
  assert.match(route, /\.select\("id, deal_id, payment_status, payment_confirmed, /);
  // The attempt path still ignores pending outright, and signature verification is unchanged.
  assert.match(route, /if \(milanoStatus === "PAYMENT_PENDING"\) return;/);
  assert.match(route, /verifyWiseSignature\(rawBody, signature\)/);
});
