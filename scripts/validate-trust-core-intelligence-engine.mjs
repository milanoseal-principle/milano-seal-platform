#!/usr/bin/env node
/**
 * Validator: Milano Trust Core intelligence engine.
 *
 * Enforces:
 *   - Trust Core component present, still exposes the six review concepts.
 *   - Syncs to the active Mini Atlas corridor via the shared store.
 *   - Uses canonical destination data.
 *   - Reduced-motion compliance.
 *   - No fake live intelligence (no trust scores, live matter counts, fake
 *     verification results); demonstration state is clearly labelled illustrative.
 *   - No protected-system changes (payments, gates, custody ledger, RLS/auth,
 *     Shippo, BlueNotary, pricing, intake state machine, routing rules).
 */

import { readFileSync, existsSync } from "node:fs";
import { hasMotionPreference } from "./lib/reduced-motion-contract.mjs";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const RESET = "\x1b[0m";

const errors = [];
const ok = [];
const check = (cond, pass, fail) => (cond ? ok.push(pass) : errors.push(fail));

const corePath = "components/landing/milano-trust-core.tsx";
const storePath = "lib/homepage/activeCorridorStore.ts";
const miniPath = "components/home/MiniAtlasPreview.tsx";

check(existsSync(corePath), `${corePath} exists`, `${corePath} missing`);
check(existsSync(storePath), `${storePath} exists`, `${storePath} missing`);

const SIX = [
  "Secure Intake",
  "Global Document Intelligence",
  "Payment-Gated Scheduling",
  "Chain-of-Custody Visibility",
  "Apostille Coordination",
  "International Release",
];

if (existsSync(corePath)) {
  const core = readFileSync(corePath, "utf8");

  for (const concept of SIX) {
    check(core.includes(concept),
      `preserves review concept: ${concept}`,
      `missing review concept: ${concept}`);
  }

  check(/useSyncExternalStore/.test(core) && /activeCorridorStore/.test(core),
    "Trust Core syncs to the active Mini Atlas corridor",
    "Trust Core must sync to the Mini Atlas corridor via the shared store");

  check(/from "@\/data\/destinations"|from '@\/data\/destinations'/.test(core),
    "Trust Core uses canonical destination data",
    "Trust Core must use canonical DESTINATIONS data");

  check(hasMotionPreference(core, readFileSync("lib/motion/use-milano-reduced-motion.ts", "utf8")) && /reduce/.test(core),
    "Trust Core respects reduced-motion",
    "Trust Core must respect reduced-motion");

  check(/[Ii]llustrative platform sequence/.test(core),
    "demonstration state labelled as illustrative platform sequence",
    "engine demonstration must be labelled as an illustrative platform sequence");

  // No fabricated live intelligence.
  check(!/Trust Score|trustScore|\/\s*100\b/.test(core),
    "no fake Trust Score",
    "must not display a fake Trust Score");
  check(!/matters? (?:completed|processed|active)\b|live matter count|documents verified/i.test(core),
    "no fake live matter counts / verification results",
    "must not display fake live counts or verification results");

  // No protected-system wiring dragged into this presentation component.
  const forbidden = /stripe|createPaymentIntent|releaseGate|schedulingGate|custodyLedger|supabase|shippo|bluenotary|calculatePrice/i;
  check(!forbidden.test(core),
    "no protected-system references in Trust Core",
    "Trust Core must not reference protected systems (payments/gates/custody/RLS/Shippo/BlueNotary/pricing)");
}

if (existsSync(miniPath)) {
  const mini = readFileSync(miniPath, "utf8");
  check(/setActiveCorridor/.test(mini),
    "Mini Atlas publishes its corridor to the shared store",
    "Mini Atlas must publish its corridor via setActiveCorridor");
}

if (existsSync(storePath)) {
  const store = readFileSync(storePath, "utf8");
  check(/getActiveCorridorServerSnapshot/.test(store),
    "store provides an SSR-safe server snapshot",
    "store must provide a server snapshot to avoid hydration mismatch");
}

console.log("\nMilano Trust Core intelligence engine validation\n");
for (const line of ok) console.log(`  ${GREEN}✓${RESET} ${line}`);
for (const line of errors) console.log(`  ${RED}✗${RESET} ${line}`);

if (errors.length) {
  console.log(`\n${RED}${errors.length} check(s) failed${RESET}\n`);
  process.exit(1);
}
console.log(`\n${GREEN}All ${ok.length} checks passed${RESET}\n`);
