import { isDomesticDestination } from "@/lib/intake/reviewReadiness";
// INTERNAL ONLY — destination × document route intelligence for governed pricing.
//
// This module is a projection over the canonical registries. It does not own a
// routing table: destination route posture comes from
// COUNTRY_EXECUTION_INTELLIGENCE (via the professional toolbelt resolver),
// authority evidence from AUTHORITY_EVIDENCE_REGISTRY and the verified country
// overrides, and document posture from DOCUMENT_ORIGIN_ROUTING_MATRIX.
//
// Document-name heuristics classify routing posture only. They never select a
// legal instrument, a notarial act or an execution method, and any fact that
// cannot be resolved fails closed into operator review.

import { COUNTRY_EXECUTION_INTELLIGENCE } from "@/data/country-execution-intelligence";
import {
  canonicalDestinationSlug,
  projectApostilleRoute,
  type IssuingAuthority,
} from "@/lib/alliance/professionalToolbelt";
import { hasVerifiedHagueOverride } from "@/lib/compliance/verified-country-overrides";
import {
  AUTHORITY_EVIDENCE_REGISTRY,
  DOCUMENT_ORIGIN_ROUTING_MATRIX,
  evaluateAuthorityFreshness,
  type DocumentOriginCategory,
} from "@/lib/international-execution/operationalGovernance";

export type QuoteRouteType =
  | "domestic_execution"
  | "hague_apostille"
  | "authentication"
  | "consular_legalization"
  | "receiving_authority_review"
  | "hybrid_review"
  | "review_required";

export type QuoteIssuingLane = "state" | "federal" | "unresolved";

export type QuoteReceivingAuthorityType =
  | "court"
  | "comune"
  | "civil_registry"
  | "bank"
  | "university"
  | "immigration_authority"
  | "foreign_counsel"
  | "consulate"
  | "embassy"
  | "corporate_counterparty"
  | "private_institution"
  | "government_agency"
  | "other"
  | "unknown";

export type QuoteRouteReviewCode =
  | "ROUTE_DESTINATION_UNRESOLVED"
  | "ROUTE_DESTINATION_NOT_IN_REGISTRY"
  | "ROUTE_DOCUMENT_TYPE_UNRESOLVED"
  | "ROUTE_DOCUMENT_CLASSIFICATION_REVIEW"
  | "ROUTE_ORIGIN_UNRESOLVED"
  | "ROUTE_ISSUING_AUTHORITY_UNRESOLVED"
  | "ROUTE_FEDERAL_AGENCY_UNIDENTIFIED"
  | "ROUTE_FEDERAL_STATE_CONFLICT"
  | "ROUTE_CONSULAR_LEGALIZATION_REVIEW"
  | "ROUTE_RECEIVING_AUTHORITY_REVIEW"
  | "ROUTE_RECEIVING_AUTHORITY_UNKNOWN"
  | "ROUTE_AUTHORITY_EVIDENCE_UNVERIFIED";

export interface QuoteRouteIntelligenceInput {
  authentication_requirement?: unknown;
  destination_country?: unknown;
  origin_state?: unknown;
  document_type?: unknown;
  document_category?: unknown;
  issuing_authority?: unknown;
  issuing_agency?: unknown;
  receiving_authority?: unknown;
}

export interface QuoteRouteIntelligence {
  destination: string;
  destinationSlug: string | null;
  documentCategory: DocumentOriginCategory;
  documentCategorySource: "operator" | "heuristic";
  issuingAuthority: IssuingAuthority;
  issuingLane: QuoteIssuingLane;
  federalAgency: string | null;
  receivingAuthority: string | null;
  receivingAuthorityType: QuoteReceivingAuthorityType;
  routeType: QuoteRouteType;
  routeLabel: string;
  authorityPath: string[];
  authorityStatus: string;
  reviewRequired: boolean;
  reviewCodes: QuoteRouteReviewCode[];
  reviewReasons: string[];
  advisories: string[];
  pricingFacts: {
    consular_legalization: boolean;
    federal_apostille: boolean;
    receiving_authority_uncertain: boolean;
  };
  acceptanceNotice: string;
  safetyNotice: string;
}

