// Global Execution Toolkit — Pure computation library
// No network calls. No DB calls. No Supabase. No Shippo API.
// All functions are pure and take typed input, returning ToolResult.

import { getLanguageRouting } from "@/lib/hague-countries";
import { JURISDICTIONS } from "@/lib/jurisdictions";

// ─── Standard output interface ────────────────────────────────────────────────

export interface ToolResult<T = Record<string, unknown>> {
  result: T;
  confidence: "high" | "medium" | "low" | "manual_review";
  source_type: "static_registry" | "db_lookup" | "computed" | "manual";
  manual_review_flag: boolean;
  next_action: string;
  operator_note: string;
  client_summary: string;
}

// ─── Static registries ────────────────────────────────────────────────────────

const HAGUE_MEMBER_COUNTRIES = new Set([
  "Italy",
  "Spain",
  "Germany",
  "France",
  "Portugal",
  "Mexico",
  "Japan",
  "South Korea",
  "Netherlands",
  "Belgium",
  "Switzerland",
  "Austria",
  "Greece",
  "Poland",
  "Czech Republic",
  "Hungary",
  "Romania",
  "Bulgaria",
  "Croatia",
  "Slovakia",
  "Slovenia",
  "Estonia",
  "Latvia",
  "Lithuania",
  "Finland",
  "Sweden",
  "Denmark",
  "Norway",
  "Ireland",
  "United Kingdom",
  "Australia",
  "New Zealand",
  "Brazil",
  "Argentina",
  "Colombia",
  "Peru",
  "Chile",
  "Ecuador",
  "Russia",
  "China",
  "India",
  "South Africa",
  "Morocco",
  "Israel",
  "Turkey",
  "Thailand",
  "Philippines",
  "Indonesia",
  "Malaysia",
  "Singapore",
  "United Arab Emirates",
  "Saudi Arabia",
  "Kuwait",
  "Bahrain",
  "Qatar",
  "Oman",
  "Egypt",
  "Ukraine",
  "Serbia",
  "Albania",
  "Kosovo",
  "Bosnia and Herzegovina",
  "North Macedonia",
  "Montenegro",
  // Canada acceded Jan 2024
  "Canada",
  // Additional confirmed members
  "Luxembourg",
  "Panama",
  "Costa Rica",
  "Uruguay",
  "Venezuela",
  "Hong Kong",
] as const);

const NON_HAGUE_COUNTRIES = new Set([
  "Vatican City",
  "Taiwan",
  "Myanmar",
  "Vietnam",
  "Pakistan",
  "Bangladesh",
  "Nigeria",
  "Ghana",
  "Kenya",
  "Ethiopia",
  "Tanzania",
] as const);

// High-risk shipping destinations (limited tracking / carrier reliability)
const HIGH_RISK_SHIPPING_COUNTRIES = new Set([
  "Nigeria",
  "Ghana",
  "Ethiopia",
  "Tanzania",
  "Myanmar",
  "Bangladesh",
  "Pakistan",
  "Kenya",
] as const);

// Embassy notes — generic and safe, no fabricated addresses or phone numbers
const EMBASSY_NOTES: Record<string, string> = {
  Taiwan:
    "Taiwan does not have a formal US embassy. Documents are routed via the American Institute in Taiwan (AIT). Manual verification of current requirements is advised before submission.",
  Vietnam:
    "Vietnamese authorities may require legalization through the Vietnamese Embassy or Consulate. Confirm current requirements with the receiving authority before submission.",
  Nigeria:
    "Contact the Nigerian Embassy or Consulate. Requirements vary by document type and receiving state. Confirm requirements before submission.",
  Ghana:
    "Contact the Ghana Embassy or Consulate. Requirements vary by document type. Confirm requirements with the receiving authority.",
  Pakistan:
    "Contact the Pakistani Embassy or Consulate. Legalization requirements vary. Confirm with the receiving authority before submission.",
  Bangladesh:
    "Contact the Bangladesh Embassy or Consulate. Requirements vary by document type. Manual verification advised.",
  Myanmar:
    "Contact the Myanmar Embassy or Consulate. Requirements vary. Manual verification strongly advised before submission.",
  Kenya:
    "Contact the Kenyan Embassy or Consulate. Requirements vary by document type. Confirm with the receiving authority.",
};

