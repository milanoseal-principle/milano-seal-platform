export interface TranslationCoordinationEntry {
  id: string;
  label: string;
  publicSummary: string;
  requiresManualReview: boolean;
}

export const translationCoordinationRegistry: TranslationCoordinationEntry[] = [
  {
    id: "certified-translation",
    label: "Certified Translation Coordination",
    publicSummary:
      "Coordination of certified translation for documents intended for receiving authorities.",
    requiresManualReview: false,
  },
  {
    id: "accuracy-affidavit",
    label: "Translation Accuracy Affidavit",
    publicSummary:
      "Support for translation accuracy affidavits where a receiving authority requires one.",
    requiresManualReview: false,
  },
  {
    id: "authority-specific",
    label: "Receiving-Authority Specific Translation",
    publicSummary:
      "Review of receiving-authority specific translation requirements.",
    requiresManualReview: true,
  },
];

export function getTranslationCoordination(
  id: string
): TranslationCoordinationEntry | undefined {
  return translationCoordinationRegistry.find((entry) => entry.id === id);
}
