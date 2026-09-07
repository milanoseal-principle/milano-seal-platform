import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

// Regression locks for the Pipeline Stagnation Alerts surfaces.
// The alerts are an operator-only read projection: the API must be
// dashboard-guarded and non-mutating, and the client page must not present
// client-facing alarm language or assert SLAs.

const api = readFileSync("app/api/dashboard/stagnation/route.ts", "utf8");
const page = readFileSync("app/dashboard/stagnation/page.tsx", "utf8");

test("stagnation API is operator-guarded and read-only", () => {
  assert.match(api, /requireDashboardAccess/);
  assert.match(api, /status:\s*401/);
  // Read projection only — no canonical mutation from this surface.
  assert.doesNotMatch(api, /\.update\(|\.insert\(|\.delete\(|\.upsert\(/);
  assert.match(api, /evaluatePipelineStagnation/);
});

test("stagnation page reflects server truth and asserts no SLA", () => {
  assert.match(page, /\/api\/dashboard\/stagnation/);
  // Fail-closed evidence bucket is surfaced, not hidden.
  assert.match(page, /Insufficient Evidence/);
  // Operating heuristic, explicitly not a guarantee.
  assert.match(page, /not (a )?service-level guarantees?/i);
  // Non-happy states present.
  assert.match(page, /operator-only/i);
});
