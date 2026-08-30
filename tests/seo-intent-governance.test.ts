import assert from "node:assert/strict";
import test from "node:test";
import { COUNTRY_DOCUMENT_SEO_RECORDS } from "@/lib/seo/country-document/registry";
import { findDuplicateIntent } from "@/lib/topical-authority/contentSafety";

test("governed country-document topics have no duplicate intent", () => {
  assert.deepEqual(findDuplicateIntent(COUNTRY_DOCUMENT_SEO_RECORDS.map((record) => record.topic)), []);
});
