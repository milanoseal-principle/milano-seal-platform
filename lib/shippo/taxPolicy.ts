// Milano Seal tax ID policy for Shippo international shipments.
// Milano Seal ships document packets, not goods purchased by recipients.
// Default: No tax ID. Hague status controls apostille route only — not Tax ID.

export const MILANO_TAX_ID_POLICY = {
  defaultTaxId: "none",
  defaultLabel: "No tax ID",
  reason:
    "Milano Seal ships document packets, not goods purchased by recipients. No Tax ID applies by default.",
  hagueRule:
    "Hague Apostille Convention status determines the apostille/legalization route only. It does not determine Tax ID selection.",
  rejectDefaults: ["VAT", "IOSS", "EIN"] as const,
  exceptionRule:
    "If Shippo or the carrier requires a Tax ID for a specific shipment, pause label creation and route to operator review. Apply CUSTOMS_REVIEW and RELEASE_REVIEW_REQUIRED tags.",
  requiredTagsOnException: ["CUSTOMS_REVIEW", "RELEASE_REVIEW_REQUIRED"] as const,
} as const;

export type TaxIdPolicy = "NO_TAX_ID" | "VAT" | "IOSS" | "EIN" | "OPERATOR_REVIEW";

export function getDefaultTaxIdPolicy(): TaxIdPolicy {
  return "NO_TAX_ID";
}

export function requiresTaxIdOperatorReview(carrierRequiresTaxId: boolean): boolean {
  return carrierRequiresTaxId;
}
