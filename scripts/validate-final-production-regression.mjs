// Final production meta-gate.
//
// This is a THIN ORCHESTRATOR. It does NOT re-implement any validation logic:
// it chains the existing Milano Seal validators plus typecheck/lint/test/build,
// runs three source preflight scans, and reports one pass/fail table.
//
// It never calls live Wise / BlueNotary / Shippo / Supabase / Vercel APIs,
// never prints environment-variable values, never mutates repository files, and
// never claims live infrastructure is verified.
//
// Run: node scripts/validate-final-production-regression.mjs
// (helpers are exported for tests; the gate only runs when invoked directly.)

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

export const SELF_SCRIPT = "validate:final-production-regression";

// Preflight source scans. Each returns { name, ok, detail }.
// Uses ripgrep for speed; scans are read-only.
function rg(pattern, paths) {
  const res = spawnSync("rg", ["-n", "--no-messages", pattern, ...paths], {
    encoding: "utf8",
  });
  // rg exit 0 = matches found, 1 = none, 2 = error.
  return { status: res.status, out: (res.stdout || "").trim() };
}

export function mergeArtifactScan() {
  // Real git conflict markers only: "<<<<<<< branch", ">>>>>>> branch", and a
  // bare "=======" line (exactly 7). Excludes long "====" doc separators.
  const { out } = rg("^(<<<<<<< |>>>>>>> |=======$)", [
    "app",
    "components",
    "lib",
    "tests",
    "scripts",
    "docs",
    "package.json",
  ]);
  return { name: "merge-artifact-scan", ok: out === "", detail: out };
}

