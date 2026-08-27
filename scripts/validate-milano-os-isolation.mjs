import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";

const ROOTS = ["app", "components", "lib", "data", "docs"];
const TEXT_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".md", ".json", ".css"]);
const SKIP_DIRS = new Set(["node_modules", ".next", ".git"]);

const FOREIGN_PRODUCT_PATTERNS = [
  { label: "Liaison OS", pattern: /\bLiaison\s+OS\b/i },
  { label: "EnsureProtect", pattern: /\bEnsureProtect\b/i },
  { label: "Demesmin", pattern: /\bDemesmin\b/i },
  { label: "Dover", pattern: /\bDover\b/i },
  { label: "WCI", pattern: /\bWCI\b/ },
];

// These are not forbidden English words. They are implementation-level markers
// of an insurance/claims product model and therefore must not become Milano Seal
// platform schema/navigation by copy-paste from a reference application.
const FOREIGN_INSURANCE_MODEL_PATTERNS = [
  { label: "policyNumber", pattern: /\bpolicyNumber\b/ },
  { label: "claimNumber", pattern: /\bclaimNumber\b/ },
  { label: "coverageType", pattern: /\bcoverageType\b/ },
  { label: "insuranceCarrier", pattern: /\binsuranceCarrier\b/ },
  { label: "claimsAdministration", pattern: /\bclaimsAdministration\b/i },
];

function walk(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path, files);
    else if (TEXT_EXTENSIONS.has(extname(path))) files.push(path);
  }
  return files;
}

const files = ROOTS.flatMap((root) => walk(root));
const violations = [];

for (const file of files) {
  const source = readFileSync(file, "utf8");
  for (const rule of [...FOREIGN_PRODUCT_PATTERNS, ...FOREIGN_INSURANCE_MODEL_PATTERNS]) {
    if (rule.pattern.test(source)) violations.push(`${file}: ${rule.label}`);
  }
}

assert.deepEqual(
  violations,
  [],
  `Foreign product/insurance-model contamination found:\n${violations.join("\n")}`,
);

const roleMap = readFileSync("lib/auth/roleRedirect.ts", "utf8");
const portalLayout = readFileSync("app/portal/layout.tsx", "utf8");
const envExample = readFileSync(".env.example", "utf8");

for (const required of [
  'client: "/portal"',
  'operator: "/dashboard"',
  'admin: "/dashboard"',
  'owner: "/dashboard"',
  'va: "/va/dashboard"',
  'alliance: "/alliance/dashboard"',
]) {
  assert.ok(roleMap.includes(required), `Canonical portal topology missing: ${required}`);
}

assert.ok(
  portalLayout.includes("normalizeUserRole") && portalLayout.includes('role !== "client"'),
  "Client Portal layout must enforce the canonical client-only role map",
);
assert.ok(
  !portalLayout.includes("FOUNDER_PREVIEW_ROLES"),
  "Client Portal must not maintain a second founder-preview authorization model",
);

for (const required of [
  "NEXT_PUBLIC_SITE_URL=https://themilanoseal.com",
  "NEXT_PUBLIC_APP_URL=https://themilanoseal.com",
  "PAYMENT_BASE_URL=https://themilanoseal.com",
]) {
  assert.ok(envExample.includes(required), `Canonical Milano Seal origin missing: ${required}`);
}

console.log(
  `PASS Milano Seal OS isolation: ${files.length} active text files clean; canonical same-origin portal topology and client role boundary locked`,
);
