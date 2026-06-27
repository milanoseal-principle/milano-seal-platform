#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(__dirname, "..");
let failures = 0;

function fail(message: string): void {
  console.error(`  ✗ FAIL: ${message}`);
  failures += 1;
}

function pass(message: string): void {
  console.log(`  ✓ PASS: ${message}`);
}

function rel(path: string): string {
  return relative(ROOT, path);
}

function checkJson(relativePath: string, required = true): unknown | null {
  const abs = join(ROOT, relativePath);

  if (!existsSync(abs)) {
    if (required) fail(`${relativePath} does not exist`);
    else console.log(`  — SKIP: ${relativePath} not present`);
    return null;
  }

  try {
    const content = readFileSync(abs, "utf8");
    const parsed = JSON.parse(content);
    pass(`${relativePath} is valid JSON`);
    return parsed;
  } catch {
    fail(`${relativePath} is not valid JSON — possible bad merge`);
    return null;
  }
}

function walkFiles(dir: string): string[] {
  const results: string[] = [];

  if (!existsSync(dir)) return results;

  for (const file of readdirSync(dir)) {
    const full = join(dir, file);
    const stat = statSync(full);

    if (stat.isDirectory()) {
      if (
        file === "node_modules" ||
        file === ".next" ||
        file === ".claude" ||
        file === ".git" ||
        file === "coverage"
      ) {
        continue;
      }

      results.push(...walkFiles(full));
      continue;
    }

    if (/\.(tsx?|jsx?|mjs|cjs|css|md|json)$/.test(file)) {
      results.push(full);
    }
  }

  return results;
}

