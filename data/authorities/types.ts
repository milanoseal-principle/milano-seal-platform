/**
 * Receiving Authority Intelligence — Type System
 *
 * Every authority requirement must carry source attribution, review date,
 * and confidence level before it can drive readiness output.
 * No requirement is asserted as fact without a verified source.
 */

// ── Authority classification ───────────────────────────────────────────────────

export type AuthorityType =
  | "municipality"       // Comune, City Hall, Municipal Office
  | "state_registry"     // Civil Registry, Registro Civil
  | "notary_registry"    // Cartório (Brazil/Portugal), Notaría Pública (Mexico)
  | "court"              // Tribunal, Tribunale, Court
  | "prefettura"         // Italian Prefettura
  | "consulate"          // Foreign consulate in the US
  | "embassy"            // Foreign embassy in the US
  | "immigration_office" // USCIS, foreign immigration authority
  | "university"         // Academic institution accepting documents
  | "employer"           // Corporate/employer entity
  | "land_registry"      // Property/land registry
  | "other";

export type AuthorityStatus = "active" | "inactive" | "seasonal" | "unknown";

// ── Confidence levels ─────────────────────────────────────────────────────────
// Controls what the readiness engine is permitted to assert.

export type AuthorityConfidence =
  | "AUTHORITY_VERIFIED"       // Direct authority communication on file — may auto-drive readiness
  | "MULTI_SOURCE_CONFIRMED"   // 2+ independent sources — may drive readiness with attribution
  | "PARTNER_CONFIRMED"        // Attorney/partner confirmed — drives readiness with note
  | "OBSERVED"                 // Operator-observed from completed matters — advisory only
  | "UNVERIFIED"               // No source — shows Verification Required
  | "VERIFICATION_REQUIRED";   // Explicitly flagged — blocks requirement auto-population

// ── Source types ──────────────────────────────────────────────────────────────

export type SourceType =
  | "HCCH"                    // Hague Conference on Private International Law
  | "STATE_AUTHORITY"         // Florida Dept of State or other US state authority
  | "EMBASSY"                 // Embassy communication or website
  | "CONSULATE"               // Consulate communication or website
  | "RECEIVING_AUTHORITY"     // Direct authority communication
  | "PARTNER_CONFIRMED"       // Attorney or partner network
  | "CLIENT_PROVIDED"         // Client-reported (lowest reliability)
  | "OPERATOR_OBSERVED"       // Observed from completed matters
  | "INTERNAL_CASE_MEMORY";   // Derived from internal execution history

// ── Translation and witness types ─────────────────────────────────────────────

export type TranslationRequirement =
  | "none"
  | "recommended"
  | "required"
  | "certified_required"
  | "sworn_required"
  | "authority_specific";     // Requires further verification

export type WitnessRequirement =
  | "none"
  | "one_witness"
  | "two_witnesses"
  | "authority_specific";

// ── Rejection intelligence ────────────────────────────────────────────────────

export type RejectionSeverity = "fatal" | "correctable" | "advisory";

export interface AuthorityRejectionRule {
  id: string;
  trigger: string;            // e.g., "expired_record", "missing_original_seal"
  description: string;        // Operator-facing detail
  client_safe_label: string;  // Portal-safe version
  severity: RejectionSeverity;
  source_type: SourceType;
  source_reference: string | null;
  last_observed_at: string | null;
  active: boolean;
}

// ── Document rule ─────────────────────────────────────────────────────────────

export interface AuthorityDocumentRule {
  document_type_slug: string;
  apostille_required: boolean;
  consular_required: boolean;
  translation_requirement: TranslationRequirement;
  translation_language: string | null;
  witness_requirement: WitnessRequirement;
  notarization_required: boolean;
  ron_accepted: boolean;
  original_required: boolean;
  copy_accepted: boolean;
  age_limit_months: number | null;   // Max document age in months; null = no limit
  special_format_notes: string | null; // Operator-only
  valid_from: string;
  valid_to: string | null;           // null = currently valid
  last_reviewed_at: string;
  source_type: SourceType;
  source_reference: string | null;
}

// ── Core authority record ──────────────────────────────────────────────────────

export interface ReceivingAuthority {
  // Identity
  id: string;                         // e.g., "it-comune-cansano"
  version: number;                    // Increment on every update; never overwrite
  authority_name: string;             // Official name in local language
  authority_name_english: string | null; // English translation if applicable
  country: string;                    // ISO-2 country code
  country_name: string;
  region: string | null;              // Sub-national region
  city: string | null;

