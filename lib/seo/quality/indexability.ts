import { getCountryBySlug } from "@/lib/compliance/countries";
import { getEvidence } from "../evidence/registry";
import { requiresReview } from "../evidence/freshness";
import type { SeoIndexStatus } from "../authority/types";
import type { CountryDocumentSeoRecord } from "../country-document/types";
export interface SeoAuthorityContext { canonical: string; hasSchema: boolean; internalLinks: string[]; conversionTarget: string }
export function evaluateSeoIndexability(record: CountryDocumentSeoRecord, context: SeoAuthorityContext): { status: SeoIndexStatus; blockers: string[] } {
  const blockers: string[] = [];
  if (!getCountryBySlug(record.countrySlug)) blockers.push("ungoverned country");
  if (!record.documentSlug || !record.documentName) blockers.push("ungoverned document");
  if (!record.title || !record.description || !record.h1 || !record.primaryQuery) blockers.push("missing unique metadata or query");
  if (record.intro.length < 180 || !record.intro.includes(record.countrySlug === "italy" ? "Italy" : getCountryBySlug(record.countrySlug)?.name ?? "")) blockers.push("insufficient destination-specific content");
  if (!context.canonical || !context.hasSchema) blockers.push("missing canonical or schema");
  if (context.internalLinks.length < 3 || !context.conversionTarget) blockers.push("missing semantic links or conversion target");
  const evidence = record.evidenceIds.map(getEvidence);
  if (evidence.some((item) => !item)) blockers.push("missing evidence");
  if (evidence.some((item) => item && requiresReview(item))) blockers.push("evidence review required");
  if (/will be accepted|guaranteed acceptance/i.test(JSON.stringify(record))) blockers.push("prohibited acceptance guarantee");
  if (!blockers.length) return { status: "INDEXABLE", blockers };
  return { status: blockers.some((item) => item.includes("review")) ? "REVIEW_REQUIRED" : "NOINDEX", blockers };
}