export const RECEIVING_AUTHORITY_ACCEPTANCE_NOTICE =
  "Final acceptance remains subject to the receiving authority.";

const SAFETY_NOTICE =
  "Route intelligence supports operational review only. It does not select legal instruments, choose a notarial act, provide legal advice, or guarantee receiving-authority acceptance.";

const DOCUMENT_CATEGORIES = new Set<DocumentOriginCategory>(
  DOCUMENT_ORIGIN_ROUTING_MATRIX.map((rule) => rule.category),
);

const ISSUING_AUTHORITIES: readonly IssuingAuthority[] = [
  "state",
  "federal",
  "county",
  "court",
  "private",
  "unknown",
];

const UNKNOWN_TEXT = /^(unknown|n\/?a|none|tbd|not sure|unsure|\?+|-+)$/i;

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const known = (value: string) => (value && !UNKNOWN_TEXT.test(value) ? value : "");

// Ordered: the first matching posture wins. Federal issuers are checked before
// court/vital heuristics so a federal record can never fall into a state lane.
const DOCUMENT_POSTURE_HEURISTICS: ReadonlyArray<[RegExp, DocumentOriginCategory]> = [
  [/\bfbi\b|identity history summary|background check/i, "fbi_background_check"],
  [
    /\birs\b|\bfda\b|\buspto\b|\buscis\b|naturali[sz]ation|certificate of citizenship|social security|federal court|u\.?s\.? (district|bankruptcy|court of appeals)|\bfederal\b|department of state|consular report of birth/i,
    "federal_document",
  ],
  [/\bconsular\b|\bembassy\b|\bconsulate\b/i, "consular_document"],
  [/birth certificate|death certificate|marriage certificate|divorce certificate|\bvital record|\bvital\b/i, "vital_record"],
  [/\bcourt\b|judgment|judgement|\bdecree\b|probate|letters testamentary|letters of administration/i, "court_document"],
  [/power of attorney|\bpoa\b|\bprocura\b/i, "power_of_attorney"],
  [/affidavit|declaration|sworn statement/i, "notarized_affidavit"],
  [/diploma|transcript|\bdegree\b|academic|university record|school record/i, "educational_record"],
  [/good standing|secretary of state|state[- ]issued|state record|\bdmv\b/i, "state_public_record"],
  [/corporate|articles of (incorporation|organization)|board resolution|resolution|bylaws|operating agreement|certificate of incumbency|\bcompany\b|\bllc\b|\binc\b/i, "corporate_document"],
  [/certified copy|true copy/i, "certified_copy"],
  [/contract|agreement|consent|authori[sz]ation letter|\bletter\b|\bdeed\b|\bwill\b|\btrust\b|passport/i, "private_document"],
];

const FEDERAL_AGENCY_PATTERNS: ReadonlyArray<[RegExp, string]> = [
  [/\bfbi\b|federal bureau of investigation|identity history summary/i, "Federal Bureau of Investigation"],
  [/\birs\b|internal revenue/i, "Internal Revenue Service"],
  [/\bfda\b|food and drug/i, "U.S. Food and Drug Administration"],
  [/\buspto\b|patent and trademark/i, "U.S. Patent and Trademark Office"],
  [/\buscis\b|naturali[sz]ation|certificate of citizenship|citizenship and immigration/i, "U.S. Citizenship and Immigration Services"],
  [/social security|\bssa\b/i, "Social Security Administration"],
  [/federal court|u\.?s\.? (district|bankruptcy|court of appeals)/i, "U.S. federal court"],
  [/department of state|consular report of birth/i, "U.S. Department of State"],
  [/\busda\b|department of agriculture/i, "U.S. Department of Agriculture"],
  [/\bhhs\b|health and human services/i, "U.S. Department of Health and Human Services"],
  [/department of (commerce|justice|labor|treasury|homeland security|defense|education|transportation|energy|veterans affairs)/i, "U.S. federal department"],
];

