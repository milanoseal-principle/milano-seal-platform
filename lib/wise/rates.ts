// Wise read-only exchange rates → informational destination-currency estimates.
//
// READ-ONLY. Calls only Wise's documented rate retrieval endpoint
// (GET /rates?source=&target=) through the same server-side Bearer-token and
// versioned-base pattern as lib/wise/reconciliation.ts. It never creates a
// quote, recipient, transfer or payment, and its output is never payment
// authority: the canonical invoice stays in USD and the estimate never
// changes the amount due, settlement checks or any gate.
//
// Server-side only: the token is read from WISE_API_TOKEN (never a
// NEXT_PUBLIC_ variable) and the module refuses to run in a browser. Any
// failure (no token, HTTP error, timeout, malformed or stale rate, unknown
// currency) yields "unavailable" — a rate is never fabricated.

import { resolveDestinationCurrency, type DestinationCurrency } from "@/lib/fx/destinationCurrency";

export const WISE_RATE_PROVIDER = "Wise";
/** Milano policy: a rate older than this is not shown as current. */
export const WISE_RATE_MAX_AGE_MS = 60 * 60 * 1000;
/** In-process reuse window to avoid calling Wise on every page view. */
export const WISE_RATE_CACHE_MS = 5 * 60 * 1000;
const WISE_RATE_TIMEOUT_MS = 4_000;

export interface VerifiedRate {
  source: string;
  target: string;
  /** Exact decimal string as provided by Wise. */
  rate: string;
  provider: typeof WISE_RATE_PROVIDER;
  /** Wise's own timestamp for the rate. */
  rateTime: string;
  retrievedAt: string;
}

export type LocalCurrencyEstimate =
  | {
      status: "available";
      invoiceCurrency: "USD";
      invoiceAmount: string;
      currency: string;
      currencyName: string;
      /** Converted amount in the currency's ISO minor units (decimal string). */
      amountMinor: string;
      /** Display string, e.g. "€897.30". */
      formatted: string;
      rate: string;
      provider: typeof WISE_RATE_PROVIDER;
      rateTime: string;
      classification: "indicative";
    }
  | {
      status: "unavailable";
      currency: string | null;
      reason: "SAME_CURRENCY" | "UNKNOWN_DESTINATION" | "INVALID_AMOUNT" | "RATE_UNAVAILABLE";
    };

const ISO_CURRENCY = /^[A-Z]{3}$/;
const DECIMAL = /^\d+(?:\.\d{1,12})?$/;

/**
 * Plain positive decimal from a JSON number or an exact decimal string only.
 * Arrays, objects, booleans, padded strings and exponent forms are rejected
 * (no generic String() coercion of provider data).
 */
function decimalString(value: unknown): string | null {
  let text: string;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    text = String(value);
  } else if (typeof value === "string") {
    text = value;
  } else {
    return null;
  }
  if (!DECIMAL.test(text)) return null;
  return /[1-9]/.test(text) ? text : null;
}

/**
 * Validates a Wise rate response for the exact requested pair. Accepts the
 * documented array form or a single object. Returns null for anything that
 * is not a positive decimal rate with a parseable, fresh, non-future timestamp.
 */
export function parseWiseRateResponse(body: unknown, source: string, target: string, now: Date = new Date()): VerifiedRate | null {
  const entries = Array.isArray(body) ? body : body && typeof body === "object" ? [body] : [];
  for (const entry of entries as Array<Record<string, unknown>>) {
    if (!entry || typeof entry !== "object") continue;
    if (String(entry.source ?? "").toUpperCase() !== source || String(entry.target ?? "").toUpperCase() !== target) continue;
    const rate = decimalString(entry.rate);
    const time = Date.parse(String(entry.time ?? ""));
    if (!rate || !Number.isFinite(time)) return null;
    const age = now.getTime() - time;
    // Future-dated rates are rejected outright (no skew window): the safe
    // outcome of a rejected rate is "estimate unavailable".
    if (age > WISE_RATE_MAX_AGE_MS || age < 0) return null;
    return { source, target, rate, provider: WISE_RATE_PROVIDER, rateTime: new Date(time).toISOString(), retrievedAt: now.toISOString() };
  }
  return null;
}

const rateCache = new Map<string, { rate: VerifiedRate; until: number }>();

export function clearWiseRateCache(): void {
  rateCache.clear();
}

type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

/**
 * Read-only Wise rate retrieval. Never throws; returns null when a verified
 * current rate is not available.
 */
