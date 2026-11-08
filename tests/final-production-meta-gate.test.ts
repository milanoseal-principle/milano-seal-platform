import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
// @ts-ignore - plain .mjs orchestrator, no type declarations
import {
  collectValidators,
  collectAdvisory,
  partitionPreferred,
  mergeArtifactScan,
  authSourceScan,
  secretExposureScan,
  REQUIRED_VALIDATORS,
  SELF_SCRIPT,
} from "../scripts/validate-final-production-regression.mjs";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const SOURCE = readFileSync("scripts/validate-final-production-regression.mjs", "utf8");
const signoff = readFileSync("docs/deployment/FINAL_PRODUCTION_SIGN_OFF.md", "utf8");

test("meta-gate chains ONLY existing pure-node validators, excluding itself", () => {
  const chained = collectValidators(pkg);
  assert.ok(chained.length > 10, "should chain the existing validator suite");
  assert.ok(!chained.includes(SELF_SCRIPT), "must not call itself");
  for (const name of chained) {
    assert.ok(name in pkg.scripts, `${name} must exist`);
    assert.match(pkg.scripts[name], /^node\s+scripts\/[\w.-]+\.mjs$/);
  }
});

test("missing optional validator is reported as skipped, present ones as present", () => {
  const { present, missing } = partitionPreferred(pkg, [
    "validate:complimentary-matter-flow", // exists
    "validate:motion-system", // exists
    "validate:does-not-exist-xyz", // missing
  ]);
  assert.deepEqual(missing, ["validate:does-not-exist-xyz"]);
  assert.ok(present.includes("validate:complimentary-matter-flow"));
});

test("meta-gate runs the four core gates", () => {
  for (const step of ["typecheck", "lint", '"test"', "build"]) {
    assert.ok(SOURCE.includes(step), `must run ${step}`);
  }
});

test("meta-gate stops on first REQUIRED failure and exits nonzero", () => {
  assert.ok(/stopWith\(results, 1\)/.test(SOURCE));
  assert.ok(/if \(!r\.ok\) stopWith/.test(SOURCE));
});

test("release-critical validators all exist and are separate from advisory", () => {
  for (const name of REQUIRED_VALIDATORS) {
    assert.ok(name in pkg.scripts, `${name} must exist`);
  }
  const advisory = collectAdvisory(pkg);
  for (const name of REQUIRED_VALIDATORS) {
    assert.ok(!advisory.includes(name), `${name} must not also be advisory`);
  }
  // Advisory is the remainder of the pure-node validators.
  assert.equal(advisory.length, collectValidators(pkg).length - REQUIRED_VALIDATORS.length);
});

test("remaining validators block final certification on failure", () => {
  const remainingBlock = SOURCE.slice(SOURCE.indexOf("5. Remaining"));
  assert.match(remainingBlock, /results\.push\(r\)/);
  assert.match(remainingBlock, /if \(!r\.ok\) stopWith\(results, 1\)/);
  assert.doesNotMatch(remainingBlock, /does not block|non-blocking/);
});

test("meta-gate makes NO live provider / infra calls and prints no env values", () => {
  assert.ok(!/\bfetch\(|\baxios|https?:\/\/[a-z]/i.test(SOURCE), "no network calls / URL literals");
  assert.ok(!/console\.log\([^)]*process\.env/.test(SOURCE), "no env values printed");
});

test("preflight scans return the expected clean shape on this repo", () => {
  // On a clean checkout all three scans must pass (main is green).
  assert.equal(mergeArtifactScan().ok, true);
  assert.equal(authSourceScan().ok, true);
  assert.equal(secretExposureScan().ok, true);
});

// ── Sign-off document contract ───────────────────────────────────────────────
test("sign-off contains all 15 required sections", () => {
  for (const section of [
    "Release Identity",
    "Code Gates",
    "Vercel",
    "Supabase",
    "Tiffany",
    "Wise",
    "BlueNotary",
    "Shippo",
    "Paid Matter",
    "Complimentary Matter",
    "Role Verification",
    "Device QA",
    "Accessibility",
    "Remaining Blockers",
    "Final Status",
  ]) {
    assert.ok(signoff.includes(section), `missing section: ${section}`);
  }
});

test("unverified live items default to NOT VERIFIED, never a checked box", () => {
  // Live infra rows must be NOT VERIFIED (no fabricated checkmarks).
  assert.ok(/NOT VERIFIED/.test(signoff));
  assert.ok(!/\[x\].*Wise/i.test(signoff), "Wise must not be pre-checked");
  assert.ok(!/\[x\].*Shippo/i.test(signoff), "Shippo must not be pre-checked");
});

test("final status is not PRODUCTION VERIFIED while live items are unverified", () => {
  assert.ok(/PRODUCTION CODE VERIFIED — LIVE INFRASTRUCTURE ACTION REQUIRED/.test(signoff));
  // The ## 15. Final Status heading must resolve to the CODE-VERIFIED variant,
  // not a bare "PRODUCTION VERIFIED".
  const finalSection = signoff.slice(signoff.indexOf("## 15. Final Status"));
  assert.ok(/\*\*PRODUCTION CODE VERIFIED — LIVE INFRASTRUCTURE ACTION REQUIRED\*\*/.test(finalSection));
});
