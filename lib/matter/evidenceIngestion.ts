export const MATTER_EVIDENCE_SOURCE_TYPES = [
  "wise_webhook",
  "ron_provider",
  "authority_instruction",
  "translation_certificate",
  "shippo_webhook",
  "courier_receipt",
  "alliance_submission",
  "operator_upload",
  "email_import",
] as const;

export type MatterEvidenceSourceType = (typeof MATTER_EVIDENCE_SOURCE_TYPES)[number];
export type MatterEvidenceMatchState = "EXACT_MATCH" | "REVIEW_REQUIRED" | "CONFLICT_REVIEW" | "UNMATCHED";

export interface MatterEvidenceCandidate {
  matterId: string;
  clientEmail?: string | null;
  destinationCountry?: string | null;
  documentType?: string | null;
  wiseReference?: string | null;
  trackingNumber?: string | null;
  providerEventIds?: string[];
  sourceReferences?: string[];
}

export interface MatterEvidenceInput {
  sourceType: MatterEvidenceSourceType;
  evidenceHash: string;
  occurredAt: string;
  explicitMatterId?: string | null;
  providerEventId?: string | null;
  sourceReference?: string | null;
  wiseReference?: string | null;
  trackingNumber?: string | null;
  clientEmail?: string | null;
  destinationCountry?: string | null;
  documentType?: string | null;
}

export interface MatterEvidenceReconciliation {
  state: MatterEvidenceMatchState;
  matterId: string | null;
  candidateMatterIds: string[];
  matchedBy: string[];
  reasons: string[];
  canonicalMutationAuthorized: false;
}

const normalize = (value: string | null | undefined) => value?.trim().toLowerCase() ?? "";

function uniqueMatterIds(candidates: readonly MatterEvidenceCandidate[]) {
  return [...new Set(candidates.map((candidate) => candidate.matterId))];
}

function exactReferenceMatches(input: MatterEvidenceInput, candidates: readonly MatterEvidenceCandidate[]) {
  const matches = new Map<string, string[]>();
  const add = (matterId: string, reason: string) => matches.set(matterId, [...(matches.get(matterId) ?? []), reason]);

  for (const candidate of candidates) {
    if (input.explicitMatterId && candidate.matterId === input.explicitMatterId) add(candidate.matterId, "explicit_matter_id");
    if (input.providerEventId && candidate.providerEventIds?.includes(input.providerEventId)) add(candidate.matterId, "provider_event_id");
    if (input.sourceReference && candidate.sourceReferences?.includes(input.sourceReference)) add(candidate.matterId, "source_reference");
    if (input.wiseReference && candidate.wiseReference === input.wiseReference) add(candidate.matterId, "wise_reference");
    if (input.trackingNumber && candidate.trackingNumber === input.trackingNumber) add(candidate.matterId, "tracking_number");
  }

  return matches;
}

export function reconcileMatterEvidence(
  input: MatterEvidenceInput,
  candidates: readonly MatterEvidenceCandidate[],
): MatterEvidenceReconciliation {
  if (!MATTER_EVIDENCE_SOURCE_TYPES.includes(input.sourceType)) {
    return {
      state: "UNMATCHED",
      matterId: null,
      candidateMatterIds: [],
      matchedBy: [],
      reasons: ["Evidence source type is not governed."],
      canonicalMutationAuthorized: false,
    };
  }

  if (!input.evidenceHash.trim()) {
    return {
      state: "UNMATCHED",
      matterId: null,
      candidateMatterIds: [],
      matchedBy: [],
      reasons: ["Evidence hash is required before Matter reconciliation."],
      canonicalMutationAuthorized: false,
    };
  }

  const exact = exactReferenceMatches(input, candidates);
  const exactMatterIds = [...exact.keys()];

  if (exactMatterIds.length > 1) {
    return {
      state: "CONFLICT_REVIEW",
      matterId: null,
      candidateMatterIds: exactMatterIds.sort(),
      matchedBy: [...new Set(exactMatterIds.flatMap((id) => exact.get(id) ?? []))],
      reasons: ["Strong evidence references resolve to multiple canonical Matters."],
      canonicalMutationAuthorized: false,
    };
  }

  if (exactMatterIds.length === 1) {
    const matterId = exactMatterIds[0];
    return {
      state: "EXACT_MATCH",
      matterId,
      candidateMatterIds: [matterId],
      matchedBy: exact.get(matterId) ?? [],
      reasons: ["A unique canonical Matter matched through explicit or provider-controlled reference evidence."],
      canonicalMutationAuthorized: false,
    };
  }

  const email = normalize(input.clientEmail);
  const destination = normalize(input.destinationCountry);
  const documentType = normalize(input.documentType);

  const reviewCandidates = candidates.filter((candidate) => {
    if (!email || normalize(candidate.clientEmail) !== email) return false;
    const destinationMatches = Boolean(destination) && normalize(candidate.destinationCountry) === destination;
    const documentMatches = Boolean(documentType) && normalize(candidate.documentType) === documentType;
    return destinationMatches || documentMatches;
  });

  const reviewMatterIds = uniqueMatterIds(reviewCandidates);
  if (reviewMatterIds.length === 1) {
    return {
      state: "REVIEW_REQUIRED",
      matterId: reviewMatterIds[0],
      candidateMatterIds: reviewMatterIds,
      matchedBy: ["client_email_plus_context"],
      reasons: ["Identity/context evidence suggests one Matter but lacks a canonical or provider-controlled reference."],
      canonicalMutationAuthorized: false,
    };
  }

  if (reviewMatterIds.length > 1) {
    return {
      state: "CONFLICT_REVIEW",
      matterId: null,
      candidateMatterIds: reviewMatterIds.sort(),
      matchedBy: ["client_email_plus_context"],
      reasons: ["Identity/context evidence remains ambiguous across multiple Matters."],
      canonicalMutationAuthorized: false,
    };
  }

  return {
    state: "UNMATCHED",
    matterId: null,
    candidateMatterIds: [],
    matchedBy: [],
    reasons: ["Evidence does not match a canonical Matter with governed certainty."],
    canonicalMutationAuthorized: false,
  };
}

export function buildEvidenceLedgerAppend(input: MatterEvidenceInput, reconciliation: MatterEvidenceReconciliation) {
  if (!reconciliation.matterId) return null;
  return {
    matterId: reconciliation.matterId,
    eventType: "evidence_ingested",
    domain: "reconciliation",
    occurredAt: input.occurredAt,
    source: input.sourceType,
    sourceReference: input.sourceReference ?? input.providerEventId ?? null,
    evidenceReference: input.evidenceHash,
    reason: reconciliation.reasons.join(" "),
    metadata: {
      reconciliationState: reconciliation.state,
      matchedBy: reconciliation.matchedBy,
      canonicalMutationAuthorized: false,
    },
  } as const;
}
