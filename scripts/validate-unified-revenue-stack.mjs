#!/usr/bin/env node
/**
 * Validator: Unified Revenue Stack (ten channels, canonical reuse, no fake revenue).
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
  "lib/revenue-stack/types.ts",
  "lib/revenue-stack/channelRegistry.ts",
  "lib/revenue-stack/revenueOpportunity.ts",
  "lib/revenue-stack/revenueSafety.ts",
  "lib/revenue-stack/index.ts",
  "components/dashboard/revenue/UnifiedRevenueCommandCenter.tsx",
  "lib/revenue-stack/__tests__/revenueStack.test.ts",
]) check(existsSync(p), `present: ${p}`, `MISSING: ${p}`);

// Ten channels declared.
const reg = read("lib/revenue-stack/channelRegistry.ts");
const channelCount = (reg.match(/channel:\s*"/g) || []).length;
check(channelCount >= 10, "ten revenue channels registered", `expected >=10 channels, found ${channelCount}`);

// Reuses existing verticals (procurement, maritime) — no duplication.
check(/procurement/i.test(reg) && /maritime/i.test(reg) && /high-value-assets/i.test(reg),
  "channels reuse procurement / maritime / high-value-assets verticals",
  "channels must reuse existing verticals");

// Revenue Command wired into existing revenue dashboard (not a new dashboard).
const page = read("app/dashboard/revenue/page.tsx");
check(/UnifiedRevenueCommandCenter/.test(page),
  "unified command center wired into existing revenue dashboard",
  "must wire command center into existing revenue dashboard");
check(!existsSync("app/dashboard/revenue-stack/page.tsx"),
  "no duplicate revenue dashboard route",
  "must not add a duplicate revenue dashboard");

// Actual revenue = verified payment only; planning scenarios labelled.
const safety = read("lib/revenue-stack/revenueSafety.ts");
check(/paid === true/.test(safety) && /PLANNING_SCENARIO_LABEL/.test(safety),
  "actual revenue requires verified payment; planning scenarios labelled",
  "revenue safety must gate on verified payment + label planning scenarios");
const opp = read("lib/revenue-stack/revenueOpportunity.ts");
check(/ACTUAL_REVENUE_EVENTS.*payment_confirmed|payment_confirmed/.test(opp) && /paymentConfirmed && !o\.isSample/.test(opp),
  "real paid revenue excludes quotes and samples",
  "real paid revenue must exclude quotes and samples");

// Command center labels planning scenario + shows honest state.
const cc = read("components/dashboard/revenue/UnifiedRevenueCommandCenter.tsx");
check(/PLANNING_SCENARIO_LABEL/.test(cc) && /Verified paid revenue/.test(cc),
  "command center separates verified revenue from planning scenarios",
  "command center must separate verified revenue from planning scenarios");

// No protected-system imports in revenue-stack lib.
const lib = [
  "lib/revenue-stack/types.ts","lib/revenue-stack/channelRegistry.ts",
  "lib/revenue-stack/revenueOpportunity.ts","lib/revenue-stack/revenueSafety.ts",
].map(read).join("\n");
check(!/from\s+["'][^"']*(stripe|shippo|bluenotary|wise-|supabase)/i.test(lib) && !/service_role/.test(lib),
  "no protected-system imports in revenue-stack",
  "revenue-stack must not import protected systems");

try { JSON.parse(readFileSync("package.json", "utf8")); ok.push("package.json valid"); }
catch { errors.push("package.json invalid JSON"); }

console.log("\nUnified Revenue Stack validation\n");
for (const l of ok) console.log(`  ${GREEN}✓${RESET} ${l}`);
for (const l of errors) console.log(`  ${RED}✗${RESET} ${l}`);
if (errors.length) { console.log(`\n${RED}${errors.length} failed${RESET}\n`); process.exit(1); }
console.log(`\n${GREEN}All ${ok.length} checks passed${RESET}\n`);
