import { COUNTRY_DOCUMENT_SEO_RECORDS } from "../lib/seo/country-document/registry.ts";
import { containsBannedContentClaim } from "../lib/topical-authority/contentSafety.ts";

const unsafe = COUNTRY_DOCUMENT_SEO_RECORDS.filter((record) =>
  containsBannedContentClaim(record.page.quality.renderedText),
);

if (unsafe.length) {
  console.error(`Unsafe public claims in: ${unsafe.map((record) => record.id).join(", ")}`);
  process.exit(1);
}

console.log("SEO public-claims validation passed.");
