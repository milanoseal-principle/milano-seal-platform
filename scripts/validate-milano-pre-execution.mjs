#!/usr/bin/env node
/**
 * Validator: Milano Pre-Execution Intelligence + execution gates.
 * Also enforces zero Liaison-OS / provider / medical cross-contamination in the
 * new pre-execution files.
 */

import { readFileSync, existsSync } from "node:fs";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const RESET = "\x1b[0m";
const errors = [];
const ok = [];
const check = (c, p, f) => (c ? ok.push(p) : errors.push(f));
const read = (p) => (existsSync(p) ? readFileSync(p, "utf8") : "");

const NEW_FILES = [
  "lib/pre-execution/executionGates.ts",
  "lib/pre-execution/preExecutionSafety.ts",
  "components/dashboard/execution/ExecutionReadiness.tsx",
  "app/dashboard/matters/[matterId]/execution/page.tsx",
  "lib/pre-execution/__tests__/executionGates.test.ts",
];
for (const p of NEW_FILES) check(existsSync(p), `present: ${p}`, `MISSING: ${p}`);

const gates = read("lib/pre-execution/executionGates.ts");

// Non-bypassable + payment-first + downstream blocking.
check(/canBypassGate\(\):\s*false/.test(gates),
  "gates are non-bypassable (canBypassGate always false)",
  "gates must be non-bypassable");
check(/EXECUTION_GATE_ORDER[\s\S]*"payment"/.test(gates) && /"apostille_readiness"/.test(gates),
  "gate ladder spans payment → apostille readiness",
  "gate ladder must span payment through apostille readiness");
check(/blockedByPriorGate/.test(gates),
  "downstream gates block on prior required gate",
  "downstream gates must block on prior gate");

// AI/compliance boundary present.
const safety = read("lib/pre-execution/preExecutionSafety.ts");
check(/AI_MAY_NOT/.test(safety) && /requiresOperatorConfirmation/.test(safety) && /bypass_a_gate/.test(safety),
  "AI/compliance boundary: AI cannot approve/bypass; operator confirms",
  "AI/compliance boundary required");

// Does not modify or import protected gate systems (reads normalized states only).
check(!/from\s+["'][^"']*(stripe|shippo|bluenotary|wise|supabase)/i.test(gates + safety) && !/service_role/.test(gates + safety),
  "pre-execution engine imports no protected/provider systems",
  "pre-execution engine must not import protected systems");

// CROSS-CONTAMINATION: no Liaison-OS / provider / medical terminology in new files.
const forbidden = /\bPIP\b|ProviderOperationalWorkspace|Weekly Activity|relationshipIntelligence|Net to Provider|Responded — No Payment|provider profile|medical recovery|liaison os/i;
const blob = NEW_FILES.map(read).join("\n");
check(!forbidden.test(blob),
  "no Liaison-OS / provider / medical contamination in pre-execution files",
  "forbidden Liaison-OS/provider/medical terminology detected");

try { JSON.parse(readFileSync("package.json", "utf8")); ok.push("package.json valid"); }
catch { errors.push("package.json invalid JSON"); }

console.log("\nMilano Pre-Execution Intelligence validation\n");
for (const l of ok) console.log(`  ${GREEN}✓${RESET} ${l}`);
for (const l of errors) console.log(`  ${RED}✗${RESET} ${l}`);
if (errors.length) { console.log(`\n${RED}${errors.length} failed${RESET}\n`); process.exit(1); }
console.log(`\n${GREEN}All ${ok.length} checks passed${RESET}\n`);
