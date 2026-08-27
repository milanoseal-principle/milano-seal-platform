import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const vercel = JSON.parse(readFileSync("vercel.json", "utf8"));
const workflow = readFileSync(".github/workflows/pr-ci.yml", "utf8");
const certification = readFileSync("docs/FINAL_PRODUCTION_CERTIFICATION.md", "utf8");

assert.equal(
  vercel.buildCommand,
  "node scripts/run-vercel-merge-gate.mjs && next build",
  "Vercel must own the billing-independent merge gate",
);
assert.ok(
  typeof vercel.ignoreCommand === "string" &&
    vercel.ignoreCommand.includes("VERCEL_ENV") &&
    vercel.ignoreCommand.includes("production"),
  "Vercel must retain production-only build behavior to suppress preview spend",
);
assert.ok(
  !workflow.includes("pull_request:"),
  "GitHub-hosted PR CI must remain manual-only during billing bypass",
);
assert.ok(
  workflow.includes("workflow_dispatch:"),
  "Legacy GitHub Actions validation must remain manually recoverable",
);
assert.ok(
  certification.includes("CERTIFIED PRODUCTION SHA"),
  "Certification must bind to an exact deployed SHA",
);
assert.ok(
  !certification.includes("main @ 310886b"),
  "Stale hardcoded certification SHA must be removed",
);
assert.ok(
  certification.includes("Vercel external merge gate"),
  "Certification must name the external merge gate",
);

console.log("PASS billing-independent CI governance");

const gates = [
  ["npm", ["run", "validate:duplicate-source"]],
  ["node", ["scripts/generate-route-map.mjs", "--check"]],
  ["node", ["scripts/validate-wise-only-active-ops-docs.mjs"]],
  ["node", ["scripts/validate-milano-os-isolation.mjs"]],
  ["node", ["scripts/validate-milano-os-surface-unification.mjs"]],
  ["node", ["scripts/validate-milano-operator-intelligence.mjs"]],
  ["node", ["scripts/validate-source-database-wiring.mjs"]],
  ["node", ["scripts/validate-final-visual-system-hardening.mjs"]],
  ["node", ["scripts/validate-global-corridor-cinematic-upgrade.mjs"]],
  ["npm", ["run", "validate:cinematic-ui-system"]],
  ["npm", ["run", "validate:cinematic-route-coverage"]],
  ["npm", ["run", "validate:responsive-safety"]],
  ["npm", ["run", "validate:final-mobile-cosmetic-pass"]],
  ["npm", ["run", "typecheck"]],
  ["npm", ["run", "lint"]],
  ["npm", ["test"]],
  ["npm", ["run", "validate:smart-intake-sop"]],
  ["npm", ["run", "validate:route-registry"]],
  ["npm", ["run", "validate:milano-pre-execution"]],
  ["npm", ["run", "validate:trust-alliance-platform"]],
  ["npm", ["run", "validate:topical-authority-engine"]],
  ["npm", ["run", "validate:final-production-regression"]],
  ["npm", ["run", "validate:production-governance"]],
  ["npm", ["run", "validate:damiani-production-wiring"]],
  ["npm", ["run", "validate:tiff-15-step-production-certification"]],
];

for (const [command, args] of gates) {
  const label = `${command} ${args.join(" ")}`;
  console.log(`\n=== VERCEL MERGE GATE: ${label} ===`);

  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: { ...process.env, CI: "1" },
    shell: process.platform === "win32",
  });

  if (result.error) {
    console.error(`Gate could not start: ${label}`);
    console.error(result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`Gate failed (${result.status}): ${label}`);
    process.exit(result.status ?? 1);
  }
}

console.log(
  "\nPASS: billing-independent Vercel merge gate completed. next build may proceed.",
);
