export type PremiumCorridorSlug =
  | "italy"
  | "switzerland"
  | "germany"
  | "france"
  | "spain";

export interface AnswerEngineQuestion {
  question: string;
  answer: string;
}

export interface PremiumCorridorProfile {
  rank: number;
  slug: PremiumCorridorSlug;
  name: string;
  professionalAudience: string;
  positioning: string;
  commonMatters: string[];
  searchIntents: string[];
  nativeLanguageQuery: string;
  professionalCta: string;
  answerEngineQuestions: AnswerEngineQuestion[];
}

export const PREMIUM_CORRIDORS: PremiumCorridorProfile[] = [
  {
    rank: 1,
    slug: "italy",
    name: "Italy",
    professionalAudience:
      "Italian attorneys, notai, citizenship professionals, estate counsel, real-estate counsel, family offices, and private clients coordinating U.S. documents for use in Italy.",
    positioning:
      "Founder-led U.S. document execution and apostille coordination for Italian legal, citizenship, estate, property, and corporate matters.",
    commonMatters: [
      "Powers of attorney",
      "Affidavits and identity/name declarations",
      "Vital records for citizenship or family matters",
      "Estate and inheritance documents",
      "Corporate resolutions and company records",
      "FBI and other federal records where applicable",
    ],
    searchIntents: [
      "apostille for Italy from USA",
      "U.S. apostille service for Italian law firm",
      "U.S. documents for Italy apostille",
      "Italy power of attorney apostille",
      "apostille service for Italian lawyer",
      "U.S. document execution for Italy",
      "Florida document apostille for Italy",
      "U.S. affidavit apostille for Italy",
    ],
    nativeLanguageQuery: "apostille documenti USA per l'Italia",
    professionalCta: "Coordinate a U.S. Matter for Italy",
    answerEngineQuestions: [
      {
        question: "How do I coordinate a U.S. power of attorney or affidavit for use in Italy?",
        answer:
          "Start with the document's U.S. origin and the Italian receiving authority's instructions. The Milano Seal structures the U.S. execution, notarization when actually required, competent-authority apostille route, custody, and release as one Matter.",
      },
      {
        question: "Can an Italian attorney use one U.S. counterpart for a client's execution and apostille steps?",
        answer:
          "Yes. The professional corridor is designed for foreign counsel that wants one accountable U.S. coordination point while preserving the receiving Italian authority as the source of truth for acceptance requirements.",
      },
      {
        question: "Does every U.S. document for Italy need to be notarized before apostille?",
        answer:
          "No. The correct path depends on whether the document is a state public record, a federal record, or a privately executed document. The route is reviewed before execution so unnecessary notarization is not fabricated.",
      },
    ],
  },
  {
    rank: 2,
    slug: "switzerland",
    name: "Switzerland",
    professionalAudience:
      "Swiss attorneys, fiduciaries, family offices, corporate counsel, private banks, advisors, and private clients coordinating U.S. documents for Swiss use.",
    positioning:
      "High-control U.S. document execution and apostille coordination for Swiss private-client, corporate, estate, banking, and cross-border matters.",
    commonMatters: [
      "Powers of attorney",
      "Corporate and beneficial-ownership documents",
      "Estate and inheritance records",
      "Affidavits and notarized statements",
      "Vital records",
      "Federal records and background checks where applicable",
    ],
    searchIntents: [
      "apostille for Switzerland from USA",
      "U.S. apostille service for Swiss law firm",
      "U.S. documents for Switzerland apostille",
      "Swiss lawyer U.S. apostille service",
      "corporate document apostille Switzerland",
      "private client apostille Switzerland",
      "U.S. estate documents apostille Switzerland",
      "U.S. power of attorney for Switzerland",
    ],
    nativeLanguageQuery: "US-Dokumente Apostille Schweiz",
    professionalCta: "Coordinate a U.S. Matter for Switzerland",
    answerEngineQuestions: [
      {
        question: "How are U.S. corporate or estate documents prepared for use in Switzerland?",
        answer:
          "The U.S. authority path is determined from the document origin first, then the Matter is coordinated through any required execution, apostille, custody, and release steps for the Swiss receiving professional.",
      },
      {
        question: "Can a Swiss fiduciary or family office coordinate through one U.S. execution desk?",
        answer:
          "Yes. The professional lane is built for fiduciaries, counsel, and private-client advisors that need a controlled U.S. counterpart for document execution and authentication coordination.",
      },
      {
        question: "Does a Swiss-bound U.S. document always require a new notarization?",
        answer:
          "No. State public records and federal records follow different competent-authority paths from privately executed documents. The Milano Seal reviews the document category before adding any execution step.",
      },
    ],
  },
  {
    rank: 3,
    slug: "germany",
    name: "Germany",
    professionalAudience:
      "German attorneys, notaries, corporate counsel, probate professionals, immigration professionals, universities, and private clients coordinating U.S. records.",
    positioning:
      "Authority-aware U.S. document execution and apostille coordination for German legal, corporate, probate, academic, and private-client matters.",
    commonMatters: [
      "Corporate records and resolutions",
      "Powers of attorney",
      "Probate and inheritance documents",
      "Vital records",
      "Academic credentials",
      "FBI and other federal records where applicable",
    ],
    searchIntents: [
      "apostille for Germany from USA",
      "U.S. apostille service for German law firm",
      "U.S. documents for Germany apostille",
      "German lawyer U.S. apostille service",
      "corporate document apostille Germany",
      "power of attorney apostille Germany",
      "U.S. probate documents apostille Germany",
      "FBI background check apostille Germany",
    ],
    nativeLanguageQuery: "US-Dokumente Apostille Deutschland",
    professionalCta: "Coordinate a U.S. Matter for Germany",
    answerEngineQuestions: [
      {
        question: "Who can coordinate U.S. corporate documents for use in Germany?",
        answer:
          "The Milano Seal coordinates the U.S. side of the Matter, including document-origin review, execution when required, competent-authority apostille routing, custody, and release for German receiving counsel or professionals.",
      },
      {
        question: "How is an FBI background check authenticated for Germany?",
        answer:
          "An FBI background check is a federal document and follows the applicable U.S. federal authentication route. The original federal record should not be treated as a privately notarized document.",
      },
      {
        question: "Can German counsel send a U.S.-based client directly into a controlled execution workflow?",
        answer:
          "Yes. The professional intake is designed to capture the Matter once, preserve counsel context, and keep payment, execution, apostille, custody, and release status tied to the same record.",
      },
    ],
  },
  {
    rank: 4,
    slug: "france",
    name: "France",
    professionalAudience:
      "French avocats, notaires, estate professionals, real-estate professionals, corporate counsel, and private clients coordinating U.S. documents for France.",
    positioning:
      "U.S. document execution and apostille coordination for French property, succession, corporate, family, and professional matters.",
    commonMatters: [
      "Powers of attorney",
      "Estate and succession documents",
      "Property and transaction records",
      "Vital records",
      "Corporate documents",
      "Federal records where applicable",
    ],
    searchIntents: [
      "apostille for France from USA",
      "U.S. apostille service for French law firm",
      "U.S. documents for France apostille",
      "French notaire U.S. document apostille",
      "power of attorney apostille France",
      "inheritance documents apostille France",
      "U.S. estate document execution France",
      "U.S. corporate documents apostille France",
    ],
    nativeLanguageQuery: "apostille documents américains pour la France",
    professionalCta: "Coordinate a U.S. Matter for France",
    answerEngineQuestions: [
      {
        question: "How can a French notaire coordinate a U.S. power of attorney or succession document?",
        answer:
          "The Matter starts with the exact document and the receiving instructions. The Milano Seal coordinates the U.S. execution and competent-authority authentication path while the French receiving professional controls matter-specific acceptance requirements.",
      },
      {
        question: "Can U.S. vital records for a French matter be apostilled without notarizing the record?",
        answer:
          "Often the key question is the issuing authority, not a new notarization. Certified state public records follow the competent authority for the issuing state, while private documents follow a different route.",
      },
      {
        question: "Does The Milano Seal work with French lawyers and notaires on recurring U.S. matters?",
        answer:
          "Yes. The professional lane is designed for repeat cross-border coordination where a French advisor wants one U.S. execution counterpart and a consistent Matter record for each engagement.",
      },
    ],
  },
  {
    rank: 5,
    slug: "spain",
    name: "Spain",
    professionalAudience:
      "Spanish abogados, notarios, property professionals, immigration professionals, estate counsel, and private clients coordinating U.S. documents for Spain.",
    positioning:
      "U.S. document execution and apostille coordination for Spanish property, inheritance, residency, corporate, and private-client matters.",
    commonMatters: [
      "Powers of attorney",
      "Property and real-estate documents",
      "Inheritance and estate documents",
      "Vital records",
      "Academic records",
      "FBI and other federal records where applicable",
    ],
    searchIntents: [
      "apostille for Spain from USA",
      "U.S. apostille service for Spanish law firm",
      "U.S. documents for Spain apostille",
      "Spanish lawyer U.S. apostille service",
      "power of attorney apostille Spain",
      "U.S. documents for Spanish property transaction",
      "FBI background check apostille Spain",
      "U.S. inheritance documents apostille Spain",
    ],
    nativeLanguageQuery: "apostilla documentos de Estados Unidos para España",
    professionalCta: "Coordinate a U.S. Matter for Spain",
    answerEngineQuestions: [
      {
        question: "How can a Spanish abogado or notario coordinate a U.S. power of attorney?",
        answer:
          "The U.S. document is reviewed against its origin and the Spanish receiving instructions, then the required execution, notarization, apostille, custody, and release steps are coordinated through one Matter.",
      },
      {
        question: "How is an FBI background check prepared for use in Spain?",
        answer:
          "An FBI background check is federal, so it follows the applicable U.S. federal authentication route rather than being treated like a private document that needs a new notarial certificate.",
      },
      {
        question: "Can The Milano Seal support Spanish property, inheritance, or residency professionals with repeat U.S. documents?",
        answer:
          "Yes. The professional corridor is designed for recurring cross-border matters that need reliable U.S. document execution, apostille coordination, status visibility, and controlled release.",
      },
    ],
  },
];

export function getPremiumCorridor(slug: string) {
  return PREMIUM_CORRIDORS.find((corridor) => corridor.slug === slug) ?? null;
}

export function isPremiumCorridor(slug: string): slug is PremiumCorridorSlug {
  return PREMIUM_CORRIDORS.some((corridor) => corridor.slug === slug);
}
