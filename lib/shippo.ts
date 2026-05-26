const BASE = "https://api.goshippo.com";

export interface ShippoAddress {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state?: string;
  zip: string;
  country: string; // ISO 2-letter
  phone?: string;
  email?: string;
}

export interface ShippoParcel {
  length: number;
  width: number;
  height: number;
  distance_unit: "in" | "cm";
  weight: number;
  mass_unit: "lb" | "kg" | "oz" | "g";
}

export interface ShippoRate {
  object_id: string;
  provider: string;
  servicelevel?: { name?: string; token?: string };
  amount: string;
  currency: string;
  estimated_days?: number;
  attributes?: string[];
}

export interface ShippoShipment {
  object_id: string;
  rates: ShippoRate[];
  status?: string;
}

export interface ShippoTransaction {
  object_id: string;
  status: string;
  tracking_number: string;
  tracking_provider: string;
  tracking_url_provider?: string;
  label_url: string;
  eta?: string;
  messages?: { text: string }[];
}

export interface ShippoTrack {
  carrier?: string;
  tracking_number?: string;
  tracking_status?: {
    status?: string;
    status_details?: string;
    status_date?: string;
    location?: {
      city?: string;
      state?: string;
      zip?: string;
      country?: string;
    };
  };
  eta?: string;
}

function headers() {
  const token = process.env.SHIPPO_API_KEY;
  if (!token) throw new Error("SHIPPO_API_KEY is not configured");
  return {
    Authorization: `ShippoToken ${token}`,
    "Content-Type": "application/json",
  };
}

export async function createShipment({
  from,
  to,
  parcel,
}: {
  from: ShippoAddress;
  to: ShippoAddress;
  parcel: ShippoParcel;
}): Promise<ShippoShipment> {
  const res = await fetch(`${BASE}/shipments/`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      address_from: from,
      address_to: to,
      parcels: [parcel],
      async: false,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shippo createShipment failed (${res.status}): ${text}`);
  }
  return (await res.json()) as ShippoShipment;
}

export async function buyLabel(
  rate_object_id: string,
): Promise<ShippoTransaction> {
  const res = await fetch(`${BASE}/transactions/`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      rate: rate_object_id,
      label_file_type: "PDF",
      async: false,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shippo buyLabel failed (${res.status}): ${text}`);
  }
  return (await res.json()) as ShippoTransaction;
}

