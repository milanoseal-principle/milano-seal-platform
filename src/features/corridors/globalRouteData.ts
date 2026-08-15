import { DESTINATIONS } from "@/data/destinations";
import {
  CORRIDOR_INTEL,
  getCorridorIntel,
  type MatterVector,
} from "@/data/corridor-intel";

export type { MatterVector };

export interface GlobalRouteRecord {
  slug: string;
  name: string;
  flag: string;
  lat: number;
  lng: number;
  hague: boolean;
  hagueStatus: string;
  demand: number;
  timeline: string;
  translationRequired: boolean;
  routeType: string;
  executionPath: string[];
  commonDocuments: string[];
  note: string;
  matterVectors: MatterVector[];
}

// Visual-routing fallbacks for canonical destinations whose legacy source rows
// predate coordinate enrichment. These are public capital/city coordinates used
// only to place the destination in Milano Seal route visualizations; they do not
// alter compliance, apostille, pricing, Matter, or execution logic.
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
  const coordinates =
    typeof destination.lat === "number" && typeof destination.lng === "number"
      ? { lat: destination.lat, lng: destination.lng }
      : ROUTE_COORDINATE_FALLBACKS[destination.slug];

  if (!coordinates) return [];

  const intel = getCorridorIntel(destination.slug, destination.hague);
  return [
    {
      slug: destination.slug,
      name: destination.name,
      flag: destination.flag,
      lat: coordinates.lat,
      lng: coordinates.lng,
      hague: destination.hague,
      hagueStatus: destination.hagueStatus,
      demand: destination.demand,
      timeline: intel.timeline,
      translationRequired: intel.translationRequired,
      routeType: intel.routeType,
      executionPath: destination.executionPath,
      commonDocuments: destination.commonDocuments,
      note: destination.note,
      matterVectors: intel.matterVectors,
    },
  ];
});

export function getGlobalRoute(slug: string): GlobalRouteRecord | undefined {
  return GLOBAL_ROUTE_DATA.find((route) => route.slug === slug);
}

export const HAGUE_ROUTES: GlobalRouteRecord[] = GLOBAL_ROUTE_DATA.filter(
  (route) => route.hague,
).sort((a, b) => b.demand - a.demand);

export const ALL_ROUTES_SORTED: GlobalRouteRecord[] = [...GLOBAL_ROUTE_DATA].sort(
  (a, b) => b.demand - a.demand,
);

// Kept exported for existing consumers that import corridor intelligence from
// this module's dependency graph during static analysis.
void CORRIDOR_INTEL;
