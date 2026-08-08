import { test } from "node:test";
import assert from "node:assert/strict";
import { TARGET_ORGANIZATIONS, targetsBySegment } from "@/data/commercial/targetOrganizations";
import { VERTICAL_REGISTRY } from "@/lib/vertical-intelligence/verticalRegistry";

test("batch 1 has 10-25 real target organizations", () => {
  assert.ok(TARGET_ORGANIZATIONS.length >= 10 && TARGET_ORGANIZATIONS.length <= 25);
});

test("every target is real data with no fabricated contacts/touchpoints/relationships", () => {
  for (const t of TARGET_ORGANIZATIONS) {
    assert.equal(t.isSample, false);
    assert.equal(t.pipelineStage, "target_identified");
    assert.equal(t.decisionMakerName, null);
    assert.equal(t.email, null);
    assert.equal(t.phone, null);
    assert.equal(t.lastRealTouchpoint, null);
    assert.equal(t.referralSource, null);
    assert.equal(t.verificationStatus, "pending_verification");
    assert.ok(t.organizationName.length > 0);
  }
});

test("every target maps to a known vertical", () => {
  const ids = new Set(VERTICAL_REGISTRY.map((v) => v.id));
  for (const t of TARGET_ORGANIZATIONS) assert.ok(ids.has(t.vertical));
});

test("segment coverage spans the maritime cluster", () => {
  const seg = targetsBySegment();
  for (const s of ["marine_documentation_agent", "yacht_brokerage", "maritime_attorney", "customs_broker", "freight_forwarder"]) {
    assert.ok((seg[s] ?? 0) > 0, `expected targets in ${s}`);
  }
});
