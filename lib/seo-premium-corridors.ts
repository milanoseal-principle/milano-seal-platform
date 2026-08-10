export type PremiumCorridorSlug =
  | "italy"
  | "switzerland"
  | "germany"
  | "france"
  | "spain";

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
      "U.S. documents for Italy apostille",
      "Italy power of attorney apostille",
      "apostille service for Italian lawyer",
      "U.S. document execution for Italy",
    ],
    nativeLanguageQuery: "apostille documenti USA per l'Italia",
    professionalCta: "Coordinate a U.S. Matter for Italy",
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
      "U.S. documents for Switzerland apostille",
      "Swiss lawyer U.S. apostille service",
      "corporate document apostille Switzerland",
      "private client apostille Switzerland",
    ],
    nativeLanguageQuery: "US-Dokumente Apostille Schweiz",
    professionalCta: "Coordinate a U.S. Matter for Switzerland",
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
      "U.S. documents for Germany apostille",
      "German lawyer U.S. apostille service",
      "corporate document apostille Germany",
      "power of attorney apostille Germany",
    ],
    nativeLanguageQuery: "US-Dokumente Apostille Deutschland",
    professionalCta: "Coordinate a U.S. Matter for Germany",
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
      "U.S. documents for France apostille",
      "French notaire U.S. document apostille",
      "power of attorney apostille France",
      "inheritance documents apostille France",
    ],
    nativeLanguageQuery: "apostille documents américains pour la France",
    professionalCta: "Coordinate a U.S. Matter for France",
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
      "U.S. documents for Spain apostille",
      "Spanish lawyer U.S. apostille service",
      "power of attorney apostille Spain",
      "U.S. documents for Spanish property transaction",
    ],
    nativeLanguageQuery: "apostilla documentos de Estados Unidos para España",
    professionalCta: "Coordinate a U.S. Matter for Spain",
  },
];

export function getPremiumCorridor(slug: string) {
  return PREMIUM_CORRIDORS.find((corridor) => corridor.slug === slug) ?? null;
}

export function isPremiumCorridor(slug: string): slug is PremiumCorridorSlug {
  return PREMIUM_CORRIDORS.some((corridor) => corridor.slug === slug);
}
