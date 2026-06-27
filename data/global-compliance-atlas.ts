import { DESTINATIONS } from "@/data/destinations";
import { getCountryExecutionIntelligence } from "@/data/country-execution-intelligence";

export type CountryRouteType =
  | "hague_apostille"
  | "authentication"
  | "consular_legalization"
  | "receiving_authority_review"
  | "hybrid_review";

export type ComplianceSourceNote = {
  label: string;
  url?: string;
  sourceType:
    | "official"
    | "receiving_authority"
    | "operator_note"
    | "attorney_instruction"
    | "client_instruction";
  lastCheckedAt: string;
  confidence: "verified" | "needs_review" | "operator_only";
};

export type CountryComplianceAtlasEntry = {
  slug: string;
  displayName: string;
  iso2?: string;
  iso3?: string;
  routeType: CountryRouteType;
  publicRouteLabel: string;
  publicSummary: string;
  receivingAuthorityBoundary: string;
  hagueStatusLabel: string;
  ronSuitability:
    | "generally_possible"
    | "case_by_case"
    | "receiving_authority_risk"
    | "not_recommended_without_review";
  wetInkPreferenceRisk: "low" | "medium" | "high" | "unknown";
  translationRisk: "none" | "possible" | "likely" | "authority_specific";
  consularRisk: "none" | "possible" | "likely" | "required_review";
  courierRisk: "standard" | "elevated" | "customs_watch" | "custody_required";
  publicFlags: string[];
  documentWarnings: string[];
  industryWarnings: string[];
  requiredClientInputs: string[];
  requiredOperatorChecks: string[];
  requiredAllianceChecks: string[];
  requiredVaChecks: string[];
  sourceNotes: ComplianceSourceNote[];
  lastReviewedAt: string;
  reviewCadenceDays: number;
};

export type PublicCountryCompliance = Pick<
  CountryComplianceAtlasEntry,
  | "slug"
  | "displayName"
  | "routeType"
  | "publicRouteLabel"
  | "publicSummary"
  | "receivingAuthorityBoundary"
  | "hagueStatusLabel"
  | "ronSuitability"
  | "wetInkPreferenceRisk"
  | "translationRisk"
  | "consularRisk"
  | "courierRisk"
  | "publicFlags"
  | "documentWarnings"
  | "industryWarnings"
>;

export type PrivateComplianceRole = "operator" | "va" | "alliance" | "lawyer" | "founder";

const LAST_REVIEWED_AT = "2026-06-27";
const REVIEW_CADENCE_DAYS = 90;

function toAtlasRouteType(routeType: string, hague: boolean): CountryRouteType {
  if (routeType === "consular_legalization") return "consular_legalization";
  if (routeType === "authority_review") return "receiving_authority_review";
  if (routeType === "hybrid_review") return "hybrid_review";
  return hague ? "hague_apostille" : "authentication";
}

function publicRouteLabel(routeType: CountryRouteType) {
  if (routeType === "hague_apostille") return "Hague Apostille Execution Route";
  if (routeType === "authentication") return "Authentication Review Route";
  if (routeType === "consular_legalization") return "Consular Legalization Review Route";
  if (routeType === "receiving_authority_review") return "Receiving-Authority Review Route";
  return "Authentication / Consular Review Route";
}

function sourceNote(country: string): ComplianceSourceNote {
  return {
    label: `${country} receiving-authority requirements require operator review against document type and use case.`,
    sourceType: "operator_note",
    lastCheckedAt: LAST_REVIEWED_AT,
    confidence: "needs_review",
  };
}

