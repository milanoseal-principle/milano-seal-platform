import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildIntegrationHealthSnapshot, type IntegrationHealthInput } from "../index";

const r = (o: Partial<IntegrationHealthInput> & { provider: string }): IntegrationHealthInput => ({
  configured: false,
  health: "action_required",
  ...o,
});

// 1: configuration presence alone does not produce active
test("configured provider is configuration_present, never active", () => {
  const s = buildIntegrationHealthSnapshot([r({ provider: "wise", configured: true, health: "configured" })]);
  assert.equal(s.integrations[0].lifecycleState, "configuration_present");
  assert.equal(s.activeCount, 0);
  assert.equal(s.configuredCount, 1);
});

// 6: active requires the full evidence chain (health === active/healthy)
test("active state only from real active/healthy health evidence", () => {
  const s = buildIntegrationHealthSnapshot([r({ provider: "wise", configured: true, health: "active", lastVerifiedEventAt: "2026-01-01T00:00:00Z" })]);
  assert.equal(s.activeCount, 1);
  assert.equal(s.evidenceStatus, "verified");
});

// 7: degraded requires real failure/degraded evidence
test("degraded state only from degraded health evidence", () => {
  const s = buildIntegrationHealthSnapshot([r({ provider: "shippo", configured: true, health: "degraded", lastFailureAt: "2026-02-02T00:00:00Z" })]);
  assert.equal(s.degradedCount, 1);
  assert.equal(s.latestFailureEvent, "2026-02-02T00:00:00Z");
});

// 10: sample excluded
test("sample integration evidence is excluded", () => {
  const s = buildIntegrationHealthSnapshot([
    r({ provider: "wise", configured: true, health: "configured" }),
    r({ provider: "x", configured: true, health: "active", isSample: true }),
  ]);
  assert.equal(s.providerCount, 1);
  assert.ok(s.sampleExcluded >= 1);
});

// 12: no evidence → insufficient
test("no providers returns insufficient_evidence", () => {
  const s = buildIntegrationHealthSnapshot([]);
  assert.equal(s.evidenceStatus, "insufficient_evidence");
  assert.equal(s.confidence, null);
});

// 14: partial (configured, none active) → verified_with_limitations
test("configured-but-not-active returns verified_with_limitations", () => {
  const s = buildIntegrationHealthSnapshot([r({ provider: "wise", configured: true, health: "configured" })]);
  assert.equal(s.evidenceStatus, "verified_with_limitations");
  assert.ok(s.limitations.some((l) => /configured/i.test(l)));
});

// 15 + 16 + 17: unsupported metrics null
test("latency / uptime / error rate remain null", () => {
  const s = buildIntegrationHealthSnapshot([r({ provider: "wise", configured: true, health: "active" })]);
  assert.equal(s.latencyMs, null);
  assert.equal(s.uptimePercent, null);
  assert.equal(s.errorRate, null);
});

// 1 (missing config): unconfigured → missing_configuration, not available
test("unconfigured provider is missing_configuration", () => {
  const s = buildIntegrationHealthSnapshot([r({ provider: "bluenotary", configured: false, health: "action_required" })]);
  assert.equal(s.integrations[0].lifecycleState, "missing_configuration");
  assert.equal(s.activeCount, 0);
});

// 18: inputs not mutated
test("inputs are not mutated", () => {
  const input = Object.freeze([Object.freeze(r({ provider: "wise", configured: true, health: "configured" }))]) as IntegrationHealthInput[];
  const before = JSON.stringify(input);
  buildIntegrationHealthSnapshot(input);
  assert.equal(JSON.stringify(input), before);
});

// 23: no raw provider evidence serialized (secrets/keys)
test("snapshot serializes no secret/key/payload", () => {
  const s = buildIntegrationHealthSnapshot([r({ provider: "wise", configured: true, health: "configured" })]);
  const json = JSON.stringify(s);
  assert.ok(!/API_KEY|SECRET|PRIVATE_KEY|payload|Bearer/i.test(json));
});

// 24: Health Center alignment — same states, no invented "active"
test("Health Center alignment: 'configured' maps to configuration_present, never active", () => {
  const s = buildIntegrationHealthSnapshot([r({ provider: "wise", configured: true, health: "configured" })]);
  assert.notEqual(s.integrations[0].lifecycleState, "active");
});

// 19 + 20 + 21 + 22 + 26: server loader contracts
test("integration loader reuses Health Center, read-only, no provider calls, founder-gated, server-only", () => {
  const src = readFileSync("lib/intelligence/enterprise/server/founderIntegrationSource.ts", "utf8");
  for (const w of [".insert(", ".update(", ".delete(", ".upsert("]) assert.ok(!src.includes(w), `no ${w}`);
  assert.ok(/allIntegrationHealth/.test(src), "reuses canonical Health Center read model");
  const code = src.split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
  assert.ok(!/\bfetch\(|axios|https?:\/\//i.test(code), "no provider calls");
  assert.ok(/resolveServerRole/.test(src) && /FOUNDER_ADMIN_ROLES/.test(src));
  assert.ok(!/user_metadata/.test(src));
  const index = readFileSync("lib/intelligence/enterprise/index.ts", "utf8");
  assert.ok(!/founderIntegrationSource/.test(index), "server loader not re-exported to client barrel");
});

// 25 + 27: Sources #1-#5 intact; no duplicate engine; no migration changes
test("Sources #1-#5 wiring intact; no duplicate integration engine", () => {
  const page = readFileSync("app/dashboard/founder/page.tsx", "utf8");
  for (const l of [
    "loadFounderMatterStateSnapshot", "loadFounderRevenueSnapshot", "loadFounderOrganizationSnapshot",
    "loadFounderRelationshipSnapshot", "loadFounderCapacitySnapshot", "loadFounderIntegrationSnapshot",
  ]) {
    assert.ok(new RegExp(l).test(page), `missing ${l}`);
  }
  const src = readFileSync("lib/intelligence/enterprise/snapshots.ts", "utf8");
  assert.ok(!/class\s+\w*Integration|new IntegrationHealthCenter|IntegrationHealthV2/.test(src));
});