// ─── Tool 1: Hague Checker ─────────────────────────────────────────────────

export function checkHague(country: string): ToolResult<{
  country: string;
  is_hague_member: boolean | null;
  apostille_route: string;
}> {
  const normalized = (country ?? "").trim();

  if (!normalized) {
    return {
      result: {
        country: normalized,
        is_hague_member: null,
        apostille_route: "Unknown — country not specified",
      },
      confidence: "manual_review",
      source_type: "static_registry",
      manual_review_flag: true,
      next_action: "Specify destination country to determine Hague status",
      operator_note:
        "Country name was empty or missing. Re-submit with a valid country name.",
      client_summary:
        "We were unable to determine Hague status without a destination country.",
    };
  }

  // Normalize case for lookup
  const matchHague = [...HAGUE_MEMBER_COUNTRIES].find(
    (c) => c.toLowerCase() === normalized.toLowerCase(),
  );
  const matchNonHague = [...NON_HAGUE_COUNTRIES].find(
    (c) => c.toLowerCase() === normalized.toLowerCase(),
  );

  if (matchHague) {
    return {
      result: {
        country: matchHague,
        is_hague_member: true,
        apostille_route:
          "US apostille from issuing state authority → international delivery",
      },
      confidence: "high",
      source_type: "static_registry",
      manual_review_flag: false,
      next_action: "Request US apostille from issuing state authority",
      operator_note: `${matchHague} is a confirmed Hague Convention member. A US apostille from the issuing state is the standard authentication path. No embassy chain is needed.`,
      client_summary: `${matchHague} participates in the Hague Apostille Convention. A US apostille from the issuing state is typically the appropriate authentication path for this destination.`,
    };
  }

  if (matchNonHague) {
    return {
      result: {
        country: matchNonHague,
        is_hague_member: false,
        apostille_route:
          "Embassy/consular authentication chain — not a Hague apostille path",
      },
      confidence: "high",
      source_type: "static_registry",
      manual_review_flag: false,
      next_action:
        "Contact receiving authority — embassy/consular authentication may apply",
      operator_note: `${matchNonHague} is not a Hague Convention member. Authentication requires a legalization chain: notarization → state-level authentication → US Department of State → Embassy/Consulate of the destination country. Confirm current requirements with the receiving authority.`,
      client_summary: `${matchNonHague} is not part of the Hague Apostille Convention. Document authentication for this destination involves a multi-step process through embassy or consular channels. Requirements are confirmed with the receiving authority before submission.`,
    };
  }

  // Unknown country
  return {
    result: {
      country: normalized,
      is_hague_member: null,
      apostille_route: "Unknown — manual verification required",
    },
    confidence: "manual_review",
    source_type: "static_registry",
    manual_review_flag: true,
    next_action: "Manual verification required — contact receiving authority",
    operator_note: `"${normalized}" was not found in either the Hague members or known non-Hague registry. Verify the country name spelling and check with the receiving authority or the Hague Conference country list at hcch.net.`,
    client_summary: `We were unable to confirm the Hague status for "${normalized}" from our current registry. A manual verification step is included before processing to confirm the authentication path.`,
  };
}

// ─── Tool 2: Legalization Validator ──────────────────────────────────────────

