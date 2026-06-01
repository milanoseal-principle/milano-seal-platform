import type { Country, DocumentType, RejectionTrigger, Workflow } from "./types";

// ---------------------------------------------------------------------------
// Overrides table for specific country × document pairs that deviate from the
// base derivation logic.
// ---------------------------------------------------------------------------
const WORKFLOW_OVERRIDES: Record<string, Partial<Workflow>> = {
  "italy-power-of-attorney": {
    specialInstructions:
      "For Italian dual-citizenship proceedings, confirm whether the receiving Comune requires a wet-ink original apostille.",
    witnessRequired: false,
  },
  "france-power-of-attorney": {
    witnessRequired: true,
    witnessCount: 2,
    specialInstructions:
      "French law requires two witnesses for POA execution. Both witnesses must be present at the notarization appointment.",
  },
  "greece-power-of-attorney": {
    witnessRequired: true,
    witnessCount: 2,
    specialInstructions:
      "Greece requires two witnesses for POA execution. Witnesses must not be related to the principal.",
  },
  "brazil-power-of-attorney": {
    witnessRequired: true,
    witnessCount: 2,
    specialInstructions:
      "Brazil requires two witnesses for POA. Post-notarization translation into Portuguese by a sworn translator (tradutor juramentado) is required.",
  },
  "china-power-of-attorney": {
    specialInstructions:
      "China joined the Hague Apostille Convention on November 7, 2023. For documents predating this accession, consular legalization was required. Confirm current requirements with the receiving authority.",
  },
  "uae-power-of-attorney": {
    specialInstructions:
      "UAE joined the Hague Apostille Convention on September 19, 2022. Arabic translation by a certified translator is required. Some UAE government entities may still request additional Ministry of Foreign Affairs attestation.",
  },
  "saudi-arabia-power-of-attorney": {
    consularLegalizationRequired: true,
    apostilleRequired: false,
    specialInstructions:
      "Saudi Arabia is not a Hague member. Full consular legalization chain required: Notarization → Florida Department of State authentication → US Department of State authentication → Saudi Embassy attestation. Arabic translation required.",
  },
  "japan-birth-certificate": {
    specialInstructions:
      "Japan Family Registry (Koseki) accepts apostilled foreign birth certificates. Japanese translation by a certified translator is required.",
  },
  "south-korea-power-of-attorney": {
    specialInstructions:
      "Korea joined the Hague Convention in 2007. Korean translation certified by a court-appointed translator is required.",
  },
  "india-power-of-attorney": {
    translationRequired: false,
    specialInstructions:
      "India joined the Hague Convention in 2005. English documents are generally accepted without translation, but confirm with the receiving authority.",
  },
  "israel-power-of-attorney": {
    translationRequired: false,
    specialInstructions:
      "Israel typically accepts English-language documents without translation for commercial matters. Hebrew translation is recommended for civil registry submissions.",
  },
};

// ---------------------------------------------------------------------------
// buildExecutionPath — ordered steps for the execution of a given workflow
// ---------------------------------------------------------------------------
function buildExecutionPath(
  country: Country,
  document: DocumentType,
  isHague: boolean
): string[] {
  const steps: string[] = [];

  if (document.notarizationRequired) {
    steps.push(
      `Client executes ${document.name} before a Florida-commissioned notary (mobile or RON)`
    );
    steps.push(
      "Notary affixes embossed seal and completes acknowledgment certificate"
    );
  } else {
    steps.push(
      `Obtain certified copy of ${document.name} from ${document.floridaSourceAuthority}`
    );
  }

  if (country.requiresWitnesses && country.witnessCount) {
    steps.push(
      `${country.witnessCount} witness${country.witnessCount > 1 ? "es" : ""} must be present and sign the document`
    );
  }

  if (isHague) {
    steps.push(
      "Submit to Florida Department of State for Apostille authentication"
    );
  } else {
    steps.push(
      "Submit to Florida Department of State for state-level authentication"
    );
    steps.push(
      "Submit to U.S. Department of State for federal-level authentication"
    );
    steps.push(
      `Submit to ${country.name} Embassy or Consulate for final attestation`
    );
  }

  if (country.translationLanguage) {
    steps.push(
      `Certified ${country.translationLanguage} translation by a sworn translator`
    );
  }

  steps.push(`Courier delivery to ${country.name} receiving authority`);

  return steps;
}

