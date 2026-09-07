import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("components/dashboard/ExecutiveDashboard.tsx", "utf8");

test("executive command exposes Matter Execution Corridor priority flow", () => {
  assert.match(source, /Global Execution Command/);
  assert.match(source, /Matter → Execution → Corridor/);
  assert.match(source, /label: "Now"/);
  assert.match(source, /label: "Next"/);
  assert.match(source, /label: "Intelligence"/);
});

test("executive intelligence fails visibly instead of rendering a blank or fallback metrics", () => {
  assert.match(source, /if \(!response\.ok\) throw new Error/);
  assert.match(source, /Intelligence unavailable/);
  assert.match(source, /No fallback numbers are being shown/);
  assert.doesNotMatch(source, /catch\(\(\) => setLoading\(false\)\)/);
});

test("authority coverage does not turn missing authority evidence into a synthetic zero score", () => {
  assert.match(source, /data\.total_authorities > 0/);
  assert.match(source, /synthetic 0% score is not shown/i);
});

test("executive command is responsive and exposes reduced-motion-safe loading state", () => {
  assert.match(source, /sm:grid-cols-2 lg:grid-cols-3/);
  assert.match(source, /md:grid-cols-3/);
  assert.match(source, /motion-reduce:animate-none/);
  assert.match(source, /focus-visible:ring-2/);
});

test("executive command remains a read model and declares no mutation request", () => {
  assert.doesNotMatch(source, /method:\s*["'](?:POST|PUT|PATCH|DELETE)["']/);
  assert.match(source, /Executive read model only/);
});
