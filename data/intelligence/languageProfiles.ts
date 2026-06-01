/**
 * Language Profiles — Intelligence Registry
 *
 * Display enrichment and translation review guidance only.
 * Must not guarantee certified translation acceptance.
 * Must not state translation is always required.
 * Authority-specific records control final requirements.
 */

export interface LanguageProfile {
  language: string
  english_to_language_label: string
  language_to_english_label: string
  certified_translation_recommended: boolean
  ron_language_review_required: boolean
  witness_language_review_required: boolean
  notes_client_safe: string
  notes_operator?: string
}

// ── Country Slug → Primary Language Map ──────────────────────────────────────

const COUNTRY_LANGUAGE_MAP: Record<string, string> = {
  "italy": "Italian",
  "portugal": "Portuguese",
  "brazil": "Portuguese",
  "spain": "Spanish",
  "mexico": "Spanish",
  "argentina": "Spanish",
  "colombia": "Spanish",
  "dominican-republic": "Spanish",
  "peru": "Spanish",
  "uruguay": "Spanish",
  "ecuador": "Spanish",
  "panama": "Spanish",
  "venezuela": "Spanish",
  "chile": "Spanish",
  "france": "French",
  "senegal": "French",
  "morocco": "Arabic",
  "germany": "German",
  "austria": "German",
  "greece": "Greek",
  "japan": "Japanese",
  "south-korea": "Korean",
  "india": "Hindi",
  "united-arab-emirates": "Arabic",
  "saudi-arabia": "Arabic",
  "israel": "Hebrew",
  "china": "Chinese (Simplified)",
  "taiwan": "Chinese (Traditional)",
  "vietnam": "Vietnamese",
  "philippines": "Filipino/Tagalog",
  "turkey": "Turkish",
  "poland": "Polish",
  "netherlands": "Dutch",
  "belgium": "Dutch",
  "romania": "Romanian",
  "sweden": "Swedish",
  "norway": "Norwegian",
  "united-kingdom": "English",
  "ireland": "English",
  "canada": "English",
  "australia": "English",
  "south-africa": "English",
  "singapore": "English",
  "new-zealand": "English",
  "mauritius": "English",
}

// ── Profile Registry ──────────────────────────────────────────────────────────