const RECEIVING_AUTHORITY_PATTERNS: ReadonlyArray<[RegExp, QuoteReceivingAuthorityType]> = [
  [/\bembassy\b/i, "embassy"],
  [/consulate|consular/i, "consulate"],
  [/\bcomune\b|municipal|city hall|town hall|ayuntamiento|mairie/i, "comune"],
  [/civil regist|registry office|registro civil|stato civile|anagrafe/i, "civil_registry"],
  [/\bcourt\b|tribunal|tribunale|judge/i, "court"],
  [/\bbank\b|banca|banco|financial institution/i, "bank"],
  [/universit|college|school|academic/i, "university"],
  [/immigration|visa|residency|questura|migration/i, "immigration_authority"],
  [/counsel|attorney|lawyer|avvocato|notaio|notary|solicitor|law firm/i, "foreign_counsel"],
  [/counterparty|corporate|company|buyer|seller/i, "corporate_counterparty"],
  [/ministry|agency|government|registry|authority/i, "government_agency"],
  [/institution|private/i, "private_institution"],
];

export function classifyQuoteDocument(
  documentType: string,
  explicitCategory?: unknown,
): { category: DocumentOriginCategory; source: "operator" | "heuristic" } {
  const explicit = text(explicitCategory) as DocumentOriginCategory;
  if (explicit && DOCUMENT_CATEGORIES.has(explicit)) {
    return { category: explicit, source: "operator" };
  }
  for (const [pattern, category] of DOCUMENT_POSTURE_HEURISTICS) {
    if (pattern.test(documentType)) return { category, source: "heuristic" };
  }
  return { category: "other_review_required", source: "heuristic" };
}

export function normalizeIssuingAuthority(value: unknown): IssuingAuthority {
  const raw = text(value).toLowerCase();
  if ((ISSUING_AUTHORITIES as readonly string[]).includes(raw)) return raw as IssuingAuthority;
  if (/secretary of state|state agency|vital records office/.test(raw)) return "state";
  if (/county|clerk/.test(raw)) return "county";
  if (/federal|u\.?s\.? department|\bfbi\b|\birs\b|\buscis\b/.test(raw)) return "federal";
  if (/court/.test(raw)) return "court";
  if (/private|individual|company|executed/.test(raw)) return "private";
  return "unknown";
}

function identifyFederalAgency(...sources: string[]): string | null {
  const haystack = sources.filter(Boolean).join(" ");
  for (const [pattern, agency] of FEDERAL_AGENCY_PATTERNS) {
    if (pattern.test(haystack)) return agency;
  }
  return null;
}

export function classifyReceivingAuthority(value: string): QuoteReceivingAuthorityType {
  if (!value) return "unknown";
  for (const [pattern, type] of RECEIVING_AUTHORITY_PATTERNS) {
    if (pattern.test(value)) return type;
  }
  return "other";
}

function mapRouteType(routeType: string): QuoteRouteType {
  switch (routeType) {
    case "hague_apostille":
    case "consular_legalization":
    case "hybrid_review":
      return routeType;
    case "authority_review":
      return "receiving_authority_review";
    default:
      return "review_required";
  }
}

