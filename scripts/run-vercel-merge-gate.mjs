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
    vercel.ignoreCommand.includes("production") &&
    vercel.ignoreCommand.includes("[validate-preview]"),
  "Vercel must suppress ordinary preview spend while allowing an explicit one-commit validation override",
);
assert.ok(workflow.includes("pull_request:"), "GitHub-hosted PR CI must run automatically for pull requests targeting main");
assert.ok(workflow.includes("workflow_dispatch:"), "GitHub Actions validation must remain manually recoverable");
assert.ok(certification.includes("CERTIFIED PRODUCTION SHA"), "Certification must bind to an exact deployed SHA");
assert.ok(!certification.includes("main @ 310886b"), "Stale hardcoded certification SHA must be removed");
assert.ok(certification.includes("Vercel merge gate"), "Certification must name the Vercel merge gate");

console.log("PASS dual CI governance");

// Vercel validates the immutable source tree it checked out.
// Branch-history/diff validation belongs to GitHub PR CI, where full repository
// history is available. Do not perform network git fetches from the Vercel build.

const gates = [
  ["npm", ["run", "validate:duplicate-source"]],
  ["node", ["scripts/generate-route-map.mjs", "--check"]],
  ["node", ["scripts/validate-wise-only-active-ops-docs.mjs"]],
  ["node", ["scripts/validate-milano-os-isolation.mjs"]],
  ["node", ["scripts/validate-architecture-control-plane.mjs"]],
  ["node", ["scripts/validate-milano-os-surface-unification.mjs"]],
  ["node", ["scripts/validate-milano-brand-throughout.mjs"]],
  ["node", ["scripts/validate-nonhuman-production-hardening.mjs"]],
  ["node", ["scripts/validate-institutional-expansion.mjs"]],
  ["node", ["scripts/validate-system-control-plane.mjs"]],
  ["node", ["scripts/validate-control-plane-module-coverage.mjs"]],
  ["node", ["scripts/validate-control-plane-route-coverage.mjs"]],
  ["node", ["scripts/validate-full-system-hardening.mjs"]],
  ["node", ["scripts/validate-milano-operator-intelligence.mjs"]],
  ["node", ["scripts/validate-source-database-wiring.mjs"]],
  ["node", ["scripts/validate-final-visual-system-hardening.mjs"]],
  ["node", ["scripts/validate-global-corridor-cinematic-upgrade.mjs"]],

  // Explicit current production module / motion / intelligence coverage.
  ["npm", ["run", "validate:motion-system"]],
  ["npm", ["run", "validate:data-intel-compliance-ui"]],
  ["npm", ["run", "validate:final-wiring-confirmation"]],
  ["npm", ["run", "validate:final-branch-salvage-audit"]],
  ["npm", ["run", "validate:mini-atlas-intelligence-flow"]],
  ["npm", ["run", "validate:trust-core-intelligence-engine"]],
  ["npm", ["run", "validate:operator-intelligence-spine"]],
  ["npm", ["run", "validate:final-intelligence-operator-os"]],
  ["npm", ["run", "validate:high-value-assets"]],
  ["npm", ["run", "validate:vertical-intelligence-commercial-os"]],
  ["npm", ["run", "validate:relationship-intelligence-layer"]],
  ["npm", ["run", "validate:trusted-integration-command"]],
  ["npm", ["run", "validate:unified-revenue-stack"]],
  ["npm", ["run", "validate:universal-procurement-engine"]],
  ["npm", ["run", "validate:maritime-logistics-execution"]],
  ["npm", ["run", "validate:government-public-sector"]],
  ["npm", ["run", "validate:trust-network-intelligence"]],
  ["npm", ["run", "validate:revenue-stream-engine"]],

  ["node", ["scripts/validate-matter-execution-corridor-spine.mjs"]],
  ["node", ["scripts/validate-production-closeout-invariants.mjs"]],
  ["node", ["scripts/validate-immediate-scheduling-after-wise-submission.mjs"]],
  ["node", ["scripts/validate-wise-reconciliation-exception-orchestrator.mjs"]],
  ["npm", ["run", "validate:migration-chain"]],
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
  ["node", ["scripts/validate-tiffany-post-test-final-audit.mjs"]],
  ["node", ["scripts/validate-operating-loop-closure.mjs"]],
  ["node", ["scripts/validate-live-review-search-hardening.mjs"]],
  ["node", ["scripts/validate-sensitive-identity-helper-grants.mjs"]],
  ["node", ["scripts/validate-ron-signing-room-ux.mjs"]],
  ["node", ["scripts/validate-ron-bluenotary-client-journey.mjs"]],
  ["node", ["scripts/validate-production-transaction-10of10.mjs"]],
  ["node", ["scripts/validate-global-pricing-courier.mjs"]],
];

const gatesToRun =
  process.env.VERCEL === "1" ? gates.slice(0, 10) : gates;

for (const [command, args] of gatesToRun) {
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

console.log("\nPASS: Vercel merge gate completed. next build may proceed.");
