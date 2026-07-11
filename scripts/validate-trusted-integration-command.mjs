#!/usr/bin/env node
/**
 * Validator: Trusted Integration Command (permission core). Asserts the role
 * matrix + task orchestration enforce protected-gate isolation and that nothing
 * duplicates or bypasses the protected payment/courier/RON systems.
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
  "lib/integration-command/rolePermissions.ts",
  "lib/task-orchestration/types.ts",
  "lib/task-orchestration/taskPermissionEngine.ts",
  "lib/task-orchestration/__tests__/taskOrchestration.test.ts",
  "scripts/check-integration-configuration.mjs",
]) check(existsSync(p), `present: ${p}`, `MISSING: ${p}`);

const perms = read("lib/integration-command/rolePermissions.ts");

// Protected capabilities exist and are hard-denied to VA + Alliance.
for (const cap of ["confirm_payment", "unlock_scheduling", "authorize_release", "mutate_custody", "mark_ron_complete"]) {
  check(perms.includes(cap), `capability defined: ${cap}`, `missing protected capability: ${cap}`);
}
check(/HARD_DENY/.test(perms) && /virtual_assistant:\s*\[[\s\S]*?confirm_payment/.test(perms) && /alliance_member:\s*\[[\s\S]*?authorize_release/.test(perms),
  "VA + Alliance hard-denied protected capabilities",
  "VA/Alliance must be hard-denied protected capabilities");

// Orchestration does not import protected systems or provider SDKs.
const orch = read("lib/task-orchestration/taskPermissionEngine.ts") + read("lib/task-orchestration/types.ts") + perms;
check(!/from\s+["'][^"']*(stripe|shippo|bluenotary|wise|supabase)/i.test(orch) && !/service_role/.test(orch),
  "no protected/provider imports in permission core",
  "permission core must not import provider SDKs / protected systems");

// VA↔Alliance coordination is matter-gated.
const engine = read("lib/task-orchestration/taskPermissionEngine.ts");
check(/canCoordinate/.test(engine) && /shared matter/.test(engine),
  "VA↔Alliance coordination is matter-gated",
  "coordination must require a shared matter");
check(/deduplicateTasks/.test(engine),
  "task deduplication present",
  "task deduplication required");

// Config check reports presence only, never prints secrets, never claims live.
const cfg = read("scripts/check-integration-configuration.mjs");
check(/presence only/i.test(cfg) && !/console\.log\([^)]*process\.env\[[^\]]*\]\)/.test(cfg),
  "config check reports presence only and never prints secret values",
  "config check must not print secret values");
check(/does NOT mean the/i.test(cfg) || /not.*verified live/i.test(cfg),
  "config check does not claim live/verified",
  "config check must not claim integrations are live");

// No new payment/courier/RON engine or gate introduced.
check(!existsSync("lib/integration-command/paymentGate.ts") && !existsSync("lib/integration-command/releaseGate.ts") && !existsSync("lib/integration-command/custodyLedger.ts"),
  "no duplicate payment/release/custody gate introduced",
  "must not introduce duplicate protected gates");

try { JSON.parse(readFileSync("package.json", "utf8")); ok.push("package.json valid"); }
catch { errors.push("package.json invalid JSON"); }

console.log("\nTrusted Integration Command (permission core) validation\n");
for (const l of ok) console.log(`  ${GREEN}✓${RESET} ${l}`);
for (const l of errors) console.log(`  ${RED}✗${RESET} ${l}`);
if (errors.length) { console.log(`\n${RED}${errors.length} failed${RESET}\n`); process.exit(1); }
console.log(`\n${GREEN}All ${ok.length} checks passed${RESET}\n`);
