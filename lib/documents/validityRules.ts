import type { ValidityStatus } from "./documentGovernance";

export interface ValidityCheckInput {
  issueDate?: string | null;
  expirationDate?: string | null;
  destinationCountry?: string | null;
  documentFamily?: string | null;
  translationAgeMonths?: number | null;
}

export function evaluateDocumentValidity(input: ValidityCheckInput): ValidityStatus {
  const now = new Date();

  if (input.expirationDate) {
    const exp = new Date(input.expirationDate);
    if (exp < now) return "EXPIRED";
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (exp < thirtyDays) return "EXPIRING_SOON";
  }

  // Destination-dependent docs always need review
  const authorityDependentFamilies = ["POWER_OF_ATTORNEY","AFFIDAVIT","CORPORATE_RESOLUTION","PROBATE"];
  if (input.documentFamily && authorityDependentFamilies.includes(input.documentFamily)) {
    return "AUTHORITY_DEPENDENT";
  }

  if (!input.issueDate) return "UNKNOWN";

  return "VALID";
}

// Never say "valid everywhere" or "guaranteed"
export const VALIDITY_CLIENT_LABEL: Record<ValidityStatus, string> = {
  UNKNOWN: "Coordinator Review Required",
  VALID: "Document on File",
  EXPIRING_SOON: "Coordinator Review Recommended",
  EXPIRED: "Coordinator Review Required",
  REVIEW_REQUIRED: "Coordinator Review Required",
  AUTHORITY_DEPENDENT: "Subject to Receiving Authority",
};
