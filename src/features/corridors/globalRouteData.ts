import { DESTINATIONS } from "@/data/destinations";
import type { MatterVector } from "@/data/corridor-intel";
import { getCountryBySlug } from "@/lib/compliance/countries";
import { getPublicCountryExecutionIntelligence } from "@/data/public-country-intelligence";

export type { MatterVector };

export interface GlobalRouteRecord {
  slug: string;
  name: string;
  flag: string;
  lat: number;
  lng: number;
  hague: boolean;
  hagueStatus: string;
  verificationRequired: boolean;
  demand: number;
  timeline: string;
  translationRequired: boolean;
  routeType: string;
  executionPath: string[];
  commonDocuments: string[];
  note: string;
  matterVectors: MatterVector[];
}

const ROUTE_COORDINATE_FALLBACKS: Record<string, { lat: number; lng: number }> = {
  "united-kingdom": { lat: 51.5074, lng: -0.1278 },
  netherlands: { lat: 52.3676, lng: 4.9041 },
  switzerland: { lat: 46.948, lng: 7.4474 },
  canada: { lat: 45.4215, lng: -75.6972 },
  "south-korea": { lat: 37.5665, lng: 126.978 },
  ireland: { lat: 53.3498, lng: -6.2603 },
  india: { lat: 28.6139, lng: 77.209 },
  austria: { lat: 48.2082, lng: 16.3738 },
  chile: { lat: -33.4489, lng: -70.6693 },
  peru: { lat: -12.0464, lng: -77.0428 },
  israel: { lat: 31.7683, lng: 35.2137 },
  belgium: { lat: 50.8503, lng: 4.3517 },
  turkey: { lat: 39.9334, lng: 32.8597 },
  "south-africa": { lat: -33.9249, lng: 18.4241 },
  "new-zealand": { lat: -41.2866, lng: 174.7756 },
  singapore: { lat: 1.3521, lng: 103.8198 },
  china: { lat: 39.9042, lng: 116.4074 },
  "saudi-arabia": { lat: 24.7136, lng: 46.6753 },
};

export const GLOBAL_ROUTE_DATA: GlobalRouteRecord[] = DESTINATIONS.flatMap((destination) => {
  const compliance = getCountryBySlug(destination.slug);
  const publicIntel = getPublicCountryExecutionIntelligence(
    destination.slug,
    destination.name,
  );

  const coordinates =
    typeof compliance?.lat === "number" && typeof compliance?.lng === "number"
      ? { lat: compliance.lat, lng: compliance.lng }
      : typeof destination.lat === "number" && typeof destination.lng === "number"
        ? { lat: destination.lat, lng: destination.lng }
        : ROUTE_COORDINATE_FALLBACKS[destination.slug];

  if (!coordinates) return [];

  const hague = publicIntel.routeType === "hague_apostille";

  return [
    {
      slug: destination.slug,
      name: compliance?.name ?? destination.name,
      flag: destination.flag,
      lat: coordinates.lat,
      lng: coordinates.lng,
      hague,
      hagueStatus: publicIntel.statusPill,
      verificationRequired: publicIntel.verificationRequired,
      demand: destination.demand,
      timeline: "Estimate — not guaranteed",
      translationRequired: false,
      routeType: publicIntel.routeLabel,
      executionPath: publicIntel.publicExecutionPath,
      commonDocuments: destination.commonDocuments,
      note: destination.note,
      matterVectors: [],
    },
  ];
});

export function getGlobalRoute(slug: string): GlobalRouteRecord | undefined {
  return GLOBAL_ROUTE_DATA.find((route) => route.slug === slug);
}

export const HAGUE_ROUTES: GlobalRouteRecord[] = GLOBAL_ROUTE_DATA.filter(
  (route) => route.hague && !route.verificationRequired,
).sort((a, b) => b.demand - a.demand);

export const ALL_ROUTES_SORTED: GlobalRouteRecord[] = [...GLOBAL_ROUTE_DATA].sort(
  (a, b) => b.demand - a.demand,
);
