import { test } from "node:test";
import assert from "node:assert/strict";
import { CANONICAL_MATTER_FIELDS } from "../canonicalMatter";

test("registry has no duplicate entries", () => {
  assert.equal(CANONICAL_MATTER_FIELDS.length, new Set(CANONICAL_MATTER_FIELDS).size);
});

// Price/route-driving canonical extensions must never silently disappear from
// the registry (they are read by priceCanonicalMatter / classification).
test("price-driving canonical fields are registered", () => {
  for (const f of [
    "destinationCountry", "executionTier", "documentFamily", "apostilleStatus",
    "translationStatus", "signerLocation", "urgency", "clientType",
    "mobile", "governmentContractId",
  ] as const) {
    assert.ok(CANONICAL_MATTER_FIELDS.includes(f), `registry drift: missing "${f}"`);
  }
});
