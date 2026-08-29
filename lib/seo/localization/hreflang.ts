import { LOCALIZED_SEO_RECORDS } from "./registry";
export function getHreflangAlternates(path: string) {
  const record = LOCALIZED_SEO_RECORDS.find((item) => item.path === path || item.englishEquivalent === path);
  if (!record) return undefined;
  const reviewed = LOCALIZED_SEO_RECORDS.filter((item) => item.englishEquivalent === record.englishEquivalent && item.translationStatus === "HUMAN_REVIEWED" && item.indexationState === "approved_indexable");
  const reviewed = LOCALIZED_SEO_RECORDS.filter((item) => item.englishEquivalent === record.englishEquivalent && item.translationStatus === "HUMAN_REVIEWED" && item.indexStatus === "INDEXABLE");
  return Object.fromEntries([["en-US", record.englishEquivalent], ["x-default", record.englishEquivalent], ...reviewed.map((item) => [item.locale, item.path])]);
}
