// Generalized deterministic intake interpretation engine.
//
// Turns a free-text client description into a normalized evidence model. Each
// service concept is resolved to a polarity (positive / negative /
// already_completed / unknown) with confidence + source, so an explicit client
// statement (esp. a negative) can never be overridden by weak inference.
//
// Punctuation terminates negation scope: "No apostille, notarization required"
// yields apostille=negative AND notarization=positive — not both negated.
//
// This is the single interpretation truth used by quickTags/matterAnalysis; it
// does not price, classify documents, or route — those are separate layers.

export type FactPolarity = "positive" | "negative" | "already_completed" | "unknown";
export type FactSource =
  | "explicit_client"
  | "structured_selection"
  | "document"
  | "ai"
  | "heuristic"
  | "default";

export interface IntakeFact<T> {
  value: T | null;
  polarity: FactPolarity;
  confidence: "high" | "medium" | "low";
  source: FactSource;
  evidence?: string;
}

export type IntakeConcept =
  | "notarization"
  | "ron"
  | "apostille"
  | "authentication"
  | "translation"
  | "witness"
  | "mobile"
  | "courier"
  | "shipping"
  | "rush"
  | "sameDay";

export interface IntakeInterpretation {
  concepts: Record<IntakeConcept, IntakeFact<boolean>>;
  apostilleQuantity: IntakeFact<number>;
  documentCount: IntakeFact<number>;
  signerCount: IntakeFact<number>;
  /** Concepts where the text asserted both a positive and a negative. */
  contradictions: IntakeConcept[];
}

// Keyword patterns per concept. A concept is "mentioned" in a clause if its
// pattern matches; polarity is then decided by the clause's negation/already cues.
// Prefix-based patterns so inflections/plurals match (apostille/apostilles/
// apostilled; notary/notarize/notarization; translate/translation).
const CONCEPT_PATTERNS: Record<IntakeConcept, RegExp> = {
  notarization: /\bnotar/i, // notary, notarize, notarization, notarial, notarized
  ron: /\b(remote\s*online\s*notar|remote\s*notar|\bron\b|video\s*notar|online\s*notar|notariz\w*\s*remot|remot\w*\s*notar)/i,
  apostille: /\bapostill/i, // apostille(s), apostilled, apostilla
  authentication: /\b(authenticat|legaliza[zc]|consular|embassy\s*legaliz)/i,
  translation: /\b(translat|traduc|traduzion|übersetz)/i,
  witness: /\bwitness/i,
  mobile: /\b(mobile\s*notar|come\s*to\s*(?:my|the)|at\s*my\s*(?:house|home|office)|in[-\s]?person\s*notar|travel(?:ing)?\s*notar)/i,
  courier: /\b(courier|pick\s*up|pickup|drop\s*off)/i,
  shipping: /\b(ship\b|shipp\w*|mail\b|fedex|ups\b|dhl|deliver\w*\s*to|send\s*(?:it|them)\s*to)/i,
  rush: /\b(rush|urgent|expedit|asap|priority)\b/i,
  sameDay: /\b(same[-\s]?day|today|tonight|this\s*(?:morning|afternoon|evening)|right\s*now)\b/i,
};

const CONCEPT_LIST = Object.keys(CONCEPT_PATTERNS) as IntakeConcept[];

// Negation cues (English + a few common ES/IT/FR/DE). Applied within one clause.
const NEG_BEFORE =
  /\b(no|not|without|non|sin|sans|kein\w*|nessun\w*|don'?t|doesn'?t|do\s+not|does\s+not|never|neither|nor|skip|avoid)\b/i;
const NEG_AFTER =
  /\b(not\s+(?:needed|required|necessary|applicable)|isn'?t\s+(?:needed|required)|no\s+longer\s+(?:needed|required)|unnecessary|n[/']?a)\b/i;
const ALREADY =
  /\b(already|previously|has\s+been|have\s+been|was|were|is\s+done|completed|prior)\b/i;

const QUANTITY_BEFORE_APOSTILLE = /(\d+)\s*(?:apostille|apostilla)/i;
const DOC_COUNT_RE = /(\d+)\s*(?:document|doc|documenti|documentos|certificate|copies|copy)\b/i;
const SIGNER_RE = /(\d+)\s*(?:signer|signator|firmatari|firmant|firmante|signatario)/i;

function splitClauses(text: string): string[] {
  return text
    .split(/[.,;!?\n]+|\b(?:but|however|and then)\b/i)
    .map((c) => c.trim())
    .filter(Boolean);
}

