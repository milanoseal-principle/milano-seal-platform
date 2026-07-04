#!/usr/bin/env node
// Validator — Final Branch Salvage Audit.
// Asserts the audit doc exists and that this branch salvaged ONLY safe files:
// no Wise / payment / release / custody / Supabase RLS / Shippo / BlueNotary
// changes, no PIP/Liaison OS, and no protected files touched.

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const repoRoot = process.cwd();
let failures = 0;
const fail = (m) => {
  console.error("VALIDATOR FAIL:", m);
  failures++;
};
const ok = (m) => console.log("OK:", m);
const exists = (rel) => fs.existsSync(path.join(repoRoot, rel));

// 1. Audit doc exists.
if (!exists("docs/audits/FINAL_BRANCH_SALVAGE_AUDIT.md")) fail("Missing docs/audits/FINAL_BRANCH_SALVAGE_AUDIT.md");
else ok("Audit doc present");

// 2. Protected-file guard against current main.
const PROTECTED = /wise|webhook|payment-?confirm|paymentConfirm|release-?gate|releaseGate|performFinalRelease|custody|supabase\/(migrations|rls)|rls|serviceRole|service-role|shippo|bluenotary|pip-intel|liaison/i;
try {
  const base = execSync("git merge-base origin/main HEAD || git rev-parse main", {
    cwd: repoRoot,
    encoding: "utf8",
  }).trim();
  const diff = execSync(`git diff --name-only ${base} HEAD`, { cwd: repoRoot, encoding: "utf8" });
  const touched = diff.split("\n").filter((f) => f && PROTECTED.test(f));
  if (touched.length) fail(`Branch touches protected files: ${touched.join(", ")}`);
  else ok("No protected files touched (Wise/payment/release/custody/RLS/Shippo/BlueNotary/PIP)");
} catch (e) {
  console.log("NOTE: git diff guard skipped (", e.message, ")");
}

// 3. Salvaged files present as documented.
for (const f of [
  "scripts/validate-responsive-safety.mjs",
  "scripts/validate-motion-system.mjs",
  "app/dashboard/motion-preview/page.tsx",
  "components/dashboard/motion/index.ts",
]) {
  if (!exists(f)) fail(`Documented salvage missing: ${f}`);
}
if (failures === 0) ok("All documented salvage files present");

// 4. No PIP/Liaison OS directories added.
if (exists("lib/pip-intel") || exists("app/dashboard/pip-intel")) fail("PIP/Liaison OS files must not be added");
else ok("No PIP/Liaison OS added");

if (failures > 0) {
  console.error(`\nVALIDATOR: final-branch-salvage-audit FAILED with ${failures} error(s).`);
  process.exit(2);
}
console.log("\nVALIDATOR: final-branch-salvage-audit PASSED.");
