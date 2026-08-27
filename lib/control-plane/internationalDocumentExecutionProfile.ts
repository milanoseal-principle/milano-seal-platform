export const APOSTILLE_CONVENTION_PROFILE = {
  convention: "HCCH 1961 Apostille Convention",
  contractingParties: 129,
  authority: "HCCH",
  officialStatusSource: "https://www.hcch.net/en/instruments/conventions/status-table/?cid=41",
  verifiedAsOf: "2026-08-27",
  governanceNote:
    "129 is the current number of Contracting Parties, not a blanket promise that every document or destination uses an apostille-only route. Entry into force, territorial scope, objections, document origin, document category and receiving-authority requirements remain controlling.",
} as const;

export const INTERNATIONAL_EXECUTION_LANES = [
  {
    id: "ron_execution",
    label: "Remote Online Notarization",
    purpose: "Florida RON execution when signer location, document type, platform eligibility, identity/KBA requirements and receiving-authority expectations permit remote execution.",
    canonicalInputs: ["signer_location", "document_type", "notarial_act", "identity_evidence", "kba_credential_evidence", "receiving_authority"],
    failClosedWhen: ["notarial_act_unknown", "identity_evidence_missing", "platform_ineligible", "receiving_authority_requires_wet_ink_or_in_person"],
  },
  {
    id: "mobile_in_person_execution",
    label: "Mobile / In-Person Notarial Execution",
    purpose: "Physical execution lane when RON is unavailable, inappropriate or receiving-authority expectations indicate wet-ink or in-person handling.",
    canonicalInputs: ["execution_location", "signer_identity", "notarial_act", "witness_requirements", "original_document_status"],
    failClosedWhen: ["execution_location_missing", "notarial_act_unknown", "witness_requirements_unresolved"],
  },
  {
    id: "already_notarized_review",
    label: "Already-Notarized Document Review",
    purpose: "Review existing notarization before apostille/authentication routing without creating a new notarial act by inference.",
    canonicalInputs: ["notarization_jurisdiction", "certificate_type", "notary_details", "document_origin"],
    failClosedWhen: ["notarization_jurisdiction_unknown", "certificate_type_unknown"],
  },
  {
    id: "state_apostille",
    label: "State Apostille",
    purpose: "Route eligible state-issued or state-notarized public/private documents to the competent state apostille authority when the destination route supports the Convention.",
    canonicalInputs: ["origin_state", "document_category", "destination_country", "hague_status", "competent_authority"],
    failClosedWhen: ["origin_state_unknown", "hague_status_unverified", "competent_authority_unverified"],
  },
  {
    id: "federal_authentication",
    label: "Federal Authentication / Apostille Review",
    purpose: "Route federal documents through the correct federal authentication path without incorrectly applying state notarization or state apostille logic.",
    canonicalInputs: ["issuing_federal_agency", "document_category", "destination_country", "federal_route"],
    failClosedWhen: ["issuing_agency_unknown", "federal_route_unverified"],
  },
  {
    id: "non_hague_legalization",
    label: "Non-Hague Authentication / Consular Legalization",
    purpose: "Fail closed into authentication and consular review when the destination is not on an operative Apostille Convention route for the Matter.",
    canonicalInputs: ["destination_country", "document_origin", "document_category", "consular_requirements", "receiving_authority"],
    failClosedWhen: ["consular_requirements_unverified", "receiving_authority_unknown"],
  },
  {
    id: "translation_coordination",
    label: "Translation Coordination",
    purpose: "Track translation requirements as a separate execution decision; never assume translation, certification or translator qualification from destination alone.",
    canonicalInputs: ["document_language", "destination_language", "receiving_authority", "translation_requirement", "translator_qualification_requirement"],
    failClosedWhen: ["translation_requirement_unknown_for_release_critical_matter"],
  },
  {
    id: "international_courier_release",
    label: "International Courier & Release",
    purpose: "Govern physical release, custody handoff, international courier evidence, delivery status and final closeout after payment and execution gates are satisfied.",
    canonicalInputs: ["release_verified", "custody_evidence", "courier_service", "tracking_number", "destination_address", "delivery_evidence"],
    failClosedWhen: ["release_not_verified", "custody_incomplete", "destination_address_unverified"],
  },
] as const;

export const INTERNATIONAL_MATTER_FACTS = [
  "document_identity",
  "document_category",
  "issuing_authority",
  "origin_country_or_state",
  "destination_country",
  "receiving_authority",
  "signer_location",
  "signer_count",
  "notarization_required",
  "notarial_act",
  "execution_method",
  "witness_requirements",
  "original_or_copy_status",
  "document_language",
  "translation_requirement",
  "apostille_or_authentication_requirement",
  "competent_authority",
  "deadline_or_requested_timeline",
  "delivery_method",
  "destination_address",
] as const;