export async function getWiseRate(
  source: string,
  target: string,
  options: { fetchImpl?: FetchLike; now?: Date; env?: Record<string, string | undefined> } = {},
): Promise<VerifiedRate | null> {
  if (typeof window !== "undefined") return null;
  const from = source.trim().toUpperCase();
  const to = target.trim().toUpperCase();
  if (!ISO_CURRENCY.test(from) || !ISO_CURRENCY.test(to) || from === to) return null;
  const env = options.env ?? process.env;
  const now = options.now ?? new Date();
  const key = `${from}:${to}`;
  const cached = rateCache.get(key);
  if (cached && cached.until > now.getTime() && now.getTime() - Date.parse(cached.rate.rateTime) <= WISE_RATE_MAX_AGE_MS) {
    return cached.rate;
  }
  const token = env.WISE_API_TOKEN?.trim();
  if (!token) return null;
  const version = env.WISE_API_VERSION?.trim() || "2026Q3";
  const url = `https://api.wise.com/${version}/rates?source=${from}&target=${to}`;
  try {
    const response = await (options.fetchImpl ?? fetch)(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(WISE_RATE_TIMEOUT_MS),
    });
    if (!response.ok) {
      await response.body?.cancel();
      return null;
    }
    const rate = parseWiseRateResponse(await response.json(), from, to, now);
    if (rate) rateCache.set(key, { rate, until: now.getTime() + WISE_RATE_CACHE_MS });
    return rate;
  } catch {
    return null;
  }
}

/** USD amount (number or decimal string, ≤ 2 dp) → integer cents; null if invalid. */
export function usdToCents(amount: unknown): bigint | null {
  const text = typeof amount === "number" ? (Number.isFinite(amount) ? amount.toFixed(2) : "") : String(amount ?? "").trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return null;
  const [whole, fraction = ""] = text.split(".");
  const cents = BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0"));
  return cents > BigInt(0) ? cents : null;
}

/** 10^n as a BigInt without the ** operator (project TS target). */
function pow10(n: number): bigint {
  let result = BigInt(1);
  for (let i = 0; i < n; i += 1) result *= BigInt(10);
  return result;
}

/**
 * Decimal-safe conversion: USD cents × exact decimal rate → target minor
 * units, rounded half-up to the target currency's ISO precision. No floats.
 */
export function convertCentsToMinor(cents: bigint, rate: string, targetMinorDigits: number): bigint {
  const [whole, fraction = ""] = rate.split(".");
  const scale = pow10(fraction.length);
  const rateScaled = BigInt(whole + fraction);
  const numerator = cents * rateScaled * pow10(targetMinorDigits);
  const denominator = BigInt(100) * scale;
  return (numerator * BigInt(2) + denominator) / (denominator * BigInt(2));
}

/** Display-only formatting of minor units (the minor-unit string stays authoritative). */
export function formatMinor(amountMinor: bigint, target: DestinationCurrency): string {
  const divisor = pow10(target.minorDigits);
  const whole = amountMinor / divisor;
  const fraction = (amountMinor % divisor).toString().padStart(target.minorDigits, "0");
  const decimal = target.minorDigits > 0 ? `${whole}.${fraction}` : `${whole}`;
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: target.currency,
      minimumFractionDigits: target.minorDigits,
      maximumFractionDigits: target.minorDigits,
    }).format(decimal as unknown as number);
  } catch {
    return `${decimal} ${target.currency}`;
  }
}

/**
 * Informational destination-currency estimate for a canonical USD invoice.
 * Never modifies the invoice; "unavailable" whenever a verified current
 * Wise rate cannot be obtained.
 */
export async function buildLocalCurrencyEstimate(input: {
  amountUsd: unknown;
  destination: string | null | undefined;
  fetchImpl?: FetchLike;
  now?: Date;
  env?: Record<string, string | undefined>;
}): Promise<LocalCurrencyEstimate> {
  const target = resolveDestinationCurrency(input.destination);
  if (!target) return { status: "unavailable", currency: null, reason: "UNKNOWN_DESTINATION" };
  if (target.currency === "USD") return { status: "unavailable", currency: "USD", reason: "SAME_CURRENCY" };
  const cents = usdToCents(input.amountUsd);
  if (cents === null) return { status: "unavailable", currency: target.currency, reason: "INVALID_AMOUNT" };
  const rate = await getWiseRate("USD", target.currency, { fetchImpl: input.fetchImpl, now: input.now, env: input.env });
  if (!rate) return { status: "unavailable", currency: target.currency, reason: "RATE_UNAVAILABLE" };
  const amountMinor = convertCentsToMinor(cents, rate.rate, target.minorDigits);
  return {
    status: "available",
    invoiceCurrency: "USD",
    invoiceAmount: `${cents / BigInt(100)}.${(cents % BigInt(100)).toString().padStart(2, "0")}`,
    currency: target.currency,
    currencyName: target.currencyName,
    amountMinor: amountMinor.toString(),
    formatted: formatMinor(amountMinor, target),
    rate: rate.rate,
    provider: WISE_RATE_PROVIDER,
    rateTime: rate.rateTime,
    classification: "indicative",
  };
}
