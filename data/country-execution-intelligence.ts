// Milano Seal — Country Execution Intelligence Registry
// Single source of truth for the public Execution Intelligence Tool surfaced on
// the globe, country directory, apostille pages, and corridor map previews.
//
// Every slug in data/destinations.ts resolves to a CountryExecutionIntelligence
// object via getCountryExecutionIntelligence(). Priority countries carry hand
// written copy; all others are derived from the destination registry so no
// country ever falls back to weak generic labels.

import { DESTINATIONS, type Destination } from "@/data/destinations";

export type ExecutionRouteType =
  | "hague_apostille"
  | "consular_legalization"
  | "authority_review"
  | "hybrid_review";

export interface CountryExecutionIntelligence {
  slug: string;
  displayName: string;
  shortName?: string;
  flag?: string;
  routeType: ExecutionRouteType;
  statusPill: string;
  eyebrow: string;
  routeLabel: string;
  authoritySummary: string;
  executionFlags: string[];
  executionPath: string[];
  trustLine: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;

  matterUseCases: string[];
  notarialReadinessChecks: string[];
  apostilleRouteChecks: string[];
  authenticationRouteChecks: string[];
  translationRisk: "none" | "possible" | "likely" | "authority_specific";
  courierRisk: "standard" | "elevated" | "custody_required";
  lawyerClientUse: string;
  allianceNotaryUse: string;
  virtualAssistantUse: string;
  operatorUse: string;
  founderUse: string;
  revenueUse: string;
  escalationTriggers: string[];
  complianceBoundary: string;
}

const EYEBROW = "EXECUTION INTELLIGENCE";
const PRIMARY_CTA = "Begin Secure Intake";
const SECONDARY_CTA = "Open Global Atlas";

const ROUTE_LABELS: Record<ExecutionRouteType, string> = {
  hague_apostille: "HAGUE APOSTILLE EXECUTION ROUTE",
  consular_legalization: "CONSULAR LEGALIZATION REVIEW ROUTE",
  authority_review: "RECEIVING-AUTHORITY REVIEW ROUTE",
  hybrid_review: "AUTHENTICATION / CONSULAR REVIEW ROUTE",
};

const STATUS_PILLS: Record<ExecutionRouteType, string> = {
  hague_apostille: "HAGUE MEMBER",
  consular_legalization: "CONSULAR REVIEW",
  authority_review: "AUTHORITY CHECK",
  hybrid_review: "HYBRID REVIEW",
};

const HAGUE_PATH = [
  "01 Pre-flight readiness",
  "02 Authority route check",
  "03 Custody-controlled release",
];

const CONSULAR_PATH = [
  "01 Authentication pathway review",
  "02 Consular handling check",
  "03 Release packet control",
];

const NOTARIAL_CHECKS = [
  "Signer identity confirmed",
  "Notarial certificate language ready",
  "Witness requirement reviewed",
  "RON / mobile / in-person format confirmed",
];

function deriveRouteType(dest: Destination): ExecutionRouteType {
  if (dest.slug === "uae" || dest.slug === "saudi-arabia" || dest.slug === "qatar") {
    return "consular_legalization";
  }
  if (dest.hague) return "hague_apostille";
  if (dest.slug === "mexico" || dest.slug === "canada") return "authority_review";
  return "consular_legalization";
}

function titleCaseDocs(dest: Destination): string[] {
  const fromDocs = dest.commonDocuments ?? [];
  return Array.from(new Set(fromDocs)).slice(0, 4);
}