export function validateLegalization(params: {
  country: string;
  document_type?: string;
  apostille_required?: boolean;
}): ToolResult<{
  country: string;
  route: "apostille" | "embassy_chain" | "direct" | "unknown";
  sequence: string[];
  embassy_dependency: boolean;
}> {
  const country = (params.country ?? "").trim();

  if (!country) {
    return {
      result: {
        country: country,
        route: "unknown",
        sequence: [],
        embassy_dependency: false,
      },
      confidence: "manual_review",
      source_type: "static_registry",
      manual_review_flag: true,
      next_action: "Specify destination country to determine legalization route",
      operator_note:
        "Country was not specified. Cannot determine legalization route.",
      client_summary:
        "A destination country is needed to determine the legalization path.",
    };
  }

  const hague = checkHague(country);

  if (hague.result.is_hague_member === true) {
    return {
      result: {
        country: hague.result.country,
        route: "apostille",
        sequence: [
          "Notarization",
          "US apostille from issuing state",
          "International delivery",
        ],
        embassy_dependency: false,
      },
      confidence: "high",
      source_type: "static_registry",
      manual_review_flag: false,
      next_action:
        "Proceed with notarization and obtain US apostille from issuing state",
      operator_note: `Apostille route confirmed for ${hague.result.country}. Sequence: notarization → apostille from issuing state → international delivery. No embassy chain required.`,
      client_summary: `For documents destined to ${hague.result.country}, the standard path is notarization followed by a US apostille from the issuing state. No embassy involvement is typically needed.`,
    };
  }

  if (hague.result.is_hague_member === false) {
    return {
      result: {
        country: hague.result.country,
        route: "embassy_chain",
        sequence: [
          "Notarization",
          "State-level authentication",
          "US Dept of State legalization",
          "Embassy/Consulate legalization",
        ],
        embassy_dependency: true,
      },
      confidence: "high",
      source_type: "static_registry",
      manual_review_flag: false,
      next_action:
        "Initiate embassy chain: notarization → state authentication → US Dept of State → Embassy/Consulate",
      operator_note: `Non-Hague legalization chain required for ${hague.result.country}. This involves four steps and typically extends the processing timeline. Confirm current embassy requirements before submission.`,
      client_summary: `Documents for ${hague.result.country} follow a multi-step legalization process through embassy or consular channels. We confirm current requirements with the receiving authority before submitting on your behalf.`,
    };
  }

  // Unknown
  return {
    result: {
      country: country,
      route: "unknown",
      sequence: [],
      embassy_dependency: false,
    },
    confidence: "manual_review",
    source_type: "static_registry",
    manual_review_flag: true,
    next_action:
      "Manual verification required — Hague status for this country is unconfirmed",
    operator_note: `Country "${country}" is not in our static Hague registry. Manual verification of the authentication path is required before proceeding.`,
    client_summary: `We were unable to determine the legalization route for "${country}" from our registry. A manual review step is included to confirm the correct path before processing.`,
  };
}

// ─── Tool 3: Embassy Locator ──────────────────────────────────────────────────

export function locateEmbassy(country: string): ToolResult<{
  country: string;
  embassy_notes: string | null;
  manual_review_required: boolean;
}> {
  const normalized = (country ?? "").trim();

  if (!normalized) {
    return {
      result: {
        country: normalized,
        embassy_notes: null,
        manual_review_required: true,
      },
      confidence: "manual_review",
      source_type: "static_registry",
      manual_review_flag: true,
      next_action:
        "Manual embassy lookup required — check state.gov/embassies",
      operator_note: "Country was not specified.",
      client_summary:
        "A destination country is needed to look up embassy guidance.",
    };
  }

  const matchKey = Object.keys(EMBASSY_NOTES).find(
    (k) => k.toLowerCase() === normalized.toLowerCase(),
  );

  if (matchKey) {
    const notes = EMBASSY_NOTES[matchKey];
    return {
      result: {
        country: matchKey,
        embassy_notes: notes,
        manual_review_required: true,
      },
      confidence: "medium",
      source_type: "static_registry",
      manual_review_flag: true,
      next_action:
        "Review embassy notes below and confirm current requirements before submission",
      operator_note: `General embassy guidance found for ${matchKey}. No fabricated contact details — always verify current requirements at state.gov/embassies or the relevant embassy website.`,
      client_summary: notes,
    };
  }

  // Check if Hague — embassy lookup typically not required for Hague countries
  const hague = checkHague(normalized);
  if (hague.result.is_hague_member === true) {
    return {
      result: {
        country: hague.result.country,
        embassy_notes:
          "This country participates in the Hague Apostille Convention. An embassy chain is typically not required — a US apostille from the issuing state is the standard path.",
        manual_review_required: false,
      },
      confidence: "high",
      source_type: "static_registry",
      manual_review_flag: false,
      next_action:
        "Use apostille route — embassy legalization is not typically required for Hague members",
      operator_note: `${hague.result.country} is a Hague member. Embassy authentication is not part of the standard path. If the specific receiving authority requests additional steps, review at that stage.`,
      client_summary: `${hague.result.country} is part of the Hague Apostille Convention, so embassy involvement is not typically part of the document authentication process.`,
    };
  }

  // No entry found
  return {
    result: {
      country: normalized,
      embassy_notes: null,
      manual_review_required: true,
    },
    confidence: "manual_review",
    source_type: "static_registry",
    manual_review_flag: true,
    next_action:
      "Manual embassy lookup required — check state.gov/embassies",
    operator_note: `No embassy notes found in our registry for "${normalized}". Verify current requirements at https://www.state.gov/embassies-and-consulates/ or the destination country embassy website.`,
    client_summary: `Embassy guidance for "${normalized}" was not found in our current registry. A manual lookup step is included to confirm requirements before submission.`,
  };
}

