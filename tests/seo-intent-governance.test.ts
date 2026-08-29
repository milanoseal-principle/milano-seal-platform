import assert from "node:assert/strict";
import test from "node:test";
import { COUNTRY_DOCUMENT_SEO_RECORDS } from "@/lib/seo/country-document/registry";
import { findDuplicateIntent } from "@/lib/topical-authority/contentSafety";

test("governed country-document topics have no duplicate intent", () => {
  assert.deepEqual(findDuplicateIntent(COUNTRY_DOCUMENT_SEO_RECORDS.map((record) => record.topic)), []);
});
import test from "node:test"; import assert from "node:assert/strict"; import { SEO_AUTHORITY_NODES } from "@/lib/seo/authority/registry"; import { findIntentCollisions } from "@/lib/seo/intent/cannibalization";
test("governed indexable SEO nodes have unique intent/query pairs", () => assert.deepEqual(findIntentCollisions(SEO_AUTHORITY_NODES), []));
