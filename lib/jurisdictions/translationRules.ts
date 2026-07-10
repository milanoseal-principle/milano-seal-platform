import type { TranslationRule } from "./types";
import { getCountryByIso } from "./countryRegistry";

// Operational translation expectations. NOT guarantees. Unknown destinations
// default to manual review. Certified/sworn translation requirements vary by
// document type and receiving authority — always verify.

const TRANSLATION_RULES: TranslationRule[] = [
  {
    destinationIso: "IT",
    translationExpected: "likely",
    certifiedTranslationNote:
      "Certified Italian translation often expected — verify with receiving authority.",
    requiresManualReview: false,
  },
  {
    destinationIso: "ES",
    translationExpected: "likely",
    certifiedTranslationNote: "Certified Spanish translation often expected.",
    requiresManualReview: false,
  },
  {
    destinationIso: "BR",
    translationExpected: "likely",
    certifiedTranslationNote: "Sworn (juramentada) translation often expected — verify.",
    requiresManualReview: false,
  },
  {
    destinationIso: "JP",
    translationExpected: "sometimes",
    certifiedTranslationNote: "Translation expectations vary — verify per authority.",
    requiresManualReview: true,
  },
];

export function getTranslationRule(destinationIso: string): TranslationRule {
  const target = destinationIso.trim().toUpperCase();
  const found = TRANSLATION_RULES.find(
    (r) => r.destinationIso.toUpperCase() === target,
  );
  if (found) return found;

  const known = getCountryByIso(target);
  return {
    destinationIso: known?.iso ?? target,
    translationExpected: "unknown",
    certifiedTranslationNote:
      "No sourced translation rule for this destination — manual review required.",
    requiresManualReview: true,
  };
}

export function listTranslationRules(): TranslationRule[] {
  return [...TRANSLATION_RULES];
}
