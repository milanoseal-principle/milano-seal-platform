#!/usr/bin/env node
// Founder decision 2026-11-09: NO VERIFIED WISE SETTLEMENT -> NO SCHEDULING.
// Replaces validate-immediate-scheduling-after-wise-submission.mjs, whose
// submission-authorizes-scheduling contract is retired. This validator proves
// the stronger contract at source, database and behavioral layers.
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const gate = read("lib/scheduling/complimentarySchedulingGate.ts");
const guards = read("lib/bluenotary/guards.ts");
const readiness = read("components/ron/MatterRONReadiness.tsx");
const alerts = read("lib/notifications/transactionalEmailAlerts.ts");
const scheduleRoute = read("app/api/deals/[id]/schedule/route.ts");
const executeRoute = read("app/api/deals/[id]/execute/route.ts");
const migrations = readdirSync("supabase/migrations").filter((name) => name.endsWith(".sql")).sort();
const lastGateMigration = [...migrations].reverse().find((name) => /function public\.check_payment_gate\(\)/.test(read(`supabase/migrations/${name}`)));
const gateSql = lastGateMigration ? read(`supabase/migrations/${lastGateMigration}`) : "";
const gateBody = gateSql.slice(gateSql.indexOf("function public.check_payment_gate()"));

const ACTIVE_ROOTS = ["app", "components", "lib"];
function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) { if (entry.name !== "__tests__" && entry.name !== "node_modules") walk(path, out); }
    else if (/\.(tsx?|mjs)$/.test(entry.name)) out.push(path);
  }
  return out;
}
const active = ACTIVE_ROOTS.flatMap((root) => walk(root)).map((path) => [path, read(path)]);
const obsolete = [
  /wise_submission_observed/,
  /submission (?:may |can )?authori[sz]es? scheduling/i,
  /submission may authorize scheduling/i,
  /scheduling[- ]only authority/i,
  /Wise submitted · scheduling authorized/,
  /Wise processing · scheduling authorized/,
];
const obsoleteHits = active.flatMap(([path, source]) => obsolete.filter((rule) => rule.test(source)).map((rule) => `${path}: ${rule}`));

const checks = [
  ["scheduling gate has one exact-settlement predicate", /export function hasExactVerifiedSettlement/.test(gate) && /hasExactVerifiedSettlement\(params\.matter\)/.test(gate)],
  ["scheduling method vocabulary is verified_payment | not_satisfied only", /SchedulingPaymentRequirementMethod =\s*\|\s*"verified_payment"\s*\|\s*"not_satisfied";/.test(gate)],
  ["submission is display-only processing state", /wiseSubmission === "processing"/.test(gate) && /Scheduling unlocks only after exact verified Wise settlement/.test(gate)],
  ["execution delegates to the same settlement gate", /export function evaluateExecutionGate[\s\S]*return evaluateSchedulingGate\(\{ matter \}\);/.test(gate) && !/hasCurrentWiseProviderEvidence/.test(gate)],
  ["BlueNotary creation consumes the canonical scheduling gate", /assertCanCreateRONSession[\s\S]*verifySchedulingAuthorized/.test(guards) && /evaluateSchedulingGate/.test(guards)],
  ["schedule route consumes the canonical gate", /evaluateSchedulingGate/.test(scheduleRoute) && /Verified Wise settlement is required before scheduling/.test(scheduleRoute)],
  ["execute route consumes the canonical gate", /evaluateExecutionGate/.test(executeRoute)],
  ["RON UI labels submission as processing, not authority", /Wise processing · scheduling locked until verified settlement/.test(readiness)],
  ["operator alert forbids scheduling before settlement", /Do not schedule yet/.test(alerts) && /Wise processing \/ settlement pending/.test(alerts)],
  ["client alert states scheduling waits for settlement", /scheduling unlocks once Wise settlement is verified/.test(alerts)],
  ["final release remains settlement protected", /settlement-dependent final release remains protected/.test(alerts)],
  [`latest check_payment_gate (${lastGateMigration}) requires settlement for scheduled`, /target='scheduled' then\s*if not coalesce\(settlement_verified,false\)/.test(gateBody)],
  ["latest check_payment_gate requires settlement for execution", /target in \('in_execution','apostille_processing'\) then\s*if not coalesce\(settlement_verified,false\)/.test(gateBody)],
  ["latest check_payment_gate has no observation/provider path", !/observed_valid|provider_valid/.test(gateBody)],
  [`no obsolete submission-authorizes-scheduling contract in active source${obsoleteHits.length ? `\n  ${obsoleteHits.join("\n  ")}` : ""}`, obsoleteHits.length === 0],
];

let failed = 0;
for (const [label, ok] of checks) {
  if (ok) console.log(`PASS ${label}`);
  else { console.error(`FAIL ${label}`); failed += 1; }
}
if (failed) process.exit(1);
const behavioral = spawnSync(process.execPath, ["--import", "tsx", "--test",
  "tests/unit/schedulingPaymentGate.test.ts", "tests/unit/verifiedSettlementLifecycle.test.ts",
  "tests/verified-settlement-before-scheduling-p0.test.ts"], { stdio: "inherit" });
if (behavioral.status !== 0) process.exit(behavioral.status ?? 1);
console.log(`Verified settlement before scheduling: ${checks.length}/${checks.length} source/database checks and behavioral tests passed`);