// ─── Tool 4: RON Eligibility Checker ─────────────────────────────────────────

export function checkRONEligibility(params: {
  signer_state: string;
  document_type?: string;
  signer_location?: "in_state" | "out_of_state" | "international" | "unknown";
}): ToolResult<{
  state: string;
  ron_authorized: boolean | null;
  ron_status_note: string;
  signer_location_note: string;
}> {
  const rawState = (params.signer_state ?? "").trim();

  if (!rawState) {
    return {
      result: {
        state: rawState,
        ron_authorized: null,
        ron_status_note: "State not specified",
        signer_location_note: "",
      },
      confidence: "manual_review",
      source_type: "static_registry",
      manual_review_flag: true,
      next_action: "Specify the issuing state to determine RON eligibility",
      operator_note: "No state was provided. RON eligibility cannot be determined.",
      client_summary:
        "A US state is needed to determine Remote Online Notarization eligibility.",
    };
  }

  // Match by code or name (case-insensitive)
  const jurisdiction = JURISDICTIONS.find(
    (j) =>
      j.kind === "state" &&
      (j.code.toLowerCase() === rawState.toLowerCase() ||
        j.name.toLowerCase() === rawState.toLowerCase()),
  );

  // Location note
  let signer_location_note = "";
  const loc = params.signer_location;
  if (loc === "international") {
    signer_location_note =
      "International signer: RON may have additional platform requirements. Credential analysis and knowledge-based authentication (KBA) are typically required for international sessions. Confirm platform capabilities before scheduling.";
  } else if (loc === "in_state") {
    signer_location_note =
      "In-state signer: standard RON process applies for this jurisdiction.";
  } else if (loc === "out_of_state") {
    signer_location_note =
      "Out-of-state signer: confirm that the commissioning state's RON rules permit notarizing signers located outside the state.";
  } else {
    signer_location_note =
      "Signer location not specified. Confirm signer location before scheduling RON session.";
  }

  if (!jurisdiction) {
    return {
      result: {
        state: rawState,
        ron_authorized: null,
        ron_status_note: `State "${rawState}" not found in our jurisdiction registry.`,
        signer_location_note,
      },
      confidence: "manual_review",
      source_type: "static_registry",
      manual_review_flag: true,
      next_action: `Manually verify RON authorization for "${rawState}" with that state's notary regulator`,
      operator_note: `"${rawState}" was not matched to any jurisdiction in our registry. Verify the state name or code and consult the state's notary regulator for current RON rules.`,
      client_summary: `We were unable to find RON information for "${rawState}" in our current registry. A manual verification step is included.`,
    };
  }

  const ronAuthorized = jurisdiction.ron !== null;
  const ronStatusNote = jurisdiction.ron
    ? `RON authorized: ${jurisdiction.ron}`
    : "RON not currently authorized for this state. In-person or mobile notarization may be required.";

  return {
    result: {
      state: jurisdiction.name,
      ron_authorized: ronAuthorized,
      ron_status_note: ronStatusNote,
      signer_location_note,
    },
    confidence: "high",
    source_type: "static_registry",
    manual_review_flag: false,
    next_action: ronAuthorized
      ? `Schedule RON session — ${jurisdiction.name} RON is authorized. ${jurisdiction.execution_path}`
      : `In-person notarization required — ${jurisdiction.name} does not currently authorize RON`,
    operator_note: `${jurisdiction.name} (${jurisdiction.code}): ${ronStatusNote} Authentication path: ${jurisdiction.authentication_path}.`,
    client_summary: ronAuthorized
      ? `${jurisdiction.name} authorizes Remote Online Notarization. Your document can be notarized via a secure video session — no in-person appearance required.`
      : `${jurisdiction.name} does not currently authorize Remote Online Notarization. An in-person or mobile notarization appointment would be needed for this state.`,
  };
}