export function projectQuoteRouteIntelligence(
  input: QuoteRouteIntelligenceInput,
): QuoteRouteIntelligence {
  const destination = text(input.destination_country);
  const originState = known(text(input.origin_state));
  const documentType = text(input.document_type);
  const issuingAuthority = normalizeIssuingAuthority(input.issuing_authority);
  const issuingAgencyInput = known(text(input.issuing_agency));
  const receivingAuthority = known(text(input.receiving_authority));

  const reasons = new Map<QuoteRouteReviewCode, string>();
  const flag = (code: QuoteRouteReviewCode, message: string) => {
    if (!reasons.has(code)) reasons.set(code, message);
  };
  const advisories: string[] = [];

  // Only governed no-authentication truth permits a domestic execution quote.
  // Destination alone cannot clear an authentication requirement.
  if (isDomesticDestination(destination) && input.authentication_requirement === "not_required") {
    const { category, source } = classifyQuoteDocument(documentType, input.document_category);
    if (!documentType) flag("ROUTE_DOCUMENT_TYPE_UNRESOLVED", "Document identity/type is unresolved.");
    return {
      destination, destinationSlug: "united-states", documentCategory: category,
      documentCategorySource: source, issuingAuthority, issuingLane: "unresolved",
      federalAgency: null, receivingAuthority: receivingAuthority || null,
      receivingAuthorityType: classifyReceivingAuthority(receivingAuthority),
      routeType: "domestic_execution", routeLabel: "Reviewed Domestic Execution",
      authorityPath: [], authorityStatus: "NOT_APPLICABLE",
      reviewRequired: reasons.size > 0, reviewCodes: [...reasons.keys()],
      reviewReasons: [...reasons.values()], advisories: [],
      pricingFacts: { consular_legalization: false, federal_apostille: false, receiving_authority_uncertain: false },
      acceptanceNotice: RECEIVING_AUTHORITY_ACCEPTANCE_NOTICE, safetyNotice: SAFETY_NOTICE,
    };
  }

  // ── Destination (canonical registry only; never a synthetic fallback) ──
  const destinationSlug = destination ? canonicalDestinationSlug(destination) : null;
  const registered = destinationSlug ? COUNTRY_EXECUTION_INTELLIGENCE[destinationSlug] : undefined;
  if (!destination) {
    flag("ROUTE_DESTINATION_UNRESOLVED", "Destination country is unresolved.");
  } else if (!registered) {
    flag(
      "ROUTE_DESTINATION_NOT_IN_REGISTRY",
      "Destination is not present in the governed country execution registry.",
    );
  }

  // ── Document classification (routing posture only) ──
  const { category: documentCategory, source: documentCategorySource } =
    classifyQuoteDocument(documentType, input.document_category);
  const documentRule = DOCUMENT_ORIGIN_ROUTING_MATRIX.find(
    (rule) => rule.category === documentCategory,
  );
  if (!documentType && documentCategorySource !== "operator") {
    flag("ROUTE_DOCUMENT_TYPE_UNRESOLVED", "Document identity/type is unresolved.");
  }
  if (documentCategory === "other_review_required") {
    flag(
      "ROUTE_DOCUMENT_CLASSIFICATION_REVIEW",
      "Document could not be confidently classified; operator classification is required.",
    );
  }

  // ── Federal / state distinction ──
  const federalByDocument = documentRule?.authorityClass === "federal";
  const federalAgency = identifyFederalAgency(issuingAgencyInput, documentType);
  const federal = federalByDocument || issuingAuthority === "federal";
  const issuingLane: QuoteIssuingLane = federal
    ? "federal"
    : issuingAuthority === "unknown"
      ? "unresolved"
      : "state";

  if (issuingAuthority === "unknown") {
    flag("ROUTE_ISSUING_AUTHORITY_UNRESOLVED", "Issuing authority classification is unresolved.");
  }
  if (federalByDocument && issuingAuthority !== "federal" && issuingAuthority !== "unknown") {
    flag(
      "ROUTE_FEDERAL_STATE_CONFLICT",
      "Document indicates a federal issuer but was marked as a non-federal issuing authority; federal documents never route through state apostille.",
    );
  }
  if (federal && !federalAgency) {
    flag(
      "ROUTE_FEDERAL_AGENCY_UNIDENTIFIED",
      "Federal route is indicated but the federal issuing agency is not identified.",
    );
  }
  if (!federal && !originState) {
    flag("ROUTE_ORIGIN_UNRESOLVED", "Document origin jurisdiction is unresolved.");
  }

  // ── Destination route posture from the canonical toolbelt projection ──
  const toolbeltRoute = registered
    ? projectApostilleRoute({
        originState: federal ? "U.S. federal" : originState,
        destinationCountry: destination,
        documentType,
        issuingAuthority: federal ? "federal" : issuingAuthority,
      })
    : null;
  const routeType: QuoteRouteType = registered ? mapRouteType(registered.routeType) : "review_required";

  // ── Receiving authority ──
  const receivingAuthorityType = classifyReceivingAuthority(receivingAuthority);
  const receivingAuthorityRequired = documentRule?.authorityClass === "receiving_authority_review";
  const receivingAuthorityUncertain = receivingAuthorityRequired && !receivingAuthority;
  if (receivingAuthorityUncertain) {
    flag(
      "ROUTE_RECEIVING_AUTHORITY_UNKNOWN",
      "Receiving authority is unresolved for a document class that depends on receiving-authority requirements.",
    );
  }
  if (routeType === "receiving_authority_review") {
    flag(
      "ROUTE_RECEIVING_AUTHORITY_REVIEW",
      "Destination route is receiving-authority specific and requires operator review.",
    );
  }

  // ── Consular / non-Hague ──
  const consular =
    routeType === "consular_legalization" ||
    routeType === "hybrid_review" ||
    documentRule?.authorityClass === "consular" ||
    receivingAuthorityType === "embassy" ||
    receivingAuthorityType === "consulate";
  if (consular) {
    flag(
      "ROUTE_CONSULAR_LEGALIZATION_REVIEW",
      "Consular / legalization handling requires governed operator review; embassy or consulate costs are never auto-priced.",
    );
  }

  // ── Authority evidence ──
  const evidence = destinationSlug
    ? AUTHORITY_EVIDENCE_REGISTRY.find((record) => record.destinationSlug === destinationSlug)
    : undefined;
  let authorityStatus: string;
  if (!registered) {
    authorityStatus = "INSUFFICIENT_EVIDENCE";
  } else if (routeType !== "hague_apostille") {
    authorityStatus = consular ? "NON_HAGUE" : "REVIEW_REQUIRED";
  } else if (destinationSlug && hasVerifiedHagueOverride(destinationSlug)) {
    authorityStatus = "VERIFIED";
  } else {
    authorityStatus = evidence?.routingStatus ?? "INSUFFICIENT_EVIDENCE";
    const freshness = evidence ? evaluateAuthorityFreshness(evidence) : "MISSING_VERIFICATION";
    advisories.push(
      `Destination authority evidence is ${freshness.toLowerCase().replaceAll("_", " ")}; the Hague route is indicated by the canonical registry but official-source verification is still owed.`,
    );
  }
  if (routeType === "hague_apostille" && authorityStatus === "INSUFFICIENT_EVIDENCE") {
    flag(
      "ROUTE_AUTHORITY_EVIDENCE_UNVERIFIED",
      "Destination authority evidence is unavailable.",
    );
  }

  const authorityPath = toolbeltRoute?.authorityPath ?? [];
  const routeLabel = registered
    ? federal && routeType === "hague_apostille"
      ? "Federal Authentication / Apostille Review Route"
      : (toolbeltRoute?.destination.routeLabel ?? "Authority Review Required")
    : "Authority Review Required";

  const reviewCodes = [...reasons.keys()];
  return {
    destination,
    destinationSlug: registered ? destinationSlug : null,
    documentCategory,
    documentCategorySource,
    issuingAuthority,
    issuingLane,
    federalAgency,
    receivingAuthority: receivingAuthority || null,
    receivingAuthorityType,
    routeType,
    routeLabel,
    authorityPath,
    authorityStatus,
    reviewRequired: reviewCodes.length > 0,
    reviewCodes,
    reviewReasons: [...reasons.values()],
    advisories,
    pricingFacts: {
      consular_legalization: consular,
      federal_apostille: federal,
      receiving_authority_uncertain: receivingAuthorityUncertain,
    },
    acceptanceNotice: RECEIVING_AUTHORITY_ACCEPTANCE_NOTICE,
    safetyNotice: SAFETY_NOTICE,
  };
}
