#!/usr/bin/env node
/**
 * Validator: Vertical Intelligence + Commercial Account OS.
 */

import { readFileSync, existsSync } from "node:fs";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const RESET = "\x1b[0m";
const errors = [];
const ok = [];
const check = (c, p, f) => (c ? ok.push(p) : errors.push(f));
const read = (p) => (existsSync(p) ? readFileSync(p, "utf8") : "");

for (const p of [
  "lib/vertical-intelligence/verticalRegistry.ts",
  "lib/vertical-intelligence/verticalIntelligenceSafety.ts",
  "lib/vertical-intelligence/authorityScore.ts",
  "lib/commercial-accounts/accountRegistry.ts",
  "lib/relationship-intelligence/relationshipHealth.ts",
  "components/dashboard/commercial/CommercialCommandCenter.tsx",
  "app/dashboard/commercial/page.tsx",
  "lib/vertical-intelligence/__tests__/commercialOs.test.ts",
]) check(existsSync(p), `present: ${p}`, `MISSING: ${p}`);

// Fifteen verticals.
const reg = read("lib/vertical-intelligence/verticalRegistry.ts");
const count = (reg.match(/id:\s*"/g) || []).length;
check(count >= 15, "fifteen verticals registered", `expected >=15 verticals, found ${count}`);

// Reuses existing engines — no duplicate CRM/Matter/pricing.
check(/procurement/i.test(reg) && /maritime/i.test(reg) && /revenue-stack/i.test(reg) && /high-value-assets/i.test(reg),
  "verticals reuse existing engines (procurement/maritime/revenue-stack/high-value-assets)",
  "verticals must reuse existing engines");
check(!existsSync("lib/commercial-accounts/matter.ts") && !existsSync("lib/commercial-accounts/pricing.ts"),
  "no duplicate Matter/pricing engine in commercial-accounts",
  "must not duplicate Matter/pricing");

// Command center wired to a single new commercial route (not a duplicate dashboard shell).
const page = read("app/dashboard/commercial/page.tsx");
check(/CommercialCommandCenter/.test(page) && /index:\s*false/.test(page),
  "commercial command route renders command center and is noindex",
  "commercial route must render command center + be noindex");

// Real revenue = verified payment; authority requires evidence; forecast labelled.
const safety = read("lib/vertical-intelligence/verticalIntelligenceSafety.ts");
check(/paid === true/.test(safety) && /FORECAST_LABEL/.test(safety),
  "real revenue requires verified payment; forecast labelled planning scenario",
  "revenue/forecast safety required");
const auth = read("lib/vertical-intelligence/authorityScore.ts");
check(/hasEvidence/.test(auth) && /internalOnly/.test(auth),
  "authority score is evidence-based and internal only",
  "authority score must be evidence-based + internal");
const acct = read("lib/commercial-accounts/accountRegistry.ts");
check(/paidMatterCount > 0/.test(acct),
  "commercial account requires paid evidence",
  "commercial account must require paid evidence");

// Command center honest empty states.
const cc = read("components/dashboard/commercial/CommercialCommandCenter.tsx");
check(/No active commercial accounts|No commercial actions recorded/.test(cc) && /<select|flex-wrap/.test(cc),
  "command center has honest empty states + responsive tabs",
  "command center must have honest empty states + responsive tabs");

// No protected-system imports.
const lib = [
  "lib/vertical-intelligence/verticalRegistry.ts","lib/vertical-intelligence/verticalIntelligenceSafety.ts",
  "lib/vertical-intelligence/authorityScore.ts","lib/commercial-accounts/accountRegistry.ts",
  "lib/relationship-intelligence/relationshipHealth.ts",
].map(read).join("\n");
check(!/from\s+["'][^"']*(stripe|shippo|bluenotary|wise-|supabase)/i.test(lib) && !/service_role/.test(lib),
  "no protected-system imports",
  "must not import protected systems");

try { JSON.parse(readFileSync("package.json", "utf8")); ok.push("package.json valid"); }
catch { errors.push("package.json invalid JSON"); }

console.log("\nVertical Intelligence + Commercial Account OS validation\n");
for (const l of ok) console.log(`  ${GREEN}✓${RESET} ${l}`);
for (const l of errors) console.log(`  ${RED}✗${RESET} ${l}`);
if (errors.length) { console.log(`\n${RED}${errors.length} failed${RESET}\n`); process.exit(1); }
console.log(`\n${GREEN}All ${ok.length} checks passed${RESET}\n`);
