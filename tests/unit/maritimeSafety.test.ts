import { test } from "node:test";
import assert from "node:assert/strict";
import { containsBannedMaritimeClaim, nullIfBlank, describeDeadline } from "@/lib/maritime/maritimeSafety";
import { listRealActiveAccounts, isAccountActive, type CommercialAccount } from "@/lib/maritime/accounts/commercialAccount";
import { deduplicateMaritimeActions, type MaritimeOperatorAction } from "@/lib/maritime/operatorActions";
import { prepareMaritimeQuote } from "@/lib/maritime/pricing/maritimePricingAdapter";

test("banned maritime claims are detected", () => {
  assert.equal(containsBannedMaritimeClaim("guaranteed customs clearance"), true);
  assert.equal(containsBannedMaritimeClaim("port approved vendor"), true);
  assert.equal(containsBannedMaritimeClaim("coordination and administrative support"), false);
});

test("unknown values remain null (never guessed)", () => {
  assert.equal(nullIfBlank(""), null);
  assert.equal(nullIfBlank(undefined), null);
  assert.equal(nullIfBlank("v"), "v");
});

test("deadlines are framed, never guaranteed", () => {
  assert.equal(describeDeadline("requested"), "Requested deadline");
  assert.equal(describeDeadline("third_party"), "Third-party dependent");
});

test("no commercial accounts are active without real paid evidence", () => {
  assert.deepEqual(listRealActiveAccounts(), []);
  const fake: CommercialAccount = {
    id: "a", source: "test", dataStatus: "sample", isSample: true,
    organizationId: null, accountType: "yacht_brokerage", status: "active",
    approvedRequesterIds: [], paidMatterCount: 0, realRevenueTotal: 0,
    renewalDate: null, relationshipOwner: null, nextAction: null,
  };
  assert.equal(isAccountActive(fake), false);
});

test("maritime pricing delegates to canonical gateway (operator-prepared, internal)", () => {
  const q = prepareMaritimeQuote();
  assert.equal(q.manualReviewRequired, true);
  assert.equal(q.internalOnly, true);
  assert.equal(q.consumer, undefined);
});

test("duplicate maritime operator actions are removed", () => {
  const a = (id: string, matter: string | null): MaritimeOperatorAction => ({
    id, actionType: "review_maritime_intake", title: "", priority: "NORMAL",
    status: "open", owner: null, dueAt: null, blocker: null, sourceMatterId: matter, route: "/dashboard/maritime",
  });
  const deduped = deduplicateMaritimeActions([a("1", "m1"), a("2", "m1"), a("3", "m2")]);
  assert.equal(deduped.length, 2);
});