export async function track(
  carrier: string,
  tracking_number: string,
): Promise<ShippoTrack> {
  const res = await fetch(
    `${BASE}/tracks/${carrier.toLowerCase()}/${encodeURIComponent(
      tracking_number,
    )}`,
    { headers: headers() },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shippo track failed (${res.status}): ${text}`);
  }
  return (await res.json()) as ShippoTrack;
}

export async function validateAddress(
  addr: ShippoAddress,
): Promise<{ is_valid: boolean; messages?: { text: string }[] }> {
  const res = await fetch(`${BASE}/addresses/`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ ...addr, validate: true }),
  });
  if (!res.ok) return { is_valid: false };
  const data = (await res.json()) as {
    validation_results?: { is_valid?: boolean; messages?: { text: string }[] };
  };
  return {
    is_valid: !!data.validation_results?.is_valid,
    messages: data.validation_results?.messages,
  };
}

export interface NormalizedRate {
  id: string;
  carrier: string;
  service: string;
  amount: number;
  currency: string;
  days: number;
  attributes: string[];
}

export interface RateContext {
  destination_country: string;
  urgent?: boolean;
  signature_required?: boolean;
}

export interface RateDecision {
  chosen: NormalizedRate;
  cheapest: NormalizedRate;
  fastest: NormalizedRate;
  pool: NormalizedRate[];
}

const BLACKLIST = ["lasership"];

function isUS(country: string): boolean {
  const c = country.toLowerCase();
  return c === "us" || c === "usa" || c === "united states";
}

export function normalizeRates(rates: ShippoRate[]): NormalizedRate[] {
  return rates
    .map((r) => ({
      id: r.object_id,
      carrier: (r.provider || "").toLowerCase(),
      service: r.servicelevel?.name || "",
      amount: parseFloat(r.amount) || 0,
      currency: r.currency,
      days: r.estimated_days ?? 99,
      attributes: r.attributes || [],
    }))
    .filter((r) => !BLACKLIST.includes(r.carrier));
}

export function selectRate(
  rates: ShippoRate[],
  context: RateContext,
): RateDecision {
  const all = normalizeRates(rates);
  if (all.length === 0) {
    throw new Error("Shippo returned no rates");
  }

  const intl = !isUS(context.destination_country);

  let pool = all;
  if (intl) {
    pool = pool.filter((r) =>
      ["dhl", "dhl express", "fedex", "ups"].some((c) => r.carrier.includes(c)),
    );
  } else {
    pool = pool.filter((r) =>
      ["usps", "ups", "fedex"].some((c) => r.carrier.includes(c)),
    );
  }

  if (context.signature_required) {
    pool = pool.filter((r) => !r.carrier.includes("usps"));
  }

  if (pool.length === 0) pool = all;

  const cheapest = [...pool].sort((a, b) => a.amount - b.amount)[0];
  const fastest = [...pool].sort((a, b) => a.days - b.days)[0];

  let chosen = cheapest;
  if (context.urgent) chosen = fastest;
  if (intl && fastest.days <= 3) chosen = fastest;

  return { chosen, cheapest, fastest, pool };
}

export interface MarginContext {
  tier?: string | null;
  destination_country: string;
  declared_value?: number;
}

export interface MarginResult {
  cost: number;
  sell_price: number;
  margin: number;
  insurance_added: boolean;
}

const FLOOR = 35;

export function applyMargin(
  rate: NormalizedRate,
  context: MarginContext,
): MarginResult {
  let base = rate.amount;
  const tier = (context.tier || "").toLowerCase();

  if (tier === "executive") base *= 1.8;
  else if (tier === "priority") base *= 1.5;
  else base *= 1.3;

  if (!isUS(context.destination_country)) {
    base += 40;
  }

  let insurance_added = false;
  if (context.declared_value && context.declared_value > 1000) {
    base += Math.max(8, context.declared_value * 0.01);
    insurance_added = true;
  }

  if (base < FLOOR) base = FLOOR;

  const sell_price = Math.round(base * 100) / 100;
  return {
    cost: rate.amount,
    sell_price,
    margin: Math.round((sell_price - rate.amount) * 100) / 100,
    insurance_added,
  };
}

export function mapTrackingStatus(
  raw: string | undefined,
): "in_transit" | "out_for_delivery" | "delivered" | "unknown" | "failed" {
  if (!raw) return "unknown";
  const s = raw.toUpperCase();
  if (s === "DELIVERED") return "delivered";
  if (s === "OUT_FOR_DELIVERY") return "out_for_delivery";
  if (s === "TRANSIT") return "in_transit";
  if (s === "FAILURE" || s === "RETURNED") return "failed";
  return "unknown";
}

export function detectCarrier(
  tracking: string,
): "usps" | "ups" | "fedex" | "dhl" {
  const t = (tracking || "").trim();
  if (/^1Z/i.test(t)) return "ups";
  if (/^9[24]\d{20,}$/.test(t) || /^9[2345]\d{19,21}$/.test(t)) return "usps";
  if (/^\d{12}$/.test(t) || /^\d{15}$/.test(t) || /^\d{20,22}$/.test(t))
    return "fedex";
  return "dhl";
}

export function enforceSLA(
  rate: NormalizedRate,
  deal: { destination_country?: string | null; country?: string | null },
): true {
  const dest = deal.destination_country || deal.country || "United States";
  if (!isUS(dest) && rate.days > 7) {
    throw new Error(
      `SLA violation: international shipment estimated at ${rate.days} days exceeds 7-day limit (${rate.carrier} · ${rate.service})`,
    );
  }
  return true;
}

export interface LabelPurchaseResult {
  transaction: ShippoTransaction;
  used_rate: NormalizedRate;
  attempts: number;
}

export async function buyLabelWithFailover(
  decision: RateDecision,
  opts: { maxAttempts?: number } = {},
): Promise<LabelPurchaseResult> {
  const max = Math.min(opts.maxAttempts ?? 3, decision.pool.length);
  const tried = new Set<string>();
  const ordered: NormalizedRate[] = [];

  const push = (r?: NormalizedRate) => {
    if (r && !tried.has(r.id)) {
      tried.add(r.id);
      ordered.push(r);
    }
  };
  push(decision.chosen);
  push(decision.cheapest);
  push(decision.fastest);
  for (const r of [...decision.pool].sort((a, b) => a.amount - b.amount)) {
    push(r);
  }

  let lastErr: Error | null = null;
  for (let i = 0; i < Math.min(max, ordered.length); i++) {
    const rate = ordered[i];
    try {
      const tx = await buyLabel(rate.id);
      const status = (tx.status ?? "").toUpperCase();
      if (status && status !== "SUCCESS") {
        const msg =
          tx.messages?.map((m) => m.text).join("; ") ||
          `Shippo returned status=${tx.status}`;
        throw new Error(msg);
      }
      return { transaction: tx, used_rate: rate, attempts: i + 1 };
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
      console.warn(
        `[shippo] label purchase attempt ${i + 1} failed (${rate.carrier} · ${rate.service}):`,
        lastErr.message,
      );
    }
  }
  throw lastErr ?? new Error("All label purchase attempts failed");
}
