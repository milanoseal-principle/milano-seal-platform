/**
 * Protected Identifier Lock
 *
 * Defines the doctrine for non-generative protected fields.
 * AI may display, compare, and flag — never retype, normalize, or alter.
 */

// ── Identifier types ──────────────────────────────────────────────────────────

export const PROTECTED_FIELD_TYPES = [
  "codice_fiscale",
  "bank_account_number",
  "routing_number",
  "iban",
  "swift",
  "passport_number",
  "ssn",
  "ein",
  "tax_id",
  "foreign_registration_number",
  "court_case_number",
  "property_parcel_id",
  "birth_date",
  "legal_name",
  "address",
  "notary_commission_number",
  "tracking_number",
] as const;

export type ProtectedFieldType = (typeof PROTECTED_FIELD_TYPES)[number];

// ── Validation states ─────────────────────────────────────────────────────────

export type ProtectedIdentifierStatus =
  | "UNVERIFIED"
  | "SOURCE_CAPTURED"
  | "CHARACTER_VERIFIED"
  | "CLIENT_CONFIRMED"
  | "LOCKED_FOR_EXECUTION"
  | "LOCKED_FOR_APOSTILLE"
  | "LOCKED_FOR_RELEASE"
  | "POST_RELEASE_CORRECTION_REQUIRED";

// ── Custody events for protected identifiers ──────────────────────────────────

export const PROTECTED_ID_EVENTS = {
  PROTECTED_IDENTIFIER_CAPTURED:       "PROTECTED_IDENTIFIER_CAPTURED",
  PROTECTED_IDENTIFIER_VERIFIED:       "PROTECTED_IDENTIFIER_VERIFIED",
  PROTECTED_IDENTIFIER_LOCKED:         "PROTECTED_IDENTIFIER_LOCKED",
  PROTECTED_IDENTIFIER_MISMATCH:       "PROTECTED_IDENTIFIER_MISMATCH",
  PROTECTED_IDENTIFIER_RELEASE_HOLD:   "PROTECTED_IDENTIFIER_RELEASE_HOLD",
  POST_RELEASE_ERROR_DISCOVERED:       "POST_RELEASE_ERROR_DISCOVERED",
  CORRECTION_PACKET_SENT:              "CORRECTION_PACKET_SENT",
  CLIENT_CONFIRMED_USABLE:             "CLIENT_CONFIRMED_USABLE",
} as const;

export type ProtectedIdEvent = (typeof PROTECTED_ID_EVENTS)[keyof typeof PROTECTED_ID_EVENTS];

// ── QA gate events ────────────────────────────────────────────────────────────

export const QA_EVENTS = {
  ITALY_QA_STARTED:               "ITALY_QA_STARTED",
  ITALY_QA_PASSED:                "ITALY_QA_PASSED",
  ITALY_QA_FAILED:                "ITALY_QA_FAILED",
  RELEASE_QA_STARTED:             "RELEASE_QA_STARTED",
  RELEASE_QA_PASSED:              "RELEASE_QA_PASSED",
  RELEASE_QA_FAILED:              "RELEASE_QA_FAILED",
  RELEASE_AUTHORIZATION_STARTED:  "RELEASE_AUTHORIZATION_STARTED",
  RELEASE_AUTHORIZATION_PASSED:   "RELEASE_AUTHORIZATION_PASSED",
  RELEASE_AUTHORIZATION_FAILED:   "RELEASE_AUTHORIZATION_FAILED",
  DOCUMENT_PACKAGE_RELEASED:      "DOCUMENT_PACKAGE_RELEASED",
  PAID_AND_RELEASED:              "PAID_AND_RELEASED",
  MATTER_CLOSED:                  "MATTER_CLOSED",
} as const;

// ── Payment rail events ───────────────────────────────────────────────────────

export const PAYMENT_EVENTS = {
  PAYMENT_LINK_SENT:            "PAYMENT_LINK_SENT",
  WISE_PAYMENT_RECEIVED:        "WISE_PAYMENT_RECEIVED",
  PAYMENT_RECONCILED:           "PAYMENT_RECONCILED",
  PAYMENT_DETAIL_ERROR:         "PAYMENT_DETAIL_ERROR_DETECTED",
  PAYMENT_RETURNED:             "PAYMENT_RETURNED",
  PAYMENT_UNMATCHED:            "PAYMENT_UNMATCHED",
} as const;

// ── Post-release correction events ────────────────────────────────────────────

export const CORRECTION_EVENTS = {
  POST_RELEASE_ERROR_DISCOVERED:  "POST_RELEASE_ERROR_DISCOVERED",
  CORRECTION_REVIEW_STARTED:      "CORRECTION_REVIEW_STARTED",
  CORRECTION_PACKET_PREPARED:     "CORRECTION_PACKET_PREPARED",
  CORRECTION_PACKET_SENT:         "CORRECTION_PACKET_SENT",
  CLIENT_CONFIRMED_USABLE:        "CLIENT_CONFIRMED_USABLE",
} as const;

// ── Italy-specific QA checklist ───────────────────────────────────────────────

export const ITALY_QA_CHECKLIST = [
  "Verify signer legal name",
  "Verify all name variants",
  "Verify birth date",
  "Verify birthplace",
  "Verify codice fiscale",
  "Verify address",
  "Verify attorney delivery address",
  "Verify country of use",
  "Verify notarial act type",
  "Verify apostille cover letter",
  "Verify shipping label",
  "Verify final PDF matches approved version",
  "Verify no identifier drift from source",
] as const;

// ── Hard stops ────────────────────────────────────────────────────────────────

export interface HardStop {
  trigger: string;
  blocks: string;
  code: string;
}

export const HARD_STOPS: HardStop[] = [
  { trigger: "PAYMENT_NOT_RECONCILED",    blocks: "SCHEDULED",              code: "PAYMENT_GATE" },
  { trigger: "PROTECTED_ID_UNVERIFIED",   blocks: "RON_COMPLETED",          code: "IDENTIFIER_GATE" },
  { trigger: "ITALY_QA_FAILED",           blocks: "APOSTILLE_SUBMITTED",    code: "ITALY_QA_GATE" },
  { trigger: "RELEASE_QA_FAILED",         blocks: "SHIPPED",                code: "RELEASE_QA_GATE" },
  { trigger: "POST_RELEASE_ERROR",        blocks: "CLOSED",                 code: "CORRECTION_GATE" },
  { trigger: "RELEASE_AUTHORIZATION_FAILED", blocks: "PAID_AND_RELEASED",  code: "RELEASE_AUTH_GATE" },
];

// ── Wise payment link (immutable) ─────────────────────────────────────────────

export const WISE_PAYMENT_LINK = "https://wise.com/pay/me/nicholassamm1" as const;

// ── Revenue recognition types ─────────────────────────────────────────────────

export type RevenueType =
  | "cash"
  | "platform_payout"
  | "trade_value"
  | "barter"
  | "ron_platform"
  | "apostille"
  | "direct";

// ── Relationship states ───────────────────────────────────────────────────────

export type RelationshipState =
  | "ACTIVE"
  | "LOST_PRICE"
  | "LOST_TIMING"
  | "LOST_CHEAPER_VENDOR"
  | "LOST_SCOPE_CHANGED"
  | "LOST_BUT_WARM"
  | "REORDER_POTENTIAL"
  | "CLOSED";
