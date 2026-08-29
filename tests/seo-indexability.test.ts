import assert from "node:assert/strict";
import test from "node:test";
import { COUNTRY_DOCUMENT_SEO_RECORDS } from "@/lib/seo/country-document/registry";
import { resolveIndexation } from "@/lib/topical-authority/programmatic/pageEligibility";

test("phase-one matrix contains exactly 35 governed candidates", () => {
  assert.equal(COUNTRY_DOCUMENT_SEO_RECORDS.length, 35);
});

test("every candidate stays review-required until evidence and human approval exist", () => {
  for (const record of COUNTRY_DOCUMENT_SEO_RECORDS) {
    const eligibility = resolveIndexation(record.page);
    assert.equal(eligibility.state, "review_required");
    assert.equal(eligibility.inSitemap, false);
    assert.equal(record.page.operatorApproved, false);
  }
});
