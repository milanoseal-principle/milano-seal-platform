import type { ApostilleRoute } from "./types";

export function buildApostilleChecklist(route: ApostilleRoute): string[] {
  const base = [
    "Confirm document authority and issuing jurisdiction.",
    "Confirm destination classification (operator-reviewed).",
    "Confirm return delivery and packet requirements.",
  ];
  switch (route) {
    case "federal_authentication":
      return [...base, "Route through federal authentication (Department of State)."];
    case "county_certification_then_state":
      return [...base, "Obtain county clerk certification before state submission."];
    case "school_notarization_then_state":
      return [...base, "Obtain registrar/notary certification before state submission."];
    case "agency_certification_then_state":
      return [...base, "Obtain agency certification before state submission."];
    case "consular_legalization":
      return [...base, "Coordinate consular legalization for the destination."];
    case "manual_review":
      return [...base, "Escalate to manual review before routing."];
    case "state_apostille":
    default:
      return [...base, "Submit to issuing-state authority for apostille."];
  }
}
