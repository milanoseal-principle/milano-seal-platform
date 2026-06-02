// Milano Seal approved carrier stack
// Operators may only select approved carriers; admin/founder may override.

import { logActivity } from "@/lib/activity";

export type CarrierStatus = "APPROVED" | "CONDITIONAL" | "REJECTED_UNTIL_LOCAL_OPS";

export interface CarrierConfig {
  id: string;
  name: string;
  shippo_carrier_token: string;
  status: CarrierStatus;
  use_case: string;
  primary?: boolean;
}

export const CARRIER_POLICY: Record<string, CarrierConfig> = {
  dhl_express: {
    id: "dhl_express",
    name: "DHL Express",
    shippo_carrier_token: "dhl_express",
    status: "APPROVED",
    use_case: "Primary international document courier",
    primary: true,
  },
  fedex: {
    id: "fedex",
    name: "FedEx",
    shippo_carrier_token: "fedex",
    status: "APPROVED",
    use_case: "Backup international — time-sensitive corporate/estate/legal packets",
  },
  ups: {
    id: "ups",
    name: "UPS",
    shippo_carrier_token: "ups",
    status: "APPROVED",
    use_case: "Backup international + U.S. domestic",
  },
  usps: {
    id: "usps",
    name: "USPS",
    shippo_carrier_token: "usps",
    status: "APPROVED",
    use_case: "U.S. domestic fallback, government/PO Box mail",
  },
  lso: {
    id: "lso",
    name: "LSO",
    shippo_carrier_token: "lso",
    status: "CONDITIONAL",
    use_case: "Regional Texas/Southwest only — not for Milano Seal Florida-to-international",
  },
  canada_post:   { id: "canada_post",   name: "Canada Post",   shippo_carrier_token: "canada_post",   status: "REJECTED_UNTIL_LOCAL_OPS", use_case: "Only if Canadian entity established" },
  deutsche_post: { id: "deutsche_post", name: "Deutsche Post", shippo_carrier_token: "deutsche_post", status: "REJECTED_UNTIL_LOCAL_OPS", use_case: "Only if German local ops established" },
  dpd_de:        { id: "dpd_de",        name: "DPD DE",        shippo_carrier_token: "dpd_de",        status: "REJECTED_UNTIL_LOCAL_OPS", use_case: "Only if German local ops established" },
  dpd_uk:        { id: "dpd_uk",        name: "DPD UK",        shippo_carrier_token: "dpd_uk",        status: "REJECTED_UNTIL_LOCAL_OPS", use_case: "Only if UK local ops established" },
  evri:          { id: "evri",          name: "Evri UK",       shippo_carrier_token: "evri",          status: "REJECTED_UNTIL_LOCAL_OPS", use_case: "Only if UK local ops established" },
  chronopost:    { id: "chronopost",    name: "Chronopost",    shippo_carrier_token: "chronopost",    status: "REJECTED_UNTIL_LOCAL_OPS", use_case: "Only if French local ops established" },
  colissimo:     { id: "colissimo",     name: "Colissimo",     shippo_carrier_token: "colissimo",     status: "REJECTED_UNTIL_LOCAL_OPS", use_case: "Only if French local ops established" },
};

export const APPROVED_CARRIERS = Object.values(CARRIER_POLICY)
  .filter((c) => c.status === "APPROVED")
  .map((c) => c.shippo_carrier_token);

export function isCarrierApproved(token: string): boolean {
  return APPROVED_CARRIERS.includes(token);
}

export function requiresCarrierOverride(token: string): boolean {
  const config = Object.values(CARRIER_POLICY).find((c) => c.shippo_carrier_token === token);
  return !config || config.status !== "APPROVED";
}

export function assertCarrierApproved(token: string, actorRole?: string): void {
  const adminRoles = ["admin", "founder", "founder_admin"];
  if (actorRole && adminRoles.includes(actorRole)) return; // admin override allowed
  if (!isCarrierApproved(token)) {
    throw new Error(
      `CARRIER_NOT_APPROVED: ${token}. Approved: ${APPROVED_CARRIERS.join(", ")}`
    );
  }
}

export function filterApprovedRates<T extends { provider?: string; servicelevel?: { token?: string } }>(
  rates: T[]
): T[] {
  return rates.filter((r) => {
    const provider = (r.provider ?? "").toLowerCase().replace(/\s+/g, "_");
    return isCarrierApproved(provider);
  });
}

export async function recordCarrierOverrideApproval(opts: {
  carrier: string;
  matterId: string;
  actorEmail: string;
  reason?: string;
}): Promise<void> {
  await logActivity({
    deal_id: opts.matterId,
    actor: opts.actorEmail,
    action: "system",
    detail: `CARRIER_OVERRIDE_APPROVED: ${opts.carrier}${opts.reason ? ` — ${opts.reason}` : ""}`,
    meta: { carrier: opts.carrier, event: "CARRIER_OVERRIDE_APPROVED" },
  });
}

