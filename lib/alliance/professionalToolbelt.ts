import {
  getCountryExecutionIntelligence,
  type CountryExecutionIntelligence,
} from "@/data/country-execution-intelligence";
import { routeApostille } from "@/lib/apostille-rules/apostilleRoutingEngine";

export type ReadinessStatus = "READY" | "REVIEW_REQUIRED" | "BLOCKED";
export type ScanReadinessStatus = "READY" | "REVIEW REQUIRED" | "BLOCKED";

export type IssuingAuthority =
  | "state"
  | "federal"
  | "county"
  | "court"
  | "private"
  | "unknown";

export interface ApostilleRouteInput {
  originState: string;
  destinationCountry: string;
  documentType: string;
  issuingAuthority: IssuingAuthority;
  urgency?: "standard" | "expedited" | "rush";
}

export interface ApostilleRouteProjection {
  destination: CountryExecutionIntelligence;
  routeStatus: ReadinessStatus;
  authorityPath: string[];
  translationConsideration: string;
  consularConsideration: string;
  reviewReasons: string[];
  safetyNotice: string;
}

export interface DocumentReadinessInput {
  documentPresent: boolean;
  signatureBlocksPresent: boolean;
  signerCountKnown: boolean;
  datesComplete: boolean;
  venuePresent: boolean;
  notarialWordingConfirmed: boolean;
  missingPages: boolean;
  duplicatePages: boolean;
  scanUsable: boolean;
  foreignLanguage: boolean;
  destinationConfirmed: boolean;
  authenticationPathConfirmed: boolean;
}

export interface DocumentReadinessProjection {
  status: ReadinessStatus;
  blockers: string[];
  reviewItems: string[];
  passedChecks: string[];
}

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function projectApostilleRoute(input: ApostilleRouteInput): ApostilleRouteProjection {
  const destinationSlug = normalizeSlug(input.destinationCountry);
  const destination = getCountryExecutionIntelligence(
    destinationSlug,
    input.destinationCountry.trim() || "Destination",
  );

  const reviewReasons: string[] = [];
  const authorityPath: string[] = [];

  if (!input.originState.trim()) reviewReasons.push("Originating U.S. state requires review.");
  if (!input.documentType.trim()) reviewReasons.push("Document type requires review.");
  if (input.issuingAuthority === "unknown") reviewReasons.push("Issuing authority requires review.");
  if (input.urgency === "rush") reviewReasons.push("Rush timing requires operator review before commitment.");

  if (input.issuingAuthority === "federal") {
    authorityPath.push("Federal issuing authority review");
    authorityPath.push("U.S. Department of State authentication / apostille pathway review");
  } else if (input.issuingAuthority === "county") {
    authorityPath.push("County-issued document readiness review");
    authorityPath.push("State authentication / apostille pathway review");
  } else if (input.issuingAuthority === "court") {
    authorityPath.push("Court-issued document readiness review");
    authorityPath.push("State or federal authentication authority review");
  } else if (input.issuingAuthority === "private") {
    authorityPath.push("Private document execution / notarization readiness review");
    authorityPath.push("State authentication / apostille pathway review");
  } else if (input.issuingAuthority === "state") {
    authorityPath.push("State-issued document readiness review");
    authorityPath.push("Secretary of State apostille / authentication pathway review");
  }

  if (destination.routeType === "hague_apostille") {
    authorityPath.push("Hague apostille route indicated");
  } else if (destination.routeType === "consular_legalization") {
    authorityPath.push("Authentication route review");
    authorityPath.push("Embassy / consular legalization review");
    reviewReasons.push("Non-Hague / consular handling requires receiving-authority review.");
  } else {
    authorityPath.push("Receiving-authority pathway review");
    reviewReasons.push("Destination route is authority-specific and requires review.");
  }

  const routeStatus: ReadinessStatus = reviewReasons.length ? "REVIEW_REQUIRED" : "READY";
  const translationConsideration =
    destination.translationRisk === "none"
      ? "No standing translation risk indicated by the current country registry."
      : destination.translationRisk === "likely"
        ? "Translation is likely to require destination-specific review."
        : destination.translationRisk === "possible"
          ? "Translation may be requested by the receiving authority."
          : "Translation requirements are authority-specific and must be confirmed.";
  const consularConsideration =
    destination.routeType === "consular_legalization"
      ? "Embassy / consular review is indicated before release."
      : "Consular handling is not indicated by the current route snapshot, but the receiving authority may impose additional requirements.";

  return {
    destination,
    routeStatus,
    authorityPath,
    translationConsideration,
    consularConsideration,
    reviewReasons,
    safetyNotice:
      "Routing intelligence is operational guidance only. It does not guarantee foreign acceptance; receiving authorities may impose additional requirements.",
  };
}

export function evaluateDocumentReadiness(
  input: DocumentReadinessInput,
): DocumentReadinessProjection {
  const blockers: string[] = [];
  const reviewItems: string[] = [];
  const passedChecks: string[] = [];
  const check = (condition: boolean, label: string, mode: "block" | "review") => {
    if (condition) passedChecks.push(label);
    else if (mode === "block") blockers.push(label);
    else reviewItems.push(label);
  };

  check(input.documentPresent, "Document present", "block");
  check(!input.missingPages, "No missing pages detected", "block");
  check(input.scanUsable, "Scan quality usable", "block");
  check(input.signatureBlocksPresent, "Signature blocks confirmed", "review");
  check(input.signerCountKnown, "Signer count confirmed", "review");
  check(input.datesComplete, "Date fields complete", "review");
  check(input.venuePresent, "Venue confirmed", "review");
  check(input.notarialWordingConfirmed, "Notarial wording confirmed", "review");
  check(!input.duplicatePages, "No duplicate pages detected", "review");
  check(input.destinationConfirmed, "Destination confirmed", "review");
  check(input.authenticationPathConfirmed, "Authentication path confirmed", "review");

  if (input.foreignLanguage) reviewItems.push("Foreign-language document requires translation / authority review.");
  else passedChecks.push("No foreign-language review flag");

  const status: ReadinessStatus = blockers.length ? "BLOCKED" : reviewItems.length ? "REVIEW_REQUIRED" : "READY";
  return { status, blockers, reviewItems, passedChecks };
}

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
  const status: ScanReadinessStatus = blockers.length ? "BLOCKED" : reviewFlags.length ? "REVIEW REQUIRED" : "READY";
  return {
    status,
    findings: [...blockers, ...reviewFlags],
    disclaimer: "This readiness scan supports document operations and does not replace legal or receiving-authority review.",
  };
}
