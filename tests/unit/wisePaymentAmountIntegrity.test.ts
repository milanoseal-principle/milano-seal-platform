import { test } from "node:test";
import assert from "node:assert/strict";
import { calculatePaymentAmount } from "@/lib/wise/payments";
import { APOSTILLE_FEES, URGENCY_FEES } from "@/lib/pricing";

test("Wise retainer uses persisted canonical amount_due after discount", () => {
  const discountedMatter = {
    total_price: 625,
    amount_due: 312.5,
    invoice_retainer: 312.5,
    invoice_balance: 312.5,
  };

  assert.equal(calculatePaymentAmount(discountedMatter, "retainer"), 312.5);
  assert.equal(calculatePaymentAmount(discountedMatter, "final_balance"), 312.5);
});

test("normal 1250 Matter preserves 50 percent retainer and balance", () => {
  const matter = {
    total_price: 1250,
    amount_due: 625,
    invoice_retainer: 625,
    invoice_balance: 625,
  };

  assert.equal(calculatePaymentAmount(matter, "retainer"), 625);
  assert.equal(calculatePaymentAmount(matter, "final_balance"), 625);
});

test("Wise add-on fallbacks derive from canonical pricing constants", () => {
  assert.equal(
    calculatePaymentAmount({ total_price: 750 }, "rush_upgrade"),
    URGENCY_FEES.rush,
  );
  assert.equal(
    calculatePaymentAmount({ total_price: 750 }, "additional_apostille"),
    APOSTILLE_FEES.additional,
  );
});

test("translation payment fails closed when no approved stored fee exists", () => {
  assert.equal(
    calculatePaymentAmount({ total_price: 750 }, "translation_addon"),
    0,
  );
  assert.equal(
    calculatePaymentAmount(
      { total_price: 750, translation_fee: 225 },
      "translation_addon",
    ),
    225,
  );
});
