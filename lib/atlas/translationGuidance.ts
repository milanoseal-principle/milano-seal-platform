export type TranslationLanguage = "Portuguese" | "Spanish" | "Italian" | "French";

export type TranslationGuidanceEntry = {
  language: TranslationLanguage;
  guidance: string;
  jurisdictions: string[];
};

export const TRANSLATION_GUIDANCE: TranslationGuidanceEntry[] = [
  {
    language: "Portuguese",
    guidance: "Portugal and Brazil document use may require certified or sworn translation depending on the receiving authority, document type, and jurisdiction.",
    jurisdictions: ["portugal", "brazil"],
  },
  {
    language: "Spanish",
    guidance: "Spain, Mexico, and Latin American jurisdictions may require Spanish translation, sworn translation, or authority-specific formatting depending on document type and receiving authority.",
    jurisdictions: ["spain", "mexico", "argentina", "colombia", "chile"],
  },
  {
    language: "Italian",
    guidance: "Italian matters may require certified translations, sworn translations, or consulate and comune-specific handling depending on document type and receiving authority.",
    jurisdictions: ["italy"],
  },
  {
    language: "French",
    guidance: "French-speaking jurisdictions may require French translations, sworn translations, or receiving-authority review depending on document type and destination.",
    jurisdictions: ["france"],
  },
];
