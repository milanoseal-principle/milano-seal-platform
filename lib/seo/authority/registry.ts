import { COUNTRY_DOCUMENT_SEO_RECORDS, getCountryDocumentPath } from "../country-document/registry";
import type { SeoAuthorityNode } from "./types";

export const SEO_AUTHORITY_NODES: SeoAuthorityNode[] = COUNTRY_DOCUMENT_SEO_RECORDS.map((record) => ({
  id: `${record.countrySlug}:${record.documentSlug}`,
  path: getCountryDocumentPath(record),
  intent: "transactional",
  pillar: record.pillar,
  audience: record.audience,
  primaryQuery: record.primaryQuery,
  secondaryQueries: record.secondaryQueries,
  countrySlug: record.countrySlug,
  documentSlug: record.documentSlug,
  language: "en-US",
  canonicalParent: `/apostille/${record.countrySlug}`,
  supportingPages: [`/apostille/${record.countrySlug}`, `/professional/${record.countrySlug}`, "/global-document-intelligence", ...record.relatedDocumentSlugs.map((slug) => `/apostille/${record.countrySlug}/${slug}`)],
  conversionTarget: `/intake?lane=professional&destination=${record.countrySlug}&document_type=${record.documentSlug.replaceAll("-", "_")}`,
  status: record.indexStatus,
  uniqueTitle: record.title,
  uniqueDescription: record.description,
  h1: record.h1,
  priority: 0.9,
}));
