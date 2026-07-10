// Coverage-area model + helpers.
// Coverage describes where an independent partner is WILLING to receive
// offers. It never obligates the network to send work or the partner to accept.

import type { CoverageArea, PartnerCapability } from "./types";

// Partners covering a given region.
export function partnersInRegion(
  areas: CoverageArea[],
  region: string,
): CoverageArea[] {
  return areas.filter((a) => a.region.toLowerCase() === region.toLowerCase());
}

// Areas that both cover the region and offer the requested capability.
export function coverageForJob(
  areas: CoverageArea[],
  region: string,
  capability: PartnerCapability,
): CoverageArea[] {
  return partnersInRegion(areas, region).filter((a) =>
    a.capabilities.includes(capability),
  );
}

// Distinct regions with at least one covering partner.
export function coveredRegions(areas: CoverageArea[]): string[] {
  return Array.from(new Set(areas.map((a) => a.region))).sort();
}

export function matchesPostal(area: CoverageArea, postal: string): boolean {
  return area.postalPrefixes.some((p) => postal.startsWith(p));
}
