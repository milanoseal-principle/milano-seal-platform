// Identifier Exact-Match Gate
// Protects codice fiscale, passport numbers, tax IDs, entity numbers from
// truncation or normalization before final apostille release.
// This is a hard gate — mismatch blocks final release unconditionally.

export type IdentifierType =
  | "codice_fiscale"
  | "tax_id"
  | "passport_number"
  | "national_id"
  | "entity_registration"
  | "court_case_number"
  | "document_reference"
  | "invoice_number"
  | "tracking_number";

export type IdentifierMatchResult = {
  matched: boolean;
  sourceValue: string;
  finalValue: string;
  mismatchReason: string | null;
};

// Strip only visual whitespace — never remove letters, digits, or punctuation.
// This is the ONLY normalization permitted before comparison.
function visualStrip(value: string): string {
  return value.replace(/\s+/g, "").trim();
}

// Character-by-character exact match after visual whitespace strip only.
// Returns match result with reason if mismatch detected.
export function validateIdentifierExactMatch(
  sourceValue: string,
  finalValue: string
): IdentifierMatchResult {
  const src = visualStrip(sourceValue);
  const fin = visualStrip(finalValue);

  if (src === fin) {
    return { matched: true, sourceValue, finalValue, mismatchReason: null };
  }

  let reason = "Values do not match exactly.";
  if (src.length !== fin.length) {
    reason = `Length mismatch: source has ${src.length} characters, final has ${fin.length} characters.`;
  } else {
    // Find first differing position
    for (let i = 0; i < src.length; i++) {
      if (src[i] !== fin[i]) {
        reason = `Character mismatch at position ${i + 1}: source "${src[i]}", final "${fin[i]}".`;
        break;
      }
    }
  }

  return { matched: false, sourceValue, finalValue, mismatchReason: reason };
}

// Labels for each identifier type (operator-facing)
export const IDENTIFIER_TYPE_LABELS: Record<IdentifierType, string> = {
  codice_fiscale:       "Codice Fiscale",
  tax_id:               "Tax ID",
  passport_number:      "Passport Number",
  national_id:          "National ID",
  entity_registration:  "Entity Registration Number",
  court_case_number:    "Court Case Number",
  document_reference:   "Document Reference Number",
  invoice_number:       "Invoice Number",
  tracking_number:      "Tracking Number",
};

// Client-safe copy for identifier mismatch — never mentions AI or internal error.
export const IDENTIFIER_MISMATCH_CLIENT_COPY =
  "A document identifier requires final verification before international release. No action is required from you right now.";

// Operator copy for mismatch
export const IDENTIFIER_MISMATCH_OPERATOR_COPY =
  "Identifier mismatch detected. Final release is blocked until the value is corrected and re-locked.";

// Italian matters: codice fiscale requires explicit lock before apostille release
export function requiresCodiceFiscaleLock(destinationCountry: string | null): boolean {
  return (destinationCountry ?? "").toLowerCase().includes("italy");
}
