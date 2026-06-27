#!/usr/bin/env node
// Validate that public execution-intelligence surfaces avoid weak/forbidden language.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

const root = process.cwd();
let failed = false;
const fail = (msg) => {
  console.error(`✗ ${msg}`);
  failed = true;
};
const pass = (msg) => console.log(`✓ ${msg}`);

const SCAN_DIRS = [
  "components/landing",
  "components/map",
  "components/home",
  "app/countries",
  "app/apostille",
];
const SCAN_FILES = ["data/country-execution-intelligence.ts"];

function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...walk(full));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

const files = [];
for (const d of SCAN_DIRS) files.push(...walk(resolve(root, d)));
for (const f of SCAN_FILES) {
  const full = resolve(root, f);
  if (existsSync(full)) files.push(full);
}

// Exclude validator scripts / any "validate-" path.
const targets = files.filter((f) => !f.includes("validate-") && !f.includes("/scripts/"));

const WEAK_LABELS = ["DESTINATION REVIEW", "Start Secure Intake", "Explore Full Map"];
const FORBIDDEN = ["guaranteed", "instant approval", "legal clearance", "legal advice"];

let weakHit = false;
let forbiddenHit = false;

for (const file of targets) {
  const text = readFileSync(file, "utf8");
  for (const label of WEAK_LABELS) {
    if (text.includes(label)) {
      fail(`weak legacy label "${label}" found in ${file}`);
      weakHit = true;
    }
  }
  const lower = text.toLowerCase();
  for (const phrase of FORBIDDEN) {
    let idx = lower.indexOf(phrase);
    while (idx !== -1) {
      // Allow legitimate compliance disclaimers that NEGATE the claim, e.g.
      // "not legal advice", "no legal advice", "does not provide legal advice",
      // "legal advice should come from a licensed attorney".
      const before = lower.slice(Math.max(0, idx - 24), idx);
      const after = lower.slice(idx + phrase.length, idx + phrase.length + 28);
      const negated =
        /\b(no|not|never|without|isn't|aren't|don't|doesn't|cannot|can't)\b[^.]*$/.test(before) ||
        /^\s*(should come from|is not provided|from a licensed)/.test(after);
      if (!negated) {
        fail(`forbidden phrase "${phrase}" found in ${file}`);
        forbiddenHit = true;
        break;
      }
      idx = lower.indexOf(phrase, idx + phrase.length);
    }
  }
}
if (!weakHit) pass("no weak legacy labels in public surfaces");
if (!forbiddenHit) pass("no forbidden phrases in public surfaces");

// Registry file checks.
const countryIntel = resolve(root, "data/country-execution-intelligence.ts");
if (!existsSync(countryIntel)) {
  fail("data/country-execution-intelligence.ts missing");
} else if (!readFileSync(countryIntel, "utf8").includes("EXECUTION INTELLIGENCE")) {
  fail('data/country-execution-intelligence.ts missing "EXECUTION INTELLIGENCE"');
} else {
  pass("country-execution-intelligence.ts present with EXECUTION INTELLIGENCE marker");
}

const matrix = resolve(root, "data/execution-intelligence-matrix.ts");
if (!existsSync(matrix)) {
  fail("data/execution-intelligence-matrix.ts missing");
} else if (!readFileSync(matrix, "utf8").includes("getExecutionIntelligenceForAudience")) {
  fail("execution-intelligence-matrix.ts does not export getExecutionIntelligenceForAudience");
} else {
  pass("execution-intelligence-matrix.ts exports getExecutionIntelligenceForAudience");
}

if (failed) {
  console.error("✗ execution intelligence validation FAILED");
  process.exit(1);
}
console.log("✓ execution intelligence validation passed");
process.exit(0);
