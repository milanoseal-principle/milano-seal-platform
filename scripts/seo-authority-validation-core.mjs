import { COUNTRY_DOCUMENT_SEO_RECORDS } from "../lib/seo/country-document/registry.ts";
import { resolveIndexation } from "../lib/topical-authority/programmatic/pageEligibility.ts";
import { findDuplicateIntent } from "../lib/topical-authority/contentSafety.ts";

const failures = [];
if (COUNTRY_DOCUMENT_SEO_RECORDS.length !== 35) failures.push("phase-one matrix must contain 35 governed candidates");

const ids = new Set();
for (const record of COUNTRY_DOCUMENT_SEO_RECORDS) {
  if (ids.has(record.id)) failures.push(`duplicate candidate: ${record.id}`);
  ids.add(record.id);
  if (resolveIndexation(record.page).state !== "review_required") failures.push(`${record.id} must remain review_required until operator approval`);
  if (record.page.operatorApproved) failures.push(`${record.id} has unsupported operator approval`);
  if (record.page.quality.authoritySourceCount !== 0) failures.push(`${record.id} fabricates verified source evidence`);
  if (record.page.quality.sourcesReviewedAtEpochDays !== null) failures.push(`${record.id} fabricates a source review date`);
  if (record.topic.canonicalSource !== "atlas + canonical document taxonomy") failures.push(`${record.id} does not reuse canonical registries`);
}

if (findDuplicateIntent(COUNTRY_DOCUMENT_SEO_RECORDS.map((record) => record.topic)).length) failures.push("duplicate governed intent");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("SEO authority validation passed: 35 governed review candidates reuse Atlas, canonical document taxonomy, and the existing Topical Authority indexation gate.");
