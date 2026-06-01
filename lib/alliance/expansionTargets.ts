/**
 * Alliance Expansion Targets — Intelligence Registry
 *
 * Identifies countries where partner development would support execution capacity.
 * No revenue exposure. No margin exposure. No payout exposure. No public partner rankings.
 */

export type PartnerType =
  | "attorney"
  | "translator"
  | "genealogist"
  | "notary"
  | "apostille_runner"
  | "courier_partner"
  | "country_specialist"
  | "corporate_services_partner"

export interface AllianceExpansionTarget {
  country_slug: string
  country_name: string
  region: string
  priority: "high" | "medium" | "low"
  partner_types_needed: PartnerType[]
  language_needs: string[]
  authority_research_needed: boolean
  translation_partner_needed: boolean
  courier_partner_needed: boolean
  attorney_partner_needed: boolean
  genealogist_partner_needed: boolean
  source_links: string[]
  client_safe_note: string
  operator_note?: string
}

// ── Target Registry ───────────────────────────────────────────────────────────

export const ALLIANCE_EXPANSION_TARGETS: AllianceExpansionTarget[] = [
  {
    country_slug: "italy",
    country_name: "Italy",
    region: "Europe",
    priority: "high",
    partner_types_needed: ["translator", "attorney", "genealogist", "country_specialist"],
    language_needs: ["Italian"],
    authority_research_needed: false,
    translation_partner_needed: true,
    courier_partner_needed: true,
    attorney_partner_needed: true,
    genealogist_partner_needed: true,
    source_links: ["https://www.hcch.net/en/states/authorities/details3/?aid=279"],
    client_safe_note:
      "Italy routing support includes translation coordination, apostille processing, and receiving-authority liaison.",
    operator_note:
      "Genealogist and Italian citizenship attorney partners are high priority for the citizenship-by-descent corridor.",
  },
  {
    country_slug: "portugal",
    country_name: "Portugal",
    region: "Europe",
    priority: "high",
    partner_types_needed: ["translator", "attorney", "genealogist", "country_specialist"],
    language_needs: ["Portuguese"],
    authority_research_needed: false,
    translation_partner_needed: true,
    courier_partner_needed: true,
    attorney_partner_needed: true,
    genealogist_partner_needed: true,
    source_links: ["https://www.hcch.net/en/states/authorities/details3/?aid=341"],
    client_safe_note:
      "Portugal routing support includes translation coordination, apostille processing, and receiving-authority liaison.",
  },
  {
    country_slug: "spain",
    country_name: "Spain",
    region: "Europe",
    priority: "high",
    partner_types_needed: ["translator", "attorney", "genealogist", "country_specialist"],
    language_needs: ["Spanish"],
    authority_research_needed: false,
    translation_partner_needed: true,
    courier_partner_needed: true,
    attorney_partner_needed: true,
    genealogist_partner_needed: true,
    source_links: ["https://www.hcch.net/en/states/authorities/details3/?aid=381"],
    client_safe_note:
      "Spain routing support includes translation coordination, apostille processing, and receiving-authority liaison.",
  },
  {
    country_slug: "france",
    country_name: "France",
    region: "Europe",
    priority: "medium",
    partner_types_needed: ["translator", "attorney", "country_specialist"],
    language_needs: ["French"],
    authority_research_needed: false,
    translation_partner_needed: true,
    courier_partner_needed: true,
    attorney_partner_needed: true,
    genealogist_partner_needed: false,
    source_links: ["https://www.hcch.net/en/states/authorities/details3/?aid=181"],
    client_safe_note:
      "France routing support includes translation coordination, apostille processing, and receiving-authority liaison.",
  },
  {
    country_slug: "germany",
    country_name: "Germany",
    region: "Europe",
    priority: "medium",
    partner_types_needed: ["translator", "attorney", "country_specialist"],
    language_needs: ["German"],
    authority_research_needed: false,
    translation_partner_needed: true,
    courier_partner_needed: true,
    attorney_partner_needed: true,
    genealogist_partner_needed: false,
    source_links: ["https://www.hcch.net/en/states/authorities/details3/?aid=203"],
    client_safe_note:
      "Germany routing support includes translation coordination, apostille processing, and receiving-authority liaison.",
  },
  {
    country_slug: "united-kingdom",
    country_name: "United Kingdom",
    region: "Europe",
    priority: "medium",
    partner_types_needed: ["attorney", "courier_partner", "country_specialist"],
    language_needs: ["English"],
    authority_research_needed: false,
    translation_partner_needed: false,
    courier_partner_needed: true,
    attorney_partner_needed: true,
    genealogist_partner_needed: false,
    source_links: ["https://www.hcch.net/en/states/authorities/details3/?aid=417"],
    client_safe_note:
      "United Kingdom routing support includes apostille processing and receiving-authority liaison.",
  },
  {
    country_slug: "ireland",
    country_name: "Ireland",
    region: "Europe",
    priority: "medium",
    partner_types_needed: ["attorney", "genealogist", "country_specialist"],
    language_needs: ["English"],
    authority_research_needed: false,
    translation_partner_needed: false,
    courier_partner_needed: true,
    attorney_partner_needed: true,
    genealogist_partner_needed: true,
    source_links: ["https://www.hcch.net/en/states/authorities/details3/?aid=246"],
    client_safe_note:
      "Ireland routing support includes apostille processing and citizenship research liaison.",
  },
  {
    country_slug: "greece",
    country_name: "Greece",
    region: "Europe",
    priority: "medium",
    partner_types_needed: ["translator", "attorney", "genealogist", "country_specialist"],
    language_needs: ["Greek"],
    authority_research_needed: true,
    translation_partner_needed: true,
    courier_partner_needed: true,
    attorney_partner_needed: true,
    genealogist_partner_needed: true,
    source_links: ["https://www.hcch.net/en/states/authorities/details3/?aid=213"],
    client_safe_note:
      "Greece routing support includes translation coordination, apostille processing, and receiving-authority liaison.",
  },
  {
    country_slug: "brazil",
    country_name: "Brazil",
    region: "South America",
    priority: "high",
    partner_types_needed: ["translator", "attorney", "genealogist", "country_specialist", "apostille_runner"],
    language_needs: ["Portuguese"],
    authority_research_needed: false,
    translation_partner_needed: true,
    courier_partner_needed: true,
    attorney_partner_needed: true,
    genealogist_partner_needed: true,
    source_links: ["https://www.hcch.net/en/states/authorities/details3/?aid=103"],
    client_safe_note:
      "Brazil routing support includes translation coordination, apostille processing, and receiving-authority liaison.",
  },
  {
    country_slug: "mexico",
    country_name: "Mexico",
    region: "North America",
    priority: "high",
    partner_types_needed: ["translator", "attorney", "country_specialist", "apostille_runner"],
    language_needs: ["Spanish"],
    authority_research_needed: false,
    translation_partner_needed: true,
    courier_partner_needed: true,
    attorney_partner_needed: true,
    genealogist_partner_needed: false,
    source_links: ["https://www.hcch.net/en/states/authorities/details3/?aid=293"],
    client_safe_note:
      "Mexico routing support includes translation coordination, apostille processing, and receiving-authority liaison.",
  },
  {
    country_slug: "argentina",
    country_name: "Argentina",
    region: "South America",
    priority: "medium",
    partner_types_needed: ["translator", "attorney", "genealogist", "country_specialist"],
    language_needs: ["Spanish"],
    authority_research_needed: true,
    translation_partner_needed: true,
    courier_partner_needed: true,
    attorney_partner_needed: true,
    genealogist_partner_needed: true,
    source_links: ["https://www.hcch.net/en/states/authorities/details3/?aid=57"],
    client_safe_note:
      "Argentina routing support includes translation coordination, apostille processing, and receiving-authority liaison.",
  },
  {
    country_slug: "colombia",
    country_name: "Colombia",
    region: "South America",
    priority: "medium",
    partner_types_needed: ["translator", "attorney", "country_specialist"],
    language_needs: ["Spanish"],
    authority_research_needed: true,
    translation_partner_needed: true,
    courier_partner_needed: true,
    attorney_partner_needed: true,
    genealogist_partner_needed: false,
    source_links: ["https://www.hcch.net/en/states/authorities/details3/?aid=137"],
    client_safe_note:
      "Colombia routing support includes translation coordination, apostille processing, and receiving-authority liaison.",
  },
  {
    country_slug: "dominican-republic",
    country_name: "Dominican Republic",
    region: "Caribbean",
    priority: "high",
    partner_types_needed: ["translator", "attorney", "country_specialist", "apostille_runner"],
    language_needs: ["Spanish"],
    authority_research_needed: true,
    translation_partner_needed: true,
    courier_partner_needed: true,
    attorney_partner_needed: true,
    genealogist_partner_needed: false,
    source_links: ["https://www.hcch.net/en/states/authorities/details3/?aid=161"],
    client_safe_note:
      "Dominican Republic routing support includes translation coordination, apostille processing, and receiving-authority liaison.",
  },
  {
    country_slug: "japan",
    country_name: "Japan",
    region: "Asia",
    priority: "medium",
    partner_types_needed: ["translator", "attorney", "country_specialist"],
    language_needs: ["Japanese"],
    authority_research_needed: true,
    translation_partner_needed: true,
    courier_partner_needed: true,
    attorney_partner_needed: true,
    genealogist_partner_needed: false,
    source_links: ["https://www.hcch.net/en/states/authorities/details3/?aid=261"],
    client_safe_note:
      "Japan routing support includes translation coordination, apostille processing, and receiving-authority liaison.",
    operator_note:
      "Japanese legal translation is highly specialized. Identify vetted certified translators before accepting Japan-destination matters.",
  },
  {
    country_slug: "south-korea",
    country_name: "South Korea",
    region: "Asia",
    priority: "medium",
    partner_types_needed: ["translator", "attorney", "country_specialist"],
    language_needs: ["Korean"],
    authority_research_needed: true,
    translation_partner_needed: true,
    courier_partner_needed: true,
    attorney_partner_needed: true,
    genealogist_partner_needed: false,
    source_links: ["https://www.hcch.net/en/states/authorities/details3/?aid=271"],
    client_safe_note:
      "South Korea routing support includes translation coordination, apostille processing, and receiving-authority liaison.",
  },
  {
    country_slug: "india",
    country_name: "India",
    region: "Asia",
    priority: "medium",
    partner_types_needed: ["attorney", "country_specialist", "courier_partner"],
    language_needs: ["Hindi", "English"],
    authority_research_needed: true,
    translation_partner_needed: false,
    courier_partner_needed: true,
    attorney_partner_needed: true,
    genealogist_partner_needed: false,
    source_links: ["https://www.hcch.net/en/states/authorities/details3/?aid=239"],
    client_safe_note:
      "India routing support includes apostille processing and receiving-authority liaison.",
    operator_note:
      "India is a Hague member. Multiple apostille-issuing authorities exist by state. Verify with receiving authority.",
  },
  {
    country_slug: "united-arab-emirates",
    country_name: "United Arab Emirates",
    region: "Middle East",
    priority: "high",
    partner_types_needed: ["translator", "attorney", "country_specialist", "corporate_services_partner"],
    language_needs: ["Arabic"],
    authority_research_needed: true,
    translation_partner_needed: true,
    courier_partner_needed: true,
    attorney_partner_needed: true,
    genealogist_partner_needed: false,
    source_links: ["https://www.hcch.net/en/states/authorities/details3/?aid=1479"],
    client_safe_note:
      "UAE routing support includes translation coordination, apostille processing, and receiving-authority liaison.",
    operator_note:
      "UAE joined the Hague Convention in 2021. Notarized Arabic translation is commonly required. Verify with receiving authority before execution.",
  },
  {
    country_slug: "saudi-arabia",
    country_name: "Saudi Arabia",
    region: "Middle East",
    priority: "medium",
    partner_types_needed: ["translator", "attorney", "country_specialist", "corporate_services_partner"],
    language_needs: ["Arabic"],
    authority_research_needed: true,
    translation_partner_needed: true,
    courier_partner_needed: true,
    attorney_partner_needed: true,
    genealogist_partner_needed: false,
    source_links: [],
    client_safe_note:
      "Saudi Arabia routing support includes translation coordination, consular legalization coordination, and receiving-authority liaison.",
    operator_note:
      "Saudi Arabia is not a Hague member. Consular legalization chain required. Full chain research needed before accepting matters.",
  },
  {
    country_slug: "china",
    country_name: "China",
    region: "Asia",
    priority: "medium",
    partner_types_needed: ["translator", "attorney", "country_specialist", "corporate_services_partner"],
    language_needs: ["Chinese (Simplified)"],
    authority_research_needed: true,
    translation_partner_needed: true,
    courier_partner_needed: true,
    attorney_partner_needed: true,
    genealogist_partner_needed: false,
    source_links: [],
    client_safe_note:
      "China routing support includes translation coordination, apostille processing, and receiving-authority liaison.",
    operator_note:
      "China joined the Hague Convention in 2023. Receiving authority practices are still evolving. Authority research required before execution.",
  },
  {
    country_slug: "vietnam",
    country_name: "Vietnam",
    region: "Asia",
    priority: "medium",
    partner_types_needed: ["translator", "attorney", "country_specialist"],
    language_needs: ["Vietnamese"],
    authority_research_needed: true,
    translation_partner_needed: true,
    courier_partner_needed: true,
    attorney_partner_needed: true,
    genealogist_partner_needed: false,
    source_links: [],
    client_safe_note:
      "Vietnam routing support includes translation coordination and receiving-authority liaison.",
    operator_note:
      "Vietnam Hague status requires verification. Do not execute without authority research confirmation.",
  },
  {
    country_slug: "philippines",
    country_name: "Philippines",
    region: "Asia",
    priority: "medium",
    partner_types_needed: ["attorney", "country_specialist", "courier_partner"],
    language_needs: ["English", "Filipino/Tagalog"],
    authority_research_needed: true,
    translation_partner_needed: false,
    courier_partner_needed: true,
    attorney_partner_needed: true,
    genealogist_partner_needed: false,
    source_links: ["https://www.hcch.net/en/states/authorities/details3/?aid=338"],
    client_safe_note:
      "Philippines routing support includes apostille processing and receiving-authority liaison.",
  },
  {
    country_slug: "canada",
    country_name: "Canada",
    region: "North America",
    priority: "medium",
    partner_types_needed: ["attorney", "country_specialist", "courier_partner"],
    language_needs: ["English", "French"],
    authority_research_needed: false,
    translation_partner_needed: false,
    courier_partner_needed: true,
    attorney_partner_needed: true,
    genealogist_partner_needed: false,
    source_links: ["https://www.hcch.net/en/states/authorities/details3/?aid=119"],
    client_safe_note:
      "Canada routing support includes apostille processing and receiving-authority liaison.",
  },
  {
    country_slug: "australia",
    country_name: "Australia",
    region: "Oceania",
    priority: "medium",
    partner_types_needed: ["attorney", "country_specialist", "courier_partner"],
    language_needs: ["English"],
    authority_research_needed: false,
    translation_partner_needed: false,
    courier_partner_needed: true,
    attorney_partner_needed: true,
    genealogist_partner_needed: false,
    source_links: ["https://www.hcch.net/en/states/authorities/details3/?aid=67"],
    client_safe_note:
      "Australia routing support includes apostille processing and receiving-authority liaison.",
  },
]

// ── Query Functions ───────────────────────────────────────────────────────────

export function getAllianceExpansionTarget(
  countrySlug: string,
): AllianceExpansionTarget | undefined {
  return ALLIANCE_EXPANSION_TARGETS.find((t) => t.country_slug === countrySlug)
}

export function getHighPriorityAllianceTargets(): AllianceExpansionTarget[] {
  return ALLIANCE_EXPANSION_TARGETS.filter((t) => t.priority === "high")
}

export function getTargetsByPartnerNeed(
  partnerType: PartnerType,
): AllianceExpansionTarget[] {
  return ALLIANCE_EXPANSION_TARGETS.filter((t) =>
    t.partner_types_needed.includes(partnerType),
  )
}

export function getAuthorityResearchTargets(): AllianceExpansionTarget[] {
  return ALLIANCE_EXPANSION_TARGETS.filter((t) => t.authority_research_needed)
}
