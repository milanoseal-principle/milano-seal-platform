import { COUNTRY_REGISTRY } from "./countries";
import { DOCUMENT_TAXONOMY } from "./documents";

export function getApostilleCountryPath(countrySlug: string): string {
  return `/apostille/${countrySlug}`;
}

export function getApostilleCountryDocumentPath(countrySlug: string, documentSlug: string): string {
  return `/apostille/${countrySlug}/${documentSlug}`;
}

export function getDocumentAuthenticationPath(countrySlug: string): string {
  return `/document-authentication/${countrySlug}`;
}

export function getDocumentPath(documentSlug: string): string {
  return `/documents/${documentSlug}`;
}

export function getAllApostilleCountryPaths(): string[] {
  return COUNTRY_REGISTRY.map(c => getApostilleCountryPath(c.slug));
}

export function getAllDocumentPaths(): string[] {
  return DOCUMENT_TAXONOMY.map(d => getDocumentPath(d.slug));
}

export function getAllApostilleCountryDocumentPaths(): string[] {
  const paths: string[] = [];
  for (const country of COUNTRY_REGISTRY) {
    for (const doc of DOCUMENT_TAXONOMY) {
      if (doc.commonlyApostilled) {
        paths.push(getApostilleCountryDocumentPath(country.slug, doc.slug));
      }
    }
  }
  return paths;
}

// Legacy redirect map: old /countries/[slug] → /apostille/[slug]
export const LEGACY_COUNTRY_REDIRECTS: Record<string, string> = Object.fromEntries(
  COUNTRY_REGISTRY.map(c => [`/countries/${c.slug}`, `/apostille/${c.slug}`])
);
