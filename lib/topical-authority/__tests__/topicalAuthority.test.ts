import { test } from "node:test";
import assert from "node:assert/strict";
import { AUTHORITY_PILLARS, PILLAR_COUNT, getPillar } from "@/lib/topical-authority/topicRegistry";
import { allTopics, countryTopics, findUnmappedTopics } from "@/lib/topical-authority/contentRegistry";
import { detectOrphans, everyTopicLinksToIntake } from "@/lib/topical-authority/internalLinkEngine";
import { containsBannedContentClaim, findDuplicateIntent, isFabricatedMetric } from "@/lib/topical-authority/contentSafety";

test("sixteen authority pillars exist", () => {
  assert.equal(PILLAR_COUNT, 16);
  assert.equal(AUTHORITY_PILLARS.length, 16);
  assert.ok(getPillar("pillar-country-intelligence"));
});

test("country topics derive from Atlas (canonical source = atlas), not a duplicate registry", () => {
  const ct = countryTopics();
  assert.ok(ct.length > 0);
  assert.ok(ct.every((t) => t.canonicalSource === "atlas"));
  assert.ok(ct.every((t) => t.primaryRoute.startsWith("/countries/")));
});

test("every topic maps to a known pillar and links to intake (no orphans by rule)", () => {
  assert.deepEqual(findUnmappedTopics(), []);
  assert.equal(everyTopicLinksToIntake(), true);
  const report = detectOrphans(allTopics());
  assert.deepEqual(report.missingIntakeLink, []);
});

test("banned content claims and doorway/duplicate intent are detectable", () => {
  assert.equal(containsBannedContentClaim("We are the #1 apostille authority"), true);
  assert.equal(containsBannedContentClaim("General apostille pathway information"), false);
  const dupes = findDuplicateIntent([
    ...allTopics(),
    { ...allTopics()[0] }, // exact duplicate
  ]);
  assert.ok(dupes.length >= 1);
});

test("SEO metrics without a real source are treated as fabricated", () => {
  assert.equal(isFabricatedMetric(null), true);
  assert.equal(isFabricatedMetric("sample"), true);
  assert.equal(isFabricatedMetric("google-search-console"), false);
});
