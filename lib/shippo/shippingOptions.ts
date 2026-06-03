// Milano Seal shipping options — courier custody is included in the lane price.
// Client pays Milano Seal through Wise. Milano Seal buys the Shippo label internally.
// No client-facing shipping checkout. No carrier selection by client.

export interface MilanoShippingOption {
  id: string;
  name: string;
  description: string;
  optionType: "flat_rate";
  priceCents: number;
  includedInLane: boolean;
  allowedLanes: Array<"signature" | "priority" | "executive">;
  requiresOperatorApproval: boolean;
}

export const MILANO_SHIPPING_OPTIONS: MilanoShippingOption[] = [
  {
    id: "milano_international_release",
    name: "Milano Seal International Release",
    description: "Tracked release for international document packets. Included in all Milano Seal lanes.",
    optionType: "flat_rate",
    priceCents: 0,
    includedInLane: true,
    allowedLanes: ["signature", "priority", "executive"],
    requiresOperatorApproval: false,
  },
  {
    id: "milano_executive_courier_release",
    name: "Milano Seal Executive Courier Release",
    description: "Priority courier release for executive document packets.",
    optionType: "flat_rate",
    priceCents: 0,
    includedInLane: true,
    allowedLanes: ["executive"],
    requiresOperatorApproval: true,
  },
];

// Operator-only surcharge types — never shown in public invoice unless explicitly added
export const COURIER_SURCHARGE_TYPES = [
  "courier_surcharge",
  "executive_courier_handling",
  "multi_destination_shipping",
  "same_day_courier",
  "saturday_delivery",
  "return_shipment",
  "runner_delivery",
] as const;

export type CourierSurchargeType = typeof COURIER_SURCHARGE_TYPES[number];

export function getShippingOptionForLane(
  lane: "signature" | "priority" | "executive"
): MilanoShippingOption {
  if (lane === "executive") {
    return MILANO_SHIPPING_OPTIONS.find((o) => o.id === "milano_executive_courier_release")!;
  }
  return MILANO_SHIPPING_OPTIONS.find((o) => o.id === "milano_international_release")!;
}
