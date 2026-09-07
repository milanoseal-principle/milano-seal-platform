import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Regression locks for the Matter 360 canonical object view
// (app/dashboard/matters/[matterId]/page.tsx).
//
// The index view is a READ PROJECTION over the same canonical read model used by
// Matter Truth. These locks prevent it from silently becoming a second Matter,
// payment or scheduling authority, and keep its payment language fail-closed.

const PAGE_PATH = join(process.cwd(), "app", "dashboard", "matters", "[matterId]", "page.tsx");
const source = readFileSync(PAGE_PATH, "utf8");

test("Matter 360 index view exists and renders the canonical spine ordering", () => {
  assert.ok(source.length > 0, "Matter 360 index page must exist");
  assert.match(source, /Matter\s*→\s*Execution\s*→\s*Corridor/);
});

test("Matter 360 reuses the canonical Matter read model and creates no second engine", () => {
  // Reads canonical Matter via the deals read endpoint and the shared governance lib.
  assert.match(source, /\/api\/deals\//);
  assert.match(source, /matterTruthGovernance/);
  assert.match(source, /buildMatterTruthSections/);
});

test("Matter 360 performs no canonical mutation (read-only projection)", () => {
  // No write verbs from this view — mutation stays with canonical authorities.
  assert.doesNotMatch(source, /method:\s*["'](POST|PUT|PATCH|DELETE)["']/i);
  assert.doesNotMatch(source, /\.(post|put|patch|delete)\s*\(/);
});

test("Matter 360 keeps payment language fail-closed and never asserts PAID", () => {
  // It must not hardcode a bare paid assertion; settlement truth stays derived.
  assert.doesNotMatch(source, /\bPAID\b/);
  assert.doesNotMatch(source, />\s*Paid\s*</);
  // Explicit fail-closed phrasing when settlement is not verified.
  assert.match(source, /settlement (pending|unverified)/i);
});

test("Matter 360 renders the full canonical lifecycle from intake to closed", () => {
  for (const stage of ["Intake", "Review", "Payment Authority", "Execution", "Apostille", "Custody", "Release", "Delivered", "Closed"]) {
    assert.ok(source.includes(stage), `lifecycle stage missing: ${stage}`);
  }
});

test("Matter 360 supports reduced motion and explicit non-happy states", () => {
  assert.match(source, /useReducedMotion/);
  assert.match(source, /Loading/);
  assert.match(source, /not authorized/i);
  assert.match(source, /No Matter found/i);
});
