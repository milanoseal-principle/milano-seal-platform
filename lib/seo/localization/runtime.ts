import { LOCALIZED_SEO_RECORDS } from "./registry";
import type { LocalizedSeoRecord, SupportedSeoLocale } from "./types";

const ORIGIN = "https://www.themilanoseal.com";

export function localizedPath(prefix: string, slug: string[]) {
  return `/${prefix}/${slug.map((part) => part.trim()).filter(Boolean).join("/")}`;
}

export function getLocalizedSeoRecord(locale: SupportedSeoLocale, path: string) {
  return LOCALIZED_SEO_RECORDS.find((record) => record.locale === locale && record.path === path);
}

export function isLocalizedSeoRecordPublishable(record: LocalizedSeoRecord | undefined): record is LocalizedSeoRecord {
  if (!record) return false;
  if (record.translationStatus !== "HUMAN_REVIEWED" || record.indexStatus !== "INDEXABLE") return false;
  if (!record.reviewedBy?.trim() || !record.reviewedAt?.trim()) return false;
  if (!record.title.trim() || !record.description.trim() || !record.h1.trim()) return false;
  if (!record.ctaLabel.trim() || !record.englishVersionLabel.trim() || !record.legalBoundary.trim()) return false;
  return Object.values(record.bodySections).some((value) => value.trim().length > 0);
}

export function getPublishedLocalizedRecords(locale: SupportedSeoLocale) {
  return LOCALIZED_SEO_RECORDS.filter((record) => record.locale === locale && isLocalizedSeoRecordPublishable(record));
}

export function absoluteMilanoUrl(path: string) {
  return new URL(path, ORIGIN).toString();
}

export function slugForLocalizedRecord(record: LocalizedSeoRecord) {
  return record.path.split("/").filter(Boolean).slice(1);
}
