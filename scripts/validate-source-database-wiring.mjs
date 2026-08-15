import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const files = {
  helper: "lib/matter/canonicalOperationalRead.ts",
  operator: "lib/operator-intelligence/read-model.ts",
  ledgerModel: "lib/operator-intelligence/ledger-read-model.ts",
  today: "app/today/page.tsx",
  ledger: "app/dashboard/ledger/page.tsx",
  needsReview: "app/dashboard/needs-review/page.tsx",
  authorityVerify: "app/dashboard/authorities/verify/page.tsx",
  pipeline: "app/dashboard/pipeline/page.tsx",
  pipelineApi: "app/api/admin/pipeline/route.ts",
  apostille: "app/dashboard/apostille/page.tsx",
  courierApi: "app/api/courier/active/route.ts",
  courierPanel: "components/dashboard/courier/CourierOperationsPanel.tsx",
  releaseApi: "app/api/dashboard/releases/route.ts",
  releaseWorkspace: "app/workspace/release/page.tsx",
  releaseCenter: "components/dashboard/ReleaseControlCenter.tsx",
  followUps: "app/dashboard/follow-ups/page.tsx",
  stateMachine: "data/matter-state-machine.ts",
};

for (const [label, file] of Object.entries(files)) {
  assert.ok(existsSync(file), `Missing ${label}: ${file}`);
}

const source = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, readFileSync(file, "utf8")]),
);

for (const phrase of [
  'from "@/data/matter-state-machine"',
  "LEGACY_OPERATIONAL_STATE_ALIASES",
  "resolveOperationalMatterState",
  "awaiting_payment: \"awaiting_deposit\"",
  "apostille: \"apostille_processing\"",
  "shipped: \"in_transit\"",
]) {
  assert.ok(source.helper.includes(phrase), `Canonical read helper missing: ${phrase}`);
}

for (const prohibited of [
  "MATTER_ALLOWED_TRANSITIONS",
  "canTransitionMatter(",
  ".from(",
  ".insert(",
  ".update(",
  ".upsert(",
  ".delete(",
  ".rpc(",
]) {
  assert.ok(
    !source.helper.includes(prohibited),
    `Canonical operational read helper must remain projection-only: ${prohibited}`,
  );
}

assert.ok(
  source.operator.includes('from "@/lib/matter/canonicalOperationalRead"'),
  "Operator Intelligence must consume the canonical operational read projection",
);
assert.ok(
  source.operator.includes("withMatterQuery"),
  "Operator Intelligence action links must carry Matter focus into downstream workspaces",
);

for (const destination of [
  "/dashboard/ledger",
  "/dashboard/needs-review",
  "/dashboard/authorities/verify",
  "/dashboard/pipeline",
  "/dashboard/apostille",
  "/dashboard/courier",
  "/workspace/release",
  "/dashboard/follow-ups",
]) {
  assert.ok(
    source.operator.includes(`\"${destination}\"`),
    `Missing operator action destination: ${destination}`,
  );
}

assert.ok(
  source.ledgerModel.includes('.from("matter_events")') &&
    source.ledgerModel.includes('.from("deal_events")') &&
    source.ledgerModel.includes('.from("custody_ledger")'),
  "Operational ledger must read real Matter, deal and custody event sources",
);
assert.ok(
  !/const\s+EVENTS\s*[:=]/.test(source.ledger),
  "Operational ledger must not use a hardcoded EVENTS array",
);
assert.ok(
  source.ledger.includes("loadOperationalLedger"),
  "Operational ledger page must consume the live ledger read model",
);

assert.ok(
  !/const\s+ITEMS\s*[:=]/.test(source.needsReview),
  "Needs Review must not use a hardcoded ITEMS array",
);
assert.ok(
  source.needsReview.includes("loadOperatorIntelligence"),
  "Needs Review must derive live canonical Matter intelligence",
);

for (const fakeControl of [
  "setActiveStage",
  "Advance Stage",
  "AUDIT_EVENTS",
  "confidenceForStage",
]) {
  assert.ok(
    !source.authorityVerify.includes(fakeControl),
    `Authority verification must not contain local demo workflow: ${fakeControl}`,
  );
}
assert.ok(
  source.authorityVerify.includes('.from("receiving_authorities")'),
  "Authority verification must read production receiving-authority data",
);
assert.ok(
  source.authorityVerify.includes("Verification Required"),
  "Authority verification must fail closed when no matching authority exists",
);

