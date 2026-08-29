import { LOCALIZED_SEO_RECORDS } from "../lib/seo/localization/registry.ts";

const invalid = LOCALIZED_SEO_RECORDS.filter(
  (record) =>
    record.translationStatus !== "HUMAN_REVIEW_REQUIRED" ||
    record.indexationState !== "approved_noindex",
);

if (invalid.length) {
  console.error("Unreviewed localized reservations must remain approved_noindex");
  process.exit(1);
}

console.log("SEO localization validation passed: all unreviewed reservations remain approved_noindex.");
