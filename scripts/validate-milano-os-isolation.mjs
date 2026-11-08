import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";

const ROOTS = ["app", "components", "lib", "data", "docs"];
const TEXT_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".md", ".json", ".css"]);
const SKIP_DIRS = new Set(["node_modules", ".next", ".git"]);

const FOREIGN_PRODUCT_PATTERNS = [
  { label: "foreign liaison product", pattern: /\bLiaison\s+OS\b/i },
  { label: "foreign insurance reference brand", pattern: /\bEnsureProtect\b/i },
  { label: "outside employer name", pattern: /\bDemesmin\b/i },
  { label: "outside employer name", pattern: /\bDover\b/i },
  { label: "foreign event-intelligence product", pattern: /\bWCI\b/ },
  { label: "foreign case-recovery acronym", pattern: /\bPIP\b/ },
  { label: "foreign claimant model", pattern: /\bclaimant\b/i },
  { label: "foreign provider-BD model", pattern: /\bprovider\s+BD\b/i },
  { label: "foreign medical-legal model", pattern: /\bmedical[- ]legal\b/i },
  { label: "foreign accident-attorney model", pattern: /\baccident attorney\b/i },
  { label: "foreign chiropractor model", pattern: /\bchiropractor\b/i },
  { label: "foreign demand-package model", pattern: /\bdemand package\b/i },
  { label: "foreign carrier-posture model", pattern: /\bcarrier posture\b/i },
];

// These implementation-level markers are blocked when they come from a copied
// claims/policy product model. Milano Seal's genuine corporate procurement
// readiness registry is explicitly exempt because it tracks the company's own
// required business coverage evidence, not customer-policy or claims workflow.
const FOREIGN_INSURANCE_MODEL_PATTERNS = [
  { label: "policyNumber", pattern: /\bpolicyNumber\b/ },
  { label: "claimNumber", pattern: /\bclaimNumber\b/ },
  { label: "coverageType", pattern: /\bcoverageType\b/ },
  { label: "insuranceCarrier", pattern: /\binsuranceCarrier\b/ },
  { label: "claimsAdministration", pattern: /\bclaimsAdministration\b/i },
];
const LEGITIMATE_INSURANCE_MODEL_FILES = new Set([
  "lib/procurement/readiness/insuranceRegistry.ts",
]);

function walk(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const path = join(dir, name).replaceAll("\\", "/");
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path, files);
    else if (TEXT_EXTENSIONS.has(extname(path))) files.push(path);
  }
  return files;
}

// Governing Markdown may explicitly prohibit an outside architecture. Strip only
// this exact negative control; all affirmative mentions and all source code remain scanned.
export function isolationScanText(file,source){
  if(!file.endsWith('.md'))return source;
  return source.split('\n').filter(line=>!/^\s*\d+\. Never mix Liaison OS architecture into Milano Seal\.\s*$/.test(line)).join('\n');
}

const files = ROOTS.flatMap((root) => walk(root));
const violations = [];

for (const file of files) {
  const source = readFileSync(file, "utf8");
  for (const rule of FOREIGN_PRODUCT_PATTERNS) {
    if (rule.pattern.test(isolationScanText(file,source))) violations.push(`${file}: ${rule.label}`);
  }
  if (!LEGITIMATE_INSURANCE_MODEL_FILES.has(file)) {
    for (const rule of FOREIGN_INSURANCE_MODEL_PATTERNS) {
      if (rule.pattern.test(source)) violations.push(`${file}: ${rule.label}`);
    }
  }
}

assert.deepEqual(
  violations,
  [],
  `Foreign product/workflow contamination found:\n${violations.join("\n")}`,
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
