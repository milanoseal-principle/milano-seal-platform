// Global Jurisdiction Intelligence — type definitions.
//
// SAFETY: Every record in this module is ILLUSTRATIVE and operational only.
// Nothing here is authoritative legal fact. Each country/destination view must
// carry `verifyBeforeExecution: true` and be re-verified against primary
// sources before any real-world execution. No guaranteed acceptance, no
// government-approval claims, no legal/immigration advice.

export type HagueStatus = "member" | "non_member" | "unknown";

export type Region =
  | "Europe"
  | "Americas"
  | "Asia"
  | "Africa"
  | "Oceania"
  | "Middle East"
  | "Unknown";

export type ReviewSeverity = "info" | "warning" | "blocker";

// Core country intelligence record. `verifyBeforeExecution` is always true.
export interface CountryRecord {
  name: string;
  iso: string; // ISO 3166-1 alpha-2, uppercase; "??" when unknown
  region: Region;
  hagueStatus: HagueStatus;
  // Operational, non-authoritative notes. Never legal advice.
  operationalNotes?: string[];
  // When true (always), operators must verify against primary sources first.
  verifyBeforeExecution: true;
  // Set when any authoritative specifics are unknown / unsourced.
  requiresManualReview?: boolean;
}

export interface EmbassyRecord {
  hostCountryIso: string; // country the embassy is physically located in
  representsCountryIso: string; // country the embassy represents
  city?: string;
  label: string;
  // Illustrative contact placeholder — must be verified before use.
  contactNote?: string;
  verifyBeforeUse: true;
  requiresManualReview?: boolean;
}

export interface ConsulateRecord {
  hostCountryIso: string;
  representsCountryIso: string;
  city?: string;
  label: string;
  jurisdictionNote?: string;
  verifyBeforeUse: true;
  requiresManualReview?: boolean;
}

export interface TranslationRule {
  destinationIso: string;
  // Operational expectation only — never a guarantee of acceptance.
  translationExpected: "likely" | "sometimes" | "unknown";
  certifiedTranslationNote?: string;
  requiresManualReview: boolean;
}

export interface ProcessingNote {
  destinationIso: string;
  courierNote?: string;
  processingNote?: string;
  // Operational estimate only, in business days; null when unknown.
  estimatedBusinessDays?: number | null;
  requiresManualReview: boolean;
}

export interface ManualReviewFlag {
  code: string;
  message: string;
  severity: ReviewSeverity;
  // Which record/subject triggered the flag (iso or identifier).
  subject?: string;
}
