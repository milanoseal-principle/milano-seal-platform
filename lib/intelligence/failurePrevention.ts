export interface FailurePattern {
  id: string;
  label: string;
  description: string;
  check: (matter: Record<string, unknown>) => boolean;
}

export interface FailureCheckResult {
  matched: boolean;
  patterns: Array<{ id: string; label: string; description: string }>;
  message?: string;
}

const PATTERNS: FailurePattern[] = [
  { id: "italy_codice_fiscale", label: "Italy: Missing Codice Fiscale", description: "Italian authorities require codice fiscale on all submitted documents.", check: (m) => m.destination_country === "Italy" && !m.codice_fiscale },
  { id: "non_hague_routing", label: "Non-Hague country apostille attempt", description: "Destination country is not party to the Hague Convention. Apostille is invalid; legalization required.", check: (m) => m.apostille_required === true && m.hague_member === false },
  { id: "ron_mismatch", label: "RON document for non-RON jurisdiction", description: "Receiving authority does not accept remotely notarized documents.", check: (m) => m.signing_type === "ron" && m.ron_accepted_at_destination === false },
  { id: "translation_flag", label: "Translation required", description: "Destination authority requires certified translation.", check: (m) => m.translation_required === true && !m.translation_confirmed },
  { id: "duplicate_matter", label: "Possible duplicate matter", description: "Another matter exists with same client and document type within 30 days.", check: (m) => m.possible_duplicate === true },
];

export function checkFailurePatterns(matter: Record<string, unknown>): FailureCheckResult {
  const matched = PATTERNS.filter(p => p.check(matter));
  if (matched.length === 0) return { matched: false, patterns: [] };
  return {
    matched: true,
    patterns: matched.map(p => ({ id: p.id, label: p.label, description: p.description })),
    message: `Stop. This matter matches ${matched.length} previous failure pattern${matched.length > 1 ? "s" : ""}.`,
  };
}
