import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canMarkAwarded,
  listRealSubmissions,
  getSubmission,
} from "@/lib/procurement/submissions/submissionRegistry";

test("award cannot be set without documented evidence", () => {
  assert.equal(canMarkAwarded("gov-submission-pinellas-itq-25-0786", null), false);
  assert.equal(canMarkAwarded("gov-submission-pinellas-itq-25-0786", "verified-award-doc"), true);
  assert.equal(canMarkAwarded("does-not-exist", "x"), false);
});

test("real submissions include only non-sample records", () => {
  const real = listRealSubmissions();
  assert.ok(real.length >= 1);
  assert.ok(real.every((s) => s.isSample === false));
});

test("Pinellas resolves from registry", () => {
  assert.ok(getSubmission("gov-submission-pinellas-itq-25-0786"));
});
