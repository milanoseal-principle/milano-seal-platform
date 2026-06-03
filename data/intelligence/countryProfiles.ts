/**
 * Country Profiles — Intelligence Registry
 *
 * Display enrichment only. This file must NOT override Hague logic,
 * authority confidence, matter readiness, or workflow derivation.
 * All source_status values reflect observed or placeholder data unless
 * explicitly verified through primary source research.
 */

export interface CountryProfile {
  country_slug: string
  country_name: string
  region: string
  capital?: string
  primary_languages: string[]
  currency?: string
  timezone?: string
  embassy_reference_url?: string
  treaty_reference_url?: string
  economy_reference_url?: string
  visa_reference_url?: string
  passport_reference_url?: string
  travel_advisory_url?: string
  hague_status: "hague" | "non_hague" | "hague_with_caveats" | "verification_required"
  translation_required_default: boolean
  alliance_priority: "high" | "medium" | "low"
  source_status: "verified" | "observed" | "placeholder" | "needs_review"
  client_safe_note: string
  operator_note?: string
}

// ── Profile Registry ──────────────────────────────────────────────────────────

export const COUNTRY_PROFILES: CountryProfile[] = [
  {
    country_slug: "italy",
    country_name: "Italy",
    region: "Europe",
    capital: "Rome",
    primary_languages: ["Italian"],
    currency: "EUR",
    timezone: "Europe/Rome",
    hague_status: "hague",
    translation_required_default: true,
    alliance_priority: "high",
    source_status: "verified",
    client_safe_note:
      "Italy document routing may involve language review, destination review, apostille coordination, and receiving-authority requirements.",
    operator_note:
      "Italy is a Hague Convention member. Apostille from Florida SOS is accepted. Italian translation is typically required for receiving authorities.",
  },
  {
    country_slug: "portugal",
    country_name: "Portugal",
    region: "Europe",
    capital: "Lisbon",
    primary_languages: ["Portuguese"],
    currency: "EUR",
    timezone: "Europe/Lisbon",
    hague_status: "hague",
    translation_required_default: true,
    alliance_priority: "high",
    source_status: "verified",
    client_safe_note:
      "Portugal document routing may involve language review, destination review, apostille coordination, and receiving-authority requirements.",
  },
  {
    country_slug: "spain",
    country_name: "Spain",
    region: "Europe",
    capital: "Madrid",
    primary_languages: ["Spanish"],
    currency: "EUR",
    timezone: "Europe/Madrid",
    hague_status: "hague",
    translation_required_default: true,
    alliance_priority: "high",
    source_status: "verified",
    client_safe_note:
      "Spain document routing may involve language review, destination review, apostille coordination, and receiving-authority requirements.",
  },
  {
    country_slug: "france",
    country_name: "France",
    region: "Europe",
    capital: "Paris",
    primary_languages: ["French"],
    currency: "EUR",
    timezone: "Europe/Paris",
    hague_status: "hague",
    translation_required_default: true,
    alliance_priority: "medium",
    source_status: "observed",
    client_safe_note:
      "France document routing may involve language review, destination review, apostille coordination, and receiving-authority requirements.",
  },
  {
    country_slug: "germany",
    country_name: "Germany",
    region: "Europe",
    capital: "Berlin",
    primary_languages: ["German"],
    currency: "EUR",
    timezone: "Europe/Berlin",
    hague_status: "hague",
    translation_required_default: true,
    alliance_priority: "medium",
    source_status: "observed",
    client_safe_note:
      "Germany document routing may involve language review, destination review, apostille coordination, and receiving-authority requirements.",
  },
  {
    country_slug: "united-kingdom",
    country_name: "United Kingdom",
    region: "Europe",
    capital: "London",
    primary_languages: ["English"],
    currency: "GBP",
    timezone: "Europe/London",
    hague_status: "hague",
    translation_required_default: false,
    alliance_priority: "medium",
    source_status: "verified",
    client_safe_note:
      "United Kingdom document routing may involve destination review, apostille coordination, and receiving-authority requirements.",
  },
  {
    country_slug: "ireland",
    country_name: "Ireland",
    region: "Europe",
    capital: "Dublin",
    primary_languages: ["English", "Irish"],
    currency: "EUR",
    timezone: "Europe/Dublin",
    hague_status: "hague",
    translation_required_default: false,
    alliance_priority: "medium",
    source_status: "observed",
    client_safe_note:
      "Ireland document routing may involve destination review, apostille coordination, and receiving-authority requirements.",
  },
  {
    country_slug: "greece",
    country_name: "Greece",
    region: "Europe",
    capital: "Athens",
    primary_languages: ["Greek"],
    currency: "EUR",
    timezone: "Europe/Athens",
    hague_status: "hague",
    translation_required_default: true,
    alliance_priority: "medium",
    source_status: "observed",
    client_safe_note:
      "Greece document routing may involve language review, destination review, apostille coordination, and receiving-authority requirements.",
  },
  {
    country_slug: "brazil",
    country_name: "Brazil",
    region: "South America",
    capital: "Brasília",
    primary_languages: ["Portuguese"],
    currency: "BRL",
    timezone: "America/Sao_Paulo",
    hague_status: "hague",
    translation_required_default: true,
    alliance_priority: "high",
    source_status: "verified",
    client_safe_note:
      "Brazil document routing may involve language review, destination review, apostille coordination, and receiving-authority requirements.",
  },
  {
    country_slug: "mexico",
    country_name: "Mexico",
    region: "North America",
    capital: "Mexico City",
    primary_languages: ["Spanish"],
    currency: "MXN",
    timezone: "America/Mexico_City",
    hague_status: "hague",
    translation_required_default: true,
    alliance_priority: "high",
    source_status: "verified",
    client_safe_note:
      "Mexico document routing may involve language review, destination review, apostille coordination, and receiving-authority requirements.",
  },
  {
    country_slug: "argentina",
    country_name: "Argentina",
    region: "South America",
    capital: "Buenos Aires",
    primary_languages: ["Spanish"],
    currency: "ARS",
    timezone: "America/Argentina/Buenos_Aires",
    hague_status: "hague",
    translation_required_default: true,
    alliance_priority: "medium",
    source_status: "observed",
    client_safe_note:
      "Argentina document routing may involve language review, destination review, apostille coordination, and receiving-authority requirements.",
  },
  {
    country_slug: "colombia",
    country_name: "Colombia",
    region: "South America",
    capital: "Bogotá",
    primary_languages: ["Spanish"],
    currency: "COP",
    timezone: "America/Bogota",
    hague_status: "hague",
    translation_required_default: true,
    alliance_priority: "medium",
    source_status: "observed",
    client_safe_note:
      "Colombia document routing may involve language review, destination review, apostille coordination, and receiving-authority requirements.",
  },
  {
    country_slug: "dominican-republic",
    country_name: "Dominican Republic",
    region: "Caribbean",
    capital: "Santo Domingo",
    primary_languages: ["Spanish"],
    currency: "DOP",
    timezone: "America/Santo_Domingo",
    hague_status: "hague",
    translation_required_default: true,
    alliance_priority: "high",
    source_status: "observed",
    client_safe_note:
      "Dominican Republic document routing may involve language review, destination review, apostille coordination, and receiving-authority requirements.",
  },
  {
    country_slug: "japan",
    country_name: "Japan",
    region: "Asia",
    capital: "Tokyo",
    primary_languages: ["Japanese"],
    currency: "JPY",
    timezone: "Asia/Tokyo",
    hague_status: "hague",
    translation_required_default: true,
    alliance_priority: "medium",
    source_status: "observed",
    client_safe_note:
      "Japan document routing may involve language review, destination review, apostille coordination, and receiving-authority requirements.",
  },
  {
    country_slug: "south-korea",
    country_name: "South Korea",
    region: "Asia",
    capital: "Seoul",
    primary_languages: ["Korean"],
    currency: "KRW",
    timezone: "Asia/Seoul",
    hague_status: "hague",
    translation_required_default: true,
    alliance_priority: "medium",
    source_status: "observed",
    client_safe_note:
      "South Korea document routing may involve language review, destination review, apostille coordination, and receiving-authority requirements.",
  },
  {
    country_slug: "india",
    country_name: "India",
    region: "Asia",
    capital: "New Delhi",
    primary_languages: ["Hindi", "English"],
    currency: "INR",
    timezone: "Asia/Kolkata",
    hague_status: "hague",
    translation_required_default: false,
    alliance_priority: "medium",
    source_status: "observed",
    client_safe_note:
      "India document routing may involve destination review, apostille coordination, and receiving-authority requirements.",
  },
  {
    country_slug: "united-arab-emirates",
    country_name: "United Arab Emirates",
    region: "Middle East",
    capital: "Abu Dhabi",
    primary_languages: ["Arabic"],
    currency: "AED",
    timezone: "Asia/Dubai",
    hague_status: "hague",
    translation_required_default: true,
    alliance_priority: "high",
    source_status: "observed",
    client_safe_note:
      "United Arab Emirates document routing may involve language review, destination review, apostille coordination, and receiving-authority requirements.",
    operator_note:
      "UAE joined the Hague Convention in 2021. Receiving authority requirements may include notarized Arabic translation. Verify with receiving authority.",
  },
  {
    country_slug: "saudi-arabia",
    country_name: "Saudi Arabia",
    region: "Middle East",
    capital: "Riyadh",
    primary_languages: ["Arabic"],
    currency: "SAR",
    timezone: "Asia/Riyadh",
    hague_status: "non_hague",
    translation_required_default: true,
    alliance_priority: "medium",
    source_status: "observed",
    client_safe_note:
      "Saudi Arabia document routing may involve language review, destination review, consular legalization, and receiving-authority requirements.",
    operator_note:
      "Saudi Arabia is not a Hague Convention member. Consular legalization chain is typically required. Verify chain before advising client.",
  },
  {
    country_slug: "china",
    country_name: "China",
    region: "Asia",
    capital: "Beijing",
    primary_languages: ["Chinese (Simplified)"],
    currency: "CNY",
    timezone: "Asia/Shanghai",
    hague_status: "hague_with_caveats",
    translation_required_default: true,
    alliance_priority: "medium",
    source_status: "needs_review",
    client_safe_note:
      "China document routing may involve language review, destination review, apostille coordination, and receiving-authority requirements.",
    operator_note:
      "China joined the Hague Apostille Convention in 2023. Receiving authority acceptance and apostille procedures may vary. Verify current requirements before advising.",
  },
  {
    country_slug: "vietnam",
    country_name: "Vietnam",
    region: "Asia",
    capital: "Hanoi",
    primary_languages: ["Vietnamese"],
    currency: "VND",
    timezone: "Asia/Ho_Chi_Minh",
    hague_status: "verification_required",
    translation_required_default: true,
    alliance_priority: "low",
    source_status: "placeholder",
    client_safe_note:
      "Vietnam document routing may involve language review, destination review, and receiving-authority requirements. Verification is advised.",
    operator_note:
      "Vietnam Hague status requires verification. Do not assume apostille is accepted — confirm with receiving authority before execution.",
  },
  {
    country_slug: "philippines",
    country_name: "Philippines",
    region: "Asia",
    capital: "Manila",
    primary_languages: ["Filipino/Tagalog", "English"],
    currency: "PHP",
    timezone: "Asia/Manila",
    hague_status: "hague",
    translation_required_default: false,
    alliance_priority: "medium",
    source_status: "observed",
    client_safe_note:
      "Philippines document routing may involve destination review, apostille coordination, and receiving-authority requirements.",
  },
  {
    country_slug: "canada",
    country_name: "Canada",
    region: "North America",
    capital: "Ottawa",
    primary_languages: ["English", "French"],
    currency: "CAD",
    timezone: "America/Toronto",
    hague_status: "hague",
    translation_required_default: false,
    alliance_priority: "medium",
    source_status: "observed",
    client_safe_note:
      "Canada document routing may involve destination review, apostille coordination, and receiving-authority requirements.",
  },
  {
    country_slug: "australia",
    country_name: "Australia",
    region: "Oceania",
    capital: "Canberra",
    primary_languages: ["English"],
    currency: "AUD",
    timezone: "Australia/Sydney",
    hague_status: "hague",
    translation_required_default: false,
    alliance_priority: "medium",
    source_status: "observed",
    client_safe_note:
      "Australia document routing may involve destination review, apostille coordination, and receiving-authority requirements.",
  },
  {
    country_slug: "turkey",
    country_name: "Turkey",
    region: "Europe/Asia",
    capital: "Ankara",
    primary_languages: ["Turkish"],
    currency: "TRY",
    timezone: "Europe/Istanbul",
    hague_status: "hague",
    translation_required_default: true,
    alliance_priority: "low",
    source_status: "placeholder",
    client_safe_note:
      "Turkey document routing may involve language review, destination review, apostille coordination, and receiving-authority requirements.",
  },
  {
    country_slug: "poland",
    country_name: "Poland",
    region: "Europe",
    capital: "Warsaw",
    primary_languages: ["Polish"],
    currency: "PLN",
    timezone: "Europe/Warsaw",
    hague_status: "hague",
    translation_required_default: true,
    alliance_priority: "low",
    source_status: "placeholder",
    client_safe_note:
      "Poland document routing may involve language review, destination review, apostille coordination, and receiving-authority requirements.",
  },
  {
    country_slug: "netherlands",
    country_name: "Netherlands",
    region: "Europe",
    capital: "Amsterdam",
    primary_languages: ["Dutch"],
    currency: "EUR",
    timezone: "Europe/Amsterdam",
    hague_status: "hague",
    translation_required_default: true,
    alliance_priority: "low",
    source_status: "placeholder",
    client_safe_note:
      "Netherlands document routing may involve language review, destination review, apostille coordination, and receiving-authority requirements.",
  },
  {
    country_slug: "belgium",
    country_name: "Belgium",
    region: "Europe",
    capital: "Brussels",
    primary_languages: ["Dutch", "French", "German"],
    currency: "EUR",
    timezone: "Europe/Brussels",
    hague_status: "hague",
    translation_required_default: true,
    alliance_priority: "low",
    source_status: "placeholder",
    client_safe_note:
      "Belgium document routing may involve language review, destination review, apostille coordination, and receiving-authority requirements.",
  },
  {
    country_slug: "switzerland",
    country_name: "Switzerland",
    region: "Europe",
    capital: "Bern",
    primary_languages: ["German", "French", "Italian"],
    currency: "CHF",
    timezone: "Europe/Zurich",
    hague_status: "hague",
    translation_required_default: true,
    alliance_priority: "low",
    source_status: "placeholder",
    client_safe_note:
      "Switzerland document routing may involve language review, destination review, apostille coordination, and receiving-authority requirements.",
  },
  {
    country_slug: "austria",
    country_name: "Austria",
    region: "Europe",
    capital: "Vienna",
    primary_languages: ["German"],
    currency: "EUR",
    timezone: "Europe/Vienna",
    hague_status: "hague",
    translation_required_default: true,
    alliance_priority: "low",
    source_status: "placeholder",
    client_safe_note:
      "Austria document routing may involve language review, destination review, apostille coordination, and receiving-authority requirements.",
  },
  {
    country_slug: "romania",
    country_name: "Romania",
    region: "Europe",
    capital: "Bucharest",
    primary_languages: ["Romanian"],
    currency: "RON",
    timezone: "Europe/Bucharest",
    hague_status: "hague",
    translation_required_default: true,
    alliance_priority: "low",
    source_status: "placeholder",
    client_safe_note:
      "Romania document routing may involve language review, destination review, apostille coordination, and receiving-authority requirements.",
  },
  {
    country_slug: "sweden",
    country_name: "Sweden",
    region: "Europe",
    capital: "Stockholm",
    primary_languages: ["Swedish"],
    currency: "SEK",
    timezone: "Europe/Stockholm",
    hague_status: "hague",
    translation_required_default: true,
    alliance_priority: "low",
    source_status: "placeholder",
    client_safe_note:
      "Sweden document routing may involve language review, destination review, apostille coordination, and receiving-authority requirements.",
  },
  {
    country_slug: "norway",
    country_name: "Norway",
    region: "Europe",
    capital: "Oslo",
    primary_languages: ["Norwegian"],
    currency: "NOK",
    timezone: "Europe/Oslo",
    hague_status: "hague",
    translation_required_default: true,
    alliance_priority: "low",
    source_status: "placeholder",
    client_safe_note:
      "Norway document routing may involve language review, destination review, apostille coordination, and receiving-authority requirements.",
  },
  {
    country_slug: "peru",
    country_name: "Peru",
    region: "South America",
    capital: "Lima",
    primary_languages: ["Spanish"],
    currency: "PEN",
    timezone: "America/Lima",
    hague_status: "hague",
    translation_required_default: true,
    alliance_priority: "low",
    source_status: "placeholder",
    client_safe_note:
      "Peru document routing may involve language review, destination review, apostille coordination, and receiving-authority requirements.",
  },
  {
    country_slug: "uruguay",
    country_name: "Uruguay",
    region: "South America",
    capital: "Montevideo",
    primary_languages: ["Spanish"],
    currency: "UYU",
    timezone: "America/Montevideo",
    hague_status: "hague",
    translation_required_default: true,
    alliance_priority: "low",
    source_status: "placeholder",
    client_safe_note:
      "Uruguay document routing may involve language review, destination review, apostille coordination, and receiving-authority requirements.",
  },
  {
    country_slug: "ecuador",
    country_name: "Ecuador",
    region: "South America",
    capital: "Quito",
    primary_languages: ["Spanish"],
    currency: "USD",
    timezone: "America/Guayaquil",
    hague_status: "hague",
    translation_required_default: true,
    alliance_priority: "low",
    source_status: "placeholder",
    client_safe_note:
      "Ecuador document routing may involve language review, destination review, apostille coordination, and receiving-authority requirements.",
  },
  {
    country_slug: "panama",
    country_name: "Panama",
    region: "Central America",
    capital: "Panama City",
    primary_languages: ["Spanish"],
    currency: "PAB",
    timezone: "America/Panama",
    hague_status: "hague",
    translation_required_default: true,
    alliance_priority: "low",
    source_status: "placeholder",
    client_safe_note:
      "Panama document routing may involve language review, destination review, apostille coordination, and receiving-authority requirements.",
  },
  {
    country_slug: "venezuela",
    country_name: "Venezuela",
    region: "South America",
    capital: "Caracas",
    primary_languages: ["Spanish"],
    currency: "VES",
    timezone: "America/Caracas",
    hague_status: "hague",
    translation_required_default: true,
    alliance_priority: "low",
    source_status: "placeholder",
    client_safe_note:
      "Venezuela document routing may involve language review, destination review, apostille coordination, and receiving-authority requirements.",
    operator_note:
      "Venezuela consular and authority access may be limited. Verify receiving authority availability before committing to timeline.",
  },
  {
    country_slug: "chile",
    country_name: "Chile",
    region: "South America",
    capital: "Santiago",
    primary_languages: ["Spanish"],
    currency: "CLP",
    timezone: "America/Santiago",
    hague_status: "hague",
    translation_required_default: true,
    alliance_priority: "low",
    source_status: "placeholder",
    client_safe_note:
      "Chile document routing may involve language review, destination review, apostille coordination, and receiving-authority requirements.",
  },
  {
    country_slug: "morocco",
    country_name: "Morocco",
    region: "Africa",
    capital: "Rabat",
    primary_languages: ["Arabic", "French"],
    currency: "MAD",
    timezone: "Africa/Casablanca",
    hague_status: "non_hague",
    translation_required_default: true,
    alliance_priority: "low",
    source_status: "placeholder",
    client_safe_note:
      "Morocco document routing may involve language review, destination review, consular legalization, and receiving-authority requirements.",
    operator_note:
      "Morocco is not a Hague Convention member. Consular legalization is typically required. Verify chain before advising client.",
  },
  {
    country_slug: "south-africa",
    country_name: "South Africa",
    region: "Africa",
    capital: "Pretoria",
    primary_languages: ["English", "Zulu", "Xhosa", "Afrikaans"],
    currency: "ZAR",
    timezone: "Africa/Johannesburg",
    hague_status: "hague",
    translation_required_default: false,
    alliance_priority: "low",
    source_status: "placeholder",
    client_safe_note:
      "South Africa document routing may involve destination review, apostille coordination, and receiving-authority requirements.",
  },
  {
    country_slug: "senegal",
    country_name: "Senegal",
    region: "Africa",
    capital: "Dakar",
    primary_languages: ["French"],
    currency: "XOF",
    timezone: "Africa/Dakar",
    hague_status: "non_hague",
    translation_required_default: true,
    alliance_priority: "low",
    source_status: "placeholder",
    client_safe_note:
      "Senegal document routing may involve language review, destination review, consular legalization, and receiving-authority requirements.",
    operator_note:
      "Senegal is not a Hague Convention member. Verify legalization chain before advising client.",
  },
  {
    country_slug: "mauritius",
    country_name: "Mauritius",
    region: "Africa",
    capital: "Port Louis",
    primary_languages: ["English", "French"],
    currency: "MUR",
    timezone: "Indian/Mauritius",
    hague_status: "hague",
    translation_required_default: false,
    alliance_priority: "low",
    source_status: "placeholder",
    client_safe_note:
      "Mauritius document routing may involve destination review, apostille coordination, and receiving-authority requirements.",
  },
  {
    country_slug: "singapore",
    country_name: "Singapore",
    region: "Asia",
    capital: "Singapore",
    primary_languages: ["English", "Mandarin", "Malay", "Tamil"],
    currency: "SGD",
    timezone: "Asia/Singapore",
    hague_status: "hague",
    translation_required_default: false,
    alliance_priority: "low",
    source_status: "placeholder",
    client_safe_note:
      "Singapore document routing may involve destination review, apostille coordination, and receiving-authority requirements.",
  },
  {
    country_slug: "new-zealand",
    country_name: "New Zealand",
    region: "Oceania",
    capital: "Wellington",
    primary_languages: ["English", "Māori"],
    currency: "NZD",
    timezone: "Pacific/Auckland",
    hague_status: "hague",
    translation_required_default: false,
    alliance_priority: "low",
    source_status: "placeholder",
    client_safe_note:
      "New Zealand document routing may involve destination review, apostille coordination, and receiving-authority requirements.",
  },
  {
    country_slug: "israel",
    country_name: "Israel",
    region: "Middle East",
    capital: "Jerusalem",
    primary_languages: ["Hebrew", "Arabic"],
    currency: "ILS",
    timezone: "Asia/Jerusalem",
    hague_status: "hague",
    translation_required_default: true,
    alliance_priority: "low",
    source_status: "placeholder",
    client_safe_note:
      "Israel document routing may involve language review, destination review, apostille coordination, and receiving-authority requirements.",
  },
]

// ── Query Functions ───────────────────────────────────────────────────────────

export function getCountryProfile(countrySlug: string): CountryProfile | undefined {
  return COUNTRY_PROFILES.find((p) => p.country_slug === countrySlug)
}

export function getCountryProfilesByRegion(region: string): CountryProfile[] {
  return COUNTRY_PROFILES.filter(
    (p) => p.region.toLowerCase() === region.toLowerCase(),
  )
}

export function getAlliancePriorityCountries(): CountryProfile[] {
  return COUNTRY_PROFILES.filter((p) => p.alliance_priority === "high")
}

export function getCountryProfileSummary(countrySlug: string): string {
  const profile = getCountryProfile(countrySlug)
  if (!profile) {
    return "No country profile available for this destination. Routing context will be derived from available corridor data."
  }
  return `${profile.country_name} is a ${profile.hague_status === "hague" ? "Hague Convention member" : profile.hague_status === "hague_with_caveats" ? "Hague Convention member with caveats" : profile.hague_status === "non_hague" ? "non-Hague destination" : "destination requiring verification"}; primary language(s): ${profile.primary_languages.join(", ")}; translation review ${profile.translation_required_default ? "is typically recommended" : "may not be required"} by default.`
}