export const INTERNATIONAL_CONTROL_DOMAINS = [
  { id: "document_origin", label: "Document Origin", truth: "Issuing jurisdiction and authority determine the competent execution/authentication path." },
  { id: "destination", label: "Destination & Convention Status", truth: "Destination routing uses current HCCH Convention status plus Matter-specific entry-into-force, territorial and receiving-authority review." },
  { id: "notarial_execution", label: "Notarial Execution", truth: "Acknowledgment, jurat or other notarial act is never inferred from document type alone." },
  { id: "ron", label: "RON Suitability", truth: "RON is an execution option, not a universal default; signer, platform and receiving-authority requirements control." },
  { id: "apostille_authentication", label: "Apostille / Authentication", truth: "State, federal, Hague and non-Hague routes remain distinct and fail closed when authority evidence is unresolved." },
  { id: "translation", label: "Translation", truth: "Translation and certification requirements are explicit Matter facts, never destination-only assumptions." },
  { id: "custody_release", label: "Custody & Release", truth: "Release requires governed evidence and cannot be unlocked by intelligence projections." },
  { id: "courier_delivery", label: "Courier & Delivery", truth: "Tracking and delivered states require carrier/provider evidence; labels or generated IDs are not delivery proof." },
  { id: "receiving_authority", label: "Receiving Authority", truth: "Final acceptance belongs to the foreign court, registry, agency, consulate, bank, counsel or institution receiving the document." },
] as const;

export type ExecutionPathInput = {
  destinationHagueVerified?: boolean | null;
  destinationHagueOperativeForMatter?: boolean | null;
  documentOriginLevel?: "state" | "federal" | "foreign" | "unknown";
  notarizationRequired?: boolean | null;
  notarialActKnown?: boolean | null;
  ronRequested?: boolean | null;
  ronEligible?: boolean | null;
  receivingAuthorityWetInkRequired?: boolean | null;
};

export type ExecutionPathDecision = {
  status: "READY_FOR_OPERATOR_ROUTING" | "REVIEW_REQUIRED";
  lane: "state_apostille" | "federal_authentication" | "non_hague_legalization" | "ron_execution" | "mobile_in_person_execution" | "unresolved";
  reasons: string[];
};

export function deriveInternationalExecutionPath(input: ExecutionPathInput): ExecutionPathDecision {
  const reasons: string[] = [];

  if (!input.documentOriginLevel || input.documentOriginLevel === "unknown") {
    reasons.push("Document origin level is unresolved.");
  }
  if (input.destinationHagueVerified !== true) {
    reasons.push("Destination Apostille Convention status is not verified.");
  }
  if (input.destinationHagueVerified === true && input.destinationHagueOperativeForMatter !== true) {
    reasons.push("Convention status is not yet proven operative for this Matter.");
  }
  if (input.notarizationRequired === true && input.notarialActKnown !== true) {
    reasons.push("Required notarial act is unresolved.");
  }
  if (input.ronRequested === true && input.ronEligible !== true) {
    reasons.push("RON eligibility is not proven.");
  }
  if (input.ronRequested === true && input.receivingAuthorityWetInkRequired === true) {
    reasons.push("Receiving-authority evidence indicates wet-ink/in-person execution review.");
  }

  if (reasons.length > 0) {
    return { status: "REVIEW_REQUIRED", lane: "unresolved", reasons };
  }

  if (input.ronRequested === true && input.ronEligible === true && input.receivingAuthorityWetInkRequired !== true) {
    return { status: "READY_FOR_OPERATOR_ROUTING", lane: "ron_execution", reasons: ["RON-specific execution facts are resolved for operator routing."] };
  }

  if (input.notarizationRequired === true) {
    return { status: "READY_FOR_OPERATOR_ROUTING", lane: "mobile_in_person_execution", reasons: ["Notarial execution is required and RON is not the selected route."] };
  }

  if (input.documentOriginLevel === "federal") {
    return { status: "READY_FOR_OPERATOR_ROUTING", lane: "federal_authentication", reasons: ["Federal document origin requires the federal authentication path."] };
  }

  if (input.destinationHagueOperativeForMatter === true && input.documentOriginLevel === "state") {
    return { status: "READY_FOR_OPERATOR_ROUTING", lane: "state_apostille", reasons: ["State-origin document and operative Hague route are resolved."] };
  }

  return { status: "READY_FOR_OPERATOR_ROUTING", lane: "non_hague_legalization", reasons: ["Matter is routed outside the state apostille lane and remains subject to operator verification."] };
}

export const INTERNATIONAL_EXECUTION_GOVERNANCE = {
  internationalDocumentExecutionFirmSpecific: true,
  remoteOnlineNotarizationIsConditional: true,
  apostilleAndNotarizationAreIndependentDecisions: true,
  stateAndFederalAuthoritiesRemainDistinct: true,
  hagueContractingPartyCountIsExternallyVerified: true,
  receivingAuthorityAlwaysControlsFinalAcceptance: true,
  noCountryOnlyLegalConclusion: true,
  noAutomaticNotarialActSelection: true,
  noAutomaticApostilleSelection: true,
  noAutomaticRONSelection: true,
  nonHagueRoutesFailClosed: true,
  releaseRequiresGovernedEvidence: true,
} as const;