function buildEntry(destination: (typeof DESTINATIONS)[number]): CountryComplianceAtlasEntry {
  const intelligence = getCountryExecutionIntelligence(destination.slug, destination.name);
  const routeType = toAtlasRouteType(intelligence.routeType, destination.hague);
  const consular = routeType === "authentication" || routeType === "consular_legalization" || routeType === "hybrid_review";
  const authorityReview = routeType === "receiving_authority_review" || routeType === "hybrid_review";

  return {
    slug: destination.slug,
    displayName: intelligence.displayName,
    routeType,
    publicRouteLabel: publicRouteLabel(routeType),
    publicSummary: `${intelligence.displayName} matters are screened for notarial readiness, document-use requirements, RON suitability, apostille/authentication routing, receiving-authority risk, and controlled release requirements before the packet is released.`,
    receivingAuthorityBoundary: "Routing snapshot only — final acceptance remains subject to the receiving authority.",
    hagueStatusLabel: destination.hague ? "Hague member route review" : "Authentication or consular review route",
    ronSuitability: consular ? "receiving_authority_risk" : "case_by_case",
    wetInkPreferenceRisk: consular ? "high" : authorityReview ? "medium" : "low",
    translationRisk: intelligence.executionFlags.some((flag) => /translation/i.test(flag)) ? "likely" : "possible",
    consularRisk: consular ? "required_review" : authorityReview ? "possible" : "none",
    courierRisk: intelligence.executionFlags.some((flag) => /courier|release/i.test(flag)) ? "custody_required" : "standard",
    publicFlags: intelligence.executionFlags.slice(0, 5),
    documentWarnings: [
      "Confirm document type and receiving authority before execution.",
      "Confirm signer names, capacity, and document-use context before release.",
    ],
    industryWarnings: [
      "Private-client, legal, corporate, maritime, equine, and gemstone matters can require receiving-authority review.",
    ],
    requiredClientInputs: [
      "Destination country and receiving authority",
      "Document type and intended use",
      "Signer location and execution preference",
      "Deadline and delivery address",
    ],
    requiredOperatorChecks: [
      "Verify notarial readiness and signer capacity.",
      "Review apostille/authentication route against receiving authority.",
      "Confirm release status before courier handoff.",
    ],
    requiredAllianceChecks: [
      "Confirm referral context and document category.",
      "Escalate unusual receiving-authority instructions to Milano operators.",
    ],
    requiredVaChecks: [
      "Confirm client inputs are complete.",
      "Monitor follow-up queue for missing documents or delivery data.",
    ],
    sourceNotes: [sourceNote(intelligence.displayName)],
    lastReviewedAt: LAST_REVIEWED_AT,
    reviewCadenceDays: REVIEW_CADENCE_DAYS,
  };
}

export const GLOBAL_COMPLIANCE_ATLAS: Record<string, CountryComplianceAtlasEntry> = Object.fromEntries(
  DESTINATIONS.map((destination) => [destination.slug, buildEntry(destination)]),
);

export function getCountryComplianceAtlasEntry(slug: string): CountryComplianceAtlasEntry {
  const entry = GLOBAL_COMPLIANCE_ATLAS[slug];
  if (!entry) {
    throw new Error(`Missing Global Compliance Atlas entry for ${slug}`);
  }
  return entry;
}

export function getPublicCountryCompliance(slug: string): PublicCountryCompliance {
  const entry = getCountryComplianceAtlasEntry(slug);
  return {
    slug: entry.slug,
    displayName: entry.displayName,
    routeType: entry.routeType,
    publicRouteLabel: entry.publicRouteLabel,
    publicSummary: entry.publicSummary,
    receivingAuthorityBoundary: entry.receivingAuthorityBoundary,
    hagueStatusLabel: entry.hagueStatusLabel,
    ronSuitability: entry.ronSuitability,
    wetInkPreferenceRisk: entry.wetInkPreferenceRisk,
    translationRisk: entry.translationRisk,
    consularRisk: entry.consularRisk,
    courierRisk: entry.courierRisk,
    publicFlags: entry.publicFlags,
    documentWarnings: entry.documentWarnings,
    industryWarnings: entry.industryWarnings,
  };
}

export function getPrivateCountryCompliance(slug: string, role: PrivateComplianceRole) {
  const entry = getCountryComplianceAtlasEntry(slug);
  if (role === "va") {
    return { ...entry, requiredOperatorChecks: [] };
  }
  if (role === "alliance" || role === "lawyer") {
    return { ...entry, requiredVaChecks: [], sourceNotes: entry.sourceNotes.filter((note) => note.confidence !== "operator_only") };
  }
  return entry;
}
