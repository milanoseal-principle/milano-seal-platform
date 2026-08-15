import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const helper = readFileSync("lib/matter/canonicalOperationalRead.ts", "utf8");
const operator = readFileSync("lib/operator-intelligence/read-model.ts", "utf8");
const ledger = readFileSync("app/dashboard/ledger/page.tsx", "utf8");
const needsReview = readFileSync("app/dashboard/needs-review/page.tsx", "utf8");
const authorityVerify = readFileSync("app/dashboard/authorities/verify/page.tsx", "utf8");
const pipeline = readFileSync("app/dashboard/pipeline/page.tsx", "utf8");
const apostille = readFileSync("app/dashboard/apostille/page.tsx", "utf8");
const courierApi = readFileSync("app/api/courier/active/route.ts", "utf8");
const releaseApi = readFileSync("app/api/dashboard/releases/route.ts", "utf8");
const releaseWorkspace = readFileSync("app/workspace/release/page.tsx", "utf8");
const releaseCenter = readFileSync("components/dashboard/ReleaseControlCenter.tsx", "utf8");

test("operator intelligence uses one read-only canonical projection", () => {
  assert.match(helper, /from "@\/data\/matter-state-machine"/);
  assert.match(helper, /new:\s*"intake_received"/);
  assert.match(helper, /awaiting_payment:\s*"awaiting_deposit"/);
  assert.match(helper, /apostille:\s*"apostille_processing"/);
  assert.match(helper, /shipped:\s*"in_transit"/);
  assert.doesNotMatch(helper, /MATTER_ALLOWED_TRANSITIONS/);
  assert.doesNotMatch(helper, /canTransitionMatter\(/);
  assert.doesNotMatch(helper, /\.from\(/);
  assert.match(operator, /canonicalOperationalRead/);
  assert.match(operator, /withMatterQuery/);
});

test("ledger and review queues no longer use hardcoded empty arrays", () => {
  assert.match(ledger, /loadOperationalLedger/);
  assert.doesNotMatch(ledger, /const\s+EVENTS\s*[:=]/);
  assert.match(needsReview, /loadOperatorIntelligence/);
  assert.doesNotMatch(needsReview, /const\s+ITEMS\s*[:=]/);
});

test("authority verification is production evidence, not a local demo workflow", () => {
  assert.match(authorityVerify, /\.from\("receiving_authorities"\)/);
  assert.match(authorityVerify, /Verification Required/);
  assert.doesNotMatch(authorityVerify, /setActiveStage/);
  assert.doesNotMatch(authorityVerify, /Advance Stage/);
  assert.doesNotMatch(authorityVerify, /AUDIT_EVENTS/);
});

test("pipeline is canonical read-only and does not render legacy mutation board", () => {
  assert.match(pipeline, /canonical_phases/);
  assert.doesNotMatch(pipeline, /PipelineBoard/);
});

test("apostille, courier and release reads do not depend on nonexistent or stale status fields", () => {
  assert.match(apostille, /resolveOperationalMatterState/);
  assert.doesNotMatch(apostille, /\.select\([\s\S]{0,500}matter_status/);
  assert.doesNotMatch(courierApi, /\.eq\(\s*["']deal_status["']\s*,\s*["']shipped["']/);
  assert.match(courierApi, /resolveOperationalMatterState/);

  const releaseSelect = releaseApi.match(/\.select\(\s*([`"'])([\s\S]*?)\1\s*\)/);
  assert.ok(releaseSelect);
  assert.doesNotMatch(releaseSelect[2], /\bmatter_status\b/);
  assert.doesNotMatch(releaseSelect[2], /\bdelivered_at\b/);
  assert.match(releaseApi, /ready_for_release/);
  assert.match(releaseApi, /final_packet_assembled/);
  assert.match(releaseApi, /label_created/);
});

test("operator release flow stays operator-only and labels review truthfully", () => {
  assert.doesNotMatch(releaseWorkspace, /href="\/portal\/release"/);
  assert.match(releaseWorkspace, /\/dashboard\/releases/);
  assert.match(releaseWorkspace, /\/dashboard\/courier/);
  assert.doesNotMatch(releaseCenter, /"Mark Released"/);
  assert.match(releaseCenter, /Request Release Review/);
});

test("all eight /today destinations carry focused Matter context", () => {
  for (const route of [
    "/dashboard/ledger",
    "/dashboard/needs-review",
    "/dashboard/authorities/verify",
    "/dashboard/pipeline",
    "/dashboard/apostille",
    "/dashboard/courier",
    "/workspace/release",
    "/dashboard/follow-ups",
  ]) {
    assert.match(operator, new RegExp(route.replaceAll("/", "\\/")));
  }
  assert.match(operator, /matter/);
  assert.match(operator, /deal/);
  assert.match(operator, /focus/);
});
