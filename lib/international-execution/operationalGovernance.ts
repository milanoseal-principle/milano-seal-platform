import { GLOBAL_COMPLIANCE_ATLAS } from "@/data/global-compliance-atlas";

export type AuthorityRoutingState =
  | "VERIFIED"
  | "REVIEW_REQUIRED"
  | "STALE"
  | "INSUFFICIENT_EVIDENCE"
  | "NON_HAGUE"
  | "FEDERAL_SPECIAL"
  | "TERRITORIAL_REVIEW";

export interface AuthorityEvidenceRecord {
  destinationSlug: string;
  country: string;
  hagueConventionStatus: "contracting_party" | "non_hague" | "unknown";
  operativeRelationshipStatus: "verified" | "review_required" | "unknown";
  effectiveDate?: string;
  territorialApplicability: "verified" | "review_required" | "unknown";
  objectionsOrReservations: string[];
  competentAuthority?: string;
  competentAuthorityJurisdiction?: string;
  officialSourceUrl?: string;
  sourceType: "official" | "operator_note" | "derived";
  lastVerifiedAt?: string;
  verifiedBy?: string;
  reviewCadenceDays: number;
  nextReviewAt?: string;
  receivingAuthorityNotes?: string;
  confidence: "verified" | "reviewed" | "needs_review";
  staleState: "current" | "due_soon" | "stale" | "missing_verification";
  routingStatus: AuthorityRoutingState;
}

