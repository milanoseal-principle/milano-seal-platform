import type { TranslationStatus } from "./types";

export interface TranslationInput {
  documentLanguage?: string;
  destinationLanguage?: string;
  clientProvidedTranslation?: boolean;
  receivingAuthoritySpecified?: boolean;
}

export interface TranslationEvaluation {
  status: TranslationStatus;
  requiresManualReview: boolean;
  notes: string[];
}

export function evaluateTranslation(input: TranslationInput): TranslationEvaluation {
  const notes: string[] = [];

  if (!input.documentLanguage || !input.destinationLanguage) {
    notes.push("Language information incomplete — manual review required; do not finalize.");
    return { status: "unknown", requiresManualReview: true, notes };
  }

  if (input.clientProvidedTranslation) {
    notes.push("Client-provided translation — verify accuracy affidavit needs with receiving authority.");
    return { status: "client_provided", requiresManualReview: true, notes };
  }

  const docLang = input.documentLanguage.trim().toLowerCase();
  const destLang = input.destinationLanguage.trim().toLowerCase();

  if (docLang === destLang) {
    notes.push("Document and destination language match — translation likely not needed.");
    return { status: "not_needed", requiresManualReview: false, notes };
  }

  if (input.receivingAuthoritySpecified) {
    notes.push("Receiving-authority specific translation requirements apply.");
    return { status: "receiving_authority_specific", requiresManualReview: true, notes };
  }

  notes.push("Languages differ — certified translation likely needed; partner coordination may apply.");
  return { status: "likely_needed", requiresManualReview: true, notes };
}
