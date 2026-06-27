#!/usr/bin/env node
// Fail if any PUBLIC surface imports the private execution-intelligence engine
// or leaks private workflow / revenue / payment-gate / ledger language.
// Public = WHAT and WHY. Private (HOW) lives behind authentication only.

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(process.cwd());
let failures = 0;
const fail = (m) => { console.error(`  ✗ FAIL: ${m}`); failures++; };
const pass = (m) => console.log(`  ✓ PASS: ${m}`);

const PUBLIC_DIRS = [
  "app/countries",
  "app/map",
  "app/apostille",
  "components/landing",
  "components/map",
  "components/home",
];

function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir)) {
    const full = join(dir, f);
    const s = statSync(full);
    if (s.isDirectory()) out.push(...walk(full));
    else if (/\.(tsx?|jsx?)$/.test(f) && !/validate-/.test(f)) out.push(full);
  }
  return out;
}

const files = PUBLIC_DIRS.flatMap((d) => walk(join(ROOT, d)));

// 1. No public file may import the private engine as a runtime value.
//    (type-only imports are erased at build and are allowed.)
const PRIVATE_MODULES = [
  "data/country-execution-intelligence",
  "data/execution-intelligence-matrix",
  "private-execution-intelligence",
];
let importHit = false;
for (const file of files) {
  const text = readFileSync(file, "utf8");
  for (const line of text.split("\n")) {
    for (const mod of PRIVATE_MODULES) {
      if (line.includes(mod) && /\bimport\b/.test(line) && !/import\s+type\b/.test(line)) {
        fail(`${relative(ROOT, file)} imports private engine "${mod}" (use data/public-country-intelligence)`);
        importHit = true;
      }
    }
  }
}
if (!importHit) pass("no public surface imports the private execution-intelligence engine");

// 2. No public file may contain private workflow / revenue tokens.
// Private engine field names + private-only workflow/revenue display tokens.
// (Public-safe process language like "Payment Gate" and the Florida notary
// "commission" number / CSS "margin" are intentionally NOT flagged.)
const FORBIDDEN_CASE = [
  "revenueUse",
  "founderUse",
  "operatorUse",
  "virtualAssistantUse",
  "allianceNotaryUse",
  "lawyerClientUse",
  "Release Blocker",
  "Next Ledger Event",
  "Add-On Opportunity",
  "Revenue Opportunity",
  "VA Review Queue",
  "Operator Route Lock",
];
const FORBIDDEN_WORD = [
  /net[_ ]?margin/i,
  /profit[_ ]?margin/i,
  /\bpayout\b/i,
  /(referral|sales)[_ ]?commission/i,
];

let tokenHit = false;
for (const file of files) {
  const text = readFileSync(file, "utf8");
  for (const tok of FORBIDDEN_CASE) {
    if (text.includes(tok)) {
      fail(`${relative(ROOT, file)} contains private token "${tok}"`);
      tokenHit = true;
    }
  }
  for (const re of FORBIDDEN_WORD) {
    if (re.test(text)) {
      fail(`${relative(ROOT, file)} contains private word ${re}`);
      tokenHit = true;
    }
  }
}
if (!tokenHit) pass("no public surface leaks private workflow / revenue tokens");

console.log(`\n${"─".repeat(48)}`);
if (failures > 0) {
  console.error(`\n✗ Public intelligence safety FAILED — ${failures} issue(s).\n`);
  process.exit(1);
}
console.log("\n✓ Public intelligence safety passed.\n");
process.exit(0);
