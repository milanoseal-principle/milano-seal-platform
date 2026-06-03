import type { ShippoAddress } from "./types";
import { shippoRequest } from "./client";

interface ShippoAddressValidationResponse {
  object_id: string;
  is_valid?: boolean;
  validation_results?: {
    is_valid?: boolean;
    messages?: { code: string; source: string; type: string; text: string }[];
  };
  // Shippo returns suggested address fields at the top level
  name?: string;
  company?: string;
  street1?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone?: string;
  email?: string;
  is_residential?: boolean;
}

export interface AddressValidationResult {
  is_valid: boolean;
  validation_results?: unknown;
  suggested?: ShippoAddress | null;
  requires_review: boolean;
  messages: string[];
}

/**
 * Validate an address against the Shippo API using POST /addresses/?validate=true.
 * Never silently overwrites — always returns requires_review: true when suggestion differs.
 */
export async function validateAddressWithShippo(
  address: ShippoAddress
): Promise<AddressValidationResult> {
  const raw = await shippoRequest<ShippoAddressValidationResponse>(
    "POST",
    "/addresses/?validate=true",
    address
  );

  const isValid = raw.validation_results?.is_valid ?? raw.is_valid ?? false;

  const messages: string[] =
    raw.validation_results?.messages?.map((m) => m.text).filter(Boolean) ?? [];

  // Build suggested address from Shippo's normalized response fields
  let suggested: ShippoAddress | null = null;
  if (raw.street1) {
    suggested = {
      name: raw.name ?? address.name,
      company: raw.company ?? address.company,
      street1: raw.street1,
      street2: raw.street2 ?? address.street2,
      city: raw.city ?? address.city,
      state: raw.state ?? address.state,
      zip: raw.zip ?? address.zip,
      country: raw.country ?? address.country,
      phone: raw.phone ?? address.phone,
      email: raw.email ?? address.email,
      is_residential: raw.is_residential ?? address.is_residential,
    };
  }

  const requiresReview = requiresAddressCorrectionReview({ is_valid: isValid, suggested });

  return {
    is_valid: isValid,
    validation_results: raw.validation_results,
    suggested,
    requires_review: requiresReview,
    messages,
  };
}

/**
 * Returns true if the suggested address differs from validation result,
 * meaning operator must review before proceeding. Never allow silent overwrite.
 */
export function requiresAddressCorrectionReview(result: {
  is_valid: boolean;
  suggested?: ShippoAddress | null;
}): boolean {
  // If not valid: always requires review
  if (!result.is_valid) return true;
  // If valid but a suggestion was returned: operator must confirm
  if (result.suggested) return true;
  return false;
}

/**
 * Creates a JSON snapshot of an address for audit trail purposes.
 * Strips undefined keys for a clean, deterministic representation.
 */
export function createAddressSnapshot(address: ShippoAddress): string {
  const clean = Object.fromEntries(
    Object.entries(address).filter(([, v]) => v !== undefined && v !== null)
  );
  return JSON.stringify(clean);
}
