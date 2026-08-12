import { test } from "node:test";
import assert from "node:assert/strict";
import { scorePageQuality, type PageQualityInput } from "@/lib/topical-authority/programmatic/pageQualityScore";
import { resolveIndexation, sitemapEligiblePages, type ProgrammaticPage } from "@/lib/topical-authority/programmatic/pageEligibility";

const NOW = 20000;

function goodInput(over: Partial<PageQualityInput> = {}): PageQualityInput {
  return {
    hasVerifiedDocumentRecord: true,
    hasVerifiedCountryRecord: true,
    authoritySourceCount: 2,
    bodyLength: 2000,
    internalLinkCount: 6,
    hasCountrySpecificContent: true,
    hasDocumentSpecificContent: true,
    hasRejectionRisks: true,
    hasConversionPath: true,
    humanReviewed: true,
    sourcesReviewedAtEpochDays: NOW - 30,
    nowEpochDays: NOW,
    renderedText: "Apostille pathway for a birth certificate used in Italy. Requirements vary and must be verified.",
    duplicateIntent: false,
    ...over,
  };
}

test("thin content is never indexable", () => {
  const r = scorePageQuality(goodInput({ bodyLength: 300 }));
  assert.equal(r.indexable, false);
  assert.ok(r.blockers.some((b) => /thin content/.test(b)));
});

test("missing authority source blocks indexation", () => {
  assert.equal(scorePageQuality(goodInput({ authoritySourceCount: 0 })).indexable, false);
});

test("duplicate primary intent (cannibalization) blocks indexation", () => {
  assert.equal(scorePageQuality(goodInput({ duplicateIntent: true })).indexable, false);
});

test("stale sources block fresh indexation", () => {
  assert.equal(scorePageQuality(goodInput({ sourcesReviewedAtEpochDays: NOW - 400 })).indexable, false);
  assert.equal(scorePageQuality(goodInput({ sourcesReviewedAtEpochDays: null })).indexable, false);
});

test("guaranteed/unsupported claims block indexation", () => {
  assert.equal(scorePageQuality(goodInput({ renderedText: "We are the #1 apostille authority with guaranteed acceptance" })).indexable, false);
});

test("a fully-verified, operator-approved page becomes approved_indexable and enters sitemap", () => {
  const page: ProgrammaticPage = { slug: "birth-certificate-italy", route: "/apostille/birth-certificate-italy", quality: goodInput(), operatorApproved: true };
  const r = resolveIndexation(page);
  assert.equal(r.state, "approved_indexable");
  assert.equal(r.inSitemap, true);
});

test("passing the gate without operator approval stays review_required (no mass auto-index)", () => {
  const page: ProgrammaticPage = { slug: "x", route: "/x", quality: goodInput(), operatorApproved: false };
  assert.equal(resolveIndexation(page).state, "review_required");
});

test("sitemap contains only approved-indexable pages", () => {
  const pages: ProgrammaticPage[] = [
    { slug: "a", route: "/a", quality: goodInput(), operatorApproved: true },
    { slug: "b", route: "/b", quality: goodInput({ bodyLength: 200 }), operatorApproved: true }, // thin
    { slug: "c", route: "/c", quality: goodInput(), operatorApproved: false }, // unapproved
  ];
  const sm = sitemapEligiblePages(pages);
  assert.equal(sm.length, 1);
  assert.equal(sm[0].slug, "a");
});
