import { test } from "node:test";
import assert from "node:assert/strict";
import { VERTICAL_REGISTRY, VERTICAL_COUNT, getVertical } from "@/lib/vertical-intelligence/verticalRegistry";
import { containsBannedCommercialPublic, organizationRealRevenue } from "@/lib/vertical-intelligence/verticalIntelligenceSafety";
import { computeAuthorityScore } from "@/lib/vertical-intelligence/authorityScore";
import { isRealCommercialAccount, listRealCommercialAccounts, type CommercialAccount } from "@/lib/commercial-accounts/accountRegistry";
import { isDormant, daysSinceLastTouch } from "@/lib/relationship-intelligence/relationshipHealth";

test("fifteen verticals registered, each reusing canonical engines where applicable", () => {
  assert.equal(VERTICAL_COUNT, 15);
  assert.equal(VERTICAL_REGISTRY.length, 15);
  assert.match(getVertical("government_public_sector")!.reuses!, /procurement/);
  assert.match(getVertical("maritime")!.reuses!, /maritime/);
});

test("authority score requires evidence; zero evidence => zero score", () => {
  const none = computeAuthorityScore({ verifiedReferrals: 0, repeatPaidMatters: 0, verifiedRevenue: 0, documentedInteractions: 0 });
  assert.equal(none.hasEvidence, false);
  assert.equal(none.score, 0);
  const some = computeAuthorityScore({ verifiedReferrals: 2, repeatPaidMatters: 1, verifiedRevenue: 5000, documentedInteractions: 4 });
  assert.equal(some.hasEvidence, true);
  assert.ok(some.score > 0);
  assert.equal(some.internalOnly, true);
});

test("account is real only with paid evidence; empty registry is honest", () => {
  assert.deepEqual(listRealCommercialAccounts(), []);
  const fake: CommercialAccount = {
    id: "a", organizationId: null, verticalId: "maritime", tier: "commercial_account",
    level: "professional", approvedRequesterIds: [], paidMatterCount: 0, realRevenueTotal: 0,
    renewalDate: null, relationshipOwner: null, nextAction: null, isSample: false,
  };
  assert.equal(isRealCommercialAccount(fake), false);
});

test("actual org revenue excludes quotes and samples", () => {
  const r = organizationRealRevenue([
    { paid: true, amount: 2000 },
    { paid: false, amount: 9000 },
    { paid: true, amount: 1000, isSample: true },
  ]);
  assert.equal(r, 2000);
});

test("dormancy derives from real interactions only", () => {
  // No interactions recorded -> not dormant (null history), no fabrication.
  assert.equal(daysSinceLastTouch("org-1", 100), null);
  assert.equal(isDormant("org-1", 100), false);
});

test("banned commercial public claims are detected", () => {
  assert.equal(containsBannedCommercialPublic("guaranteed response within 1 hour"), true);
  assert.equal(containsBannedCommercialPublic("internal margin 35%"), true);
  assert.equal(containsBannedCommercialPublic("dedicated priority intake"), false);
});
