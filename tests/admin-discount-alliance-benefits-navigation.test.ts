import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const operatorShell = readFileSync("components/dashboard/OperatorShell.tsx", "utf8");
const allianceSidebar = readFileSync("components/alliance/AllianceSidebar.tsx", "utf8");

test("operator navigation exposes canonical payment and discount governance routes", () => {
  assert.match(operatorShell, /href:\s*"\/dashboard\/payments"/);
  assert.match(operatorShell, /href:\s*"\/dashboard\/payments\/discounts"/);
  assert.match(operatorShell, /href:\s*"\/dashboard\/payments\/discounts\/report"/);
});

test("Alliance navigation exposes read-only benefit surface", () => {
  assert.match(allianceSidebar, /href:\s*"\/alliance\/benefits"/);
});
