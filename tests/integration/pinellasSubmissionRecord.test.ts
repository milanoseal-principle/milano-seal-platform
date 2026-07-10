import { test } from "node:test";
import assert from "node:assert/strict";
import { PINELLAS_ITQ_250786 } from "@/lib/government/submissions/pinellasItq250786";

test("Pinellas record is real data, submitted / not awarded", () => {
  assert.equal(PINELLAS_ITQ_250786.isSample, false);
  assert.equal(PINELLAS_ITQ_250786.submissionStatus, "not_awarded");
  assert.equal(PINELLAS_ITQ_250786.awardEvidenceRef, null);
  assert.equal(PINELLAS_ITQ_250786.solicitationNumber, "25-0786-ITQ");
});

test("Pinellas rate schedule remains exact", () => {
  const byLine = Object.fromEntries(PINELLAS_ITQ_250786.rateSchedule.map((r) => [r.line, r]));
  assert.equal(byLine["1"].rate, "$150.00");
  assert.equal(byLine["1"].decision, "BID");
  assert.equal(byLine["2"].rate, "$225.00");
  assert.equal(byLine["3"].rate, "$112.50");
  assert.equal(byLine["4–18"].decision, "NO_BID");
  assert.equal(PINELLAS_ITQ_250786.contractTermMonths, 60);
});

test("open items remain pending verification, not fabricated", () => {
  assert.ok(PINELLAS_ITQ_250786.openItems.some((o) => /pending verification/i.test(o)));
});