// Position-aware polarity: negation/already cues only apply within the window
// immediately around a concept keyword, and the before-window is cut at the
// previous concept keyword so "no apostille … notarization" does not let "no"
// bleed onto notarization.
function conceptPolarity(clause: string, concept: IntakeConcept): FactPolarity | null {
  const m = CONCEPT_PATTERNS[concept].exec(clause);
  if (!m) return null;
  const start = m.index;
  const end = m.index + m[0].length;

  // Nearest preceding OTHER concept keyword end (to cut negation bleed).
  let prevConceptEnd = 0;
  let nextConceptStart = clause.length;
  for (const other of CONCEPT_LIST) {
    if (other === concept) continue;
    const om = CONCEPT_PATTERNS[other].exec(clause);
    if (!om) continue;
    const oe = om.index + om[0].length;
    if (oe <= start && oe > prevConceptEnd) prevConceptEnd = oe;
    if (om.index >= end && om.index < nextConceptStart) nextConceptStart = om.index;
  }

  const before = clause.slice(Math.max(prevConceptEnd, start - 24), start);
  const after = clause.slice(end, Math.min(nextConceptStart, end + 24));

  if (ALREADY.test(before)) return "already_completed";
  if (NEG_BEFORE.test(before) || NEG_AFTER.test(after)) return "negative";
  return "positive";
}

function emptyFact<T>(): IntakeFact<T> {
  return { value: null, polarity: "unknown", confidence: "low", source: "default" };
}

/**
 * Deterministically interpret an intake description into normalized facts.
 * Pure: no I/O, no mutation of the input.
 */
export function interpretIntakeText(text: string): IntakeInterpretation {
  const concepts = {} as Record<IntakeConcept, IntakeFact<boolean>>;
  (Object.keys(CONCEPT_PATTERNS) as IntakeConcept[]).forEach((c) => {
    concepts[c] = emptyFact<boolean>();
  });
  const result: IntakeInterpretation = {
    concepts,
    apostilleQuantity: emptyFact<number>(),
    documentCount: emptyFact<number>(),
    signerCount: emptyFact<number>(),
    contradictions: [],
  };

  const t = (text || "").trim();
  if (!t) return result;

  const clauses = splitClauses(t);

  // Track observed polarities per concept across clauses to detect contradictions.
  const seen: Record<string, Set<FactPolarity>> = {};

  for (const clause of clauses) {
    for (const concept of CONCEPT_LIST) {
      const pol = conceptPolarity(clause, concept);
      if (pol === null) continue;
      (seen[concept] ??= new Set()).add(pol);
      const prev = result.concepts[concept];
      // First real observation, or upgrade an explicit negative/already over a
      // prior positive from a different clause is handled by contradiction logic.
      const fact: IntakeFact<boolean> = {
        value: pol === "positive" ? true : pol === "negative" ? false : false,
        polarity: pol,
        confidence: "high",
        source: "explicit_client",
        evidence: clause,
      };
      if (prev.polarity === "unknown") result.concepts[concept] = fact;
      else if (prev.polarity !== pol) {
        // Conflicting explicit statements → mark unknown, record contradiction.
        result.concepts[concept] = {
          value: null,
          polarity: "unknown",
          confidence: "low",
          source: "explicit_client",
          evidence: `${prev.evidence ?? ""} | ${clause}`,
        };
      }
    }
  }

  for (const concept of Object.keys(CONCEPT_PATTERNS) as IntakeConcept[]) {
    const pols = seen[concept];
    if (pols && pols.has("positive") && (pols.has("negative") || pols.has("already_completed"))) {
      result.contradictions.push(concept);
    }
  }

  const aq = t.match(QUANTITY_BEFORE_APOSTILLE);
  if (aq) {
    result.apostilleQuantity = {
      value: Math.max(1, parseInt(aq[1], 10)),
      polarity: "positive",
      confidence: "high",
      source: "explicit_client",
      evidence: aq[0],
    };
  }
  const dm = t.match(DOC_COUNT_RE);
  if (dm) {
    result.documentCount = {
      value: Math.max(1, parseInt(dm[1], 10)),
      polarity: "positive",
      confidence: "high",
      source: "explicit_client",
      evidence: dm[0],
    };
  }
  const sm = t.match(SIGNER_RE);
  if (sm) {
    result.signerCount = {
      value: Math.max(1, parseInt(sm[1], 10)),
      polarity: "positive",
      confidence: "high",
      source: "explicit_client",
      evidence: sm[0],
    };
  }

  return result;
}

// ── Convenience booleans for the legacy MatterAnalysis flags ────────────────

/** True only when a service is affirmatively requested (positive polarity). */
export function isPositive(f: IntakeFact<boolean>): boolean {
  return f.polarity === "positive" && f.value === true;
}

/** True when the client explicitly negated OR already-completed a service. */
export function isSuppressed(f: IntakeFact<boolean>): boolean {
  return f.polarity === "negative" || f.polarity === "already_completed";
}