// ---------------------------------------------------------------------------
// buildRejectionTriggers — common rejection reasons for a given workflow
// ---------------------------------------------------------------------------
function buildRejectionTriggers(
  country: Country,
  document: DocumentType,
  isHague: boolean
): RejectionTrigger[] {
  const triggers: RejectionTrigger[] = [];

  if (document.notarizationRequired) {
    triggers.push({
      trigger: "Notary seal not embossed or not legible",
      description: `${country.name} authorities require the notary's official seal to be clearly embossed. Rubber stamp seals may be rejected.`,
      severity: "fatal",
    });
    triggers.push({
      trigger: "Notary commission expired at time of execution",
      description:
        "If the notary's commission expired before the notarization date, the apostille will be denied by the Florida Department of State.",
      severity: "fatal",
    });
  }

  if (isHague) {
    triggers.push({
      trigger: "Apostille issued by incorrect authority",
      description:
        "For notarized Florida documents, the apostille must be issued by the Florida Department of State. County-level or federal authentication is not accepted in lieu of an apostille.",
      severity: "fatal",
    });
  } else {
    triggers.push({
      trigger: "Incomplete consular legalization chain",
      description: `${country.name} requires the full legalization chain: Florida Department of State → U.S. Department of State → ${country.name} Embassy attestation. Missing any link renders the document invalid.`,
      severity: "fatal",
    });
  }

  if (country.translationLanguage) {
    triggers.push({
      trigger: `Translation not certified by a sworn ${country.translationLanguage} translator`,
      description: `${country.name} requires certified translations. Machine-generated or uncertified translations are rejected.`,
      severity: "fatal",
    });
  }

  triggers.push({
    trigger: "Name mismatch between document and identification",
    description:
      "Any discrepancy between the principal's name on the document and their passport or government-issued ID may cause rejection.",
    severity: "correctable",
  });

  return triggers;
}

// ---------------------------------------------------------------------------
// deriveWorkflow — derives a complete Workflow from country + document data
// ---------------------------------------------------------------------------
export function deriveWorkflow(
  country: Country,
  document: DocumentType
): Workflow {
  const isHague = country.corridorType === "hague";
  const baseTranslationRequired = !!country.translationLanguage;
  const baseTimeline = isHague ? "7–14 Business Days" : "3–5 Weeks";

  const executionPath = buildExecutionPath(country, document, isHague);
  const rejectionTriggers = buildRejectionTriggers(country, document, isHague);

  const overrideKey = `${country.id}-${document.id}`;
  const override: Partial<Workflow> = WORKFLOW_OVERRIDES[overrideKey] ?? {};

  // Determine witness fields — override wins, then country defaults
  const witnessRequired =
    override.witnessRequired !== undefined
      ? override.witnessRequired
      : country.requiresWitnesses;
  const witnessCount =
    override.witnessCount !== undefined
      ? override.witnessCount
      : country.witnessCount;

  // Determine translation fields
  const translationRequired =
    override.translationRequired !== undefined
      ? override.translationRequired
      : baseTranslationRequired;
  const translationLanguage =
    override.translationLanguage !== undefined
      ? override.translationLanguage
      : country.translationLanguage;

  // Determine apostille / consular fields
  const apostilleRequired =
    override.apostilleRequired !== undefined
      ? override.apostilleRequired
      : isHague;
  const consularLegalizationRequired =
    override.consularLegalizationRequired !== undefined
      ? override.consularLegalizationRequired
      : !isHague;

  return {
    id: `${country.id}-${document.id}`,
    countryId: country.id,
    documentId: document.id,
    routeType: isHague ? "Hague Convention" : "Consular Authentication",
    notarizationRequired:
      override.notarizationRequired !== undefined
        ? override.notarizationRequired
        : document.notarizationRequired,
    notarizationType: document.notarizationRequired ? "either" : undefined,
    witnessRequired,
    witnessCount: witnessRequired ? witnessCount : undefined,
    translationRequired,
    translationLanguage: translationRequired ? translationLanguage : undefined,
    certifiedTranslationRequired: translationRequired
      ? (country.certifiedTranslationRequired ?? true)
      : false,
    apostilleRequired,
    apostilleAuthority: apostilleRequired
      ? "Florida Department of State"
      : undefined,
    consularLegalizationRequired,
    estimatedTimeline: override.estimatedTimeline ?? baseTimeline,
    executionPath: override.executionPath ?? executionPath,
    rejectionTriggers: override.rejectionTriggers ?? rejectionTriggers,
    specialInstructions: override.specialInstructions,
    isDerived: true,
    validFrom: "2025-01-01",
    lastReviewed: "2026-01-01",
    sourceReference: isHague
      ? "Hague Convention of 5 October 1961 (HCCH)"
      : "US Department of State — Apostille and Authentication Requirements",
  };
}
