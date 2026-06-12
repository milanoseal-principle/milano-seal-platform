import { getAtlasCountryByName, getAtlasCountry, countryNameToSlug } from "./atlas-pathway";
import type { AtlasCountry } from "./atlas-countries";

// Reads the destination from Next.js searchParams safely.
// Supports both ?country=Italy and ?destination=italy param keys.
// Returns the matched AtlasCountry or undefined — never throws.
export function getDestinationFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>
): AtlasCountry | undefined {
  const raw =
    (typeof searchParams.country === "string" ? searchParams.country : null) ??
    (typeof searchParams.destination === "string" ? searchParams.destination : null) ??
    "";

  if (!raw) return undefined;

  // Try by slug first (e.g. ?destination=united-kingdom)
  const bySlug = getAtlasCountry(raw);
  if (bySlug) return bySlug;

  // Try by display name (e.g. ?country=Italy)
  return getAtlasCountryByName(raw);
}

// Returns a validated destination slug from any raw string.
// Use this before setting intake form state — unknown inputs return undefined.
export function resolveDestinationSlug(raw: string | undefined | null): string | undefined {
  if (!raw) return undefined;
  const slug = countryNameToSlug(raw);
  if (slug) return slug;
  // Could already be a slug
  const c = getAtlasCountry(raw);
  return c?.slug;
}
