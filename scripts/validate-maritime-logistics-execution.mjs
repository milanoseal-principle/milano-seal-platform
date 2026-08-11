#!/usr/bin/env node
/**
 * Validator: Maritime & Global Logistics Execution vertical.
 * Asserts canonical reuse, new maritime modules, safe public claims, and no
 * protected-system changes.
 */

import { readFileSync, existsSync } from "node:fs";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const RESET = "\x1b[0m";
const errors = [];
const ok = [];
const check = (c, p, f) => (c ? ok.push(p) : errors.push(f));
const read = (p) => (existsSync(p) ? readFileSync(p, "utf8") : "");

// Canonical reuse present.
for (const p of [
  "lib/pricing/canonicalPricingGateway.ts",
  "lib/platform/canonicalMatter.ts",
  "data/destinations.ts",
]) check(existsSync(p), `canonical present: ${p}`, `missing canonical: ${p}`);

// New maritime modules.
for (const p of [
  "lib/maritime/types.ts",
  "lib/maritime/maritimeSafety.ts",
  "lib/maritime/urgency/maritimeUrgency.ts",
  "lib/maritime/documents/maritimeDocumentRegistry.ts",
  "lib/maritime/pricing/maritimePricingAdapter.ts",
  "lib/maritime/accounts/commercialAccount.ts",
  "lib/maritime/operatorActions.ts",
  "lib/trust-chain/maritimeTrustEvents.ts",
  "components/dashboard/maritime/MaritimeCommandCenter.tsx",
  "app/dashboard/maritime/page.tsx",
  "app/services/maritime-global-logistics-document-execution/page.tsx",
  "app/ports/port-tampa-bay-document-execution/page.tsx",
]) check(existsSync(p), `created: ${p}`, `MISSING: ${p}`);

// Pricing adapter delegates (no new calculator).
const adapter = read("lib/maritime/pricing/maritimePricingAdapter.ts");
check(/quoteNonConsumer/.test(adapter) && !/function\s+calculate/i.test(adapter),
  "maritime pricing delegates to canonical gateway (no new calculator)",
  "maritime pricing must delegate to canonical gateway");

// Trust chain events are additive, not a second engine, and not a legal guarantee.
const tc = read("lib/trust-chain/maritimeTrustEvents.ts");
check(/Chain-of-Custody Visibility/.test(tc) && !/guaranteed legal chain/i.test(tc),
  "trust events use chain-of-custody visibility (no legal guarantee)",
  "maritime trust events must avoid guaranteed-legal-chain claims");

// Public page safety — no banned claims, safety notice present.
const pub = read("app/services/maritime-global-logistics-document-execution/page.tsx");
const port = read("app/ports/port-tampa-bay-document-execution/page.tsx");
const banned = /guaranteed customs clearance|port approved|cbp approved|coast guard approved|carrier approved|tsa approved|guaranteed sailing/i;
check(!banned.test(pub) && !banned.test(port),
  "public + port pages contain no banned authority/guarantee claims",
  "public/port pages must not claim port/customs/CBP/Coast Guard/TSA approval or guarantees");
check(/MARITIME_SAFETY_NOTICE/.test(pub) && /MARITIME_SAFETY_NOTICE/.test(port),
  "public + port pages render the maritime safety notice",
  "public/port pages must render the maritime safety notice");

// Dashboard: honest empty states + real/sample labelling, responsive.
const cc = read("components/dashboard/maritime/MaritimeCommandCenter.tsx");
check(/No urgent maritime matters recorded|No active commercial accounts/.test(cc),
  "command center shows honest empty states",
  "command center must show honest empty states");
check(/<select|flex-wrap/.test(cc),
  "command center is responsive (mobile select + wrapping tabs)",
  "command center must be responsive");

// Payment-gate honored in urgency engine.
const urg = read("lib/maritime/urgency/maritimeUrgency.ts");
check(/scheduling locked/i.test(urg) && /verify_payment/.test(urg),
  "urgency engine honors payment-before-scheduling",
  "urgency engine must honor payment-before-scheduling");

// No protected-system imports.
const allNew = [
  "lib/maritime/types.ts","lib/maritime/maritimeSafety.ts","lib/maritime/urgency/maritimeUrgency.ts",
  "lib/maritime/documents/maritimeDocumentRegistry.ts","lib/maritime/pricing/maritimePricingAdapter.ts",
  "lib/maritime/accounts/commercialAccount.ts","lib/maritime/operatorActions.ts","lib/trust-chain/maritimeTrustEvents.ts",
].map(read).join("\n");
check(!/from\s+["'][^"']*(stripe|shippo|bluenotary|wise-|supabase)/i.test(allNew) && !/service_role/.test(allNew),
  "no protected-system imports in maritime modules",
  "maritime modules must not import protected systems");

// Tests present.
for (const p of ["tests/unit/maritimeUrgency.test.ts", "tests/unit/maritimeSafety.test.ts"])
  check(existsSync(p), `test present: ${p}`, `MISSING test: ${p}`);

// package.json valid.
try { JSON.parse(readFileSync("package.json", "utf8")); ok.push("package.json valid"); }
catch { errors.push("package.json invalid JSON"); }

console.log("\nMaritime & Global Logistics Execution validation\n");
for (const l of ok) console.log(`  ${GREEN}✓${RESET} ${l}`);
for (const l of errors) console.log(`  ${RED}✗${RESET} ${l}`);
if (errors.length) { console.log(`\n${RED}${errors.length} failed${RESET}\n`); process.exit(1); }
console.log(`\n${GREEN}All ${ok.length} checks passed${RESET}\n`);
