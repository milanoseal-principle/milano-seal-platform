import { DESTINATIONS } from "@/data/destinations";
import { getCountryBySlug } from "@/lib/compliance/countries";
import { getPublicCountryExecutionIntelligence } from "@/data/public-country-intelligence";

export type RouteType =
  | "hague_apostille"
  | "authentication"
  | "consular_legalization"
  | "receiving_authority_review"
  | "hybrid_review";

export type SourceNote = {
  sourceType: "operator_note" | "official_source";
  confidence: "needs_review" | "reviewed";
  note: string;
};

export type GlobalComplianceAtlasEntry = {
  slug: string;
  displayName: string;
  iso2: string;
  iso3: string;
  routeType: RouteType;
  publicRouteLabel: string;
  publicSummary: string;
  receivingAuthorityBoundary: string;
  hagueStatusLabel: string;
  ronSuitability: string;
  wetInkPreferenceRisk: string;
  translationRisk: string;
  consularRisk: string;
  courierRisk: string;
  publicFlags: string[];
  documentWarnings: string[];
  industryWarnings: string[];
  requiredClientInputs: string[];
  requiredOperatorChecks: string[];
  requiredAllianceChecks: string[];
  requiredVaChecks: string[];
  sourceNotes: SourceNote[];
  lastReviewedAt: string | null;
  reviewCadenceDays: number;
};

function atlasRouteType(
  routeType: ReturnType<typeof getPublicCountryExecutionIntelligence>["routeType"],
): RouteType {
  if (routeType === "hague_apostille") return "hague_apostille";
  if (routeType === "consular_legalization") return "consular_legalization";
  if (routeType === "hybrid_review") return "hybrid_review";
  return "receiving_authority_review";
}

export const GLOBAL_COMPLIANCE_ATLAS: GlobalComplianceAtlasEntry[] =
  DESTINATIONS.map((destination) => {
    const compliance = getCountryBySlug(destination.slug);
    const publicIntel = getPublicCountryExecutionIntelligence(
      destination.slug,
      destination.name,
    );
    const routeType = atlasRouteType(publicIntel.routeType);

    return {
      slug: destination.slug,
      displayName: compliance?.name ?? destination.name,
      iso2: compliance?.iso2 ?? "XX",
      iso3: compliance?.iso3 ?? "XXX",
      routeType,
      publicRouteLabel: publicIntel.routeLabel,
      publicSummary: publicIntel.authoritySummary,
      receivingAuthorityBoundary: publicIntel.complianceBoundary,
      hagueStatusLabel: publicIntel.statusPill,
      ronSuitability:
        "RON suitability is reviewed against signer location, document type, provider capability, and receiving-authority expectations before execution.",
      wetInkPreferenceRisk: "receiving_authority_review",
      translationRisk: "receiving_authority_review",
      consularRisk:
        routeType === "consular_legalization" || routeType === "hybrid_review"
          ? "operator_review_required"
          : "receiving_authority_review",
      courierRisk: "international_courier_review",
      publicFlags: publicIntel.publicFlags,
      documentWarnings: [
        "Document type and origin authority must be reviewed before routing.",
      ],
      industryWarnings: [
        "High-value asset, private-client, lawyer-led, and registry matters require Matter-specific review.",
      ],
      requiredClientInputs: [
        "document type",
        "destination country",
        "origin state or issuing authority",
        "signer location",
        "receiving authority if known",
      ],
      requiredOperatorChecks: [
        "route type",
        "RON suitability",
        "authority source status",
        "payment gate",
        "release gate",
      ],
      requiredAllianceChecks: [
        "signer location",
        "certificate readiness",
        "witness posture",
      ],
      requiredVaChecks: [
        "missing country",
        "missing document type",
        "missing signer count",
        "missing deadline",
        "missing upload",
      ],
      sourceNotes: [
        {
          sourceType: "operator_note",
          confidence:
            publicIntel.sourceStatus === "CANONICAL" ? "reviewed" : "needs_review",
          note:
            publicIntel.sourceStatus === "CANONICAL"
              ? "Public routing posture is projected from the canonical country compliance registry; Matter-specific receiving-authority review still controls execution."
              : "Current public routing posture requires operator review before specific authority claims are made.",
        },
      ],
      lastReviewedAt: null,
      reviewCadenceDays: 90,
    };
  });

export function getGlobalComplianceAtlasEntry(slug: string) {
  return GLOBAL_COMPLIANCE_ATLAS.find((entry) => entry.slug === slug);
}
