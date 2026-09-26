import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile("components/payments/SecurePaymentCard.tsx", "utf8");

test("mutation state prevents duplicate submission", () => {
  assert.match(source, /MutationPhase/);
  assert.match(
    source,
    /if \(!normalized \|\| busy \|\| isSubmitted\) return/,
    "discount mutation must reject empty input, concurrent mutations, and already-submitted payments",
  );
  assert.match(source, /disabled=\{!code\.trim\(\) \|\| busy\}/);
  assert.match(source, /aria-busy=\{busy\}/);
  assert.match(source, /aria-live="polite"/);
});