  // Classification
  authority_type: AuthorityType;
  authority_status: AuthorityStatus;

  // Confidence & verification
  authority_confidence: AuthorityConfidence;
  verified_by: string | null;         // Operator ID or partner name
  verified_at: string | null;         // ISO date of last verification
  review_cadence_months: number;      // How often to re-verify (e.g., 12)
  next_review_due: string | null;     // ISO date

  // Friction & complexity
  friction_score: number;             // 1–10
  complexity_score: number;           // 1–10
  escalation_required: boolean;       // friction >= 9 triggers Nick review

  // Contact (operator-only — never exposed to portal)
  website: string | null;
  contact_email: string | null;       // Internal only
  contact_phone: string | null;       // Internal only
  contact_hours: string | null;

  // Requirements (macro)
  translation_requirement: TranslationRequirement;
  translation_language: string | null;
  witness_requirement: WitnessRequirement;
  ron_eligibility: boolean;
  apostille_standard: string | null;  // e.g., "Prefettura", "Hague Direct"
  federal_auth_required: boolean;
  consular_auth_required: boolean;

  // Document-specific rules (overrides country defaults when authority-verified)
  document_rules: AuthorityDocumentRule[];

  // Rejection intelligence
  rejection_rules: AuthorityRejectionRule[];

  // Source attribution
  source_type: SourceType;
  source_reference: string | null;

  // Operator notes (never exposed to portal)
  notes_operator: string | null;
  notes_client_safe: string | null;

  // Audit
  valid_from: string;
  valid_to: string | null;
  created_at: string;
  updated_at: string;
}

// ── Authority pack (generated output) ─────────────────────────────────────────

export interface AuthorityPack {
  authority: {
    id: string;
    name: string;
    country: string;
    type: string;
    confidence: AuthorityConfidence;
    friction_score: number;
    complexity_score: number;
    verified_at: string | null;
  };
  requirements: {
    apostille_required: boolean;
    consular_required: boolean;
    translation: TranslationRequirement;
    translation_language: string | null;
    witnesses: WitnessRequirement;
    ron_accepted: boolean;
    original_required: boolean;
    age_limit_months: number | null;
  } | null;
  rejection_warnings: {
    trigger: string;
    client_safe_label: string;
    severity: RejectionSeverity;
  }[];
  source_attribution: string | null;
  verification_status: AuthorityConfidence;
  client_safe_notes: string | null;
  operator_guidance: string | null;
  requires_qa_checklist: boolean;    // true if friction >= 7 or country = Italy
  customs_advisory: CustomsAdvisory | null;
}

// ── Corridor intelligence ──────────────────────────────────────────────────────

export type CorridorStatus = "NORMAL" | "ELEVATED" | "RESTRICTED" | "VERIFICATION_REQUIRED";

export interface CorridorProfile {
  id: string;
  origin_state: string;              // e.g., "FL", "CO", "TX"
  destination_country: string;       // ISO-2
  document_type_slug: string;
  receiving_authority_id: string | null;
  route_type: "hague" | "consular";
  corridor_status: CorridorStatus;
  friction_score: number;            // 1–10 combined corridor friction
  // Stats — only populated from real completed matters
  average_timeline_days: number | null;
  sample_size: number;               // number of completed matters this is based on
  last_successful_execution_at: string | null;
  known_delays: string | null;       // operator notes on operational delays
  source_reference: string | null;
}

// ── Customs intelligence (advisory only) ──────────────────────────────────────

export interface CustomsAdvisory {
  advisory_only: true;               // Always true — never implies customs approval
  pre_clearance_integrity_score: number | null; // 0–100 based on doc completeness only
  documentation_completeness: "complete" | "partial" | "unknown";
  authority_pack_status: "ready" | "incomplete" | "verification_required";
  customs_risk_buffer: "low" | "moderate" | "elevated" | "unknown";
  corridor_friction: number | null;
  known_operational_delays: string | null;
  disclaimer: string;
}

// ── SEO authority page data ────────────────────────────────────────────────────

export interface AuthoritySeoPage {
  country_slug: string;
  authority_slug: string;
  document_slug: string;
  page_title: string;
  meta_description: string;
  authority_name: string;
  authority_type: AuthorityType;
  country_name: string;
  // Content blocks
  requirements_summary: string | null;
  disclaimer: string;
}
