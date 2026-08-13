import { getCountryExecutionIntelligence } from "@/data/country-execution-intelligence";
import { routeApostille } from "@/lib/apostille-rules/apostilleRoutingEngine";

export interface RouteArchitectInput {
  originatingState: string;
  destinationCountry: string;
  destinationSlug: string;
  documentType: string;
  signingRequirement: "notarized" | "already_issued" | "unknown";
  notarizationState?: string;
  issuance: "state" | "federal" | "unknown";
  certifiedCopyState?: string;
  urgency: "standard" | "expedited" | "rush";
}

export interface RouteArchitectResult {
  authorityPath: string[];
  hagueStatus: string;
  routeIndicated: string;
  translationConsideration: string;
  embassyConsideration: string;
  executionRestrictions: string[];
  reviewRequired: boolean;
  disclaimer: string;
}

export function buildApostilleRoute(input: RouteArchitectInput): RouteArchitectResult {
  const country = getCountryExecutionIntelligence(input.destinationSlug, input.destinationCountry);
  const canonical = routeApostille({
    documentType: input.issuance === "federal" ? `federal ${input.documentType}` : input.documentType,
    destinationCountry: input.destinationCountry,
  });
  const reviewRequired =
    canonical.requiresManualReview ||
    input.issuance === "unknown" ||
    input.signingRequirement === "unknown" ||
    country.routeType === "authority_review" ||
    country.routeType === "hybrid_review";

  const authorityPath = [
    `${input.originatingState || "Originating jurisdiction"} document authority review`,
    ...(input.signingRequirement === "notarized"
      ? [`Notarization in ${input.notarizationState || input.originatingState || "the commissioning state"} typically required`]
      : []),
    ...canonical.operatorChecklist,
  ];

  return {
    authorityPath,
    hagueStatus: country.statusPill,
    routeIndicated: country.routeLabel,
    translationConsideration:
      country.translationRisk === "likely"
        ? "Translation review is typically required; confirm language and certification with the receiving authority."
        : "Translation requirements are receiving-authority specific and require review.",
    embassyConsideration:
      country.routeType === "consular_legalization" || country.routeType === "hybrid_review"
        ? "Embassy or consular handling may be indicated after authentication; operator review required."
        : "Embassy or consular handling is not indicated by the current route, but the receiving authority may impose additional requirements.",
    executionRestrictions: [
      ...canonical.warnings,
      ...(input.urgency === "rush" ? ["Rush timing requires operator feasibility review before commitment."] : []),
      ...(input.certifiedCopyState && input.certifiedCopyState !== input.originatingState
        ? ["Certified-copy jurisdiction differs from document origin; authority review required."]
        : []),
    ],
    reviewRequired,
    disclaimer:
      "Route intelligence supports professional review only. It does not guarantee foreign acceptance; the receiving authority may impose additional requirements.",
  };
}

export interface ReadinessScanInput {
  documentPresent: boolean;
  signatureBlocks: boolean;
  signerCountConfirmed: boolean;
  dateFieldsComplete: boolean;
  venuePresent: boolean;
  notarialWordingReviewed: boolean;
  missingPages: boolean;
  duplicatePages: boolean;
  lowResolutionOrCutOff: boolean;
  foreignLanguage: boolean;
  receivingCountryConfirmed: boolean;
  authenticationPathConfirmed: boolean;
}

export type ReadinessStatus = "READY" | "REVIEW REQUIRED" | "BLOCKED";

export function scanDocumentReadiness(input: ReadinessScanInput) {
  const blockers = [
    !input.documentPresent && "Document is not present.",
    input.missingPages && "One or more pages are missing.",
    input.lowResolutionOrCutOff && "The scan is low-resolution or cut off.",
  ].filter((item): item is string => Boolean(item));
  const reviewFlags = [
    !input.signatureBlocks && "Signature blocks require review.",
    !input.signerCountConfirmed && "Signer count is not confirmed.",
    !input.dateFieldsComplete && "Date fields require review.",
    !input.venuePresent && "Venue is missing or unresolved.",
    !input.notarialWordingReviewed && "Acknowledgment or jurat wording requires review.",
    input.duplicatePages && "Possible duplicate pages detected.",
    input.foreignLanguage && "Foreign-language content requires professional review.",
    !input.receivingCountryConfirmed && "Receiving country is not confirmed.",
    !input.authenticationPathConfirmed && "Authentication pathway requires review.",
  ].filter((item): item is string => Boolean(item));

  const status: ReadinessStatus = blockers.length
    ? "BLOCKED"
    : reviewFlags.length
      ? "REVIEW REQUIRED"
      : "READY";
  return {
    status,
    findings: [...blockers, ...reviewFlags],
    disclaimer: "This readiness scan supports document operations and does not replace legal or receiving-authority review.",
  };
}
