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
import test from "node:test"; import assert from "node:assert/strict"; import { COUNTRY_DOCUMENT_SEO_RECORDS } from "@/lib/seo/country-document/registry"; import { SEO_AUTHORITY_NODES } from "@/lib/seo/authority/registry"; import { getAuthorityLinks } from "@/lib/seo/authority/links"; import { evaluateSeoIndexability } from "@/lib/seo/quality/indexability";
test("phase-one matrix contains exactly 35 governed routes", () => assert.equal(COUNTRY_DOCUMENT_SEO_RECORDS.length, 35));
test("every governed route passes the indexability gate", () => { for (const record of COUNTRY_DOCUMENT_SEO_RECORDS) { const node = SEO_AUTHORITY_NODES.find((item) => item.countrySlug === record.countrySlug && item.documentSlug === record.documentSlug); assert.ok(node); assert.deepEqual(evaluateSeoIndexability(record, { canonical: `https://www.themilanoseal.com${node.path}`, hasSchema: true, internalLinks: getAuthorityLinks(node), conversionTarget: node.conversionTarget }), { status: "INDEXABLE", blockers: [] }); } });