// ─── Tool 5: Signer Requirement Checker ──────────────────────────────────────

export function checkSignerRequirements(params: {
  jurisdiction: string;
  document_type?: string;
}): ToolResult<{
  jurisdiction: string;
  signer_count: number | null;
  witness_required: boolean | null;
  witness_count: number | null;
  id_required: boolean;
  witness_rules_note: string;
}> {
  const rawJurisdiction = (params.jurisdiction ?? "").trim();

  if (!rawJurisdiction) {
    return {
      result: {
        jurisdiction: rawJurisdiction,
        signer_count: null,
        witness_required: null,
        witness_count: null,
        id_required: true,
        witness_rules_note: "Jurisdiction not specified",
      },
      confidence: "manual_review",
      source_type: "static_registry",
      manual_review_flag: true,
      next_action:
        "Specify jurisdiction to determine signer and witness requirements",
      operator_note: "No jurisdiction was provided.",
      client_summary:
        "A jurisdiction is needed to determine signer and witness requirements.",
    };
  }

  const jurisdiction = JURISDICTIONS.find(
    (j) =>
      j.code.toLowerCase() === rawJurisdiction.toLowerCase() ||
      j.name.toLowerCase() === rawJurisdiction.toLowerCase(),
  );

  if (!jurisdiction) {
    return {
      result: {
        jurisdiction: rawJurisdiction,
        signer_count: null,
        witness_required: null,
        witness_count: null,
        id_required: true,
        witness_rules_note: `Jurisdiction "${rawJurisdiction}" not found in registry`,
      },
      confidence: "manual_review",
      source_type: "static_registry",
      manual_review_flag: true,
      next_action: `Manually verify signer and witness requirements for "${rawJurisdiction}"`,
      operator_note: `"${rawJurisdiction}" was not matched in the jurisdiction registry. Verify the jurisdiction name or code.`,
      client_summary: `We were unable to find signer requirement details for "${rawJurisdiction}". A manual verification step is included.`,
    };
  }

  // Parse witness rules text for counts
  const rules = jurisdiction.witness_rules ?? "";
  const witnessRequired =
    /witness/i.test(rules) && !/no witness|optional|not required/i.test(rules);

  // Try to extract witness count from text (e.g., "Two witnesses", "One witness", "2 witnesses")
  let witnessCount: number | null = null;
  if (witnessRequired) {
    const twoMatch = /\b(two|2)\b.*witness/i.test(rules);
    const oneMatch = /\b(one|1|single)\b.*witness/i.test(rules);
    if (twoMatch) witnessCount = 2;
    else if (oneMatch) witnessCount = 1;
    else witnessCount = 1; // default if witness mentioned but count unclear
  }

  // Signer count: typically 1 for most documents, some require multiple
  const signerCount = 1;

  return {
    result: {
      jurisdiction: jurisdiction.name,
      signer_count: signerCount,
      witness_required: witnessRequired,
      witness_count: witnessCount,
      id_required: true,
      witness_rules_note: rules,
    },
    confidence: "high",
    source_type: "static_registry",
    manual_review_flag: false,
    next_action: witnessRequired
      ? `Arrange ${witnessCount} witness${witnessCount === 1 ? "" : "es"} for the notarization session — ${jurisdiction.name} rules apply`
      : "No witnesses required for this jurisdiction — standard identification check applies",
    operator_note: `${jurisdiction.name}: ${rules} ID: government-issued photo ID required for all signers.`,
    client_summary: witnessRequired
      ? `For documents notarized under ${jurisdiction.name} rules, ${witnessCount} adult witness${witnessCount === 1 ? "" : "es"} is typically required in addition to the signer. A valid government-issued photo ID is required for identification.`
      : `For documents notarized under ${jurisdiction.name} rules, witnesses are generally not required. A valid government-issued photo ID is needed for identification.`,
  };
}

