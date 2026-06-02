// Milano Seal approved carrier stack
// Operators may only select approved carriers; admin/founder may override.

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
  canada_post: {
    id: "canada_post",
    name: "Canada Post",
    shippo_carrier_token: "canada_post",
    status: "REJECTED_UNTIL_LOCAL_OPS",
    use_case: "Only if Canadian entity or Canadian return address established",
  },
};

export const APPROVED_CARRIERS = Object.values(CARRIER_POLICY)
  .filter((c) => c.status === "APPROVED")
  .map((c) => c.shippo_carrier_token);

export function isCarrierApproved(token: string): boolean {
  return APPROVED_CARRIERS.includes(token);
}

export function assertCarrierApproved(token: string, adminOverride = false): void {
  if (adminOverride) return;
  if (!isCarrierApproved(token)) {
    throw new Error(
      `CARRIER_NOT_APPROVED: ${token}. Approved carriers: ${APPROVED_CARRIERS.join(", ")}`
    );
  }
}
