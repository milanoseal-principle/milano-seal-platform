// Client delivery journey — one simple, Matter-level "Document Delivery"
// timeline projected from the EXISTING Matter-linked shipment legs.
//
// Evidence-only: a milestone is reached only when persisted canonical or
// verified provider evidence supports it. Label creation is never "shipped";
// a carrier "delivered" event is never Matter release or completion; no ETA,
// GPS or date is invented. Internal authority legs are summarised by stage
// only — no tracking numbers, addresses, costs, provider ids or label URLs.

import type { ShipmentLegRow } from "@/lib/intelligence/execution-brain/authorityLogistics";

export const CLIENT_DELIVERY_MILESTONES = [
  { key: "preparing", label: "Preparing shipment" },
  { key: "ready_for_dispatch", label: "Ready for dispatch" },
  { key: "shipped", label: "Shipped" },
  { key: "in_transit", label: "In transit" },
  { key: "out_for_delivery", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
] as const;

export type ClientMilestoneKey = (typeof CLIENT_DELIVERY_MILESTONES)[number]["key"];
export type ClientMilestoneState = "complete" | "current" | "upcoming";

export interface ClientDeliveryJourney {
  status: "not_started" | "active" | "attention" | "delivered";
  headline: string;
  milestones: Array<{ key: ClientMilestoneKey; label: string; state: ClientMilestoneState }>;
  carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  destination_summary: string | null;
  last_verified_update: string | null;
  provider_eta: string | null;
  delivered_at: string | null;
  exception_message: string | null;
  authority_stages: Array<{ stage: string; status: string }>;
  release_note: string;
}

const FINAL_LEGS = new Set(["final_to_client", "final_international"]);
const SHIPPED_CUSTODY = new Set(["carrier_accepted", "final_handoff", "in_transit", "delivered"]);

const CARRIER_NAMES: Record<string, string> = {
  usps: "USPS",
  fedex: "FedEx",
  ups: "UPS",
  dhl_express: "DHL Express",
  dhl: "DHL Express",
};

const TRACKING_URL: Record<string, (tracking: string) => string> = {
  usps: (t) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${t}`,
  fedex: (t) => `https://www.fedex.com/fedextrack/?trknbr=${t}`,
  ups: (t) => `https://www.ups.com/track?tracknum=${t}`,
  dhl_express: (t) => `https://www.dhl.com/global-en/home/tracking/tracking-express.html?submit=1&tracking-id=${t}`,
};

function carrierKey(carrier: string | null | undefined): string {
  const key = String(carrier ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  return key === "dhl" ? "dhl_express" : key;
}

/**
 * Official public carrier tracking page for an approved carrier only. Returns
 * null for unknown carriers or tracking numbers that are not plain
 * alphanumerics, so no arbitrary URL can be injected into the portal.
 */
export function safeCarrierTrackingUrl(carrier: string | null | undefined, trackingNumber: string | null | undefined): string | null {
  const tracking = String(trackingNumber ?? "").trim();
  if (!/^[A-Za-z0-9]{6,40}$/.test(tracking)) return null;
  const builder = TRACKING_URL[carrierKey(carrier)];
  return builder ? builder(encodeURIComponent(tracking)) : null;
}

export function clientCarrierName(carrier: string | null | undefined): string | null {
  if (!carrier) return null;
  return CARRIER_NAMES[carrierKey(carrier)] ?? null;
}

function validDate(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  return Number.isFinite(Date.parse(value)) ? value : null;
}

function lastTracking(leg: ShipmentLegRow): { status: string; substatus: string; status_date: string | null } {
  const raw = ((leg.provider_evidence ?? {}) as Record<string, unknown>).last_tracking as Record<string, unknown> | undefined;
  const substatus = raw?.substatus;
  return {
    status: String(raw?.status ?? leg.tracking_status ?? "").toUpperCase(),
    substatus: (typeof substatus === "string" ? substatus : JSON.stringify(substatus ?? "")).toLowerCase(),
    status_date: validDate(raw?.status_date),
  };
}

const AUTHORITY_STAGE: Record<string, string> = {
  outbound_to_authority: "Sent to the authentication authority",
  return_from_authority: "Returning from the authentication authority",
};
const AUTHORITY_STATUS: Record<string, string> = {
  not_started: "Preparing",
  prepared: "Preparing",
  handoff_ready: "Preparing",
  carrier_accepted: "With carrier",
  in_transit: "In transit",
  authority_received: "Received by authority",
  return_in_transit: "Returning",
  received_back: "Received by The Milano Seal",
  exception: "Under review",
};

const RELEASE_NOTE =
  "Carrier delivery confirms the packet arrived. Your coordinator separately confirms release and completion of your Matter.";

/** Picks the client-facing final leg: the latest non-exception final leg, else the latest final leg. */
function primaryFinalLeg(legs: readonly ShipmentLegRow[]): ShipmentLegRow | null {
  const finals = legs.filter((leg) => FINAL_LEGS.has(leg.leg_type)).sort((a, b) => b.sequence - a.sequence);
  return finals.find((leg) => leg.custody_status !== "exception") ?? finals[0] ?? null;
}

export function buildClientDeliveryJourney(legs: readonly ShipmentLegRow[]): ClientDeliveryJourney {
  const authority_stages = legs
    .filter((leg) => leg.leg_type in AUTHORITY_STAGE)
    .sort((a, b) => a.sequence - b.sequence)
    .map((leg) => ({ stage: AUTHORITY_STAGE[leg.leg_type], status: AUTHORITY_STATUS[leg.custody_status] ?? "Under review" }));

  const leg = primaryFinalLeg(legs);
  const base: ClientDeliveryJourney = {
    status: "not_started",
    headline: "Delivery details will appear once your documents are prepared for release.",
    milestones: CLIENT_DELIVERY_MILESTONES.map(({ key, label }) => ({ key, label, state: "upcoming" as const })),
    carrier: null,
    tracking_number: null,
    tracking_url: null,
    destination_summary: null,
    last_verified_update: null,
    provider_eta: null,
    delivered_at: null,
    exception_message: null,
    authority_stages,
    release_note: RELEASE_NOTE,
  };
  if (!leg) return base;

  const tracking = lastTracking(leg);
  const labelCreated = leg.label_status === "created";
  const delivered = labelCreated && leg.custody_status === "delivered" && Boolean(validDate(leg.delivered_at));
  const shipped = labelCreated && (Boolean(leg.shipped_at) || SHIPPED_CUSTODY.has(leg.custody_status));
  const inTransit =
    shipped && (leg.custody_status === "in_transit" || tracking.status === "TRANSIT" || tracking.status === "OUT_FOR_DELIVERY" || delivered);
  const outForDelivery =
    delivered || (inTransit && (tracking.status === "OUT_FOR_DELIVERY" || tracking.substatus.includes("out_for_delivery")));
  const attention =
    !delivered && (leg.custody_status === "exception" || tracking.status === "RETURNED" || tracking.status === "FAILURE");

  const reached: Record<ClientMilestoneKey, boolean> = {
    preparing: true,
    ready_for_dispatch: labelCreated,
    shipped,
    in_transit: inTransit,
    out_for_delivery: outForDelivery,
    delivered,
  };
  // Each milestone needs its own evidence. "Out for delivery" is optional
  // carrier detail: it is shown only when the carrier reports it, or once
  // verified delivery evidence exists (which necessarily passed through it).
  let currentAssigned = false;
  const milestones = CLIENT_DELIVERY_MILESTONES.map(({ key, label }, index) => {
    const nextReached = CLIENT_DELIVERY_MILESTONES.slice(index + 1).some(({ key: later }) => reached[later]);
    let state: ClientMilestoneState = "upcoming";
    if (reached[key] && !nextReached) {
      state = delivered && key === "delivered" ? "complete" : "current";
      currentAssigned = true;
    } else if (reached[key]) state = "complete";
    return { key, label, state };
  });
  if (!currentAssigned) milestones[0].state = "current";

  const destination = (leg.destination_json ?? {}) as Record<string, unknown>;
  const destination_summary =
    [destination.city, destination.country].filter((part) => typeof part === "string" && part.trim()).join(", ") || null;
  const label = (((leg.provider_evidence ?? {}) as Record<string, unknown>).label ?? {}) as Record<string, unknown>;
  const trackingNumber = labelCreated ? leg.tracking_number : null;

  return {
    status: delivered ? "delivered" : attention ? "attention" : "active",
    headline: delivered
      ? "Your documents were delivered by the carrier."
      : attention
        ? "Your shipment needs attention. Your coordinator is reviewing it."
        : shipped
          ? "Your documents are with the carrier."
          : labelCreated
            ? "Your documents are prepared and ready for dispatch."
            : "Your shipment is being prepared.",
    milestones,
    carrier: labelCreated ? clientCarrierName(leg.carrier) : null,
    tracking_number: trackingNumber,
    tracking_url: safeCarrierTrackingUrl(leg.carrier, trackingNumber),
    destination_summary,
    last_verified_update: labelCreated ? tracking.status_date : null,
    provider_eta: labelCreated && !delivered ? validDate(label.eta) : null,
    delivered_at: delivered ? leg.delivered_at : null,
    exception_message: attention
      ? tracking.status === "RETURNED"
        ? "The carrier reports the packet is being returned. Your coordinator will confirm next steps with you."
        : "The carrier reported a delivery exception. Your coordinator will contact you if anything is needed."
      : null,
    authority_stages,
    release_note: RELEASE_NOTE,
  };
}
