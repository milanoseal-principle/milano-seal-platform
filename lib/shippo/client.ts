import type {
  ShippoCustomsDeclaration,
  ShippoCustomsItem,
  ShippoShipmentPayload,
  ShippoShipmentResponse,
  ShippoTransaction,
  ShippoTrackingStatus,
} from "./types";

const BASE = "https://api.goshippo.com";
const shippoApiVersion = process.env.SHIPPO_API_VERSION;

function getKey(): string {
  const key = process.env.SHIPPO_API_KEY;
  if (!key) throw new Error("SHIPPO_API_KEY not configured");
  return key;
}

/**
 * assertShippoMode — operator safety guard.
 * In production with SHIPPO_MODE !== "live": warn (do not block).
 * Outside production with SHIPPO_MODE === "live": throw hard error.
 */
export function assertShippoMode(): void {
  const mode = process.env.SHIPPO_MODE;
  const env = process.env.NODE_ENV;

  if (env === "production" && mode !== "live") {
    console.warn(
      `[Shippo] WARNING: NODE_ENV is "production" but SHIPPO_MODE="${mode}". ` +
        `Labels will be sandbox. Set SHIPPO_MODE=live when ready for production traffic.`
    );
  } else if (env !== "production" && mode === "live") {
    throw new Error("LIVE_LABEL_BLOCKED_IN_NON_PRODUCTION");
  }
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
      ...(shippoApiVersion ? { "Shippo-API-Version": shippoApiVersion } : {}),
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

export async function getShippoShipment(
  shipmentId: string
): Promise<ShippoShipmentResponse> {
  return shippoRequest<ShippoShipmentResponse>(
    "GET",
    `/shipments/${encodeURIComponent(shipmentId)}`
  );
}

export async function purchaseShippoLabel(
  rateId: string
): Promise<ShippoTransaction> {
  assertShippoMode();
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
  return shippoRequest<{ object_id: string }>(
    "POST",
    "/customs/items/",
    payload
  );
}

export async function createShippoCustomsDeclaration(
  payload: ShippoCustomsDeclaration
): Promise<{ object_id: string }> {
  return shippoRequest<{ object_id: string }>(
    "POST",
    "/customs/declarations/",
    payload
  );
}
