import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const code = (path: string) =>
  readFileSync(path, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

test("the operator demo never claims payment or unlocks scheduling", () => {
  const demo = code("app/dashboard/testing/tiffany-e2e/_components/e2e-demo-shell.tsx");
  assert.doesNotMatch(demo, /\/api\/deals\/\$\{[^}]+\}\/payment`/, "demo no longer calls the retired route");
  for (const claim of ["SCHEDULING_UNLOCKED", "PAYMENT_CONFIRMED", "WISE_SETTLEMENT_VERIFIED", "SCHEDULING_AUTHORIZED", "EXECUTION_AUTHORIZED", "RELEASE_AUTHORIZED"]) {
    assert.ok(!demo.includes(claim), `demo must not emit ${claim}`);
  }
  assert.ok(!demo.includes("scheduling unlocked"), "demo must not tell the operator scheduling is unlocked");
  assert.match(demo, /verified_settlement: false/);
});
