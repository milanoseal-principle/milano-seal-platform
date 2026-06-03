import type { ShippoAddress } from "./types";

export function buildReturnAddress(): ShippoAddress {
  return {
    name: process.env.SHIPPO_DEFAULT_RETURN_NAME ?? "The Milano Seal",
    company: process.env.SHIPPO_DEFAULT_RETURN_COMPANY ?? "The Milano Seal LLC",
    street1: process.env.SHIPPO_DEFAULT_RETURN_STREET1 ?? "",
    city: process.env.SHIPPO_DEFAULT_RETURN_CITY ?? "",
    state: process.env.SHIPPO_DEFAULT_RETURN_STATE ?? "FL",
    zip: process.env.SHIPPO_DEFAULT_RETURN_ZIP ?? "",
    country: process.env.SHIPPO_DEFAULT_RETURN_COUNTRY ?? "US",
    phone: process.env.SHIPPO_DEFAULT_RETURN_PHONE ?? "",
    email: process.env.SHIPPO_DEFAULT_RETURN_EMAIL ?? "",
  };
}

interface MatterAddressInput {
  client_name?: string | null;
  email?: string | null;
  phone?: string | null;
  shipping_street1?: string | null;
  shipping_street2?: string | null;
  shipping_city?: string | null;
  shipping_state?: string | null;
  shipping_zip?: string | null;
  destination_country?: string | null;
  country?: string | null;
}

export function buildRecipientAddressFromMatter(
  matter: MatterAddressInput
): ShippoAddress {
  const country = matter.destination_country ?? matter.country ?? "";

  return {
    name: matter.client_name ?? "",
    street1: matter.shipping_street1 ?? "",
    street2: matter.shipping_street2 ?? undefined,
    city: matter.shipping_city ?? "",
    state: matter.shipping_state ?? undefined,
    zip: matter.shipping_zip ?? undefined,
    country,
    phone: matter.phone ?? undefined,
    email: matter.email ?? undefined,
  };
}

export function validateMilanoShippingAddress(address: ShippoAddress): string[] {
  const errors: string[] = [];

  if (!address.name?.trim()) errors.push("Recipient name is required.");
  if (!address.street1?.trim()) errors.push("Street address is required.");
  if (!address.city?.trim()) errors.push("City is required.");
  if (!address.country?.trim()) errors.push("Country is required.");

  if (address.country === "US") {
    if (!address.state?.trim()) errors.push("State is required for US addresses.");
    if (!address.zip?.trim()) errors.push("ZIP code is required for US addresses.");
  }

  return errors;
}
