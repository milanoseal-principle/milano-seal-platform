import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCorridorScaleDecisions } from "../scale-engine";
import type { MatterEconomicsRow } from "@/lib/economics/matterEconomics";

function matter(id: string, overrides: Partial<MatterEconomicsRow> = {}): MatterEconomicsRow {
  return {
    matterId: id,
    destinationCountry: "Italy",
    originState: null,
    documentType: "Power of Attorney",
    executionMethod: null,
    acquisitionSource: null,
    collectedRevenue: { value: 650, currency: "USD", evidenceClass: "OBSERVED", evidence: "verified" },
    directExecutionCost: { value: null, currency: "USD", evidenceClass: "UNKNOWN", evidence: "unknown" },
    contributionMargin: { value: null, currency: "USD", evidenceClass: "UNKNOWN", evidence: "unknown" },
    cycleDays: null,
    exceptionObserved: null,
    refundObserved: null,
    ...overrides,
  };
}

test("high demand remains INSUFFICIENT_EVIDENCE while critical evidence is unknown", () => {
  const result = buildCorridorScaleDecisions([matter("1"), matter("2"), matter("3"), matter("4"), matter("5")]);
  assert.equal(result.length, 1);
  assert.equal(result[0].status, "INSUFFICIENT_EVIDENCE");
  assert.ok(result[0].factors.some((f) => f.label === "Margin" && f.state === "UNKNOWN"));
  assert.ok(result[0].factors.some((f) => f.label === "Authority-rule freshness" && f.state === "UNKNOWN"));
});

test("low demand plus critical unknowns remains INSUFFICIENT_EVIDENCE rather than a negative decision", () => {
  const result = buildCorridorScaleDecisions([matter("1")]);
  assert.equal(result[0].status, "INSUFFICIENT_EVIDENCE");
});

test("mixed currency observed revenue is not fabricated into one aggregate", () => {
  const result = buildCorridorScaleDecisions([
    matter("1"),
    matter("2", { collectedRevenue: { value: 600, currency: "EUR", evidenceClass: "OBSERVED", evidence: "verified" } }),
  ]);
  assert.equal(result[0].observedRevenue, null);
  assert.equal(result[0].currency, null);
});

test("scale decision exposes independent factors rather than a black-box score", () => {
  const result = buildCorridorScaleDecisions([matter("1"), matter("2")])[0] as unknown as Record<string, unknown>;
  assert.ok(Array.isArray(result.factors));
  for (const key of ["score", "scaleScore", "readinessScore", "weightedScore"]) assert.ok(!(key in result));
});
