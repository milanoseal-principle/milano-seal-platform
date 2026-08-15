import { DESTINATIONS } from "@/data/destinations";
import {
  CORRIDOR_INTEL,
  getCorridorIntel,
  type MatterVector,
} from "@/data/corridor-intel";
import { getCountryBySlug } from "@/lib/compliance/countries";

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

// Visual-routing fallbacks for destination rows that predate coordinate enrichment.
// These are display coordinates only and do not alter compliance or execution logic.
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

function safeExecutionPath({
  hague,
  verificationRequired,
}: {
  hague: boolean;
  verificationRequired: boolean;
}) {
  if (verificationRequired) {
    return [
      "Document-origin and receiving-authority review",
      "Execution requirements confirmed before notarization",
      "Apostille / authentication pathway verified",
      "Destination release / courier coordination",
    ];
  }

  if (hague) {
    return [
      "Document-origin and receiving-authority review",
      "Notarization or certified-copy review, if required",
      "Competent-authority apostille routing",
      "Destination release / courier coordination",
    ];
  }

  return [
    "Document-origin and receiving-authority review",
    "Execution / notarization review, if required",
    "Authentication / consular pathway confirmation",
    "Destination release / courier coordination",
  ];
}

export const GLOBAL_ROUTE_DATA: GlobalRouteRecord[] = DESTINATIONS.flatMap((destination) => {
  // Public corridor visuals defer to the canonical compliance registry whenever
  // that registry has a profile. Legacy DESTINATIONS data remains a fallback only.
  const compliance = getCountryBySlug(destination.slug);
  const hague = compliance
    ? compliance.hagueMember === "member"
    : destination.hague;
  const verificationRequired =
    compliance?.verificationStatus === "VERIFICATION_REQUIRED";

  const coordinates =
    typeof compliance?.lat === "number" && typeof compliance?.lng === "number"
      ? { lat: compliance.lat, lng: compliance.lng }
      : typeof destination.lat === "number" && typeof destination.lng === "number"
        ? { lat: destination.lat, lng: destination.lng }
        : ROUTE_COORDINATE_FALLBACKS[destination.slug];

  if (!coordinates) return [];

  const intel = getCorridorIntel(destination.slug, hague);
  const legacyRouteMatchesCanonical = destination.hague === hague;
  const shouldUseLegacyPath =
    legacyRouteMatchesCanonical && !verificationRequired;

  const routeType = verificationRequired
    ? "Route Verification Required"
    : hague
      ? "Hague Convention"
      : "Consular Authentication";

  return [
    {
      slug: destination.slug,
      name: compliance?.name ?? destination.name,
      flag: destination.flag,
      lat: coordinates.lat,
      lng: coordinates.lng,
      hague,
      hagueStatus: compliance
        ? compliance.hagueMember === "member"
          ? "Hague Convention Member"
          : compliance.hagueMember === "bilateral"
            ? "Bilateral / authority review"
            : "Non-Hague"
        : destination.hagueStatus,
      verificationRequired,
      demand: destination.demand,
      timeline: intel.timeline,
      translationRequired: intel.translationRequired,
      routeType,
      executionPath: shouldUseLegacyPath
        ? destination.executionPath
        : safeExecutionPath({ hague, verificationRequired }),
      commonDocuments: destination.commonDocuments,
      note: destination.note,
      matterVectors:
        shouldUseLegacyPath && intel.routeType === routeType
          ? intel.matterVectors
          : [],
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
