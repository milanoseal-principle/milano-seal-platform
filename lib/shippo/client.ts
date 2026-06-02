import type {
  ShippoCustomsDeclaration,
  ShippoCustomsItem,
  ShippoShipmentPayload,
  ShippoShipmentResponse,
  ShippoTransaction,
  ShippoTrackingStatus,
} from "./types";

const BASE = "https://api.goshippo.com";

function getKey(): string {
  const key = process.env.SHIPPO_API_KEY;
  if (!key) throw new Error("SHIPPO_API_KEY not configured");
  return key;
}

export async function shippoRequest<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `ShippoToken ${getKey()}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Shippo ${method} ${path} → ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

export async function createShippoShipment(
  payload: ShippoShipmentPayload
): Promise<ShippoShipmentResponse> {
  return shippoRequest<ShippoShipmentResponse>("POST", "/shipments/", payload);
}

export async function purchaseShippoLabel(rateId: string): Promise<ShippoTransaction> {
  return shippoRequest<ShippoTransaction>("POST", "/transactions/", {
    rate: rateId,
    label_file_type: "PDF",
    async: false,
  });
}

export async function getShippoTrackingStatus(
  carrier: string,
  trackingNumber: string
): Promise<ShippoTrackingStatus> {
  return shippoRequest<ShippoTrackingStatus>(
    "GET",
    `/tracks/${carrier}/${trackingNumber}`
  );
}

export async function registerShippoTrackingWebhook(
  carrier: string,
  trackingNumber: string,
  metadata?: string
): Promise<{ carrier: string; tracking_number: string }> {
  return shippoRequest<{ carrier: string; tracking_number: string }>(
    "POST",
    "/tracks/",
    { carrier, tracking_number: trackingNumber, metadata }
  );
}

export async function createShippoCustomsItem(
  payload: Omit<ShippoCustomsItem, never>
): Promise<{ object_id: string }> {
  return shippoRequest<{ object_id: string }>("POST", "/customs/items/", payload);
}

export async function createShippoCustomsDeclaration(
  payload: ShippoCustomsDeclaration
): Promise<{ object_id: string }> {
  return shippoRequest<{ object_id: string }>("POST", "/customs/declarations/", payload);
}
