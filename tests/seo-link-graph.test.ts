import assert from "node:assert/strict";
import test from "node:test";
import { COUNTRY_DOCUMENT_SEO_RECORDS } from "@/lib/seo/country-document/registry";

test("every candidate links to its country, professional route, intelligence, and intake", () => {
  for (const record of COUNTRY_DOCUMENT_SEO_RECORDS) {
    const links = record.topic.internalLinkTargets;
    assert.ok(links.includes(`/apostille/${record.countrySlug}`));
    assert.ok(links.includes(`/professional/${record.countrySlug}`));
    assert.ok(links.includes("/global-document-intelligence"));
    assert.ok(links.some((link) => link.startsWith("/intake")));
  }
});
import test from "node:test"; import assert from "node:assert/strict"; import { SEO_AUTHORITY_NODES } from "@/lib/seo/authority/registry"; import { getAuthorityLinks } from "@/lib/seo/authority/links";
test("every indexable node has useful semantic links", () => { for (const node of SEO_AUTHORITY_NODES) assert.ok(getAuthorityLinks(node).length >= 3); });
