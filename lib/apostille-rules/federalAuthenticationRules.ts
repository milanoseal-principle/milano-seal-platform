import type { DocumentAuthority } from "./types";

export const FEDERAL_DOCUMENT_AUTHORITIES: DocumentAuthority[] = [
  "fbi_background_check",
  "federal_agency_document",
];

export interface FederalAuthenticationRule {
  requiresDepartmentOfState: boolean;
  note: string;
}

export const FEDERAL_AUTHENTICATION_RULE: FederalAuthenticationRule = {
  requiresDepartmentOfState: true,
  note: "Federal documents (FBI background checks, federal agency documents) route to federal authentication through the U.S. Department of State.",
};

export function isFederalDocument(authority: DocumentAuthority): boolean {
  return FEDERAL_DOCUMENT_AUTHORITIES.includes(authority);
}
