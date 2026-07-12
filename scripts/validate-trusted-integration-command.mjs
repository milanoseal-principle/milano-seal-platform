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

// ── Read model + role command UIs (increment 2) ──
const rm = read("lib/integration-command/integrationReadModel.ts");
if (rm) {
  check(!/from\s+["'][^"']*(stripe|shippo|bluenotary|wise|supabase)/i.test(rm),
    "read model imports no provider SDK",
    "read model must not import provider SDKs");
  check(/configured ≠ healthy|configured\s*\?\s*"configured"/.test(rm) || /health:\s*configured\s*\?\s*"configured"/.test(rm),
    "read model health is evidence-based (configured is not healthy)",
    "read model must keep configured distinct from healthy");
}
for (const p of [
  "app/dashboard/founder/integrations/page.tsx",
  "app/dashboard/operations/integrations/page.tsx",
  "app/dashboard/va/command/page.tsx",
  "app/alliance/command/page.tsx",
  "app/dashboard/system/integrations/page.tsx",
  "components/integrations/RoleIntegrationCommand.tsx",
  "components/integrations/health/IntegrationHealthGrid.tsx",
]) if (existsSync(p)) ok.push(`route/component present: ${p}`); else errors.push(`MISSING: ${p}`);

const grid = read("components/integrations/health/IntegrationHealthGrid.tsx");
if (grid) check(/STATE_LABEL/.test(grid),
  "health grid conveys state by text (not colour alone)",
  "health grid must convey state by text, not colour alone");

try { JSON.parse(readFileSync("package.json", "utf8")); ok.push("package.json valid"); }
catch { errors.push("package.json invalid JSON"); }

console.log("\nTrusted Integration Command (permission core) validation\n");
for (const l of ok) console.log(`  ${GREEN}✓${RESET} ${l}`);
for (const l of errors) console.log(`  ${RED}✗${RESET} ${l}`);
if (errors.length) { console.log(`\n${RED}${errors.length} failed${RESET}\n`); process.exit(1); }
console.log(`\n${GREEN}All ${ok.length} checks passed${RESET}\n`);