function readSafe(file: string): string {
  try {
    return readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

function filesMatching(files: string[], pattern: RegExp): string[] {
  return files.filter((file) => pattern.test(readSafe(file)));
}

console.log("\n[1] Config file integrity");
checkJson("package.json");
checkJson("tsconfig.json");
checkJson(".eslintrc.json", false);
checkJson("vercel.json", false);

console.log("\n[2] next.config.mjs");
const nextConfigPath = join(ROOT, "next.config.mjs");
if (!existsSync(nextConfigPath)) {
  fail("next.config.mjs does not exist");
} else {
  const content = readSafe(nextConfigPath);
  const matches = [...content.matchAll(/const\s+nextConfig\s*=/g)];

  if (matches.length === 0) fail("next.config.mjs has no nextConfig export");
  else if (matches.length > 1) {
    fail(`next.config.mjs has ${matches.length} nextConfig definitions — possible bad merge`);
  } else {
    pass("next.config.mjs has exactly one nextConfig export");
  }
}

console.log("\n[3] Root layout");
const layoutPaths = ["app/layout.tsx", "src/app/layout.tsx"];
const layoutPath = layoutPaths.find((path) => existsSync(join(ROOT, path)));

if (!layoutPath) {
  fail("No root layout.tsx found");
} else {
  const content = readSafe(join(ROOT, layoutPath));
  const rootExports = [
    ...content.matchAll(/export\s+default\s+function\s+(RootLayout|Layout)/g),
  ];

  if (rootExports.length === 0) fail(`${layoutPath} missing RootLayout default export`);
  else if (rootExports.length > 1) fail(`${layoutPath} has duplicate RootLayout exports`);
  else pass(`${layoutPath} has valid RootLayout export`);
}

console.log("\n[4] Root page");
const pagePaths = ["app/page.tsx", "src/app/page.tsx"];
const pagePath = pagePaths.find((path) => existsSync(join(ROOT, path)));

if (!pagePath) {
  fail("No root page.tsx found");
} else {
  const content = readSafe(join(ROOT, pagePath));
  const hasDefault =
    /export\s+default\s+function/.test(content) ||
    /export\s+default\s+async\s+function/.test(content) ||
    /export\s+\{\s*\w+\s+as\s+default\s*\}/.test(content);

  if (!hasDefault) fail(`${pagePath} missing default export`);
  else pass(`${pagePath} has default export`);
}

const scannedDirs = ["app", "components", "lib", "src", "scripts"].filter((dir) =>
  existsSync(join(ROOT, dir)),
);

const allFiles: string[] = [];
for (const dir of scannedDirs) {
  allFiles.push(...walkFiles(join(ROOT, dir)));
}

const sourceFiles = allFiles.filter((file) => /\.(tsx?|jsx?|mjs|cjs)$/.test(file));
const productionFiles = allFiles.filter((file) => {
  const name = rel(file);
  return (
    !name.startsWith("docs/") &&
    !name.includes(".claude/") &&
    !name.includes("node_modules/") &&
    !name.includes(".next/")
  );
});

console.log("\n[5] Forbidden Milano Seal production content patterns");
const forbiddenPatterns: { pattern: RegExp; label: string }[] = [
  { pattern: /Survisure/i, label: "Survisure reference" },
  {
    pattern: /HVAC|appliance\s+claim|work.?order|service.?contract/i,
    label: "HVAC/appliance/service-contract language",
  },
  { pattern: /product.?registration/i, label: "product registration language" },
];

let forbiddenFound = false;

// Exclude this validator's own source — it legitimately contains the pattern
// strings it scans for.
const contentScanFiles = productionFiles.filter(
  (file) => !rel(file).startsWith("scripts/validate-project"),
);

for (const { pattern, label } of forbiddenPatterns) {
  const hits = filesMatching(contentScanFiles, pattern);

  if (hits.length > 0) {
    fail(`Forbidden pattern (${label}) found in: ${hits.map(rel).join(", ")}`);
    forbiddenFound = true;
  }
}

if (!forbiddenFound) pass("No forbidden Survisure/HVAC/appliance patterns found");

console.log("\n[6] Stripe Checkout guard");
const stripePatterns = [
  /stripe\.checkout\.sessions\.create/,
  /allow_promotion_codes/,
  /checkout\.session\.completed/,
  /loadStripe\(/,
];

const paymentFiles = sourceFiles.filter((file) => {
  const name = rel(file);
  return (
    name.includes("/portal/") ||
    name.includes("/api/") ||
    name.includes("/payment") ||
    name.includes("/payments/")
  );
});

let stripeFound = false;

for (const pattern of stripePatterns) {
  const hits = filesMatching(paymentFiles, pattern);

  if (hits.length > 0) {
    fail(`Stripe Checkout pattern (${pattern.source}) found in: ${hits.map(rel).join(", ")}`);
    stripeFound = true;
  }
}

if (!stripeFound) pass("No Stripe Checkout patterns found in payment/portal routes");

console.log("\n[7] Public header offset guard");
const publicRouteFiles = sourceFiles.filter((file) => {
  const name = rel(file);
  if (!name.startsWith("app/")) return false;
  if (!name.endsWith("page.tsx")) return false;

  return (
    name === "app/page.tsx" ||
    name.startsWith("app/countries/") ||
    name.startsWith("app/apostille/") ||
    name.startsWith("app/map/") ||
    name.startsWith("app/intake/") ||
    name.startsWith("app/review/") ||
    name.startsWith("app/about/") ||
    name.startsWith("app/founder/") ||
    name.startsWith("app/login/")
  );
});

const unsafeOffsetHits = publicRouteFiles.filter((file) => {
  const content = readSafe(file);
  if (content.includes("ms-allow-hardcoded-offset")) return false;
  return /\bpt-(20|24|28|32)\b/.test(content) && !content.includes("header-total-height");
});

if (unsafeOffsetHits.length > 0) {
  fail(`Hardcoded public top offsets found: ${unsafeOffsetHits.map(rel).join(", ")}`);
} else {
  pass("No unsafe hardcoded public top offsets found");
}

console.log("\n[8] Country name truncation guard");
const truncationFiles = sourceFiles.filter((file) => {
  const name = rel(file);
  // Operator/internal surfaces use dense tables where whitespace-nowrap on
  // header cells is intentional; this guard targets public country surfaces.
  if (
    name.includes("/dashboard/") ||
    name.includes("components/dashboard/") ||
    name.includes("/va/") ||
    name.includes("/alliance/") ||
    name.includes("/ops/") ||
    name.includes("/internal/") ||
    name.includes("/admin/")
  ) {
    return false;
  }
  return (
    name.includes("Destination") ||
    name.includes("Country") ||
    name.includes("countries") ||
    name.includes("apostille")
  );
});

const truncationHits = truncationFiles.filter((file) => {
  const content = readSafe(file);
  if (content.includes("ms-allow-country-truncate")) return false;
  return /className=["'`][^"'`]*(truncate|text-ellipsis|line-clamp|whitespace-nowrap)[^"'`]*["'`]/.test(
    content,
  );
});

if (truncationHits.length > 0) {
  fail(`Possible country/title truncation found: ${truncationHits.map(rel).join(", ")}`);
} else {
  pass("No country/title truncation patterns found");
}

console.log("\n[9] Critical card clipping guard");
const criticalCardHits = sourceFiles.filter((file) => {
  const content = readSafe(file);
  if (!content.includes("data-critical-card")) return false;
  if (content.includes("ms-allow-critical-overflow-hidden")) return false;
  return /data-critical-card[\s\S]{0,240}overflow-hidden/.test(content);
});

if (criticalCardHits.length > 0) {
  fail(`Critical card wrapper uses overflow-hidden: ${criticalCardHits.map(rel).join(", ")}`);
} else {
  pass("No critical card wrapper clipping patterns found");
}

console.log("\n[10] Secret leak guard");
const clientFacingFiles = sourceFiles.filter((file) => {
  const name = rel(file);
  return (
    name.startsWith("app/") ||
    name.startsWith("components/") ||
    name.startsWith("src/")
  );
});

const serviceRoleClientHits = clientFacingFiles.filter((file) => {
  const name = rel(file);
  if (name.includes("/api/")) return false;
  if (name.includes("server")) return false;
  if (name.includes("admin")) return false;
  const content = readSafe(file);
  // The leak risk is client components shipping the key to the browser.
  // Server components may safely reference it; checklist text that only names
  // the env var (e.g. "SUPABASE_SERVICE_ROLE_KEY set, not in code") is not a leak.
  if (!/^["']use client["']/m.test(content)) return false;
  return /SUPABASE_SERVICE_ROLE_KEY|service_role|service-role/i.test(content);
});

if (serviceRoleClientHits.length > 0) {
  fail(`Service role key reference found in client-facing code: ${serviceRoleClientHits.map(rel).join(", ")}`);
} else {
  pass("No service role key references found in client-facing code");
}

const hardcodedPasswordHits = productionFiles.filter((file) => {
  const name = rel(file);
  if (name.startsWith("docs/")) return false;
  if (name.includes("repair-operator-accounts")) return false;
  const content = readSafe(file);

  return /(password|temp_password)\s*[:=]\s*["'][^"']{6,}["']/i.test(content);
});

if (hardcodedPasswordHits.length > 0) {
  fail(`Possible hardcoded password found: ${hardcodedPasswordHits.map(rel).join(", ")}`);
} else {
  pass("No hardcoded password literals found");
}

console.log(`\n${"─".repeat(56)}`);

if (failures > 0) {
  console.error(`\n✗ Validation FAILED — ${failures} issue(s) found.\n`);
  process.exit(1);
}

console.log("\n✓ All validation checks passed.\n");
process.exit(0);
