#!/usr/bin/env node
/**
 * Validator: Universal Government & Institutional Procurement Engine.
 * Asserts existing modules are preserved, new canonical modules exist, the real
 * Pinellas record stays submitted/not-awarded, and no fabricated/unsafe content.
 */

import { readFileSync, existsSync } from "node:fs";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const RESET = "\x1b[0m";
const errors = [];
const ok = [];
const check = (cond, pass, fail) => (cond ? ok.push(pass) : errors.push(fail));
const read = (p) => (existsSync(p) ? readFileSync(p, "utf8") : "");

// ── Existing modules preserved (reuse, not rebuilt) ──
for (const p of [
  "lib/government/bidNoBidScoring.ts",
  "lib/government/vendorRegistrationTracker.ts",
  "lib/government/commodityCodeRegistry.ts",
  "lib/government/governmentCrmEngine.ts",
  "lib/government/intelligence/agencyRegistry.ts",
  "lib/government/intelligence/procurementKnowledgeGraph.ts",
  "lib/operatorActions.ts",
  "lib/pricing/canonicalPricingGateway.ts",
  "app/services/government-document-execution/page.tsx",
  "app/dashboard/government/page.tsx",
]) {
  check(existsSync(p), `preserved: ${p}`, `MISSING existing module: ${p}`);
}

// ── New canonical modules created ──
for (const p of [
  "lib/procurement/procurementSafety.ts",
  "lib/government/submissions/pinellasItq250786.ts",
  "lib/procurement/submissions/submissionRegistry.ts",
  "lib/procurement/references/referenceConsentTracker.ts",
  "lib/procurement/readiness/insuranceRegistry.ts",
  "lib/procurement/proposals/proposalSectionRegistry.ts",
  "lib/procurement/sow/sowBuilder.ts",
  "lib/procurement/pricing/procurementPricingAdapter.ts",
]) {
  check(existsSync(p), `created: ${p}`, `MISSING new module: ${p}`);
}

// ── No duplicate government dashboard added ──
check(!existsSync("app/dashboard/procurement/page.tsx"),
  "no duplicate procurement dashboard route",
  "must not add a parallel procurement dashboard route");

// ── Pricing adapter delegates to canonical (no new calculator) ──
const adapter = read("lib/procurement/pricing/procurementPricingAdapter.ts");
check(/quoteNonConsumer/.test(adapter) && !/function\s+calculate/i.test(adapter),
  "pricing adapter delegates to canonical gateway (no new calculator)",
  "pricing adapter must delegate to canonical gateway and not implement a calculator");

// ── Pinellas record: real + submitted/not awarded ──
const pin = read("lib/government/submissions/pinellasItq250786.ts");
check(/25-0786/.test(pin), "Pinellas ITQ #25-0786 record present", "Pinellas record missing solicitation number");
check(/isSample:\s*false/.test(pin), "Pinellas record is real data (isSample: false)", "Pinellas must be real data");
check(/submissionStatus:\s*"not_awarded"/.test(pin), "Pinellas remains not_awarded", "Pinellas must remain not_awarded");
check(/awardEvidenceRef:\s*null/.test(pin), "Pinellas has no fabricated award evidence", "Pinellas must have null award evidence");

// ── Award safety in registry ──
const subReg = read("lib/procurement/submissions/submissionRegistry.ts");
check(/canRecordAward|canMarkAwarded/.test(subReg),
  "submission registry enforces award evidence",
  "submission registry must gate awards on evidence");

// ── Safety policy present + consumed ──
const safety = read("lib/procurement/procurementSafety.ts");
check(/BANNED_PUBLIC_CLAIMS/.test(safety) && /canRecordAward/.test(safety) && /isInsuranceBound/.test(safety),
  "procurement safety policy exports guards",
  "procurement safety policy incomplete");

// ── No fabricated/unsafe content in new procurement modules ──
const proc = [
  "lib/procurement/procurementSafety.ts",
  "lib/procurement/submissions/submissionRegistry.ts",
  "lib/procurement/references/referenceConsentTracker.ts",
  "lib/procurement/readiness/insuranceRegistry.ts",
  "lib/procurement/proposals/proposalSectionRegistry.ts",
  "lib/procurement/sow/sowBuilder.ts",
  "lib/procurement/pricing/procurementPricingAdapter.ts",
].map(read).join("\n");
// Guarded phrases only allowed inside the banned-claims list itself (safety file).
check(!/guaranteed award|guaranteed contract|government approved|tsa certified/i.test(proc.replace(/BANNED_PUBLIC_CLAIMS[\s\S]*?\];/, "")),
  "no fabricated guarantees/endorsements in procurement modules",
  "found unsafe guarantee/endorsement claim in procurement modules");

// ── Protected systems not IMPORTED/USED by new modules (comments describing
//    what is untouched are allowed; real imports/service-role usage are not). ──
const protectedImport = /from\s+["'][^"']*(stripe|shippo|bluenotary|wise-|supabase)/i;
check(!protectedImport.test(proc) && !/service_role/.test(proc),
  "no protected-system imports in procurement modules",
  "procurement modules must not import protected systems");

// ── package.json valid ──
try {
  JSON.parse(readFileSync("package.json", "utf8"));
  ok.push("package.json valid");
} catch {
  errors.push("package.json invalid JSON");
}

console.log("\nUniversal Procurement Engine validation\n");
for (const l of ok) console.log(`  ${GREEN}✓${RESET} ${l}`);
for (const l of errors) console.log(`  ${RED}✗${RESET} ${l}`);
if (errors.length) {
  console.log(`\n${RED}${errors.length} check(s) failed${RESET}\n`);
  process.exit(1);
}
console.log(`\n${GREEN}All ${ok.length} checks passed${RESET}\n`);
