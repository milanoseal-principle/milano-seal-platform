import type {
  ApostilleRoute,
  ApostilleRoutingResult,
  AuthorityLevel,
  DocumentAuthority,
} from "./types";
import { classifyDocumentAuthority } from "./documentAuthorityClassifier";
import { classifyDestination, HAGUE_ROUTING_NOTE } from "./hagueNonHagueRouting";
import { isFederalDocument } from "./federalAuthenticationRules";
import { buildApostilleChecklist } from "./apostilleSubmissionChecklist";

export interface ApostilleRoutingInput {
  documentType?: string;
  destinationCountry?: string;
}

export function routeApostille(input: ApostilleRoutingInput): ApostilleRoutingResult {
  const documentAuthority: DocumentAuthority = classifyDocumentAuthority(
    input.documentType
  );
  const destination = classifyDestination(input.destinationCountry);

  const warnings: string[] = [HAGUE_ROUTING_NOTE];
  let requiresManualReview = false;
  let route: ApostilleRoute = "manual_review";
  let authorityLevel: AuthorityLevel = "manual_review";
  let hagueDestination: boolean | null = null;

  if (destination === "hague") hagueDestination = true;
  else if (destination === "unknown") hagueDestination = null;

  if (documentAuthority === "unknown") {
    requiresManualReview = true;
    warnings.push("Document authority unknown — manual review required.");
  } else if (isFederalDocument(documentAuthority)) {
    route = "federal_authentication";
    authorityLevel = "department_of_state";
  } else if (documentAuthority === "state_vital_record") {
    route = "state_apostille";
    authorityLevel = "state";
  } else if (documentAuthority === "county_vital_record") {
    route = "county_certification_then_state";
    authorityLevel = "county_clerk";
  } else if (documentAuthority === "notarized_private_document") {
    route = "state_apostille";
    authorityLevel = "notary_commission";
  } else if (documentAuthority === "school_document") {
    route = "school_notarization_then_state";
    authorityLevel = "state";
  } else if (documentAuthority === "court_document") {
    route = "county_certification_then_state";
    authorityLevel = "court";
  } else if (
    documentAuthority === "professional_license" ||
    documentAuthority === "corporate_document" ||
    documentAuthority === "commercial_customs_document" ||
    documentAuthority === "translation_affidavit"
  ) {
    route = "state_apostille";
    authorityLevel = "state";
  }

  if (destination === "unknown") {
    requiresManualReview = true;
    warnings.push("Destination unknown — manual review required before routing.");
    if (route !== "federal_authentication" && route !== "manual_review") {
      // Keep route but flag for manual review; destination decides apostille vs consular.
      warnings.push(
        "Destination must be confirmed to determine apostille versus consular legalization."
      );
    }
  }

  return {
    documentAuthority,
    authorityLevel,
    route,
    hagueDestination,
    publicSummary:
      "Routing determined by document authority and destination review. Final acceptance remains subject to the receiving authority.",
    operatorChecklist: buildApostilleChecklist(route),
    warnings,
    requiresManualReview,
  };
}
