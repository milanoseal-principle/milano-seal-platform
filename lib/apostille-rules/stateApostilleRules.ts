import type { ApostilleRoute, DocumentAuthority } from "./types";

export interface StateApostilleRule {
  documentAuthority: DocumentAuthority;
  route: ApostilleRoute;
  note: string;
}

export const STATE_APOSTILLE_RULES: StateApostilleRule[] = [
  {
    documentAuthority: "state_vital_record",
    route: "state_apostille",
    note: "State vital records route via issuing-state apostille rules.",
  },
  {
    documentAuthority: "county_vital_record",
    route: "county_certification_then_state",
    note: "County vital records may require county certification before state apostille.",
  },
  {
    documentAuthority: "notarized_private_document",
    route: "state_apostille",
    note: "Notarized private documents route via notary commission then state apostille.",
  },
  {
    documentAuthority: "school_document",
    route: "school_notarization_then_state",
    note: "School documents may require registrar/notary certification before state apostille.",
  },
];

export function getStateApostilleRule(
  documentAuthority: DocumentAuthority
): StateApostilleRule | undefined {
  return STATE_APOSTILLE_RULES.find((r) => r.documentAuthority === documentAuthority);
}
