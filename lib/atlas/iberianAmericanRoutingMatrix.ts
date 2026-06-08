export type HagueStatus = "HAGUE" | "NON_HAGUE" | "MANUAL_REVIEW";

export type IberianAmericanCorridor = {
  countryKey: string;
  countryName: string;
  hagueStatus: HagueStatus;
  primaryLanguage: "Portuguese" | "Spanish" | "French" | "Italian" | "English";
  translationGuidance: string;
  commonDocumentFamilies: string[];
  nodeTypes: string[];
  publicSummary: string;
  operatorNotes?: string;
  sourceStatus: "VERIFIED" | "NEEDS_REVIEW" | "PLACEHOLDER";
};

export const IBERIAN_AMERICAN_CORRIDORS: IberianAmericanCorridor[] = [
  {
    countryKey: "portugal",
    countryName: "Portugal",
    hagueStatus: "HAGUE",
    primaryLanguage: "Portuguese",
    translationGuidance: "Portugal document use may require certified or sworn translation depending on receiving authority.",
    commonDocumentFamilies: ["Powers of Attorney", "Real Estate", "Citizenship", "Probate", "Corporate", "Banking"],
    nodeTypes: ["HAGUE", "APOSTILLE", "TRANSLATION_REVIEW", "REAL_ESTATE", "CITIZENSHIP", "CORPORATE", "PRIVATE_CLIENT"],
    publicSummary: "Portugal is a Hague Apostille Convention jurisdiction. Document use remains subject to document type, signer location, origin jurisdiction, translation expectations, and the receiving Portuguese authority.",
    sourceStatus: "VERIFIED",
  },
  {
    countryKey: "brazil",
    countryName: "Brazil",
    hagueStatus: "HAGUE",
    primaryLanguage: "Portuguese",
    translationGuidance: "Brazil document use may require Portuguese translation or sworn translation depending on authority.",
    commonDocumentFamilies: ["Powers of Attorney", "Corporate", "Real Estate", "Family", "Probate", "Academic", "Medical"],
    nodeTypes: ["HAGUE", "APOSTILLE", "TRANSLATION_REVIEW", "REAL_ESTATE", "CITIZENSHIP", "CORPORATE", "AUTHORITY_REVIEW"],
    publicSummary: "Brazil is a Hague Apostille Convention jurisdiction. Document use remains subject to document type, origin jurisdiction, signer location, sworn translation expectations, and the receiving Brazilian authority.",
    sourceStatus: "VERIFIED",
  },
  {
    countryKey: "spain",
    countryName: "Spain",
    hagueStatus: "HAGUE",
    primaryLanguage: "Spanish",
    translationGuidance: "Spain and Latin American jurisdictions may require Spanish translation, sworn translation, or authority-specific formatting.",
    commonDocumentFamilies: ["Powers of Attorney", "Real Estate", "Citizenship", "Corporate", "Probate"],
    nodeTypes: ["HAGUE", "APOSTILLE", "TRANSLATION_REVIEW", "REAL_ESTATE", "CITIZENSHIP", "CORPORATE"],
    publicSummary: "Spain is a Hague Apostille Convention jurisdiction. Document use remains subject to document type, origin jurisdiction, signer location, and the receiving Spanish authority.",
    sourceStatus: "VERIFIED",
  },
  {
    countryKey: "mexico",
    countryName: "Mexico",
    hagueStatus: "HAGUE",
    primaryLanguage: "Spanish",
    translationGuidance: "Mexico document use may require Spanish translation or sworn translation depending on receiving authority.",
    commonDocumentFamilies: ["Powers of Attorney", "Corporate", "Real Estate", "Family", "Probate"],
    nodeTypes: ["HAGUE", "APOSTILLE", "TRANSLATION_REVIEW", "REAL_ESTATE", "CORPORATE", "PRIVATE_CLIENT"],
    publicSummary: "Mexico is a Hague Apostille Convention jurisdiction. Document use remains subject to document type, origin jurisdiction, signer location, translation expectations, and the receiving Mexican authority.",
    sourceStatus: "VERIFIED",
  },
  {
    countryKey: "argentina",
    countryName: "Argentina",
    hagueStatus: "HAGUE",
    primaryLanguage: "Spanish",
    translationGuidance: "Argentina document use may require Spanish translation or sworn translation depending on receiving authority.",
    commonDocumentFamilies: ["Powers of Attorney", "Corporate", "Real Estate", "Family"],
    nodeTypes: ["HAGUE", "APOSTILLE", "TRANSLATION_REVIEW", "REAL_ESTATE", "CORPORATE"],
    publicSummary: "Argentina is a Hague Apostille Convention jurisdiction. Document use remains subject to document type, origin jurisdiction, signer location, and the receiving Argentine authority.",
    sourceStatus: "VERIFIED",
  },
  {
    countryKey: "colombia",
    countryName: "Colombia",
    hagueStatus: "HAGUE",
    primaryLanguage: "Spanish",
    translationGuidance: "Colombia document use may require Spanish translation depending on receiving authority.",
    commonDocumentFamilies: ["Powers of Attorney", "Corporate", "Family", "Probate"],
    nodeTypes: ["HAGUE", "APOSTILLE", "TRANSLATION_REVIEW", "CORPORATE", "AUTHORITY_REVIEW"],
    publicSummary: "Colombia is a Hague Apostille Convention jurisdiction. Document use remains subject to document type, origin jurisdiction, signer location, and the receiving Colombian authority.",
    sourceStatus: "VERIFIED",
  },
  {
    countryKey: "chile",
    countryName: "Chile",
    hagueStatus: "HAGUE",
    primaryLanguage: "Spanish",
    translationGuidance: "Chile document use may require Spanish translation depending on receiving authority.",
    commonDocumentFamilies: ["Powers of Attorney", "Corporate", "Real Estate", "Family"],
    nodeTypes: ["HAGUE", "APOSTILLE", "TRANSLATION_REVIEW", "REAL_ESTATE", "CORPORATE"],
    publicSummary: "Chile is a Hague Apostille Convention jurisdiction. Document use remains subject to document type, origin jurisdiction, signer location, and the receiving Chilean authority.",
    sourceStatus: "VERIFIED",
  },
];

export function getCorridorByKey(key: string): IberianAmericanCorridor | undefined {
  return IBERIAN_AMERICAN_CORRIDORS.find((c) => c.countryKey === key);
}
