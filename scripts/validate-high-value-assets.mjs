#!/usr/bin/env node
/**
 * Validator: High-Value Asset Intelligence (extends Maritime).
 */

import { readFileSync, existsSync } from "node:fs";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const RESET = "\x1b[0m";
const errors = [];
const ok = [];
const check = (c, p, f) => (c ? ok.push(p) : errors.push(f));
const read = (p) => (existsSync(p) ? readFileSync(p, "utf8") : "");

// Required files.
for (const p of [
  "lib/high-value-assets/types.ts",
  "lib/high-value-assets/assetClassifier.ts",
  "lib/high-value-assets/documentRegistry.ts",
  "lib/high-value-assets/urgency.ts",
  "lib/high-value-assets/maritimeBridge.ts",
  "lib/high-value-assets/pricingAdapter.ts",
  "lib/high-value-assets/safetyGuard.ts",
  "components/high-value-assets/HighValueAssetCommandCenter.tsx",
  "app/dashboard/high-value-assets/page.tsx",
  "app/services/high-value-asset-document-execution/page.tsx",
  "lib/high-value-assets/__tests__/assetClassifier.test.ts",
  "lib/high-value-assets/__tests__/highValueAssets.test.ts",
]) check(existsSync(p), `present: ${p}`, `MISSING: ${p}`);

// Pricing adapter delegates (no independent calculator).
const pricing = read("lib/high-value-assets/pricingAdapter.ts");
check(/prepareMaritimeQuote|canonicalPricingContext/.test(pricing) && !/function\s+calculate/i.test(pricing),
  "pricing adapter delegates to canonical gateway (no independent calculator)",
  "pricing adapter must delegate to canonical gateway");

// Maritime bridge imports maritime types (extends, not duplicates).
const bridge = read("lib/high-value-assets/maritimeBridge.ts");
check(/@\/lib\/maritime/.test(bridge),
  "maritime bridge reuses the Maritime vertical",
  "maritime bridge must reuse the Maritime vertical");
check(!existsSync("components/high-value-assets/MaritimeCommandCenter.tsx"),
  "no duplicate maritime command center",
  "must not duplicate the maritime command center");

// Safety guard blocks forbidden claims.
const guard = read("lib/high-value-assets/safetyGuard.ts");
check(/HVA_BLOCKED_CLAIMS/.test(guard) && /validateHighValueAssetOutput/.test(guard),
  "safety guard blocks forbidden claims",
  "safety guard must block forbidden claims");

// No forbidden guarantee claims in public/dashboard copy (outside the guard's blocklist).
const pub = read("app/services/high-value-asset-document-execution/page.tsx");
const dash = read("components/high-value-assets/HighValueAssetCommandCenter.tsx");
const forbidden = /guarantee title transfer|we clear customs|register with (uscg|faa)|approve ownership|guarantee delivery|guarantee acceptance|certify value/i;
check(!forbidden.test(pub) && !forbidden.test(dash),
  "public + dashboard copy contain no forbidden guarantee/approval claims",
  "public/dashboard copy must not claim title/customs/registry/ownership guarantees");
check(/does not provide legal, title, customs/i.test(pub),
  "public page contains the review disclaimer",
  "public page must contain the review disclaimer");

// Command center: honest empty states + responsive.
check(/No high-value asset matters recorded/.test(dash) && /<select|flex-wrap/.test(dash),
  "command center has honest empty states + responsive tabs",
  "command center must have honest empty states + responsive tabs");

// Urgency honors payment-before-scheduling.
const urg = read("lib/high-value-assets/urgency.ts");
check(/verify_payment/.test(urg) && /paymentConfirmed/.test(urg),
  "urgency engine honors payment-before-scheduling",
  "urgency engine must honor payment-before-scheduling");

// No protected-system imports.
const allLib = [
  "lib/high-value-assets/types.ts","lib/high-value-assets/assetClassifier.ts",
  "lib/high-value-assets/documentRegistry.ts","lib/high-value-assets/urgency.ts",
  "lib/high-value-assets/maritimeBridge.ts","lib/high-value-assets/pricingAdapter.ts",
  "lib/high-value-assets/safetyGuard.ts",
].map(read).join("\n");
check(!/from\s+["'][^"']*(stripe|shippo|bluenotary|wise-|supabase)/i.test(allLib) && !/service_role/.test(allLib),
  "no protected-system imports",
  "must not import protected systems");

try { JSON.parse(readFileSync("package.json", "utf8")); ok.push("package.json valid"); }
catch { errors.push("package.json invalid JSON"); }

console.log("\nHigh-Value Asset Intelligence validation\n");
for (const l of ok) console.log(`  ${GREEN}✓${RESET} ${l}`);
for (const l of errors) console.log(`  ${RED}✗${RESET} ${l}`);
if (errors.length) { console.log(`\n${RED}${errors.length} failed${RESET}\n`); process.exit(1); }
console.log(`\n${GREEN}All ${ok.length} checks passed${RESET}\n`);