export function authSourceScan() {
  // Any user_metadata role/permission/disabled read is a finding UNLESS the line
  // is an explanatory comment or the display-name exception.
  const { out } = rg("user_metadata.{0,4}(role|permissions|disabled)", [
    "app",
    "components",
    "lib",
    "tests",
    "scripts",
    "proxy.ts",
  ]);
  const offending = out
    .split("\n")
    .filter(Boolean)
    .filter((line) => {
      const code = line.replace(/^[^:]*:\d+:/, "").trim();
      // Allow comments (explanatory) and the documented display-name use.
      if (code.startsWith("//") || code.startsWith("*")) return false;
      if (/never|must not|user-writable|display name|solely for/i.test(code)) return false;
      // Allow test assertions that reference the pattern as a string / negated
      // regex (they verify ABSENCE of the read, not perform one).
      if (/assert|\.test\(|!\/|expect\(/.test(code)) return false;
      return true;
    });
  return {
    name: "auth-source-scan",
    ok: offending.length === 0,
    detail: offending.join("\n"),
  };
}

export function secretExposureScan() {
  // The risk is a secret VALUE reaching the client — i.e. a `process.env.<SECRET>`
  // read in a client/public surface. Displaying a secret's NAME as a config-label
  // string (e.g. the operator go-live checklist) is not exposure.
  const { out } = rg(
    "process\\.env\\.(SUPABASE_SERVICE_ROLE|WISE_API|WISE_TOKEN|SHIPPO_API|BLUENOTARY_API|PRIVATE_KEY|SECRET_KEY)",
    ["app", "components", "public"],
  );
  const offending = out
    .split("\n")
    .filter(Boolean)
    // API route handlers (server-only) legitimately read secrets; the client
    // risk is components / public assets.
    .filter((line) => !/^app\/api\//.test(line))
    .filter((line) => {
      const code = line.replace(/^[^:]*:\d+:/, "").trim();
      return !(code.startsWith("//") || code.startsWith("*"));
    });
  return {
    name: "secret-exposure-scan",
    ok: offending.length === 0,
    detail: offending.join("\n"),
  };
}

// Release-critical validators: security, canonical structure, and the
// complimentary-Matter flow. These MUST be green to ship — the meta-gate
// hard-fails on any of them. (All are green on the baseline commit.)
export const REQUIRED_VALIDATORS = [
  "validate:complimentary-matter-flow",
  "validate:route-registry",
  "validate:cross-system-gates",
  "validate:canonical-foundation",
  "validate:responsive-safety",
  "validate:final-wiring-confirmation",
];

// Discover existing validators to chain: pure `node scripts/*.mjs` validate:*
// scripts (offline, no network), excluding this meta-gate itself.
export function collectValidators(pkg) {
  const scripts = pkg.scripts ?? {};
  const toRun = [];
  for (const [name, cmd] of Object.entries(scripts)) {
    if (!name.startsWith("validate:")) continue;
    if (name === SELF_SCRIPT) continue;
    if (!/^node\s+scripts\/[\w.-]+\.mjs$/.test(cmd.trim())) continue; // pure node only
    toRun.push(name);
  }
  return toRun;
}

// Advisory validators = every pure-node validator that is NOT release-critical.
// They are run and REPORTED but do not block the gate (many are content/copy
// linters with pre-existing findings tracked separately).
export function collectAdvisory(pkg) {
  const required = new Set(REQUIRED_VALIDATORS);
  return collectValidators(pkg).filter((n) => !required.has(n));
}

// Report which of a preferred list are present vs missing (skipped).
export function partitionPreferred(pkg, preferred) {
  const scripts = pkg.scripts ?? {};
  const present = preferred.filter((n) => n in scripts);
  const missing = preferred.filter((n) => !(n in scripts));
  return { present, missing };
}

function runStep(label, cmd, args) {
  const start = process.hrtime.bigint();
  const res = spawnSync(cmd, args, { stdio: "inherit" });
  const ms = Number(process.hrtime.bigint() - start) / 1e6;
  return { label, ok: (res.status ?? 1) === 0, ms };
}

function parsePackage() {
  try {
    return JSON.parse(readFileSync("package.json", "utf8"));
  } catch {
    return null;
  }
}

async function main() {
  const results = [];
  const stopWith = (rows, code) => {
    console.log("\nFinal production meta-gate");
    console.log("─".repeat(52));
    for (const r of rows) {
      const status = r.ok ? "PASS" : "FAIL";
      const dur = r.ms != null ? `${Math.round(r.ms)}ms` : "";
      console.log(`  ${status.padEnd(5)} ${r.label.padEnd(38)} ${dur}`);
    }
    console.log("─".repeat(52));
    process.exit(code);
  };

  // 1. package.json must be valid.
  const pkg = parsePackage();
  results.push({ label: "package.json valid", ok: pkg !== null });
  if (!pkg) stopWith(results, 1);

  // 2. Preflight scans BEFORE any build.
  for (const scan of [mergeArtifactScan(), authSourceScan(), secretExposureScan()]) {
    results.push({ label: scan.name, ok: scan.ok });
    if (!scan.ok) {
      console.error(`\n${scan.name} FAILED:\n${scan.detail}`);
      stopWith(results, 1);
    }
  }

  // 3. Release-critical validators — hard fail.
  for (const name of REQUIRED_VALIDATORS) {
    if (!(name in (pkg.scripts ?? {}))) {
      results.push({ label: `${name} (missing)`, ok: false });
      stopWith(results, 1);
    }
    const r = runStep(name, "npm", ["run", "--silent", name]);
    results.push(r);
    if (!r.ok) stopWith(results, 1);
  }

  // 4. Core gates — hard fail.
  for (const [label, cmd, args] of [
    ["typecheck", "npm", ["run", "--silent", "typecheck"]],
    ["lint", "npm", ["run", "--silent", "lint"]],
    ["test", "npm", ["test", "--silent"]],
    ["build", "npm", ["run", "--silent", "build"]],
  ]) {
    const r = runStep(label, cmd, args);
    results.push(r);
    if (!r.ok) stopWith(results, 1);
  }

  // 5. Advisory validators — REPORTED, non-blocking. Pre-existing findings are
  // surfaced here honestly without failing the release gate or hiding them.
  const advisory = [];
  for (const name of collectAdvisory(pkg)) {
    const r = runStep(name, "npm", ["run", "--silent", name]);
    advisory.push(r);
  }
  const advisoryFail = advisory.filter((r) => !r.ok);
  console.log("\nAdvisory validators (non-blocking):");
  console.log(`  ${advisory.length - advisoryFail.length}/${advisory.length} passed`);
  if (advisoryFail.length) {
    console.log("  Reporting (does not block release):");
    for (const r of advisoryFail) console.log(`    REPORT ${r.label}`);
  }

  // Exit reflects REQUIRED gates only.
  stopWith(results, results.every((r) => r.ok) ? 0 : 1);
}

const invokedDirectly = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (invokedDirectly) {
  main();
}
