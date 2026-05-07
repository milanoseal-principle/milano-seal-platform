import { validateCompliance } from "@/lib/compliance";

export interface ValidatableDeal {
  id?: string;
  destination_country?: string | null;
  country?: string | null;
  document_type?: string | null;
  service_type?: string | null;
  mobile?: boolean | null;
  signers?: number | null;
  witnesses?: number | null;
}

export class ComplianceError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
    this.name = "ComplianceError";
  }
}

export function validateDeal(deal: ValidatableDeal) {
  const country = deal.destination_country || deal.country || "United States";
  const docType = deal.document_type || deal.service_type || null;

  if (!docType) {
    throw new ComplianceError(
      "Document type is required to validate compliance.",
      "MISSING_DOCUMENT_TYPE",
    );
  }

  const rules = validateCompliance({
    country,
    documentType: docType,
    executionType: deal.mobile ? "mobile" : "ron",
    destinationCountry: country,
  });

  if (rules.witnesses_required) {
    const need = Number(rules.witness_count ?? 1);
    const have = Number(deal.witnesses ?? 0);
    if (have < need) {
      throw new ComplianceError(
        `${country} requires ${need} witness(es); ${have} provided.`,
        "INSUFFICIENT_WITNESSES",
      );
    }
  }

  return rules;
}
