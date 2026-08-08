#!/usr/bin/env node
// Validator — Smart Intake SOP.
// Proves BEHAVIOR (runs the deterministic intake/pricing fixture tests) and scans
// for the doctrine regressions the SOP forbids. Not a filename checker.

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const root = process.cwd();
let failures = 0;
const fail = (m) => { console.error("VALIDATOR FAIL:", m); failures++; };
const ok = (m) => console.log("OK:", m);
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const exists = (rel) => fs.existsSync(path.join(root, rel));

// 1. package.json integrity — valid JSON, no duplicate script keys.
try {
  const raw = read("package.json");
  const pkg = JSON.parse(raw);
  const keys = Object.keys(pkg.scripts || {});
  const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
  if (dupes.length) fail(`duplicate package scripts: ${dupes.join(", ")}`);
  else ok("package.json valid, no duplicate scripts");
} catch (e) {
  fail(`package.json invalid: ${e.message}`);
}

// 2. Required canonical modules exist (positive wiring).
const required = [
  "lib/intake/intakeInterpretation.ts",
  "lib/intake/smartClassification.ts",
  "lib/intake/intakeClarifications.ts",
  "lib/intake/operatorHandoff.ts",
  "lib/pricing/milanoPricingTruth.ts",
  "lib/pricing/priceCanonicalMatter.ts",
  "lib/pricing/pricingProjections.ts",
];
for (const f of required) exists(f) ? ok(`present: ${f}`) : fail(`missing canonical module: ${f}`);

// 3. Positive symbol wiring.
const symbolChecks = [
  ["lib/pricing/priceCanonicalMatter.ts", /export function priceCanonicalMatter/],
  ["lib/pricing/pricingProjections.ts", /export function projectClientPricing/],
  ["lib/intake/intakeClarifications.ts", /export function buildIntakeClarifications/],
  ["lib/intake/operatorHandoff.ts", /export function buildOperatorHandoff/],
  ["lib/pricing/milanoPricingTruth.ts", /paymentGateRequired/],
  ["lib/pricing/milanoPricingTruth.ts", /schedulingLockedUntilPayment/],
];
for (const [f, re] of symbolChecks) re.test(read(f)) ? ok(`wired: ${f} ${re}`) : fail(`not wired: ${f} ${re}`);

// 4. No client-side price arithmetic / copied lane table in the intake UI.
const uiDirs = ["components/intake", "app/intake"];
const PRICE_TOKENS = /\b(975|1850|1,850)\b|lanePrices|pricingMap|calculateTotal|apostillePrice|rushPrice|signerPrice/;
for (const dir of uiDirs) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) continue;
  for (const file of walk(abs)) {
    if (!/\.(tsx?|jsx?)$/.test(file)) continue;
    const src = fs.readFileSync(file, "utf8");
    if (PRICE_TOKENS.test(src)) fail(`hard-coded pricing/lane logic in intake UI: ${path.relative(root, file)}`);
  }
}
ok("no copied lane-price table / price arithmetic in intake UI");

// 5. No merge-conflict markers in Smart Intake scope.
for (const dir of ["lib/intake", "lib/pricing", ...uiDirs]) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) continue;
  for (const file of walk(abs)) {
    const src = fs.readFileSync(file, "utf8");
    if (/^(<{7}|={7}|>{7})/m.test(src)) fail(`conflict markers in ${path.relative(root, file)}`);
  }
}
ok("no conflict markers in Smart Intake scope");

// 6. BEHAVIORAL proof — run the deterministic intake/pricing fixture tests.
const testGlobs = [
  "lib/intake/__tests__/intakeInterpretation.test.ts",
  "lib/intake/__tests__/smartClassification.test.ts",
  "lib/intake/__tests__/intakeClarifications.test.ts",
  "lib/intake/__tests__/operatorHandoff.test.ts",
  "lib/intake/__tests__/intakeCorrectness.test.ts",
  "lib/pricing/__tests__/milanoPricingTruth.test.ts",
  "lib/pricing/__tests__/priceCanonicalMatter.test.ts",
  "lib/pricing/__tests__/pricingProjections.test.ts",
].filter(exists);
try {
  execSync(`node --import tsx --test ${testGlobs.join(" ")}`, { cwd: root, stdio: "pipe" });
  ok(`behavioral fixtures passed (${testGlobs.length} suites)`);
} catch (e) {
  fail(`behavioral fixtures failed:\n${(e.stdout || e.message || "").toString().slice(-2000)}`);
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

if (failures) {
  console.error(`\nVALIDATOR: smart-intake-sop FAILED (${failures} failure${failures > 1 ? "s" : ""}).`);
  process.exit(1);
}
console.log("\nVALIDATOR: smart-intake-sop PASSED.");
