import type { CountryComplianceProfile } from "./countries";
import type { DocumentTaxonomyItem } from "./documents";

export type RoutePath =
  | "notarize-only"
  | "notarize-apostille"
  | "notarize-apostille-translate"
  | "certified-copy-apostille"
  | "certified-copy-apostille-translate"
  | "consular-legalization"
  | "federal-apostille";

export interface CountryDocumentRoute {
  countrySlug: string;
  documentSlug: string;
  routePath: RoutePath;
  estimatedDays: { min: number; max: number };
  notes?: string;
}

export function buildCountryDocumentRoute(
  country: CountryComplianceProfile,
  document: DocumentTaxonomyItem
): CountryDocumentRoute {
  let routePath: RoutePath;

  if (country.hagueMember === "non-member") {
    if (document.slug === "background-check") {
      routePath = "federal-apostille";
    } else {
      routePath = "consular-legalization";
    }
  } else if (!document.commonlyApostilled) {
    routePath = "notarize-only";
  } else if (document.requiresCertifiedCopy && !document.requiresNotarizationFirst) {
    routePath = document.translationOftenRequired
      ? "certified-copy-apostille-translate"
      : "certified-copy-apostille";
  } else {
    routePath = document.translationOftenRequired
      ? "notarize-apostille-translate"
      : "notarize-apostille";
  }

  const estimatedDays = getEstimatedDays(routePath, country.corridorActive);

  return {
    countrySlug: country.slug,
    documentSlug: document.slug,
    routePath,
    estimatedDays,
  };
}

function getEstimatedDays(
  path: RoutePath,
  corridorActive: boolean
): { min: number; max: number } {
  const base: Record<RoutePath, { min: number; max: number }> = {
    "notarize-only": { min: 1, max: 3 },
    "notarize-apostille": { min: 5, max: 10 },
    "notarize-apostille-translate": { min: 7, max: 14 },
    "certified-copy-apostille": { min: 5, max: 12 },
    "certified-copy-apostille-translate": { min: 8, max: 16 },
    "consular-legalization": { min: 14, max: 30 },
    "federal-apostille": { min: 10, max: 20 },
  };
  const days = base[path];
  if (corridorActive) return days;
  return { min: days.min + 2, max: days.max + 5 };
}
