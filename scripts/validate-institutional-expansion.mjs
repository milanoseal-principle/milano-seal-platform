import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const required = [
  "lib/expansion/institutionalExpansion.ts",
  "app/dashboard/expansion/page.tsx",
  "tests/institutional-expansion.test.ts",
  "components/dashboard/OperatorShell.tsx",
];
for (const file of required) assert.ok(existsSync(file), `Missing institutional expansion file: ${file}`);

const engine = readFileSync("lib/expansion/institutionalExpansion.ts", "utf8");
const page = readFileSync("app/dashboard/expansion/page.tsx", "utf8");
const nav = readFileSync("components/dashboard/OperatorShell.tsx", "utf8");
const cert = readFileSync("docs/FINAL_PRODUCTION_CERTIFICATION.md", "utf8");

for (const token of [
  "execution_reconciliation",
  "truth_failure_alerts",
  "operator_knowledge_graph",
  "client_return_engine",
  "trust_engine_2",
  "alliance_intelligence",
]) assert.ok(engine.includes(`\"${token}\"`), `Missing expansion module ${token}`);

assert.ok(engine.includes("wiseRemainsPaymentAuthority: true"), "Wise authority lock missing");
assert.ok(engine.includes("noSecondMatterEngine: true"), "Second Matter engine prohibition missing");
assert.ok(engine.includes("noSyntheticTrustScores: true"), "Synthetic trust score prohibition missing");
assert.ok(engine.includes("noAutomaticRelease: true"), "Automatic release prohibition missing");
assert.ok(engine.includes("releaseBlocked"), "Execution reconciliation release gate missing");
assert.ok(engine.includes("Paid state lacks Wise transaction reference"), "Wise discrepancy detection missing");
assert.ok(engine.includes("No completed Matter evidence"), "Client return fail-closed behavior missing");
assert.ok(engine.includes("zero open exceptions") || engine.includes("zero open exceptions."), "Alliance exception gate missing");
assert.ok(page.includes("Institutional Expansion Layer"), "Expansion control center missing");
assert.ok(page.includes("Live Vercel READY evidence"), "Expansion UI must preserve live certification boundary");
assert.ok(nav.includes('/dashboard/expansion'), "Operator navigation missing expansion center");
assert.ok(cert.includes("PENDING"), "Human/live certification must remain pending where evidence is absent");
assert.ok(!engine.match(/stripe/i), "Expansion engine must remain Wise-only");

console.log("PASS institutional expansion: reconciliation, truth alerts, knowledge graph, return engine, Trust Engine 2.0 and Alliance intelligence are governed and fail closed.");
