/**
 * Receiving Authority Registry
 *
 * This registry is intentionally empty at launch.
 *
 * Every authority record requires:
 * - operator-verified requirements
 * - source_reference (URL, direct communication, or partner confirmation)
 * - review date
 * - confidence level
 * - valid_from date
 *
 * Do not add records without verified source attribution.
 * Do not invent requirements without direct authority research.
 * "Verification Required" is the correct state for any unresearched authority.
 *
 * To add the first verified authority record:
 * 1. Research the authority directly (website, direct communication, or partner)
 * 2. Document the source_reference and source_type
 * 3. Set authority_confidence to the appropriate level
 * 4. Set verified_at to the research date
 * 5. Set next_review_due to verified_at + review_cadence_months
 * 6. Add the record below with version: 1
 *
 * Example structure for reference (do not uncomment without verified data):
 *
 * {
 *   id: "it-comune-cansano",
 *   version: 1,
 *   authority_name: "Comune di Cansano",
 *   authority_name_english: "Municipality of Cansano",
 *   country: "IT",
 *   country_name: "Italy",
 *   region: "Abruzzo",
 *   city: "Cansano",
 *   authority_type: "municipality",
 *   authority_status: "active",
 *   authority_confidence: "UNVERIFIED",  // ← must be verified before use
 *   verified_by: null,
 *   verified_at: null,
 *   review_cadence_months: 12,
 *   next_review_due: null,
 *   friction_score: 8,                  // ← estimated; must be confirmed
 *   complexity_score: 8,
 *   escalation_required: false,
 *   website: null,
 *   contact_email: null,
 *   contact_phone: null,
 *   contact_hours: null,
 *   translation_requirement: "certified_required",
 *   translation_language: "Italian",
 *   witness_requirement: "none",
 *   ron_eligibility: false,
 *   apostille_standard: "Prefettura",
 *   federal_auth_required: false,
 *   consular_auth_required: false,
 *   document_rules: [],                 // ← must be researched per document type
 *   rejection_rules: [],                // ← must be sourced from real rejections
 *   source_type: "OPERATOR_OBSERVED",
 *   source_reference: null,
 *   notes_operator: null,
 *   notes_client_safe: null,
 *   valid_from: "2026-05-31",
 *   valid_to: null,
 *   created_at: "2026-05-31",
 *   updated_at: "2026-05-31",
 * }
 */

import type { ReceivingAuthority } from "./types";

export const RECEIVING_AUTHORITIES: ReceivingAuthority[] = [
  // Intentionally empty — see module docstring above.
  // First records to be added after operator authority research and source verification.
];
