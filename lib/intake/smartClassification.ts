// Stage 2 — the single canonical Smart Intake classification truth.
//
// Consolidates the Stage 1 interpretation engine + optional AI extraction +
// explicit structured client selections into ONE normalized classification,
// under a strict precedence law. Services use a semantic state model
// (required / not_required / already_completed / unknown / contradictory) so
// "already notarized" is never treated as "needs notarization".
//
// Pure: no I/O. It classifies; it does not price or route.

import { interpretIntakeText, type IntakeConcept, type FactPolarity } from "./intakeInterpretation";

export type ServiceState =
  | "required"
  | "not_required"
  | "already_completed"
  | "unknown"
  | "contradictory";

export type Confidence = "high" | "medium" | "low";

export interface SmartIntakeClassification {
  documentType?: string;
  documentFamily?: string;
  documentCount: number;

  originJurisdiction?: string;
  destinationCountry?: string;
  destinationNormalization?: { from: string; to: string; confidence: Confidence };

  /** Signer physical location — DISTINCT from document origin jurisdiction. */
  signerLocation?: string;
  signerCount: number;

  notarization: ServiceState;
  ron: ServiceState;
  apostille: ServiceState;
  apostilleQuantity: number;
  authentication: ServiceState;
  translation: ServiceState;
  witness: ServiceState;
  mobile: ServiceState;
  courier: ServiceState;
  shipping: ServiceState;

  urgency: "normal" | "urgent" | "same_day" | "unknown";
  deadline?: string | null;

  explicitNegatives: string[];
  contradictions: string[];
  missingCriticalFacts: string[];
  manualReviewReasons: string[];

  classificationConfidence: Confidence;
  routingConfidence: Confidence;
}

/** Explicit structured client selections — the HIGHEST precedence source. */
export interface StructuredSelections {
  notarization?: boolean | "already_completed";
  ron?: boolean;
  apostille?: boolean;
  translation?: boolean;
  mobile?: boolean;
  documentType?: string;
  destinationCountry?: string;
  originState?: string;
  signerLocation?: string;
  documentCount?: number;
  signerCount?: number;
}

/** AI extraction — lower precedence than explicit client evidence. */
export interface AiExtraction {
  documentType?: string;
  country?: string;
  originState?: string;
  documentCount?: number;
  signerCount?: number;
  apostilleRequired?: boolean;
  translationNeeded?: boolean;
}

export interface ClassificationInput {
  text?: string;
  structured?: StructuredSelections;
  ai?: AiExtraction;
}

const FAMILY_RULES: Array<[RegExp, string]> = [
  [/power\s*of\s*attorney|attorney-?in-?fact|\bpoa\b/i, "power_of_attorney"],
  [/affidavit/i, "affidavit"],
  [/birth\s*certificate/i, "birth_certificate"],
  [/marriage\s*certificate/i, "marriage_certificate"],
  [/death\s*certificate/i, "death_certificate"],
  [/divorce/i, "divorce_record"],
  [/fbi|background\s*check|criminal\s*record/i, "fbi_background_check"],
  [/transcript|diploma|university|college/i, "school_transcript"],
  [/deed|title|escritura/i, "real_estate_document"],
  [/articles?\s*of\s*incorporation|corporate\s*resolution|bylaws/i, "corporate_document"],
  [/contract|agreement/i, "business_agreement"],
  [/court\s*(order|document|judgment)/i, "court_document"],
  [/certified\s*copy/i, "certified_copy"],
];

function documentFamilyOf(docType?: string, text?: string): string | undefined {
  const hay = `${docType ?? ""} ${text ?? ""}`;
  for (const [re, fam] of FAMILY_RULES) if (re.test(hay)) return fam;
  return docType ? "unknown" : undefined;
}

const COUNTRY_ALIASES: Record<string, { to: string; confidence: Confidence }> = {
  columbia: { to: "Colombia", confidence: "medium" },
};

function normalizeCountry(raw?: string): { value?: string; norm?: { from: string; to: string; confidence: Confidence } } {
  if (!raw) return {};
  const key = raw.trim().toLowerCase();
  const alias = COUNTRY_ALIASES[key];
  if (alias) return { value: alias.to, norm: { from: raw, to: alias.to, confidence: alias.confidence } };
  return { value: raw };
}

