#!/usr/bin/env node
/**
 * Milano Seal — Pre-build project validation.
 * Run with: npx tsx scripts/validate-project.ts
 *
 * Checks config files for corruption and guards against forbidden patterns.
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");
let failures = 0;

function fail(message: string): void {
  console.error(`  ✗ FAIL: ${message}`);
  failures++;
}

function pass(message: string): void {
  console.log(`  ✓ PASS: ${message}`);
}

function checkJson(relativePath: string, required = true): unknown | null {
  const abs = join(ROOT, relativePath);
  if (!existsSync(abs)) {
    if (required) fail(`${relativePath} does not exist`);
    else console.log(`  — SKIP: ${relativePath} not present (optional)`);
    return null;
  }
  try {
    const content = readFileSync(abs, "utf-8");
    const parsed = JSON.parse(content);
    pass(`${relativePath} is valid JSON`);
    return parsed;
  } catch {
    fail(`${relativePath} is not valid JSON — possible bad merge`);
    return null;
  }
}

// ── 1. Config files ───────────────────────────────────────────────────────────
console.log("\n[1] Config file integrity");
checkJson("package.json");
checkJson("tsconfig.json");
checkJson(".eslintrc.json", false);
checkJson("vercel.json", false);

// ── 2. next.config.mjs — single nextConfig export ────────────────────────────
console.log("\n[2] next.config.mjs");
const nextConfigPath = join(ROOT, "next.config.mjs");
if (!existsSync(nextConfigPath)) {
  fail("next.config.mjs does not exist");
} else {
  const content = readFileSync(nextConfigPath, "utf-8");
  const matches = [...content.matchAll(/const\s+nextConfig\s*=/g)];
  if (matches.length === 0) fail("next.config.mjs has no nextConfig export");
  else if (matches.length > 1)
    fail(
      `next.config.mjs has ${matches.length} nextConfig definitions — possible bad merge`,
    );
  else pass("next.config.mjs has exactly one nextConfig export");
}

// ── 3. Root layout ────────────────────────────────────────────────────────────
console.log("\n[3] Root layout");
const layoutPaths = ["app/layout.tsx", "src/app/layout.tsx"];
const layoutPath = layoutPaths.find((p) => existsSync(join(ROOT, p)));
if (!layoutPath) {
  fail("No root layout.tsx found");
} else {
  const content = readFileSync(join(ROOT, layoutPath), "utf-8");
  const rootExports = [
    ...content.matchAll(/export\s+default\s+function\s+(RootLayout|Layout)/g),
  ];
  if (rootExports.length === 0)
    fail(`${layoutPath} missing RootLayout default export`);
  else if (rootExports.length > 1)
    fail(`${layoutPath} has duplicate RootLayout exports — bad merge`);
  else pass(`${layoutPath} has valid RootLayout export`);
}

// ── 4. Root page ─────────────────────────────────────────────────────────────
console.log("\n[4] Root page");
const pagePaths = ["app/page.tsx", "src/app/page.tsx"];
const pagePath = pagePaths.find((p) => existsSync(join(ROOT, p)));
if (!pagePath) {
  fail("No root page.tsx found");
} else {
  const content = readFileSync(join(ROOT, pagePath), "utf-8");
  const hasDefault =
    /export\s+default\s+function/.test(content) ||
    /export\s+default\s+async\s+function/.test(content) ||
    /export\s+\{\s*\w+\s+as\s+default\s*\}/.test(content);
  if (!hasDefault) fail(`${pagePath} missing default export`);
  else pass(`${pagePath} has default export`);
}

// ── 5. Forbidden patterns — Survisure / HVAC / appliance ─────────────────────
console.log("\n[5] Forbidden content patterns (Milano Seal production routes)");
const FORBIDDEN_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /Survisure/i, label: "Survisure reference" },
  { pattern: /HVAC|appliance\s+claim|work.?order|service.?contract/i, label: "HVAC/appliance/service-contract" },
  { pattern: /product.?registration/i, label: "product registration" },
  { pattern: /liability\s+(waiver|form|update)/i, label: "liability form language" },
];

const SCANNED_DIRS = ["app", "components", "lib"].filter((d) =>
  existsSync(join(ROOT, d)),
);

import { readdirSync, statSync } from "node:fs";

function walkFiles(dir: string): string[] {
  const results: string[] = [];
  const list = readdirSync(dir);
  for (const file of list) {
    const full = join(dir, file);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (file === "node_modules" || file === ".next" || file === ".claude") continue;
      results.push(...walkFiles(full));
    } else if (/\.(tsx?|jsx?)$/.test(file)) {
      results.push(full);
    }
  }
  return results;
}

const allFiles: string[] = [];
for (const dir of SCANNED_DIRS) {
  allFiles.push(...walkFiles(join(ROOT, dir)));
}

let forbiddenFound = false;
for (const { pattern, label } of FORBIDDEN_PATTERNS) {
  const hits = allFiles.filter((f) => {
    try {
      return pattern.test(readFileSync(f, "utf-8"));
    } catch {
      return false;
    }
  });
  if (hits.length > 0) {
    fail(`Forbidden pattern (${label}) found in: ${hits.map((h) => h.replace(ROOT + "/", "")).join(", ")}`);
    forbiddenFound = true;
  }
}
if (!forbiddenFound) pass("No forbidden Survisure/HVAC/appliance patterns found");

// ── 6. Forbidden: Stripe Checkout in production payment flow ─────────────────
console.log("\n[6] Stripe Checkout guard");
const STRIPE_CHECKOUT_PATTERNS = [
  /stripe\.checkout\.sessions\.create/,
  /allow_promotion_codes/,
  /checkout\.session\.completed/,
  /loadStripe\(/,
];

const paymentFiles = allFiles.filter((f) =>
  f.includes("/portal/") || f.includes("/api/") || f.includes("/payment"),
);

let stripeFound = false;
for (const pattern of STRIPE_CHECKOUT_PATTERNS) {
  const hits = paymentFiles.filter((f) => {
    try {
      return pattern.test(readFileSync(f, "utf-8"));
    } catch {
      return false;
    }
  });
  if (hits.length > 0) {
    fail(`Stripe Checkout pattern (${pattern.source}) found in: ${hits.map((h) => h.replace(ROOT + "/", "")).join(", ")}`);
    stripeFound = true;
  }
}
if (!stripeFound) pass("No Stripe Checkout patterns found in payment/portal routes");

// ── Result ────────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(56)}`);
if (failures > 0) {
  console.error(`\n✗ Validation FAILED — ${failures} issue(s) found.\n`);
  process.exit(1);
} else {
  console.log("\n✓ All validation checks passed.\n");
  process.exit(0);
}
