import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { PREMIUM_CORRIDORS } from "../../lib/seo-premium-corridors";
import {
  buildReferralCapture,
  detectAcquisitionSource,
} from "../../lib/acquisition/referralCapture";

const root = process.cwd();

test("premium professional corridors stay locked to the five high-value Hague markets", () => {
  assert.deepEqual(
    PREMIUM_CORRIDORS.map(({ rank, slug }) => [rank, slug]),
    [
      [1, "italy"],
      [2, "switzerland"],
      [3, "germany"],
      [4, "france"],
      [5, "spain"],
    ],
  );
});

test("every premium corridor has deep professional query and answer coverage", () => {
  for (const corridor of PREMIUM_CORRIDORS) {
    assert.ok(corridor.searchIntents.length >= 8, `${corridor.slug} needs search-intent depth`);
    assert.ok(corridor.answerEngineQuestions.length >= 3, `${corridor.slug} needs answer-engine depth`);
    assert.ok(corridor.commonMatters.length >= 5, `${corridor.slug} needs real matter coverage`);
    assert.match(corridor.positioning, /U\.S\./i);
  }
});

test("search acquisition source normalization covers target discovery engines", () => {
  assert.equal(detectAcquisitionSource({ referrer: "www.google.com" }), "google");
  assert.equal(detectAcquisitionSource({ referrer: "www.bing.com" }), "bing");
  assert.equal(detectAcquisitionSource({ referrer: "search.yahoo.com" }), "yahoo");
  assert.equal(detectAcquisitionSource({ referrer: "duckduckgo.com" }), "duckduckgo");
  assert.equal(detectAcquisitionSource({ referrer: "search.brave.com" }), "brave");
  assert.equal(detectAcquisitionSource({ referrer: "chatgpt.com" }), "chatgpt");
  assert.equal(detectAcquisitionSource({ referrer: "www.perplexity.ai" }), "perplexity");
});

test("UTM source outranks generic landing campaign labels", () => {
  assert.equal(
    detectAcquisitionSource({
      utmSource: "bing",
      landingSource: "professional-italy-seo",
    }),
    "bing",
  );
});

test("referral capture stores attribution without changing operational state", () => {
  const capture = buildReferralCapture({
    channel: "Website Form",
    matterId: "matter-123",
    utmSource: "google",
    utmMedium: "organic",
    utmCampaign: "italy-professional",
    landingSource: "professional-italy-seo",
    capturedAt: "2026-08-10T12:00:00.000Z",
  });

  assert.equal(capture.source, "google");
  assert.equal(capture.channel, "Website Form");
  assert.equal(capture.matterId, "matter-123");
  assert.equal(capture.utmMedium, "organic");
  assert.equal(capture.landingSource, "professional-italy-seo");
});

test("professional hub and country pages preserve premium Matter-first positioning", () => {
  const hub = fs.readFileSync(path.join(root, "app/professional/page.tsx"), "utf8");
  const country = fs.readFileSync(path.join(root, "app/professional/[country]/page.tsx"), "utf8");
  const header = fs.readFileSync(path.join(root, "components/landing/header.tsx"), "utf8");
  const publicDictionary = fs.readFileSync(path.join(root, "lib/i18n/public-dictionary.ts"), "utf8");

  assert.match(hub, /U\.S\. Apostille & Document Execution/);
  assert.match(hub, /Matter review comes first/);
  assert.match(hub, /Professional Execution Access/);
  assert.match(country, /answerEngineQuestions/);
  assert.doesNotMatch(hub, /Final scope and pricing are confirmed only after the Matter is reviewed/);
  assert.doesNotMatch(hub, /\$750|\$975|\$1,850/);
  assert.doesNotMatch(country, /\$750|\$975|\$1,850/);
  assert.match(header, /professionalNavLinks/);
  assert.match(header, /t\.header\.submitClientMatter/);
  assert.match(publicDictionary, /submitClientMatter:\s*"Submit Client Matter"/);
  assert.doesNotMatch(
    header.match(/const professionalNavLinks = \[([\s\S]*?)\];/)?.[1] ?? "",
    /Pricing|\/pricing/,
  );
});
