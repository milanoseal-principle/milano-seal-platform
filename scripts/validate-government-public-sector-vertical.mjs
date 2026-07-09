#!/usr/bin/env node
// Validator for Module 14 — Government & Public Sector Document Execution Vertical.
// File + content checks only. No build. Exit 2 on failure.

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
let failures = 0;

function ok(msg) {
  console.log(`OK   ${msg}`);
}
function fail(msg) {
  console.log(`FAIL ${msg}`);
  failures += 1;
}

function mustExist(rel) {
  if (existsSync(resolve(root, rel))) ok(`exists: ${rel}`);
  else fail(`missing: ${rel}`);
}

// ── lib/government ─────────────────────────────────────────────────────────
const libFiles = [
  "lib/government/types.ts",
  "lib/government/governmentServicesRegistry.ts",
  "lib/government/procurementOpportunityEngine.ts",
  "lib/government/vendorRegistrationTracker.ts",
  "lib/government/commodityCodeRegistry.ts",
  "lib/government/governmentCrmEngine.ts",
  "lib/government/bidNoBidScoring.ts",
  "lib/government/capabilityStatementModel.ts",
  "lib/government/governmentSafety.ts",
];
libFiles.forEach(mustExist);

// ── public page ────────────────────────────────────────────────────────────
const publicPage = "app/services/government-document-execution/page.tsx";
mustExist(publicPage);

// ── dashboard ────────────────────────────────────────────────────────────────
mustExist("app/dashboard/government/page.tsx");

// ── components ───────────────────────────────────────────────────────────────
const components = [
  "GovernmentCommandCenter",
  "GovernmentCRMBoard",
  "ProcurementOpportunityBoard",
  "VendorRegistrationTracker",
  "CommodityCodeRegistry",
  "CapabilityStatementManager",
  "BidNoBidScoringPanel",
  "GovernmentRevenuePanel",
  "GovernmentSafetyPanel",
];
components.forEach((c) => mustExist(`components/dashboard/government/${c}.tsx`));

// ── docs ─────────────────────────────────────────────────────────────────────
const docs = [
  "docs/government/GOVERNMENT_PUBLIC_SECTOR_VERTICAL.md",
  "docs/government/PINELLAS_VENDOR_REGISTRATION_PLAN.md",
  "docs/government/GOVERNMENT_CAPABILITY_STATEMENT_TEMPLATE.md",
  "docs/government/PROCUREMENT_COMMODITY_CODE_TRACKER.md",
  "docs/government/BID_NO_BID_SCORING_SOP.md",
  "docs/outreach/GOVERNMENT_CAPABILITY_STATEMENT_OUTREACH_SCRIPT.md",
  "docs/investor/GOVERNMENT_PUBLIC_SECTOR_VERTICAL_INVESTOR_INSERT.md",
];
docs.forEach(mustExist);

// Pinellas plan must contain the 8-step markers + priority list anchor.
const pinellasPath = resolve(root, "docs/government/PINELLAS_VENDOR_REGISTRATION_PLAN.md");
if (existsSync(pinellasPath)) {
  const t = readFileSync(pinellasPath, "utf8");
  const needs = ["OpenGov", "W-9", "capability statement", "commodity", "Hillsborough", "Pinellas County Schools", "St. Petersburg-Clearwater International Airport"];
  const missing = needs.filter((n) => !t.includes(n));
  if (missing.length === 0) ok("Pinellas plan content complete");
  else fail(`Pinellas plan missing: ${missing.join(", ")}`);
}

// ── banned-claim scan (public page + docs) ──────────────────────────────────
// Affirmative banned patterns. Disclaimer/negated lines are skipped.
const bannedPatterns = [
  /government[- ]approved/i,
  /guaranteed (contract|procurement|award|acceptance)/i,
  /official [a-z ]*partner/i,
  /\blegal advice\b/i,
  /fake (past performance|client)/i,
];
const negationMarkers = [
  "does not",
  "do not",
  "not provide",
  "no guarantee",
  "without",
  "cannot",
  "remains subject",
  "not constitute",
  "does not constitute",
  "don't",
  "no legal",
  "no fabricated",
  "never a guarantee",
  "not a guarantee",
  "not a prediction",
  "no claims",
  "no guaranteed",
];

function scanForBanned(rel) {
  const p = resolve(root, rel);
  if (!existsSync(p)) return;
  const lines = readFileSync(p, "utf8").split(/\r?\n/);
  lines.forEach((line, i) => {
    const lower = line.toLowerCase();
    const negated = negationMarkers.some((m) => lower.includes(m));
    if (negated) return;
    for (const pat of bannedPatterns) {
      if (pat.test(line)) {
        fail(`banned claim in ${rel}:${i + 1} → "${line.trim()}"`);
      }
    }
  });
}

[publicPage, ...docs].forEach(scanForBanned);
if (failures === 0) ok("no banned claims detected in public page + docs");

// ── result ───────────────────────────────────────────────────────────────────
if (failures > 0) {
  console.log(`\nFAIL — ${failures} problem(s) found.`);
  process.exit(2);
}
console.log("\nOK — Government & Public Sector vertical validated.");
