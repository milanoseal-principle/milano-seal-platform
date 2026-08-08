#!/usr/bin/env node
/**
 * Validator: Relationship Intelligence (executive read-only layer).
 * Asserts it READS canonical engines and does NOT duplicate them.
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
  "lib/commercial-intelligence/executiveEngine.ts",
  "components/dashboard/commercial/intelligence/ExecutiveIntelligence.tsx",
  "app/dashboard/commercial/intelligence/page.tsx",
  "lib/commercial-intelligence/__tests__/executiveEngine.test.ts",
]) check(existsSync(p), `present: ${p}`, `MISSING: ${p}`);

const engine = read("lib/commercial-intelligence/executiveEngine.ts");

// READS canonical engines (imports), does NOT define new data models.
check(/@\/lib\/vertical-intelligence\/verticalRegistry/.test(engine) &&
      /@\/lib\/commercial-accounts\/accountRegistry/.test(engine) &&
      /@\/lib\/revenue-stack\/revenueOpportunity/.test(engine),
  "executive engine reads existing canonical engines",
  "executive engine must read existing engines");
check(!/interface\s+(Organization|Contact|Matter|CommercialAccount)\b/.test(engine),
  "no duplicate Organization/Contact/Matter/Account model defined",
  "executive layer must not redefine canonical models");

// Six questions.
const count = (engine.match(/questionId:\s*"/g) || []).length;
check(count === 6, "answers all six executive questions", `expected 6 questions, found ${count}`);

// Evidence-gated: verified revenue not fabricated; forecast/planning separate.
check(/realPaidRevenue/.test(engine) && /insufficient_evidence/.test(engine),
  "verified revenue gated; insufficient-evidence honored",
  "must gate on verified revenue + support insufficient_evidence");
check(/planning_only|planningMetrics/.test(engine),
  "planning signals separated from verified",
  "planning must be separated from verified");

// Route lives under existing commercial dashboard; noindex; reuses shell.
const page = read("app/dashboard/commercial/intelligence/page.tsx");
check(/requireDashboardAccess/.test(page) && /index:\s*false/.test(page) && /DashboardPageHeader/.test(page),
  "intelligence route reuses dashboard shell/auth and is noindex",
  "intelligence route must reuse shell/auth + be noindex");
check(!existsSync("app/dashboard/relationship-intelligence/page.tsx"),
  "no parallel relationship dashboard route",
  "must not create a parallel relationship dashboard");

// No protected-system imports.
check(!/from\s+["'][^"']*(stripe|shippo|bluenotary|wise-|supabase)/i.test(engine) && !/service_role/.test(engine),
  "no protected-system imports",
  "must not import protected systems");

try { JSON.parse(readFileSync("package.json", "utf8")); ok.push("package.json valid"); }
catch { errors.push("package.json invalid JSON"); }

console.log("\nRelationship Intelligence (executive layer) validation\n");
for (const l of ok) console.log(`  ${GREEN}✓${RESET} ${l}`);
for (const l of errors) console.log(`  ${RED}✗${RESET} ${l}`);
if (errors.length) { console.log(`\n${RED}${errors.length} failed${RESET}\n`); process.exit(1); }
console.log(`\n${GREEN}All ${ok.length} checks passed${RESET}\n`);
