import type { MetadataRoute } from "next";
import { COUNTRY_DOCUMENT_SEO_RECORDS, getCountryDocumentPath } from "../country-document/registry";
const BASE_URL = "https://www.themilanoseal.com";
export function buildCountryDocumentSitemap(): MetadataRoute.Sitemap { const lastModified = new Date(); return COUNTRY_DOCUMENT_SEO_RECORDS.filter((record) => record.indexStatus === "INDEXABLE").map((record) => ({ url: `${BASE_URL}${getCountryDocumentPath(record)}`, lastModified, changeFrequency: "monthly" as const, priority: 0.9 })); }
