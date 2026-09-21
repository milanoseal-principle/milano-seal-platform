import "server-only";

import { GLOBAL_COMPLIANCE_ATLAS } from "@/data/global-compliance-atlas";
import {
  AUTHORITY_EVIDENCE_REGISTRY,
  DOCUMENT_ORIGIN_ROUTING_MATRIX,
  evaluateAuthorityFreshness,
  type DocumentOriginCategory,
} from "@/lib/international-execution/operationalGovernance";

export type QuoteRouteIntelligenceInput = {
  destination_country?: unknown;
  origin_state?: unknown;
  document_type?: unknown;
  issuing_authority?: unknown;
  receiving_authority?: unknown;
};

export type QuoteRouteIntelligence = {
  destination: string;
  documentCategory: DocumentOriginCategory;
  routeType: string;
  routeLabel: string;
  authorityStatus: string;
  reviewRequired: boolean;
  reviewReasons: string[];
  pricingFacts: {
    consular_legalization: boolean;
    federal_apostille: boolean;
    receiving_authority_uncertain: boolean;
  };
  safetyNotice: string;
};

const s = (value: unknown) => String(value ?? "").trim();
const slug = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function classifyDocument(value: string): DocumentOriginCategory {
  const v = value.toLowerCase();
  if (/fbi|federal|irs|fda|uspto|naturalization|social security/.test(v)) return "federal_document";
  if (/birth|death|marriage|divorce certificate|vital/.test(v)) return "vital_record";
  if (/affidavit|declaration|sworn/.test(v)) return "notarized_affidavit";
  if (/power of attorney|\bpoa\b/.test(v)) return "power_of_attorney";
  if (/court|judgment|decree/.test(v)) return "court_document";
  if (/diploma|transcript|degree|education/.test(v)) return "educational_record";
  if (/corporate|resolution|articles|company|entity/.test(v)) return "corporate_document";
  if (/certified copy/.test(v)) return "certified_copy";
  if (/consular|embassy/.test(v)) return "consular_document";
  if (/passport/.test(v)) return "private_document";
  return "other_review_required";
}

export function projectQuoteRouteIntelligence(
  input: QuoteRouteIntelligenceInput,
): QuoteRouteIntelligence {
  const destination = s(input.destination_country);
  const originState = s(input.origin_state);
  const documentType = s(input.document_type);
  const issuingAuthority = s(input.issuing_authority).toLowerCase();
  const receivingAuthority = s(input.receiving_authority);

  const destinationSlug = slug(destination);
  const atlas = GLOBAL_COMPLIANCE_ATLAS.find(
    (item) => item.slug === destinationSlug || item.displayName.toLowerCase() === destination.toLowerCase(),
  );
  const evidence = AUTHORITY_EVIDENCE_REGISTRY.find(
    (item) => item.destinationSlug === destinationSlug,
  );
  const documentCategory = classifyDocument(documentType);
  const documentRule = DOCUMENT_ORIGIN_ROUTING_MATRIX.find((rule) => rule.category === documentCategory);

  const reviewReasons: string[] = [];
  if (!destination) reviewReasons.push("Destination country is unresolved.");
  if (!originState && documentCategory !== "federal_document") reviewReasons.push("Document origin jurisdiction is unresolved.");
  if (!documentType) reviewReasons.push("Document identity/type is unresolved.");
  if (!atlas) reviewReasons.push("Destination route is not present in the governed compliance atlas.");
  if (!evidence) {
    reviewReasons.push("Destination authority evidence is unavailable.");
  } else {
    const freshness = evaluateAuthorityFreshness(evidence);
    if (freshness !== "CURRENT") reviewReasons.push(`Destination authority evidence requires review: ${freshness}.`);
    if (!["VERIFIED", "NON_HAGUE"].includes(evidence.routingStatus)) {
      reviewReasons.push(`Destination routing status is ${evidence.routingStatus}.`);
    }
  }

  const federalByDocument = documentCategory === "federal_document" || documentCategory === "fbi_background_check";
  const federalByAuthority = issuingAuthority === "federal";
  const federal = federalByDocument || federalByAuthority;

  if (!issuingAuthority || issuingAuthority === "unknown") {
    reviewReasons.push("Issuing authority classification is unresolved.");
  }
  if (documentRule?.authorityClass === "receiving_authority_review" && !receivingAuthority) {
    reviewReasons.push("Receiving authority is unresolved for this document class.");
  }
  const consular = atlas?.routeType === "consular_legalization" || atlas?.routeType === "hybrid_review";
  if (consular) reviewReasons.push("Consular/legalization route requires governed operator review.");
  if (federal && !/federal|fbi|us department|u\.s\./i.test(issuingAuthority + " " + documentType)) {
    reviewReasons.push("Federal route is indicated but the federal issuing authority is not fully identified.");
  }

  return {
    destination,
    documentCategory,
    routeType: atlas?.routeType ?? "review_required",
    routeLabel: atlas?.publicRouteLabel ?? "Authority Review Required",
    authorityStatus: evidence?.routingStatus ?? "INSUFFICIENT_EVIDENCE",
    reviewRequired: reviewReasons.length > 0,
    reviewReasons: Array.from(new Set(reviewReasons)),
    pricingFacts: {
      consular_legalization: Boolean(consular),
      federal_apostille: federal,
      receiving_authority_uncertain:
        Boolean(documentRule?.authorityClass === "receiving_authority_review" && !receivingAuthority),
    },
    safetyNotice:
      "Route intelligence supports operational review only. It does not select legal instruments, choose a notarial act, provide legal advice, or guarantee receiving-authority acceptance.",
  };
}
