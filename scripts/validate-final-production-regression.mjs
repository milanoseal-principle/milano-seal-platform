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
      if (code.startsWith("//") || code.startsWith("*")) return false;
      if (/never|must not|user-writable|display name|solely for/i.test(code)) return false;
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
  const { out } = rg(
    "process\\.env\\.(SUPABASE_SERVICE_ROLE|WISE_API|WISE_TOKEN|SHIPPO_API|BLUENOTARY_API|PRIVATE_KEY|SECRET_KEY)",
    ["app", "components", "public"],
  );
  const offending = out
    .split("\n")
    .filter(Boolean)
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

export const REQUIRED_VALIDATORS = [
  "validate:damiani-production-wiring",
  "validate:complimentary-matter-flow",
  "validate:route-registry",
  "validate:cross-system-gates",
  "validate:canonical-foundation",
  "validate:responsive-safety",
  "validate:final-wiring-confirmation",
];

export function collectValidators(pkg) {
  const scripts = pkg.scripts ?? {};
  const toRun = [];
  for (const [name, cmd] of Object.entries(scripts)) {
    if (!name.startsWith("validate:")) continue;
    if (name === SELF_SCRIPT) continue;
    if (!/^node\s+scripts\/[\w.-]+\.mjs$/.test(cmd.trim())) continue;
    toRun.push(name);
  }
  return toRun;
}

export function collectAdvisory(pkg) {
  const required = new Set(REQUIRED_VALIDATORS);
  return collectValidators(pkg).filter((n) => !required.has(n));
}

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

  const pkg = parsePackage();
  results.push({ label: "package.json valid", ok: pkg !== null });
  if (!pkg) stopWith(results, 1);

  for (const scan of [mergeArtifactScan(), authSourceScan(), secretExposureScan()]) {
    results.push({ label: scan.name, ok: scan.ok });
    if (!scan.ok) {
      console.error(`\n${scan.name} FAILED:\n${scan.detail}`);
      stopWith(results, 1);
    }
  }

  for (const name of REQUIRED_VALIDATORS) {
    if (!(name in (pkg.scripts ?? {}))) {
      results.push({ label: `${name} (missing)`, ok: false });
      stopWith(results, 1);
    }
    const r = runStep(name, "npm", ["run", "--silent", name]);
    results.push(r);
    if (!r.ok) stopWith(results, 1);
  }

  // Core gates — hard fail. Use the repository's canonical scripts so the
  // final gate remains deterministic/offline and cannot drift by downloading a
  // different tool version from the network during release validation.
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

  // 5. Advisory validators are reported for release visibility. A failure here
  // does not block the required production gate above.
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

  stopWith(results, results.every((r) => r.ok) ? 0 : 1);
}

const invokedDirectly = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (invokedDirectly) {
  main();
}
