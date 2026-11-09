#!/usr/bin/env node
// Validator — Final Branch Salvage Audit.
// Asserts the audit doc exists and that this branch salvaged ONLY safe files:
// no Wise / payment / release / custody / Supabase RLS / Shippo / BlueNotary
// changes, no PIP/Liaison OS, and no protected files touched.

import { GAP_CLOSURE_PROTECTED_CHANGES, P4B_PROTECTED_CHANGES, P5_PROTECTED_CHANGES, AI_GOVERNANCE_PROTECTED_CHANGES, SETTLEMENT_SCHEDULING_PROTECTED_CHANGES, HOSTED_RECOVERY_PROTECTED_CHANGES } from './governed-production-scope.mjs';
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

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
// Additive pre-Matter persistence explicitly required by counsel acquisition.
// Its private access and canonical Matter FK are covered by the SQL fixture.
// This exception does not permit any other Supabase or protected gate change.
const APPROVED_ADDITIVE_MIGRATIONS = new Set([
    ...GAP_CLOSURE_PROTECTED_CHANGES, ...P4B_PROTECTED_CHANGES,
    ...AI_GOVERNANCE_PROTECTED_CHANGES,
    ...P5_PROTECTED_CHANGES,
    ...SETTLEMENT_SCHEDULING_PROTECTED_CHANGES, ...HOSTED_RECOVERY_PROTECTED_CHANGES,
  "supabase/migrations/20261107094755_counsel_inquiry_capture.sql",
]);
const PROTECTED = /wise|webhook|payment-?confirm|paymentConfirm|release-?gate|releaseGate|performFinalRelease|custody|supabase\/(migrations|rls)|rls|serviceRole|service-role|shippo|bluenotary|pip-intel|liaison/i;
// Base resolution never fabricates a merge base. Candidates, in order:
//   1. SALVAGE_AUDIT_BASE (explicit operator/CI override)
//   2. merge-base origin/main HEAD, then merge-base main HEAD (local + CI clones)
//   3. VERCEL_GIT_PREVIOUS_SHA (Vercel's last-deployed commit for this branch)
// Each candidate must resolve to a commit object present in this clone.
// If none resolves, the diff subcheck is reported as UNAVAILABLE, never PASS.
// Outside Vercel (or with SALVAGE_AUDIT_REQUIRE_DIFF=1) UNAVAILABLE is a failure.
const git = (args) => {
  const r = spawnSync("git", args, { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  return r.status === 0 ? r.stdout.trim() : null;
};
const isCommit = (sha) => Boolean(sha) && git(["cat-file", "-e", `${sha}^{commit}`]) !== null;
function resolveBase() {
  const explicit = process.env.SALVAGE_AUDIT_BASE?.trim();
  if (explicit) return isCommit(explicit) ? { sha: explicit, source: "SALVAGE_AUDIT_BASE" } : null;
  for (const ref of ["origin/main", "main"]) {
    if (!isCommit(ref)) continue;
    const mb = git(["merge-base", ref, "HEAD"]);
    if (isCommit(mb)) return { sha: mb, source: `merge-base ${ref} HEAD` };
  }
  const previous = process.env.VERCEL_GIT_PREVIOUS_SHA?.trim();
  if (isCommit(previous)) return { sha: previous, source: "VERCEL_GIT_PREVIOUS_SHA" };
  return null;
}
const base = resolveBase();
if (base) {
  const diff = git(["diff", "--name-only", base.sha, "HEAD"]);
  if (diff === null) fail(`git diff ${base.sha}..HEAD could not be computed`);
  else {
    const touched = diff.split("\n").filter((f) => f && PROTECTED.test(f) && !APPROVED_ADDITIVE_MIGRATIONS.has(f));
    if (touched.length) fail(`Branch touches protected files: ${touched.join(", ")}`);
    else ok(`No unapproved protected files touched (base: ${base.source} ${base.sha.slice(0, 12)})`);
  }
} else {
  const requireDiff = process.env.SALVAGE_AUDIT_REQUIRE_DIFF === "1" || process.env.VERCEL !== "1";
  const message = "protected-file diff subcheck UNAVAILABLE: no resolvable base commit in this clone (origin/main, main and VERCEL_GIT_PREVIOUS_SHA absent). This subcheck did NOT pass; it did not run.";
  if (requireDiff) fail(message);
  else console.log(`NOT_APPLICABLE: ${message} Isolation and artifact checks below still run.`);
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