// ─── Tool 6: Translation Detector ────────────────────────────────────────────

export function detectTranslation(params: {
  destination_country: string;
  document_language?: string;
}): ToolResult<{
  destination_country: string;
  translation_likely: boolean | null;
  target_languages: string[];
  sworn_translation_note: string;
}> {
  const country = (params.destination_country ?? "").trim();

  if (!country) {
    return {
      result: {
        destination_country: country,
        translation_likely: null,
        target_languages: [],
        sworn_translation_note: "Destination country not specified",
      },
      confidence: "manual_review",
      source_type: "static_registry",
      manual_review_flag: true,
      next_action:
        "Specify destination country to determine translation requirements",
      operator_note: "No destination country was provided.",
      client_summary:
        "A destination country is needed to determine translation requirements.",
    };
  }

  const routing = getLanguageRouting(country);

  if (!routing) {
    return {
      result: {
        destination_country: country,
        translation_likely: null,
        target_languages: [],
        sworn_translation_note:
          "Translation requirements unknown — manual verification required",
      },
      confidence: "manual_review",
      source_type: "static_registry",
      manual_review_flag: true,
      next_action:
        "Manual verification required — translation requirements for this destination are not in our registry",
      operator_note: `No language routing data found for "${country}". Confirm translation requirements with the receiving authority before submitting documents.`,
      client_summary: `Translation requirements for "${country}" are not in our current registry. A manual verification step is included to confirm whether translation is needed before submission.`,
    };
  }

  // If document_language is provided, check against official languages
  const docLang = (params.document_language ?? "").trim().toLowerCase();
  let translationLikely = routing.translationLikely;
  let confidence: "high" | "medium" = "medium";

  if (docLang) {
    const officialLower = routing.officialLanguages.map((l) => l.toLowerCase());
    const docMatchesOfficial = officialLower.some(
      (lang) => lang === docLang || lang.startsWith(docLang) || docLang.startsWith(lang.split(" ")[0]),
    );
    if (docMatchesOfficial) {
      translationLikely = false;
      confidence = "high";
    } else {
      translationLikely = true;
      confidence = "high";
    }
  }

  const swornNote = translationLikely
    ? `Translation into ${routing.officialLanguages.join(" or ")} is typically needed. A sworn or certified translation may be required depending on the receiving authority. ${routing.translationNote}`
    : `Translation is generally not required for this destination — ${routing.translationNote}`;

  return {
    result: {
      destination_country: routing.country,
      translation_likely: translationLikely,
      target_languages: routing.officialLanguages,
      sworn_translation_note: swornNote,
    },
    confidence: confidence,
    source_type: "static_registry",
    manual_review_flag: false,
    next_action: translationLikely
      ? `Arrange certified translation into ${routing.officialLanguages[0]} — confirm with receiving authority if sworn translation is required`
      : "No translation appears necessary — confirm with receiving authority before final submission",
    operator_note: `${routing.country}: official languages ${routing.officialLanguages.join(", ")}. Translation likely: ${translationLikely}. Note: ${routing.translationNote}`,
    client_summary: translationLikely
      ? `Your document may need to be translated into ${routing.officialLanguages.join(" or ")} for submission to ${routing.country}. We confirm the specific translation requirements with the receiving authority before proceeding.`
      : `Translation is generally not required for ${routing.country}, as the destination accepts English or the document language matches the official language. Requirements are confirmed before submission.`,
  };
}

// ─── Tool 7: Courier Matrix ───────────────────────────────────────────────────

function isUSDestination(country: string): boolean {
  const c = (country ?? "").trim().toLowerCase();
  return c === "us" || c === "usa" || c === "united states" || c === "united states of america";
}

