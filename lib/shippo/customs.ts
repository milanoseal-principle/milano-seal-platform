// Customs support for international document shipments.
//
// Customs declarations support courier processing only. They do NOT
// guarantee customs clearance or foreign authority acceptance, and they do
// NOT determine document authentication. Apostille / legalization routing is
// owned by the canonical treaty modules (lib/treaty/*); this module keeps no
// treaty-country registry of its own and never uses Hague membership to
// decide customs value, duties, carrier acceptance or packaging.

export function requiresCustoms(destinationCountry: string): boolean {
  return destinationCountry.trim().toUpperCase() !== "US";
}

export const CUSTOMS_ADVISORY =
  "Customs declaration supports courier processing only. It does not establish document authentication (apostille or legalization), which follows the Matter's verified authentication route. Customs clearance and receiving-authority acceptance are not guaranteed.";

/** Destination-neutral advisory: no treaty classification is made here. */
export function getCustomsAdvisory(_destinationCountry?: string): string {
  return CUSTOMS_ADVISORY;
}

/**
 * Nominal declared value for papers with no commercial value. Carriers
 * require a positive value on a customs item; Milano declares a nominal
 * amount for noncommercial document packets. This is a governed Milano
 * declaration policy for DOCUMENTS contents only — it is never applied to
 * merchandise or any other contents type.
 */
export const NONCOMMERCIAL_DOCUMENT_DECLARED_VALUE_USD = "1.00";

export class CustomsReviewRequiredError extends Error {
  readonly code = "CUSTOMS_REVIEW_REQUIRED";
  constructor(readonly reasons: string[]) {
    super(`CUSTOMS_REVIEW_REQUIRED: ${reasons.join(" ")}`);
    this.name = "CustomsReviewRequiredError";
  }
}

/**
 * The customs declaration is certified by The Milano Seal as shipper of
 * record, never by the client. The authorized declarant is configured
 * server-side; when it is missing the declaration is not certified and
 * customs review is required.
 */
export function resolveAuthorizedCustomsDeclarant(env: Record<string, string | undefined> = process.env): string | null {
  const signer = String(env.SHIPPO_CUSTOMS_CERTIFY_SIGNER ?? "").trim();
  return signer.length >= 3 ? signer : null;
}

interface MatterCustomsInput {
  document_type?: string | null;
  document_count?: number | null;
}

interface ParcelWeightInput {
  weight: string;
  mass_unit: string;
}

export interface DocumentCustomsPayload {
  item: {
    description: string;
    quantity: number;
    net_weight: string;
    mass_unit: string;
    value_amount: string;
    value_currency: string;
    origin_country: string;
  };
  declaration: {
    contents_type: "DOCUMENTS";
    contents_explanation: string;
    non_delivery_option: "RETURN";
    certify: boolean;
    certify_signer: string;
  };
}

/**
 * Builds the DOCUMENTS customs payload from verified packet facts. The net
 * weight comes from the actual governed parcel (never a fixed constant), the
 * description never asserts authentication, and certification requires the
 * configured Milano declarant. Throws CustomsReviewRequiredError instead of
 * fabricating any missing element.
 */
export function buildDocumentCustomsPayload(
  matter: MatterCustomsInput,
  parcel: ParcelWeightInput,
  env: Record<string, string | undefined> = process.env,
): DocumentCustomsPayload {
  const reasons: string[] = [];
  const signer = resolveAuthorizedCustomsDeclarant(env);
  if (!signer) reasons.push("No authorized Milano customs declarant is configured (SHIPPO_CUSTOMS_CERTIFY_SIGNER).");

  const weight = Number(String(parcel?.weight ?? "").trim());
  const massUnit = String(parcel?.mass_unit ?? "").trim().toLowerCase();
  if (!Number.isFinite(weight) || weight <= 0) reasons.push("Verified packet weight is unavailable.");
  if (!["lb", "oz", "kg", "g"].includes(massUnit)) reasons.push("Packet weight unit is not carrier-supported.");

  const count = Number.isInteger(matter.document_count) && (matter.document_count ?? 0) > 0 ? (matter.document_count as number) : 1;
  if (reasons.length > 0) throw new CustomsReviewRequiredError(reasons);

  const docType = String(matter.document_type ?? "").trim() || "Legal documents";
  return {
    item: {
      description: `${docType} (paper documents, no commercial value)`.slice(0, 200),
      quantity: count,
      net_weight: String(parcel.weight).trim(),
      mass_unit: massUnit,
      value_amount: NONCOMMERCIAL_DOCUMENT_DECLARED_VALUE_USD,
      value_currency: "USD",
      origin_country: "US",
    },
    declaration: {
      contents_type: "DOCUMENTS",
      contents_explanation: "Paper legal documents for an international document Matter. No commercial value.",
      non_delivery_option: "RETURN",
      certify: true,
      certify_signer: signer as string,
    },
  };
}
