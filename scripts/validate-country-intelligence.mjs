#!/usr/bin/env node
// Validate country execution intelligence registry coverage (static text checks).
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
let failed = false;
const fail = (msg) => {
  console.error(`✗ ${msg}`);
  failed = true;
};
const pass = (msg) => console.log(`✓ ${msg}`);

const destPath = resolve(root, "data/destinations.ts");
const intelPath = resolve(root, "data/country-execution-intelligence.ts");

const destText = readFileSync(destPath, "utf8");
const intelText = readFileSync(intelPath, "utf8");

// Extract destination slugs.
const slugs = new Set();
for (const m of destText.matchAll(/slug:\s*['"]([a-z0-9-]+)['"]/g)) {
  slugs.add(m[1]);
}
if (slugs.size < 1) {
  fail("no destination slugs found in destinations.ts");
} else {
  pass(`found ${slugs.size} destination slugs`);
}

// Registry construction markers.
if (intelText.includes("getCountryExecutionIntelligence")) {
  pass("getCountryExecutionIntelligence present");
} else {
  fail("getCountryExecutionIntelligence missing");
}
if (intelText.includes("DESTINATIONS.reduce")) {
  pass("registry built from DESTINATIONS.reduce");
} else {
  fail("DESTINATIONS.reduce missing");
}

// Priority slugs as explicit keys.
const prioritySlugs = ["italy", "brazil", "uae"];
for (const slug of prioritySlugs) {
  if (new RegExp(`\\b${slug}:\\s*\\{`).test(intelText)) {
    pass(`priority slug "${slug}" present`);
  } else {
    fail(`priority slug "${slug}" missing from PRIORITY block`);
  }
}

// Required field names.
const requiredFields = [
  "slug", "displayName", "routeType", "statusPill", "eyebrow", "routeLabel",
  "authoritySummary", "executionFlags", "executionPath", "trustLine",
  "primaryCtaLabel", "secondaryCtaLabel", "matterUseCases",
  "notarialReadinessChecks", "apostilleRouteChecks", "authenticationRouteChecks",
  "translationRisk", "courierRisk", "lawyerClientUse", "allianceNotaryUse",
  "virtualAssistantUse", "operatorUse", "founderUse", "revenueUse",
  "escalationTriggers", "complianceBoundary",
];
for (const field of requiredFields) {
  if (!intelText.includes(field)) {
    fail(`required field name "${field}" absent`);
  }
}
if (!failed) pass("all required field names present");

if (failed) {
  console.error("✗ country intelligence validation FAILED");
  process.exit(1);
}
console.log("✓ country intelligence validation passed");
process.exit(0);
