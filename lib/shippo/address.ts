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
  shipping_country?:string|null;
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
  const country = matter.shipping_country ?? matter.destination_country ?? matter.country ?? "";

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

/** Legacy courier presentation from canonical stored quote/address fields. */
export function projectShippingMatter<T extends Record<string,unknown>>(row:T) {
 const address=(row.ship_to&&typeof row.ship_to==='object'?row.ship_to:{}) as Record<string,unknown>;
 const text=(value:unknown)=>typeof value==='string'?value:null;
 return {...row,tier:text(row.execution_tier??row.lane),document_count:Number(row.docs_count??1),shipping_country:text(address.country),country:text(row.destination_country),shipping_street1:text(address.street1??address.address_line1),shipping_street2:text(address.street2??address.address_line2),shipping_city:text(address.city),shipping_state:text(address.state),shipping_zip:text(address.zip??address.postal_code)};
}