function buildDerived(dest: Destination): CountryExecutionIntelligence {
  const routeType = deriveRouteType(dest);
  const isHague = routeType === "hague_apostille";
  const docs = titleCaseDocs(dest);
  const flags = Array.from(
    new Set([
      ...docs,
      isHague ? "Apostille" : "Authentication",
      "Custody Release",
    ]),
  ).slice(0, 5);

  const summary = isHague
    ? `Florida-origin documents for ${dest.name} are screened for notarial readiness, apostille routing, destination-use, translation risk, and receiving-authority presentation before custody-controlled release.`
    : `${dest.name}-bound documents are screened for notarial readiness, authentication route assessment, consular handling risk, and receiving-party presentation before custody-controlled release.`;

  const boundary = `Routing snapshot only — final acceptance remains subject to ${dest.name} receiving-authority review.`;

  return {
    slug: dest.slug,
    displayName: dest.name,
    flag: dest.flag,
    routeType,
    statusPill: STATUS_PILLS[routeType],
    eyebrow: EYEBROW,
    routeLabel: ROUTE_LABELS[routeType],
    authoritySummary: summary,
    executionFlags: flags,
    executionPath: isHague ? HAGUE_PATH : CONSULAR_PATH,
    trustLine: boundary,
    primaryCtaLabel: PRIMARY_CTA,
    secondaryCtaLabel: SECONDARY_CTA,
    matterUseCases: docs.length ? docs : ["Legal", "Corporate", "Civil Record"],
    notarialReadinessChecks: NOTARIAL_CHECKS,
    apostilleRouteChecks: isHague
      ? [
          "State of origin confirmed",
          "Notarization readiness verified",
          "Receiving-authority use confirmed",
          "Release packet reviewed",
        ]
      : [],
    authenticationRouteChecks: isHague
      ? []
      : [
          "State authentication route",
          "Federal authentication route",
          "Embassy / consular review",
          "Courier / custody risk",
        ],
    translationRisk: isHague ? "possible" : "authority_specific",
    courierRisk: isHague ? "standard" : "elevated",
    lawyerClientUse: `Use this route snapshot to prepare client expectations for ${dest.name} document execution without implying any acceptance guarantee.`,
    allianceNotaryUse:
      "Confirm signer identity, certificate readiness, witness needs, and whether execution is RON, mobile, or in-person before assignment.",
    virtualAssistantUse:
      "Check document type, signer count, destination use, authentication/apostille need, translation risk, uploaded files, and urgency before quote.",
    operatorUse: isHague
      ? "Route through intake, compliance review, quote, payment gate, execution, apostille, release packet, and custody event logging."
      : "Route through authority review, quote, payment gate, execution, authentication pathway, consular coordination, and release logging.",
    founderUse:
      "Track demand, lawyer referral source, alliance assignment readiness, add-on opportunity, rush risk, and completion blocker.",
    revenueUse: isHague
      ? "Potential add-ons include apostille coordination, translation review, rush handling, courier release, and additional signer support."
      : "Potential add-ons include authentication coordination, rush handling, courier release, additional signer, and high-control private-client support.",
    escalationTriggers: isHague
      ? ["Tight deadline", "Translation required by authority", "Multi-document custody"]
      : ["Consular handling required", "Federal authentication required", "Courier-controlled release"],
    complianceBoundary: boundary,
  };
}