export function getCourierMatrix(params: {
  destination_country: string;
  urgent?: boolean;
  signature_required?: boolean;
}): ToolResult<{
  destination_country: string;
  is_international: boolean;
  recommended_carriers: string[];
  customs_note_required: boolean;
  signature_requirement: string;
  courier_risk: "low" | "medium" | "high";
  delivery_estimate_days: string;
}> {
  const country = (params.destination_country ?? "").trim();

  if (!country) {
    return {
      result: {
        destination_country: country,
        is_international: false,
        recommended_carriers: [],
        customs_note_required: false,
        signature_requirement: "Unknown",
        courier_risk: "medium",
        delivery_estimate_days: "Unknown",
      },
      confidence: "manual_review",
      source_type: "computed",
      manual_review_flag: true,
      next_action: "Specify destination country to generate courier guidance",
      operator_note: "No destination country provided.",
      client_summary: "A destination country is needed for courier guidance.",
    };
  }

  const isIntl = !isUSDestination(country);
  const isHighRisk = [...HIGH_RISK_SHIPPING_COUNTRIES].some(
    (c) => c.toLowerCase() === country.toLowerCase(),
  );
  const courierRisk: "low" | "medium" | "high" = isHighRisk
    ? "high"
    : isIntl
      ? "medium"
      : "low";

  // Carrier preference — mirrors selectRate logic from lib/shippo.ts
  let carriers: string[];
  if (isHighRisk) {
    carriers = ["DHL Express"];
  } else if (isIntl) {
    carriers = ["DHL Express", "FedEx International", "UPS International"];
    if (params.urgent) {
      carriers = ["DHL Express", "FedEx International Priority"];
    }
  } else {
    // Domestic US
    carriers = ["USPS Priority Mail", "UPS Ground", "FedEx Ground"];
    if (params.urgent) {
      carriers = ["USPS Priority Mail Express", "UPS Next Day Air", "FedEx Overnight"];
    }
  }

  // Exclude USPS if signature required (mirrors shippo.ts selectRate logic)
  if (params.signature_required) {
    carriers = carriers.filter((c) => !c.toLowerCase().startsWith("usps"));
    if (carriers.length === 0) {
      carriers = isIntl
        ? ["DHL Express", "FedEx International"]
        : ["UPS Ground", "FedEx Ground"];
    }
  }

  const customsRequired = isIntl;
  const signatureRequirement = params.signature_required
    ? "Adult signature required on delivery — USPS excluded from carrier selection"
    : "Signature on delivery is optional — add at label purchase if needed";

  const deliveryEstimate = isIntl
    ? params.urgent
      ? "1–3 business days (express international)"
      : "3–7 business days (standard international)"
    : params.urgent
      ? "1–2 business days (domestic express)"
      : "1–3 business days (domestic standard)";

  return {
    result: {
      destination_country: country,
      is_international: isIntl,
      recommended_carriers: carriers,
      customs_note_required: customsRequired,
      signature_requirement: signatureRequirement,
      courier_risk: courierRisk,
      delivery_estimate_days: deliveryEstimate,
    },
    confidence: "high",
    source_type: "computed",
    manual_review_flag: isHighRisk,
    next_action: isHighRisk
      ? "Use DHL Express only — this destination has limited carrier tracking reliability. Confirm delivery capabilities before purchase."
      : `Select from recommended carriers. ${customsRequired ? "Prepare customs documentation before shipment." : "Domestic shipment — no customs documentation needed."}`,
    operator_note: `Destination: ${country}. International: ${isIntl}. Risk: ${courierRisk}. Carriers selected based on destination type, urgency, and signature requirements. Carrier list mirrors platform preference logic (DHL/FedEx/UPS for international; USPS/UPS/FedEx domestic; USPS excluded when signature required).`,
    client_summary: isIntl
      ? `Your documents will be shipped internationally to ${country} via ${carriers[0]}${carriers.length > 1 ? ` or ${carriers[1]}` : ""}. Customs documentation is included with international shipments. Estimated delivery: ${deliveryEstimate}.`
      : `Your documents will be shipped domestically via ${carriers[0]}${carriers.length > 1 ? ` or ${carriers[1]}` : ""}. Estimated delivery: ${deliveryEstimate}.`,
  };
}
