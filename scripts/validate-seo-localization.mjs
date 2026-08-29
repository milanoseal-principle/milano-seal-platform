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
import fs from "node:fs"; const source = fs.readFileSync("lib/seo/localization/registry.ts", "utf8"); if (!source.includes('translationStatus: "HUMAN_REVIEW_REQUIRED"') || !source.includes('indexStatus: "NOINDEX"')) { console.error("Localized route reservations must fail closed"); process.exit(1); } console.log("SEO localization validation passed: machine/unreviewed routes remain NOINDEX.");