// ── Priority overrides (exact copy) ──────────────────────────────────────────
const PRIORITY: Record<string, CountryExecutionIntelligence> = {
  italy: {
    slug: "italy",
    displayName: "Italy",
    flag: "🇮🇹",
    routeType: "hague_apostille",
    statusPill: "HAGUE MEMBER",
    eyebrow: EYEBROW,
    routeLabel: "HAGUE APOSTILLE EXECUTION ROUTE",
    authoritySummary:
      "Italy-bound documents are screened for notarial readiness, apostille routing, citizenship/private-client use, translation risk, and receiving-authority presentation before release.",
    executionFlags: ["Citizenship", "POA", "Civil Record", "Apostille", "Translation Review"],
    executionPath: HAGUE_PATH,
    trustLine: "Milano Seal routing snapshot — subject to Italian receiving-authority review.",
    primaryCtaLabel: PRIMARY_CTA,
    secondaryCtaLabel: SECONDARY_CTA,
    matterUseCases: ["Citizenship", "Power of Attorney", "Civil Record", "Private Client"],
    notarialReadinessChecks: NOTARIAL_CHECKS,
    apostilleRouteChecks: [
      "State of origin confirmed",
      "Notarization readiness verified",
      "Italian receiving-authority use confirmed",
      "Release packet reviewed",
    ],
    authenticationRouteChecks: [],
    translationRisk: "likely",
    courierRisk: "standard",
    lawyerClientUse:
      "Use this route snapshot to prepare client expectations for Italian citizenship, civil-record, POA, and private-client document execution.",
    allianceNotaryUse:
      "Confirm signer identity, certificate readiness, witness needs, and whether execution is RON, mobile, or in-person before assignment.",
    virtualAssistantUse:
      "Check document type, signer count, destination use, apostille need, translation risk, uploaded files, and urgency before quote.",
    operatorUse:
      "Route through intake, compliance review, quote, payment gate, execution, apostille, release packet, and custody event logging.",
    founderUse:
      "Track citizenship/private-client demand, lawyer referral source, add-on opportunity, rush risk, and completion blocker.",
    revenueUse:
      "Potential add-ons include apostille coordination, rush handling, extra signer, translation review, courier release, and lawyer-client package support.",
    escalationTriggers: ["Tight citizenship deadline", "Certified translation required", "Multi-record custody"],
    complianceBoundary:
      "Routing snapshot only — final acceptance remains subject to Italian receiving-authority review.",
  },
  brazil: {
    slug: "brazil",
    displayName: "Brazil",
    flag: "🇧🇷",
    routeType: "hague_apostille",
    statusPill: "HAGUE MEMBER",
    eyebrow: EYEBROW,
    routeLabel: "HAGUE APOSTILLE EXECUTION ROUTE",
    authoritySummary:
      "Florida-origin documents for Brazil are routed through a controlled Hague apostille pathway with notarial readiness review, destination-use screening, translation/courier risk check, and release packet coordination.",
    executionFlags: ["Corporate", "POA", "Civil Record", "Translation Review", "Courier Release"],
    executionPath: HAGUE_PATH,
    trustLine: "Milano Seal routing snapshot — subject to Brazilian receiving-authority review.",
    primaryCtaLabel: PRIMARY_CTA,
    secondaryCtaLabel: SECONDARY_CTA,
    matterUseCases: ["Corporate", "Power of Attorney", "Civil Record", "Medical"],
    notarialReadinessChecks: NOTARIAL_CHECKS,
    apostilleRouteChecks: [
      "State of origin confirmed",
      "Notarization readiness verified",
      "Brazilian receiving-authority use confirmed",
      "Release packet reviewed",
    ],
    authenticationRouteChecks: [],
    translationRisk: "likely",
    courierRisk: "elevated",
    lawyerClientUse:
      "Use this route snapshot to prepare clients for apostille timing, translation risk, courier handling, and Brazilian receiving-authority review.",
    allianceNotaryUse:
      "Confirm signer identity, signer location, certificate readiness, witness needs, and whether execution is RON, mobile, or in-person.",
    virtualAssistantUse:
      "Confirm document type, signer count, notarization status, destination use, deadline, and whether translation/courier release is needed.",
    operatorUse:
      "Route matter through intake, compliance review, quote, Wise payment, execution, apostille, final release, and custody event logging.",
    founderUse:
      "Track corporate/POA demand, translation/courier add-ons, lawyer referral source, alliance assignment readiness, and completion risk.",
    revenueUse:
      "Potential add-ons include apostille coordination, translation review, rush handling, courier release, and additional signer support.",
    escalationTriggers: ["Portuguese translation required", "Courier-controlled release", "Tight corporate deadline"],
    complianceBoundary:
      "Routing snapshot only — final acceptance remains subject to Brazilian receiving-authority review.",
  },
  uae: {
    slug: "uae",
    displayName: "United Arab Emirates",
    shortName: "UAE",
    flag: "🇦🇪",
    routeType: "consular_legalization",
    statusPill: "CONSULAR REVIEW",
    eyebrow: EYEBROW,
    routeLabel: "CONSULAR LEGALIZATION REVIEW ROUTE",
    authoritySummary:
      "UAE-bound documents require higher-control authentication review, with notarial readiness, state/federal route assessment, consular handling risk, and receiving-party presentation checked before release.",
    executionFlags: ["Corporate", "Commercial", "Private Wealth", "Consular Review", "Courier Release"],
    executionPath: CONSULAR_PATH,
    trustLine: "Milano Seal routing snapshot — UAE matters may require authentication and consular review.",
    primaryCtaLabel: PRIMARY_CTA,
    secondaryCtaLabel: SECONDARY_CTA,
    matterUseCases: ["Corporate", "Commercial", "Private Wealth", "Authentication"],
    notarialReadinessChecks: NOTARIAL_CHECKS,
    apostilleRouteChecks: [],
    authenticationRouteChecks: [
      "State authentication route",
      "Federal authentication route",
      "Embassy / consular review",
      "Courier / custody risk",
    ],
    translationRisk: "authority_specific",
    courierRisk: "custody_required",
    lawyerClientUse:
      "Use this route snapshot to explain authentication complexity, consular handling risk, receiving-party review, and timing sensitivity.",
    allianceNotaryUse:
      "Confirm certificate language, signer authority, ID readiness, witness needs, and whether execution format is compatible with downstream authentication.",
    virtualAssistantUse:
      "Escalate early if the document needs consular handling, federal authentication, corporate authority review, or courier-controlled release.",
    operatorUse:
      "Route through authority review, quote, payment gate, execution, authentication pathway assessment, consular review coordination, and release logging.",
    founderUse:
      "Track high-control commercial/private-wealth demand, rush risk, courier release, lawyer referral source, and premium matter opportunity.",
    revenueUse:
      "Potential add-ons include rush handling, authentication coordination, courier release, additional signer, and high-control private-client support.",
    escalationTriggers: ["Consular handling required", "Federal authentication required", "Courier-controlled release"],
    complianceBoundary:
      "Routing snapshot only — UAE matters may require authentication and consular review before receiving-party acceptance.",
  },
};

export const COUNTRY_EXECUTION_INTELLIGENCE: Record<string, CountryExecutionIntelligence> =
  DESTINATIONS.reduce<Record<string, CountryExecutionIntelligence>>((acc, dest) => {
    acc[dest.slug] = PRIORITY[dest.slug] ?? buildDerived(dest);
    return acc;
  }, {});

// Make sure priority slugs that may not be in DESTINATIONS still resolve.
for (const slug of Object.keys(PRIORITY)) {
  if (!COUNTRY_EXECUTION_INTELLIGENCE[slug]) {
    COUNTRY_EXECUTION_INTELLIGENCE[slug] = PRIORITY[slug];
  }
}

export function getCountryExecutionIntelligence(
  slug: string,
  fallbackName?: string,
): CountryExecutionIntelligence {
  const found = COUNTRY_EXECUTION_INTELLIGENCE[slug];
  if (found) return found;

  const dest = DESTINATIONS.find((d) => d.slug === slug);
  if (dest) return buildDerived(dest);

  // Last-resort synthetic record so the UI never renders an empty card.
  const name = fallbackName ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return buildDerived({
    slug,
    name,
    flag: "🌐",
    hague: true,
    hagueStatus: "Hague Convention Member",
    apostilleRequired: true,
    demand: 0,
    note: "",
    executionPath: [],
    commonDocuments: ["Legal", "Corporate", "Civil Record"],
  } as Destination);
}
