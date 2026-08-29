import assert from "node:assert/strict";
import test from "node:test";
import { COUNTRY_DOCUMENT_SEO_RECORDS } from "@/lib/seo/country-document/registry";

test("editorial candidates do not fabricate source verification", () => {
  for (const record of COUNTRY_DOCUMENT_SEO_RECORDS) {
    assert.equal(record.page.quality.authoritySourceCount, 0);
    assert.equal(record.page.quality.sourcesReviewedAtEpochDays, null);
    assert.ok(record.sourceCandidates.length > 0);
  }
});
import test from "node:test"; import assert from "node:assert/strict"; import { SEO_EVIDENCE } from "@/lib/seo/evidence/registry"; import { requiresReview } from "@/lib/seo/evidence/freshness";
test("evidence is fresh at its governed verification date", () => { for (const record of SEO_EVIDENCE) assert.equal(requiresReview(record, new Date("2026-08-29")), false); });
