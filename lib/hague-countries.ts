// HAGUE APOSTILLE COUNTRY LANGUAGE ROUTING
// Used by the Smart Matter Intake to surface translation guidance per destination.
// All notes are client-safe: we never assert guaranteed acceptance or legal finality.
// Receiving authority requirements are always confirmed before execution.

export interface CountryLanguageRouting {
  country: string;
  officialLanguages: string[];
  translationLikely: boolean;
  translationNote: string;
}

// Countries where the document language is English and translation is not typically required
const ENGLISH_LANGUAGE_COUNTRIES = new Set([
  "United Kingdom",
  "Ireland",
  "Australia",
  "New Zealand",
  "Singapore",
]);

const ROUTING_TABLE: Record<string, CountryLanguageRouting> = {
  Italy: {
    country: "Italy",
    officialLanguages: ["Italian"],
    translationLikely: true,
    translationNote:
      "Italian translation is typically required. Receiving authority requirements are confirmed before international release.",
  },
  Spain: {
    country: "Spain",
    officialLanguages: ["Spanish"],
    translationLikely: true,
    translationNote:
      "Spanish translation is typically required. Receiving authority requirements are confirmed before international release.",
  },
  France: {
    country: "France",
    officialLanguages: ["French"],
    translationLikely: true,
    translationNote:
      "French translation is typically required. Receiving authority requirements are confirmed before international release.",
  },
  Germany: {
    country: "Germany",
    officialLanguages: ["German"],
    translationLikely: true,
    translationNote:
      "German translation is typically required. Receiving authority requirements are confirmed before international release.",
  },
  Austria: {
    country: "Austria",
    officialLanguages: ["German"],
    translationLikely: true,
    translationNote:
      "German translation is typically required. Receiving authority requirements are confirmed before international release.",
  },
  Switzerland: {
    country: "Switzerland",
    officialLanguages: ["German", "French", "Italian"],
    translationLikely: true,
    translationNote:
      "Translation requirements vary by canton (German, French, or Italian). Target jurisdiction confirmed before international release.",
  },
  Portugal: {
    country: "Portugal",
    officialLanguages: ["Portuguese"],
    translationLikely: true,
    translationNote:
      "Portuguese translation is typically required. Receiving authority requirements are confirmed before international release.",
  },
  Brazil: {
    country: "Brazil",
    officialLanguages: ["Portuguese"],
    translationLikely: true,
    translationNote:
      "Portuguese (Brazilian) translation is typically required. Receiving authority requirements are confirmed before international release.",
  },
  Mexico: {
    country: "Mexico",
    officialLanguages: ["Spanish"],
    translationLikely: true,
    translationNote:
      "Spanish translation is typically required. Mexico is a Hague Convention member. Receiving authority requirements are confirmed before international release.",
  },
  Argentina: {
    country: "Argentina",
    officialLanguages: ["Spanish"],
    translationLikely: true,
    translationNote:
      "Spanish translation is typically required. Receiving authority requirements are confirmed before international release.",
  },
  Colombia: {
    country: "Colombia",
    officialLanguages: ["Spanish"],
    translationLikely: true,
    translationNote:
      "Spanish translation is typically required. Receiving authority requirements are confirmed before international release.",
  },
  Chile: {
    country: "Chile",
    officialLanguages: ["Spanish"],
    translationLikely: true,
    translationNote:
      "Spanish translation is typically required. Receiving authority requirements are confirmed before international release.",
  },
  Peru: {
    country: "Peru",
    officialLanguages: ["Spanish"],
    translationLikely: true,
    translationNote:
      "Spanish translation is typically required. Receiving authority requirements are confirmed before international release.",
  },
  Uruguay: {
    country: "Uruguay",
    officialLanguages: ["Spanish"],
    translationLikely: true,
    translationNote:
      "Spanish translation is typically required. Receiving authority requirements are confirmed before international release.",
  },
  Ecuador: {
    country: "Ecuador",
    officialLanguages: ["Spanish"],
    translationLikely: true,
    translationNote:
      "Spanish translation is typically required. Receiving authority requirements are confirmed before international release.",
  },
  Venezuela: {
    country: "Venezuela",
    officialLanguages: ["Spanish"],
    translationLikely: true,
    translationNote:
      "Spanish translation is typically required. Receiving authority requirements are confirmed before international release.",
  },
  Panama: {
    country: "Panama",
    officialLanguages: ["Spanish"],
    translationLikely: true,
    translationNote:
      "Spanish translation is typically required. Receiving authority requirements are confirmed before international release.",
  },
  "Costa Rica": {
    country: "Costa Rica",
    officialLanguages: ["Spanish"],
    translationLikely: true,
    translationNote:
      "Spanish translation is typically required. Receiving authority requirements are confirmed before international release.",
  },
  Greece: {
    country: "Greece",
    officialLanguages: ["Greek"],
    translationLikely: true,
    translationNote:
      "Greek translation is typically required. Receiving authority requirements are confirmed before international release.",
  },
  Netherlands: {
    country: "Netherlands",
    officialLanguages: ["Dutch"],
    translationLikely: true,
    translationNote:
      "Dutch translation is often required, though some authorities accept English. Receiving authority requirements are confirmed before international release.",
  },
  Belgium: {
    country: "Belgium",
    officialLanguages: ["French", "Dutch", "German"],
    translationLikely: true,
    translationNote:
      "Translation requirements depend on the receiving region (French, Dutch, or German). Target jurisdiction confirmed before international release.",
  },
  Luxembourg: {
    country: "Luxembourg",
    officialLanguages: ["French", "German", "Luxembourgish"],
    translationLikely: true,
    translationNote:
      "French or German translation is typically required. Receiving authority requirements are confirmed before international release.",
  },
  Poland: {
    country: "Poland",
    officialLanguages: ["Polish"],
    translationLikely: true,
    translationNote:
      "Polish translation is typically required. Receiving authority requirements are confirmed before international release.",
  },
  Romania: {
    country: "Romania",
    officialLanguages: ["Romanian"],
    translationLikely: true,
    translationNote:
      "Romanian translation is typically required. Receiving authority requirements are confirmed before international release.",
  },
  Hungary: {
    country: "Hungary",
    officialLanguages: ["Hungarian"],
    translationLikely: true,
    translationNote:
      "Hungarian translation is typically required. Receiving authority requirements are confirmed before international release.",
  },
  "Czech Republic": {
    country: "Czech Republic",
    officialLanguages: ["Czech"],
    translationLikely: true,
    translationNote:
      "Czech translation is typically required. Receiving authority requirements are confirmed before international release.",
  },
  Sweden: {
    country: "Sweden",
    officialLanguages: ["Swedish"],
    translationLikely: true,
    translationNote:
      "Swedish translation may be required. Some Swedish authorities accept English. Receiving authority requirements are confirmed before international release.",
  },
  Norway: {
    country: "Norway",
    officialLanguages: ["Norwegian"],
    translationLikely: true,
    translationNote:
      "Norwegian translation may be required. Receiving authority requirements are confirmed before international release.",
  },
  Denmark: {
    country: "Denmark",
    officialLanguages: ["Danish"],
    translationLikely: true,
    translationNote:
      "Danish translation may be required. Receiving authority requirements are confirmed before international release.",
  },
  Finland: {
    country: "Finland",
    officialLanguages: ["Finnish", "Swedish"],
    translationLikely: true,
    translationNote:
      "Finnish or Swedish translation may be required. Receiving authority requirements are confirmed before international release.",
  },
  Japan: {
    country: "Japan",
    officialLanguages: ["Japanese"],
    translationLikely: true,
    translationNote:
      "Japanese translation is typically required. Receiving authority requirements are confirmed before international release.",
  },
  China: {
    country: "China",
    officialLanguages: ["Mandarin Chinese"],
    translationLikely: true,
    translationNote:
      "Simplified Chinese translation is typically required. Receiving authority requirements are confirmed before international release.",
  },
  "Hong Kong": {
    country: "Hong Kong",
    officialLanguages: ["Chinese", "English"],
    translationLikely: false,
    translationNote:
      "English documents are often accepted in Hong Kong. Translation requirements are confirmed before international release.",
  },
  "South Korea": {
    country: "South Korea",
    officialLanguages: ["Korean"],
    translationLikely: true,
    translationNote:
      "Korean translation is typically required. Receiving authority requirements are confirmed before international release.",
  },
  India: {
    country: "India",
    officialLanguages: ["Hindi", "English"],
    translationLikely: false,
    translationNote:
      "English is an official language of India. Translation requirements vary by state and authority. Confirmed before international release.",
  },
  "United Arab Emirates": {
    country: "United Arab Emirates",
    officialLanguages: ["Arabic"],
    translationLikely: true,
    translationNote:
      "Arabic translation is typically required. Receiving authority requirements are confirmed before international release.",
  },
  "Saudi Arabia": {
    country: "Saudi Arabia",
    officialLanguages: ["Arabic"],
    translationLikely: true,
    translationNote:
      "Arabic translation is typically required. Receiving authority requirements are confirmed before international release.",
  },
  Qatar: {
    country: "Qatar",
    officialLanguages: ["Arabic"],
    translationLikely: true,
    translationNote:
      "Arabic translation is typically required. Receiving authority requirements are confirmed before international release.",
  },
  Israel: {
    country: "Israel",
    officialLanguages: ["Hebrew", "Arabic"],
    translationLikely: true,
    translationNote:
      "Hebrew translation is typically required. Receiving authority requirements are confirmed before international release.",
  },
  Turkey: {
    country: "Turkey",
    officialLanguages: ["Turkish"],
    translationLikely: true,
    translationNote:
      "Turkish translation is typically required. Receiving authority requirements are confirmed before international release.",
  },
  "United Kingdom": {
    country: "United Kingdom",
    officialLanguages: ["English"],
    translationLikely: false,
    translationNote:
      "English documents are accepted without translation. Receiving authority requirements are confirmed before international release.",
  },
  Ireland: {
    country: "Ireland",
    officialLanguages: ["English", "Irish"],
    translationLikely: false,
    translationNote:
      "English documents are generally accepted without translation. Receiving authority requirements are confirmed before international release.",
  },
  Australia: {
    country: "Australia",
    officialLanguages: ["English"],
    translationLikely: false,
    translationNote:
      "English documents are accepted without translation. Receiving authority requirements are confirmed before international release.",
  },
  "New Zealand": {
    country: "New Zealand",
    officialLanguages: ["English", "Māori"],
    translationLikely: false,
    translationNote:
      "English documents are accepted without translation. Receiving authority requirements are confirmed before international release.",
  },
  Singapore: {
    country: "Singapore",
    officialLanguages: ["English", "Mandarin", "Malay", "Tamil"],
    translationLikely: false,
    translationNote:
      "English documents are generally accepted in Singapore. Receiving authority requirements are confirmed before international release.",
  },
  Canada: {
    country: "Canada",
    officialLanguages: ["English", "French"],
    translationLikely: false,
    translationNote:
      "English and French documents are accepted depending on the province. Receiving authority requirements are confirmed before international release.",
  },
  "South Africa": {
    country: "South Africa",
    officialLanguages: ["English", "Afrikaans", "Zulu", "Xhosa"],
    translationLikely: false,
    translationNote:
      "English documents are generally accepted. Receiving authority requirements are confirmed before international release.",
  },
  Morocco: {
    country: "Morocco",
    officialLanguages: ["Arabic", "Berber", "French"],
    translationLikely: true,
    translationNote:
      "Arabic or French translation is typically required. Receiving authority requirements are confirmed before international release.",
  },
  Tunisia: {
    country: "Tunisia",
    officialLanguages: ["Arabic", "French"],
    translationLikely: true,
    translationNote:
      "Arabic or French translation is typically required. Receiving authority requirements are confirmed before international release.",
  },
  Philippines: {
    country: "Philippines",
    officialLanguages: ["Filipino", "English"],
    translationLikely: false,
    translationNote:
      "English documents are generally accepted in the Philippines. Receiving authority requirements are confirmed before international release.",
  },
  Indonesia: {
    country: "Indonesia",
    officialLanguages: ["Indonesian"],
    translationLikely: true,
    translationNote:
      "Indonesian (Bahasa) translation is typically required. Receiving authority requirements are confirmed before international release.",
  },
  "United States": {
    country: "United States",
    officialLanguages: ["English"],
    translationLikely: false,
    translationNote:
      "Domestic matter — no international translation or apostille required.",
  },
};

/**
 * Returns language routing guidance for a destination country.
 * Returns null for unknown countries; caller should treat as manual review.
 */
export function getLanguageRouting(
  country: string,
): CountryLanguageRouting | null {
  if (!country?.trim()) return null;
  const normalized = country.trim();
  if (ROUTING_TABLE[normalized]) return ROUTING_TABLE[normalized];
  const lower = normalized.toLowerCase();
  for (const key of Object.keys(ROUTING_TABLE)) {
    if (key.toLowerCase() === lower) return ROUTING_TABLE[key];
  }
  // English-language fallback for known English countries
  if (ENGLISH_LANGUAGE_COUNTRIES.has(normalized)) {
    return {
      country: normalized,
      officialLanguages: ["English"],
      translationLikely: false,
      translationNote:
        "English documents are generally accepted. Receiving authority requirements are confirmed before international release.",
    };
  }
  return null;
}

export { ROUTING_TABLE };
