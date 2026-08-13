import assert from "node:assert/strict";
import test from "node:test";
import { inspectSource } from "../scripts/validate-duplicate-source.mjs";

const longBody = `{
  const countries = ["Italy", "Spain", "Brazil", "UAE"];
  const resolved = countries.map((country) => ({ country, status: "REVIEW_REQUIRED", authority: null }));
  return resolved.filter((route) => route.authority !== "UNKNOWN").map((route) => ({ ...route, controlled: true }));
}`;

test("duplicate-source validator detects repeated implementation bodies", () => {
  const findings = inspectSource("toolbelt.ts", `function first() ${longBody}\nfunction second() ${longBody}`);
  assert.equal(findings.some((finding) => finding.rule === "duplicate-body"), true);
});

test("duplicate-source validator detects duplicate declarations and test names", () => {
  const source = `
    export function route() { return "READY"; }
    export function route() { return "BLOCKED"; }
    test("fails closed", () => assert(true));
    test("fails closed", () => assert(true));
  `;
  const rules = inspectSource("routing.test.ts", source).map((finding) => finding.rule);
  assert.ok(rules.includes("duplicate-declaration"));
  assert.ok(rules.includes("duplicate-test"));
});

test("duplicate-source validator detects duplicate component constants", () => {
  const source = `const Toolbelt = () => <main />;\nconst Toolbelt = () => <main />;`;
  assert.equal(inspectSource("toolbelt.tsx", source).some((finding) => finding.rule === "duplicate-declaration"), true);
});

test("duplicate-source validator permits matching test names in separate suites", () => {
  const source = `
    describe("intake", () => { test("fails closed", () => true); });
    describe("payment", () => { test("fails closed", () => true); });
  `;
  assert.equal(inspectSource("routing.test.ts", source).length, 0);
});