assert.ok(
  !source.pipeline.includes("PipelineBoard"),
  "Primary pipeline must not expose the legacy mutation board",
);
assert.ok(
  source.pipeline.includes("canonical_phases"),
  "Primary pipeline must render canonical phase projection",
);
assert.ok(
  source.pipelineApi.includes("resolveOperationalMatterState"),
  "Pipeline API must project canonical Matter state",
);
assert.ok(
  source.pipelineApi.includes("state_mismatch_count"),
  "Pipeline API must surface historical state drift instead of hiding it",
);

assert.ok(
  !/\.select\([\s\S]{0,500}matter_status/.test(source.apostille),
  "Apostille tracker must not query nonexistent deals.matter_status",
);
assert.ok(
  source.apostille.includes("resolveOperationalMatterState"),
  "Apostille tracker must use canonical operational state projection",
);

assert.ok(
  !/\.eq\(\s*["']deal_status["']\s*,\s*["']shipped["']\s*\)/.test(
    source.courierApi,
  ),
  "Courier API must not depend on legacy deal_status=shipped",
);
assert.ok(
  source.courierApi.includes("resolveOperationalMatterState"),
  "Courier API must use canonical operational state projection",
);
assert.ok(
  source.courierPanel.includes("deliveredLast7Days"),
  "Courier panel must use live delivered-7-day data, not a hardcoded zero",
);
assert.ok(
  !/const\s+deliveredThisWeek\s*=\s*0/.test(source.courierPanel),
  "Courier panel must not hardcode delivered-this-week as zero",
);

const releaseSelectMatch = source.releaseApi.match(/\.select\(\s*([`"'])([\s\S]*?)\1\s*\)/);
if (releaseSelectMatch) {
  assert.ok(
    !releaseSelectMatch[2].includes("matter_status"),
    "Release API must not query nonexistent deals.matter_status",
  );
  assert.ok(
    !releaseSelectMatch[2].includes("delivered_at"),
    "Release API must not query nonexistent deals.delivered_at",
  );
}
assert.ok(
  !source.releaseApi.includes('matter_status.in.(courier_ready'),
  "Release API must not classify queues from legacy courier_ready/shipped SQL filters",
);
assert.ok(
  source.releaseApi.includes("ready_for_release") &&
    source.releaseApi.includes("final_packet_assembled") &&
    source.releaseApi.includes("label_created") &&
    source.releaseApi.includes("in_transit"),
  "Release API must classify canonical release/transit states",
);
assert.ok(
  !source.releaseWorkspace.includes('href="/portal/release"'),
  "Operator Release Workspace must not deep-link into the client-only portal",
);
assert.ok(
  source.releaseWorkspace.includes("/dashboard/releases") &&
    source.releaseWorkspace.includes("/dashboard/courier") &&
    source.releaseWorkspace.includes("/dashboard/needs-review"),
  "Release Workspace must stay inside operator-authorized surfaces",
);
assert.ok(
  !source.releaseCenter.includes('"Mark Released"'),
  "Release Control Center must not label a review-request note as an actual release",
);
assert.ok(
  source.releaseCenter.includes("Request Release Review"),
  "Release Control Center must truthfully label the review-request action",
);

assert.ok(
  source.followUps.includes("useSearchParams") && source.followUps.includes("focusDeal"),
  "Follow-Up Queue must preserve focused Matter context from /today",
);

for (const page of [
  source.ledger,
  source.needsReview,
  source.authorityVerify,
  source.apostille,
  source.releaseWorkspace,
]) {
  assert.ok(
    page.includes("requireDashboardAccess"),
    "Server-rendered operator workspaces must retain dashboard authorization",
  );
}

for (const api of [source.courierApi, source.releaseApi]) {
  assert.ok(
    api.includes("requireDashboardAccess"),
    "Operator source APIs must retain dashboard authorization",
  );
}

for (const protectedFile of [
  "data/matter-state-machine.ts",
  "lib/wise.ts",
  "app/api/webhooks/wise/route.ts",
]) {
  assert.ok(existsSync(protectedFile), `Protected production authority file missing: ${protectedFile}`);
}

assert.ok(
  source.stateMachine.includes("MATTER_ALLOWED_TRANSITIONS") &&
    source.stateMachine.includes("canTransitionMatter"),
  "Canonical Matter state machine remains the single transition authority",
);

console.log(
  "PASS source/database wiring: live event, review, authority, pipeline, apostille, courier, release and follow-up click paths are canonical-read aligned",
);