export const LANGUAGE_PROFILES: LanguageProfile[] = [
  {
    language: "Italian",
    english_to_language_label: "English to Italian",
    language_to_english_label: "Italian to English",
    certified_translation_recommended: true,
    ron_language_review_required: true,
    witness_language_review_required: true,
    notes_client_safe:
      "Italian-language review is typically recommended for documents destined for Italian receiving authorities. Requirements vary by authority.",
    notes_operator:
      "Italian receiving authorities commonly require certified Italian translation. Confirm with specific authority before execution.",
  },
  {
    language: "Portuguese",
    english_to_language_label: "English to Portuguese",
    language_to_english_label: "Portuguese to English",
    certified_translation_recommended: true,
    ron_language_review_required: true,
    witness_language_review_required: true,
    notes_client_safe:
      "Portuguese-language review is typically recommended for documents destined for Portuguese or Brazilian receiving authorities. Requirements vary by authority.",
  },
  {
    language: "Spanish",
    english_to_language_label: "English to Spanish",
    language_to_english_label: "Spanish to English",
    certified_translation_recommended: true,
    ron_language_review_required: true,
    witness_language_review_required: true,
    notes_client_safe:
      "Spanish-language review is typically recommended for documents destined for Spanish-speaking receiving authorities. Requirements vary by authority.",
  },
  {
    language: "French",
    english_to_language_label: "English to French",
    language_to_english_label: "French to English",
    certified_translation_recommended: true,
    ron_language_review_required: true,
    witness_language_review_required: false,
    notes_client_safe:
      "French-language review may be recommended for documents destined for French receiving authorities. Requirements vary by authority.",
  },
  {
    language: "German",
    english_to_language_label: "English to German",
    language_to_english_label: "German to English",
    certified_translation_recommended: true,
    ron_language_review_required: true,
    witness_language_review_required: false,
    notes_client_safe:
      "German-language review may be recommended for documents destined for German or Austrian receiving authorities. Requirements vary by authority.",
  },
  {
    language: "Greek",
    english_to_language_label: "English to Greek",
    language_to_english_label: "Greek to English",
    certified_translation_recommended: true,
    ron_language_review_required: true,
    witness_language_review_required: false,
    notes_client_safe:
      "Greek-language review may be recommended for documents destined for Greek receiving authorities. Requirements vary by authority.",
  },
  {
    language: "Japanese",
    english_to_language_label: "English to Japanese",
    language_to_english_label: "Japanese to English",
    certified_translation_recommended: true,
    ron_language_review_required: true,
    witness_language_review_required: true,
    notes_client_safe:
      "Japanese-language review is typically recommended for documents destined for Japanese receiving authorities. Requirements vary by authority.",
    notes_operator:
      "Japanese translation is specialized — allow additional lead time. Confirm with receiving authority.",
  },
  {
    language: "Korean",
    english_to_language_label: "English to Korean",
    language_to_english_label: "Korean to English",
    certified_translation_recommended: true,
    ron_language_review_required: true,
    witness_language_review_required: false,
    notes_client_safe:
      "Korean-language review may be recommended for documents destined for South Korean receiving authorities. Requirements vary by authority.",
  },
  {
    language: "Arabic",
    english_to_language_label: "English to Arabic",
    language_to_english_label: "Arabic to English",
    certified_translation_recommended: true,
    ron_language_review_required: true,
    witness_language_review_required: true,
    notes_client_safe:
      "Arabic-language review is typically recommended for documents destined for Arabic-speaking receiving authorities. Requirements vary by authority and country.",
    notes_operator:
      "Arabic translation requirements vary significantly between UAE, Saudi Arabia, and other GCC states. Notarized Arabic translation is often required by UAE authorities.",
  },
  {
    language: "Hindi",
    english_to_language_label: "English to Hindi",
    language_to_english_label: "Hindi to English",
    certified_translation_recommended: false,
    ron_language_review_required: false,
    witness_language_review_required: false,
    notes_client_safe:
      "Hindi-language review requirements depend on the specific receiving authority in India. Many Indian authorities accept English-language documents.",
  },
  {
    language: "Chinese (Simplified)",
    english_to_language_label: "English to Chinese (Simplified)",
    language_to_english_label: "Chinese (Simplified) to English",
    certified_translation_recommended: true,
    ron_language_review_required: true,
    witness_language_review_required: true,
    notes_client_safe:
      "Chinese-language review may be recommended for documents destined for mainland Chinese receiving authorities. Requirements vary by authority.",
    notes_operator:
      "China joined the Hague Apostille Convention in 2023. Receiving authority translation requirements are evolving — verify before execution.",
  },
  {
    language: "Chinese (Traditional)",
    english_to_language_label: "English to Chinese (Traditional)",
    language_to_english_label: "Chinese (Traditional) to English",
    certified_translation_recommended: true,
    ron_language_review_required: true,
    witness_language_review_required: true,
    notes_client_safe:
      "Chinese (Traditional) language review may be recommended for documents destined for certain receiving authorities. Requirements vary by authority.",
  },
  {
    language: "Vietnamese",
    english_to_language_label: "English to Vietnamese",
    language_to_english_label: "Vietnamese to English",
    certified_translation_recommended: true,
    ron_language_review_required: true,
    witness_language_review_required: false,
    notes_client_safe:
      "Vietnamese-language review may be recommended for documents destined for Vietnamese receiving authorities. Destination requirements should be verified.",
  },
  {
    language: "Filipino/Tagalog",
    english_to_language_label: "English to Filipino/Tagalog",
    language_to_english_label: "Filipino/Tagalog to English",
    certified_translation_recommended: false,
    ron_language_review_required: false,
    witness_language_review_required: false,
    notes_client_safe:
      "Philippine receiving authorities often accept English-language documents. Translation requirements depend on the specific receiving authority.",
  },
  {
    language: "Hebrew",
    english_to_language_label: "English to Hebrew",
    language_to_english_label: "Hebrew to English",
    certified_translation_recommended: true,
    ron_language_review_required: true,
    witness_language_review_required: false,
    notes_client_safe:
      "Hebrew-language review may be recommended for documents destined for Israeli receiving authorities. Requirements vary by authority.",
  },
  {
    language: "Turkish",
    english_to_language_label: "English to Turkish",
    language_to_english_label: "Turkish to English",
    certified_translation_recommended: true,
    ron_language_review_required: true,
    witness_language_review_required: false,
    notes_client_safe:
      "Turkish-language review may be recommended for documents destined for Turkish receiving authorities. Requirements vary by authority.",
  },
  {
    language: "Polish",
    english_to_language_label: "English to Polish",
    language_to_english_label: "Polish to English",
    certified_translation_recommended: true,
    ron_language_review_required: true,
    witness_language_review_required: false,
    notes_client_safe:
      "Polish-language review may be recommended for documents destined for Polish receiving authorities. Requirements vary by authority.",
  },
  {
    language: "Dutch",
    english_to_language_label: "English to Dutch",
    language_to_english_label: "Dutch to English",
    certified_translation_recommended: true,
    ron_language_review_required: true,
    witness_language_review_required: false,
    notes_client_safe:
      "Dutch-language review may be recommended for documents destined for Dutch or Belgian receiving authorities. Requirements vary by authority.",
  },
  {
    language: "Romanian",
    english_to_language_label: "English to Romanian",
    language_to_english_label: "Romanian to English",
    certified_translation_recommended: true,
    ron_language_review_required: true,
    witness_language_review_required: false,
    notes_client_safe:
      "Romanian-language review may be recommended for documents destined for Romanian receiving authorities. Requirements vary by authority.",
  },
  {
    language: "Swedish",
    english_to_language_label: "English to Swedish",
    language_to_english_label: "Swedish to English",
    certified_translation_recommended: true,
    ron_language_review_required: false,
    witness_language_review_required: false,
    notes_client_safe:
      "Swedish-language review may be recommended for documents destined for Swedish receiving authorities. Requirements vary by authority.",
  },
  {
    language: "Norwegian",
    english_to_language_label: "English to Norwegian",
    language_to_english_label: "Norwegian to English",
    certified_translation_recommended: true,
    ron_language_review_required: false,
    witness_language_review_required: false,
    notes_client_safe:
      "Norwegian-language review may be recommended for documents destined for Norwegian receiving authorities. Requirements vary by authority.",
  },
]

// ── Query Functions ───────────────────────────────────────────────────────────

export function getLanguageProfile(language: string): LanguageProfile | undefined {
  return LANGUAGE_PROFILES.find(
    (p) => p.language.toLowerCase() === language.toLowerCase(),
  )
}

export function getCountryLanguageProfile(countrySlug: string): LanguageProfile | undefined {
  const language = COUNTRY_LANGUAGE_MAP[countrySlug]
  if (!language) return undefined
  return getLanguageProfile(language)
}

export function getTranslationReviewNote(
  countrySlug: string,
  _documentSlug?: string,
): string {
  const profile = getCountryLanguageProfile(countrySlug)
  if (!profile) {
    return "Translation requirements depend on destination and receiving-authority requirements."
  }
  return `Translation requirements for ${profile.language}-destination documents depend on the receiving authority. ${profile.certified_translation_recommended ? "Certified translation is commonly recommended but is not guaranteed to be required or accepted in all circumstances." : "Translation may not be required by all receiving authorities."} Requirements should always be confirmed with the specific receiving authority.`
}
