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
  body?: unknown,
  options: { timeoutMs?: number } = {}
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    ...(options.timeoutMs ? { signal: AbortSignal.timeout(options.timeoutMs) } : {}),
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
  rateId: string,
  metadata?: string
): Promise<ShippoTransaction> {
  assertShippoMode();
  return shippoRequest<ShippoTransaction>(
    "POST",
    "/transactions/",
    {
      rate: rateId,
      label_file_type: "PDF",
      async: false,
      // Correlation reference (Matter / leg ids only — no client data) so an
      // ambiguous purchase can be reconciled against the provider record.
      ...(metadata ? { metadata: metadata.slice(0, 100) } : {}),
    },
    // Hard upper bound on an in-flight purchase. An abort is OUTCOME_UNKNOWN
    // (never a failure); it bounds how long an attempt can stay active so the
    // reconciliation window cannot open while the request is still running.
    { timeoutMs: SHIPPO_PURCHASE_TIMEOUT_MS }
  );
}

export const SHIPPO_PURCHASE_TIMEOUT_MS = 60_000;

/** One page of provider transactions (read-only; used for reconciliation scans). */
export async function listShippoTransactions(
  page: number,
  results = 100
): Promise<{ results: ShippoTransaction[]; next?: string | null }> {
  return shippoRequest<{ results: ShippoTransaction[]; next?: string | null }>(
    "GET",
    `/transactions/?results=${results}&page=${page}`
  );
}

/** Read-only provider lookup used to reconcile an ambiguous label purchase. */
export async function getShippoTransaction(
  transactionId: string
): Promise<ShippoTransaction> {
  return shippoRequest<ShippoTransaction>(
    "GET",
    `/transactions/${encodeURIComponent(transactionId)}`
  );
}

/**
 * Classifies a label-purchase failure. Only an explicit provider 4xx
 * rejection is a definitive "no label was purchased". Network failures,
 * timeouts and provider 5xx responses leave the outcome UNKNOWN: the provider
 * may have created the transaction, so the purchase must be reconciled and
 * never blindly retried.
 */
export function classifyShippoPurchaseError(error: unknown): "DEFINITIVE_REJECTION" | "OUTCOME_UNKNOWN" {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /^Shippo POST \/transactions\/ → 4\d\d:/.test(message) ? "DEFINITIVE_REJECTION" : "OUTCOME_UNKNOWN";
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