const addDays = (iso: string, days: number) => {
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return undefined;
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

export const AUTHORITY_EVIDENCE_REGISTRY: readonly AuthorityEvidenceRecord[] = GLOBAL_COMPLIANCE_ATLAS.map((entry) => {
  const official = entry.sourceNotes.find((note) => note.sourceType === "official_source" && note.confidence === "reviewed");
  const hague = entry.routeType === "hague_apostille";
  const lastVerifiedAt = official && entry.lastReviewedAt ? entry.lastReviewedAt : undefined;
  return {
    destinationSlug: entry.slug,
    country: entry.displayName,
    hagueConventionStatus: hague ? "contracting_party" : "non_hague",
    operativeRelationshipStatus: official ? "verified" : "review_required",
    territorialApplicability: official ? "verified" : "review_required",
    objectionsOrReservations: [],
    sourceType: official ? "official" : "derived",
    lastVerifiedAt,
    reviewCadenceDays: entry.reviewCadenceDays,
    nextReviewAt: lastVerifiedAt ? addDays(lastVerifiedAt, entry.reviewCadenceDays) : undefined,
    receivingAuthorityNotes: entry.receivingAuthorityBoundary,
    confidence: official ? "verified" : "needs_review",
    staleState: official ? "current" : "missing_verification",
    routingStatus: official ? (hague ? "VERIFIED" : "NON_HAGUE") : "REVIEW_REQUIRED",
  } satisfies AuthorityEvidenceRecord;
});

export function evaluateAuthorityFreshness(record: AuthorityEvidenceRecord, now = new Date()) {
  if (!record.lastVerifiedAt) return "MISSING_VERIFICATION" as const;
  if (!record.officialSourceUrl && record.sourceType !== "official") return "MISSING_SOURCE" as const;
  const last = new Date(`${record.lastVerifiedAt}T00:00:00Z`);
  if (Number.isNaN(last.getTime())) return "REVIEW_REQUIRED" as const;
  const ageDays = Math.floor((now.getTime() - last.getTime()) / 86_400_000);
  if (ageDays > record.reviewCadenceDays) return "STALE" as const;
  if (ageDays >= Math.max(0, record.reviewCadenceDays - 14)) return "DUE_SOON" as const;
  return "CURRENT" as const;
}

export function summarizeHagueCoverage(records: readonly AuthorityEvidenceRecord[] = AUTHORITY_EVIDENCE_REGISTRY) {
  const count = (predicate: (record: AuthorityEvidenceRecord) => boolean) => records.filter(predicate).length;
  return {
    contractingParties: 130,
    mappedDestinations: records.length,
    verified: count((r) => r.routingStatus === "VERIFIED"),
    stale: count((r) => evaluateAuthorityFreshness(r) === "STALE"),
    reviewRequired: count((r) => r.routingStatus === "REVIEW_REQUIRED"),
    incompleteEvidence: count((r) => r.routingStatus === "INSUFFICIENT_EVIDENCE" || r.confidence === "needs_review"),
    territorialReview: count((r) => r.routingStatus === "TERRITORIAL_REVIEW"),
    nonHague: count((r) => r.hagueConventionStatus === "non_hague"),
    federalSpecial: count((r) => r.routingStatus === "FEDERAL_SPECIAL"),
  };
}

export type DocumentOriginCategory =
  | "state_public_record"
  | "federal_document"
  | "private_document"
  | "court_document"
  | "corporate_document"
  | "educational_record"
  | "vital_record"
  | "notarized_affidavit"
  | "power_of_attorney"
  | "certified_copy"
  | "fbi_background_check"
  | "consular_document"
  | "other_review_required";

export interface DocumentOriginRule {
  category: DocumentOriginCategory;
  requiredOriginFacts: string[];
  possibleNotarizationState: "not_applicable" | "possible" | "required_by_evidence_only" | "review_required";
  possibleAuthenticationRoute: "state" | "federal" | "consular" | "depends";
  authorityClass: "state" | "federal" | "consular" | "receiving_authority_review";
  originalCopyRules: string[];
  certificationRequirements: string[];
  manualReviewConditions: string[];
}

export const DOCUMENT_ORIGIN_ROUTING_MATRIX: readonly DocumentOriginRule[] = [
  { category: "state_public_record", requiredOriginFacts: ["issuing_state", "issuing_authority", "document_identity"], possibleNotarizationState: "not_applicable", possibleAuthenticationRoute: "state", authorityClass: "state", originalCopyRules: ["government-certified copy may be required"], certificationRequirements: ["issuing authority certification must be valid where required"], manualReviewConditions: ["destination applicability unresolved", "copy acceptance unresolved"] },
  { category: "federal_document", requiredOriginFacts: ["federal_agency", "document_identity"], possibleNotarizationState: "not_applicable", possibleAuthenticationRoute: "federal", authorityClass: "federal", originalCopyRules: ["federal issuance/certification controls"], certificationRequirements: ["federal route evidence"], manualReviewConditions: ["agency route unresolved"] },
  { category: "private_document", requiredOriginFacts: ["execution_jurisdiction", "document_identity"], possibleNotarizationState: "required_by_evidence_only", possibleAuthenticationRoute: "depends", authorityClass: "receiving_authority_review", originalCopyRules: ["wet-ink or copy acceptance must be explicit"], certificationRequirements: [], manualReviewConditions: ["notarial act unknown", "receiving authority unknown"] },
  { category: "court_document", requiredOriginFacts: ["court", "jurisdiction", "certification_status"], possibleNotarizationState: "not_applicable", possibleAuthenticationRoute: "depends", authorityClass: "receiving_authority_review", originalCopyRules: ["court-certified copy rules apply"], certificationRequirements: ["court certification evidence"], manualReviewConditions: ["court certification unresolved"] },
  { category: "corporate_document", requiredOriginFacts: ["entity_jurisdiction", "document_identity", "signer_authority"], possibleNotarizationState: "required_by_evidence_only", possibleAuthenticationRoute: "depends", authorityClass: "receiving_authority_review", originalCopyRules: ["corporate original/copy acceptance varies"], certificationRequirements: ["signer authority where applicable"], manualReviewConditions: ["signer authority unresolved"] },
  { category: "educational_record", requiredOriginFacts: ["institution", "issuing_state", "document_identity"], possibleNotarizationState: "possible", possibleAuthenticationRoute: "state", authorityClass: "state", originalCopyRules: ["institution-issued or certified copy evidence required"], certificationRequirements: ["school/registrar certification where required"], manualReviewConditions: ["institution certification unresolved"] },
  { category: "vital_record", requiredOriginFacts: ["issuing_state", "vital_records_authority"], possibleNotarizationState: "not_applicable", possibleAuthenticationRoute: "state", authorityClass: "state", originalCopyRules: ["certified government copy required where applicable"], certificationRequirements: ["issuing authority certification"], manualReviewConditions: ["copy type unresolved"] },
  { category: "notarized_affidavit", requiredOriginFacts: ["notarization_jurisdiction", "notarial_act", "notary_details"], possibleNotarizationState: "not_applicable", possibleAuthenticationRoute: "state", authorityClass: "state", originalCopyRules: ["original notarized instrument may be required"], certificationRequirements: ["notarial certificate readiness"], manualReviewConditions: ["certificate type or jurisdiction unresolved"] },
  { category: "power_of_attorney", requiredOriginFacts: ["execution_jurisdiction", "signer_location", "receiving_authority"], possibleNotarizationState: "required_by_evidence_only", possibleAuthenticationRoute: "depends", authorityClass: "receiving_authority_review", originalCopyRules: ["wet-ink/original requirements must be explicit"], certificationRequirements: [], manualReviewConditions: ["notarial act unknown", "receiving authority requirement unknown"] },
  { category: "certified_copy", requiredOriginFacts: ["certifying_authority", "original_document_identity"], possibleNotarizationState: "possible", possibleAuthenticationRoute: "depends", authorityClass: "receiving_authority_review", originalCopyRules: ["certified copy is not automatically a government-certified copy"], certificationRequirements: ["certification authority evidence"], manualReviewConditions: ["copy authority unresolved"] },
  { category: "fbi_background_check", requiredOriginFacts: ["federal_issuer", "document_identity"], possibleNotarizationState: "not_applicable", possibleAuthenticationRoute: "federal", authorityClass: "federal", originalCopyRules: ["federal document handling controls"], certificationRequirements: ["federal authentication route"], manualReviewConditions: ["federal route unresolved"] },
  { category: "consular_document", requiredOriginFacts: ["consulate_or_embassy", "destination_country"], possibleNotarizationState: "review_required", possibleAuthenticationRoute: "consular", authorityClass: "consular", originalCopyRules: ["consular-specific medium requirements"], certificationRequirements: [], manualReviewConditions: ["consular requirements unresolved"] },
  { category: "other_review_required", requiredOriginFacts: ["document_identity", "origin_jurisdiction"], possibleNotarizationState: "review_required", possibleAuthenticationRoute: "depends", authorityClass: "receiving_authority_review", originalCopyRules: ["unknown"], certificationRequirements: [], manualReviewConditions: ["operator classification required"] },
] as const;

export type ReceivingAuthorityType = "court" | "municipality" | "comune" | "bank" | "university" | "immigration_office" | "civil_registry" | "attorney" | "embassy" | "consulate" | "corporate_counterparty" | "private_institution" | "government_agency" | "other";
export interface ReceivingAuthorityEvidence {
  id: string;
  matterId?: string;
  country: string;
  authorityType: ReceivingAuthorityType;
  name?: string;
  location?: string;
  contactReference?: string;
  requirementsKnown: boolean;
  acceptanceRequirements: string[];
  wetInkPreference: "required" | "preferred" | "not_required" | "unknown";
  translationRequirement: "required" | "not_required" | "unknown";
  certificationRequirement: "required" | "not_required" | "unknown";
  apostilleRequirementKnown: boolean;
  source?: string;
  sourceUrl?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  confidence: "verified" | "reviewed" | "unknown";
  status: "VERIFIED" | "REVIEW_REQUIRED" | "STALE";
  notes?: string;
}

export type RonEligibilityState = "ELIGIBLE" | "INELIGIBLE" | "REVIEW_REQUIRED" | "INSUFFICIENT_EVIDENCE";
export interface RonEligibilityInput {
  signerLocation?: string | null;
  documentType?: string | null;
  notarialAct?: string | null;
  platformEligibility?: boolean | null;
  identityEvidence?: boolean | null;
  KBAEvidence?: boolean | null;
  credentialAnalysis?: boolean | null;
  witnessRequirement?: "required" | "not_required" | "unknown";
  wetInkRequirement?: boolean | null;
  foreignAcceptanceRisk?: "low" | "review_required" | "unknown";
  receivingAuthorityState?: "verified" | "review_required" | "unknown";
  documentOriginalRequirement?: "wet_ink_original" | "other" | "unknown";
}

export function evaluateRonEligibility(input: RonEligibilityInput): { state: RonEligibilityState; reasons: string[] } {
  const reasons: string[] = [];
  if (!input.signerLocation) reasons.push("Signer jurisdiction is missing.");
  if (!input.documentType) reasons.push("Document type is unresolved.");
  if (!input.notarialAct) reasons.push("Notarial act is unresolved.");
  if (input.wetInkRequirement === true || input.documentOriginalRequirement === "wet_ink_original") return { state: "INELIGIBLE", reasons: ["Wet-ink/original requirement blocks RON."] };
  if (input.platformEligibility === false) return { state: "INELIGIBLE", reasons: ["Document/platform is not eligible for RON."] };
  if (input.foreignAcceptanceRisk !== "low" || input.receivingAuthorityState !== "verified") reasons.push("Receiving-authority/foreign acceptance is unresolved.");
  if (input.identityEvidence !== true || input.KBAEvidence !== true || input.credentialAnalysis !== true) reasons.push("Identity/KBA/credential evidence is incomplete.");
  if (reasons.length) return { state: input.signerLocation && input.documentType && input.notarialAct ? "REVIEW_REQUIRED" : "INSUFFICIENT_EVIDENCE", reasons };
  return { state: "ELIGIBLE", reasons: ["Required RON evidence is explicitly resolved."] };
}

export interface WitnessGovernance {
  required: true | false | "unknown";
  countRequired?: number;
  sourceOfRequirement?: string;
  supplyMode: "client" | "partner" | "operator" | "unresolved";
  witnesses: string[];
  eligibilityChecked: boolean;
  disqualificationFlags: string[];
  verifiedAt?: string;
  verifiedBy?: string;
}
export function evaluateWitnessGovernance(input: WitnessGovernance) {
  if (input.required === false) return "NOT_REQUIRED" as const;
  if (input.required === "unknown") return "REVIEW_REQUIRED" as const;
  if (input.disqualificationFlags.length) return "DISQUALIFIED" as const;
  if (!input.eligibilityChecked || input.supplyMode === "unresolved" || input.witnesses.length < (input.countRequired ?? 1)) return "INCOMPLETE" as const;
  return "READY" as const;
}

export interface TranslationGovernance {
  requirement: "required" | "not_required" | "unknown";
  sourceLanguage?: string;
  targetLanguage?: string;
  certifiedTranslationRequired: true | false | "unknown";
  translatorId?: string;
  translatorName?: string;
  providerType?: string;
  assignmentStatus?: string;
  sourceDocumentRef?: string;
  translatedDocumentRef?: string;
  certificationEvidenceRef?: string;
  completedAt?: string;
  verifiedAt?: string;
  receivingAuthorityAcceptance: "accepted" | "rejected" | "unknown" | "review_required";
}
export function evaluateTranslationGovernance(input: TranslationGovernance) {
  if (input.requirement === "not_required") return "NOT_REQUIRED" as const;
  if (input.requirement === "unknown") return "REVIEW_REQUIRED" as const;
  if (!input.sourceLanguage || !input.targetLanguage || !input.translatedDocumentRef) return "INCOMPLETE" as const;
  if (input.certifiedTranslationRequired === "unknown") return "REVIEW_REQUIRED" as const;
  if (input.certifiedTranslationRequired === true && !input.certificationEvidenceRef) return "INCOMPLETE" as const;
  if (input.receivingAuthorityAcceptance === "rejected") return "BLOCKED" as const;
  if (input.receivingAuthorityAcceptance !== "accepted") return "REVIEW_REQUIRED" as const;
  return "READY" as const;
}

export type DocumentMediumState = "ORIGINAL_REQUIRED" | "CERTIFIED_COPY_REQUIRED" | "GOVERNMENT_CERTIFIED_COPY" | "NOTARIZED_COPY" | "SCAN_ACCEPTABLE" | "WET_INK_ORIGINAL" | "COPY_ACCEPTABILITY_UNKNOWN";
export interface DocumentMediumGovernance {
  documentId: string;
  physicalForm?: string;
  originalAvailable?: boolean | null;
  copyType?: string;
  certificationAuthority?: string;
  wetInkRequired?: boolean | null;
  scanAccepted?: boolean | null;
  sourceOfRequirement?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  state: DocumentMediumState;
}
export function evaluateDocumentMedium(input: DocumentMediumGovernance) {
  if (input.state === "COPY_ACCEPTABILITY_UNKNOWN") return "REVIEW_REQUIRED" as const;
  if ((input.state === "ORIGINAL_REQUIRED" || input.state === "WET_INK_ORIGINAL") && input.originalAvailable !== true) return "BLOCKED" as const;
  if (input.state === "SCAN_ACCEPTABLE" && input.scanAccepted !== true) return "REVIEW_REQUIRED" as const;
  if (input.state === "GOVERNMENT_CERTIFIED_COPY" && !input.certificationAuthority) return "INCOMPLETE" as const;
  return "READY" as const;
}
