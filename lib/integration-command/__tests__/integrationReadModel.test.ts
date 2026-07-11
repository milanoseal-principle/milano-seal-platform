import { test } from "node:test";
import assert from "node:assert/strict";
import { getIntegrationHealth, allIntegrationHealth, listMatterIntegrationSummaries } from "@/lib/integration-command/integrationReadModel";

test("configured is not healthy — health is evidence-based", () => {
  const all = allIntegrationHealth();
  assert.equal(all.length, 3);
  for (const r of all) {
    // Without a verified event, health can never be "healthy".
    assert.notEqual(r.health, "healthy");
    assert.equal(r.lastVerifiedEventAt, null);
  }
});

test("missing configuration reports action_required, not a fake green state", () => {
  // In this environment the keys are absent -> action_required.
  const wise = getIntegrationHealth("wise");
  assert.ok(["action_required", "configured"].includes(wise.health));
  if (!wise.configured) assert.equal(wise.health, "action_required");
});

test("matter integration summaries are empty (no fabricated matters)", () => {
  assert.deepEqual(listMatterIntegrationSummaries(), []);
});
