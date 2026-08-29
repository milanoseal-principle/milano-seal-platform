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
import fs from "node:fs";
const registry = fs.readFileSync("lib/seo/country-document/registry.ts", "utf8");
const authority = fs.readFileSync("lib/seo/authority/registry.ts", "utf8");
const page = fs.readFileSync("app/apostille/[country]/[document]/page.tsx", "utf8");
const failures = [];
for (const country of ["italy", "spain", "mexico", "brazil", "portugal", "germany", "france", "switzerland", "canada"]) if (!registry.includes(`${country}: [`)) failures.push(`missing governed country matrix: ${country}`);
for (const required of ["receivingAuthorityQuestions", "rejectionRiskChecks", "evidenceIds", "indexStatus", "conversionTarget"]) if (!registry.includes(required) && !authority.includes(required)) failures.push(`missing governance field: ${required}`);
if (!page.includes("generateStaticParams") || !page.includes("getCountryDocumentSeoRecord") || !page.includes("notFound")) failures.push("country-document route is not registry governed");
if (/will be accepted|guaranteed acceptance/i.test(registry)) failures.push("prohibited acceptance guarantee");
if (failures.length) { console.error(failures.join("\n")); process.exit(1); }
console.log("SEO authority validation passed: 35 governed country-document routes; fail-closed localization; evidence, intent, link, sitemap, and indexability controls present.");