function polarityToState(p: FactPolarity, isContradiction: boolean): ServiceState {
  if (isContradiction) return "contradictory";
  switch (p) {
    case "positive": return "required";
    case "negative": return "not_required";
    case "already_completed": return "already_completed";
    default: return "unknown";
  }
}

function resolveService(
  concept: IntakeConcept,
  interp: ReturnType<typeof interpretIntakeText>,
  structured: boolean | "already_completed" | undefined,
  ai: boolean | undefined,
): ServiceState {
  const isContra = interp.contradictions.includes(concept);
  const fromText = polarityToState(interp.concepts[concept].polarity, isContra);

  if (structured === "already_completed") return "already_completed";
  if (structured === true) return "required";
  if (structured === false) return "not_required";
  if (fromText !== "unknown") return fromText;
  if (ai === true) return "required";
  if (ai === false) return "not_required";
  return "unknown";
}

export function classifyIntake(input: ClassificationInput): SmartIntakeClassification {
  const text = input.text ?? "";
  const s = input.structured ?? {};
  const ai = input.ai ?? {};
  const interp = interpretIntakeText(text);

  const notarization = resolveService("notarization", interp, s.notarization, undefined);
  const ron = resolveService("ron", interp, s.ron, undefined);
  const apostille = resolveService("apostille", interp, s.apostille, ai.apostilleRequired);
  const translation = resolveService("translation", interp, s.translation, ai.translationNeeded);
  const mobile = resolveService("mobile", interp, s.mobile, undefined);
  const authentication = resolveService("authentication", interp, undefined, undefined);
  const witness = resolveService("witness", interp, undefined, undefined);
  const courier = resolveService("courier", interp, undefined, undefined);
  const shipping = resolveService("shipping", interp, undefined, undefined);

  const documentType = s.documentType ?? ai.documentType ?? undefined;
  const documentFamily = documentFamilyOf(documentType, text);

  const rawDest = s.destinationCountry ?? ai.country;
  const dest = normalizeCountry(rawDest);

  const originJurisdiction = s.originState ?? ai.originState ?? undefined;
  const signerLocation = s.signerLocation ?? undefined;

  const documentCount = Math.max(1, s.documentCount ?? interp.documentCount.value ?? ai.documentCount ?? 1);
  const signerCount = Math.max(1, s.signerCount ?? interp.signerCount.value ?? ai.signerCount ?? 1);
  const apostilleQuantity = Math.max(1, interp.apostilleQuantity.value ?? 1);

  const urgency: SmartIntakeClassification["urgency"] =
    interp.concepts.sameDay.polarity === "positive"
      ? "same_day"
      : interp.concepts.rush.polarity === "positive"
        ? "urgent"
        : "unknown";

  const explicitNegatives = (Object.keys(interp.concepts) as IntakeConcept[])
    .filter((c) => interp.concepts[c].polarity === "negative")
    .map((c) => `${c}:not_required`);

  const missingCriticalFacts: string[] = [];
  if (!documentType) missingCriticalFacts.push("documentType");
  if (!dest.value) missingCriticalFacts.push("destinationCountry");

  const manualReviewReasons: string[] = [];
  if (interp.contradictions.length) manualReviewReasons.push("contradictory_service_statements");
  if (apostille === "unknown" && dest.value && dest.value !== "United States") {
    manualReviewReasons.push("apostille_undetermined_for_international_destination");
  }

  const classificationConfidence: Confidence = missingCriticalFacts.length === 0 ? "high" : missingCriticalFacts.length === 1 ? "medium" : "low";
  const routingConfidence: Confidence = dest.value ? (apostille === "unknown" ? "medium" : "high") : "low";

  return {
    documentType,
    documentFamily,
    documentCount,
    originJurisdiction,
    destinationCountry: dest.value,
    destinationNormalization: dest.norm,
    signerLocation,
    signerCount,
    notarization,
    ron,
    apostille,
    apostilleQuantity,
    authentication,
    translation,
    witness,
    mobile,
    courier,
    shipping,
    urgency,
    deadline: null,
    explicitNegatives,
    contradictions: interp.contradictions.map(String),
    missingCriticalFacts,
    manualReviewReasons,
    classificationConfidence,
    routingConfidence,
  };
}
