import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { resolveDestinationCurrency, resolveDestinationIso2 } from "@/lib/fx/destinationCurrency";
import {
  buildLocalCurrencyEstimate,
  clearWiseRateCache,
  convertCentsToMinor,
  getWiseRate,
  parseWiseRateResponse,
  usdToCents,
  WISE_RATE_MAX_AGE_MS,
} from "@/lib/wise/rates";

const NOW = new Date("2026-11-25T12:00:00Z");
const ENV = { WISE_API_TOKEN: "test-token-not-real", WISE_API_VERSION: "2026Q3" };
const fresh = new Date(NOW.getTime() - 60_000).toISOString();

type Call = { url: string; init: RequestInit };
function fakeFetch(body: unknown, status = 200) {
  const calls: Call[] = [];
  const impl = async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  };
  return { impl, calls };
}

beforeEach(() => clearWiseRateCache());

test("destination resolver maps ISO codes and names to ISO 4217 with runtime precision", () => {
  const expected: Record<string, [string, number]> = {
    US: ["USD", 2], IT: ["EUR", 2], ES: ["EUR", 2], PT: ["EUR", 2], DE: ["EUR", 2], FR: ["EUR", 2], GB: ["GBP", 2],
    CA: ["CAD", 2], MX: ["MXN", 2], JP: ["JPY", 0], BR: ["BRL", 2], AE: ["AED", 2], CH: ["CHF", 2], AU: ["AUD", 2],
    BH: ["BHD", 3], KW: ["KWD", 3], CL: ["CLP", 0], BG: ["EUR", 2], HR: ["EUR", 2],
  };
  for (const [iso2, [currency, digits]] of Object.entries(expected)) {
    const resolved = resolveDestinationCurrency(iso2);
    assert.equal(resolved?.currency, currency, iso2);
    assert.equal(resolved?.minorDigits, digits, iso2);
  }
  assert.equal(resolveDestinationIso2("Italy"), "IT");
  assert.equal(resolveDestinationIso2("united kingdom"), "GB");
  assert.equal(resolveDestinationIso2("UAE"), "AE");
  assert.equal(resolveDestinationCurrency("Japan")?.currencyName, "Japanese Yen");
  assert.equal(resolveDestinationCurrency("Atlantis"), null);
  assert.equal(resolveDestinationCurrency("ZW"), null, "ambiguous everyday currency is not guessed");
  assert.equal(resolveDestinationCurrency(""), null);
});

test("decimal-safe conversion uses integer minor units and half-up rounding", () => {
  assert.equal(usdToCents(975), BigInt(97500));
  assert.equal(usdToCents("975.5"), BigInt(97550));
  assert.equal(usdToCents(0.1 + 0.2), BigInt(30), "float noise is normalized at the cent boundary");
  assert.equal(usdToCents(-1), null);
  assert.equal(usdToCents("abc"), null);
  assert.equal(usdToCents(0), null);
  // $975.00 × 0.92031 EUR = €897.30225 → €897.30
  assert.equal(convertCentsToMinor(BigInt(97500), "0.92031", 2), BigInt(89730));
  // Half-up at the boundary: $1.00 × 0.125 = 0.125 → 0.13
  assert.equal(convertCentsToMinor(BigInt(100), "0.125", 2), BigInt(13));
  // Zero-decimal and three-decimal currencies.
  assert.equal(convertCentsToMinor(BigInt(97500), "154.237", 0), BigInt(150381)); // ¥150,381
  assert.equal(convertCentsToMinor(BigInt(97500), "0.376", 3), BigInt(366600)); // BHD 366.600
});

test("rate responses are accepted only for the exact pair, positive decimal, fresh and timestamped", () => {
  const good = parseWiseRateResponse([{ rate: 0.92031, source: "USD", target: "EUR", time: fresh }], "USD", "EUR", NOW);
  assert.equal(good?.rate, "0.92031");
  assert.equal(good?.provider, "Wise");
  assert.equal(parseWiseRateResponse({ rate: "0.92031", source: "USD", target: "EUR", time: fresh }, "USD", "EUR", NOW)?.rate, "0.92031");
  assert.equal(parseWiseRateResponse([{ rate: 0.92, source: "USD", target: "GBP", time: fresh }], "USD", "EUR", NOW), null, "wrong pair");
  assert.equal(parseWiseRateResponse([{ rate: 0, source: "USD", target: "EUR", time: fresh }], "USD", "EUR", NOW), null);
  assert.equal(parseWiseRateResponse([{ rate: -1, source: "USD", target: "EUR", time: fresh }], "USD", "EUR", NOW), null);
  assert.equal(parseWiseRateResponse([{ rate: "1e-7", source: "USD", target: "EUR", time: fresh }], "USD", "EUR", NOW), null);
  assert.equal(parseWiseRateResponse([{ rate: 0.92, source: "USD", target: "EUR" }], "USD", "EUR", NOW), null, "no timestamp");
  const stale = new Date(NOW.getTime() - WISE_RATE_MAX_AGE_MS - 1).toISOString();
  assert.equal(parseWiseRateResponse([{ rate: 0.92, source: "USD", target: "EUR", time: stale }], "USD", "EUR", NOW), null, "stale");
  const future = new Date(NOW.getTime() + 60 * 60 * 1000).toISOString();
  assert.equal(parseWiseRateResponse([{ rate: 0.92, source: "USD", target: "EUR", time: future }], "USD", "EUR", NOW), null, "future");
});

test("rate retrieval is a single read-only GET to the versioned Wise rates endpoint", async () => {
  const fake = fakeFetch([{ rate: 0.92031, source: "USD", target: "EUR", time: fresh }]);
  const rate = await getWiseRate("USD", "EUR", { fetchImpl: fake.impl, now: NOW, env: ENV });
  assert.equal(rate?.rate, "0.92031");
  assert.equal(fake.calls.length, 1);
  assert.equal(fake.calls[0].url, "https://api.wise.com/2026Q3/rates?source=USD&target=EUR");
  assert.equal(fake.calls[0].init.method, "GET");
  assert.equal(fake.calls[0].init.body, undefined);
  assert.equal((fake.calls[0].init.headers as Record<string, string>).Authorization, "Bearer test-token-not-real");
  // Cached within the reuse window: no second call.
  await getWiseRate("USD", "EUR", { fetchImpl: fake.impl, now: new Date(NOW.getTime() + 60_000), env: ENV });
  assert.equal(fake.calls.length, 1);
});

test("no token, HTTP errors and network failures yield no rate (never fabricated)", async () => {
  const fake = fakeFetch([{ rate: 0.92, source: "USD", target: "EUR", time: fresh }]);
  assert.equal(await getWiseRate("USD", "EUR", { fetchImpl: fake.impl, now: NOW, env: {} }), null);
  assert.equal(fake.calls.length, 0, "no call without a token");
  assert.equal(await getWiseRate("USD", "EUR", { fetchImpl: fakeFetch({ error: "x" }, 401).impl, now: NOW, env: ENV }), null);
  assert.equal(await getWiseRate("USD", "EUR", { fetchImpl: fakeFetch({ error: "x" }, 503).impl, now: NOW, env: ENV }), null);
  const failing = async () => { throw new TypeError("fetch failed"); };
  assert.equal(await getWiseRate("USD", "EUR", { fetchImpl: failing, now: NOW, env: ENV }), null);
  assert.equal(await getWiseRate("USD", "USD", { fetchImpl: fake.impl, now: NOW, env: ENV }), null);
  assert.equal(await getWiseRate("usd", "E1R", { fetchImpl: fake.impl, now: NOW, env: ENV }), null);
});

test("estimate keeps the USD invoice canonical and is indicative only", async () => {
  const fake = fakeFetch([{ rate: "0.92031", source: "USD", target: "EUR", time: fresh }]);
  const estimate = await buildLocalCurrencyEstimate({ amountUsd: 975, destination: "Italy", fetchImpl: fake.impl, now: NOW, env: ENV });
  assert.equal(estimate.status, "available");
  if (estimate.status !== "available") return;
  assert.equal(estimate.invoiceCurrency, "USD");
  assert.equal(estimate.invoiceAmount, "975.00");
  assert.equal(estimate.currency, "EUR");
  assert.equal(estimate.amountMinor, "89730");
  assert.equal(estimate.formatted, "€897.30");
  assert.equal(estimate.provider, "Wise");
  assert.equal(estimate.classification, "indicative");

  const yen = await buildLocalCurrencyEstimate({
    amountUsd: 975, destination: "JP", now: NOW, env: ENV,
    fetchImpl: fakeFetch([{ rate: "154.237", source: "USD", target: "JPY", time: fresh }]).impl,
  });
  assert.equal(yen.status === "available" && yen.formatted, "¥150,381");

  assert.deepEqual(await buildLocalCurrencyEstimate({ amountUsd: 975, destination: "US", now: NOW, env: ENV }), { status: "unavailable", currency: "USD", reason: "SAME_CURRENCY" });
  assert.equal((await buildLocalCurrencyEstimate({ amountUsd: 975, destination: "Atlantis", now: NOW, env: ENV })).status, "unavailable");
  const noRate = await buildLocalCurrencyEstimate({ amountUsd: 975, destination: "GB", now: NOW, env: {} });
  assert.deepEqual(noRate, { status: "unavailable", currency: "GBP", reason: "RATE_UNAVAILABLE" });
  assert.equal((await buildLocalCurrencyEstimate({ amountUsd: null, destination: "IT", now: NOW, env: ENV })).status, "unavailable");
});

test("Wise FX code is read-only, server-side and never payment authority", () => {
  const source = fs.readFileSync("lib/wise/rates.ts", "utf8");
  assert.doesNotMatch(source, /method:\s*"(POST|PUT|PATCH|DELETE)"/);
  assert.doesNotMatch(source, /\/quotes|\/transfers|\/payments|\/recipients|\/accounts/);
  assert.doesNotMatch(source, /env\.NEXT_PUBLIC_|env\[["']NEXT_PUBLIC_/, "token must never come from a public env var");
  assert.match(source, /typeof window !== "undefined"\) return null/);
  // The client card only imports the TYPE; the rate fetch runs on the server page.
  const card = fs.readFileSync("components/portal/WisePaymentCard.tsx", "utf8");
  assert.match(card, /import type \{ LocalCurrencyEstimate \} from "@\/lib\/wise\/rates"/);
  assert.doesNotMatch(card, /import \{[^}]*\} from "@\/lib\/wise\/rates"/);
  assert.match(card, /Local currency estimate unavailable\./);
  assert.match(card, /Estimate only: your invoice is in USD/);
  const page = fs.readFileSync("app/portal/matter-room/page.tsx", "utf8");
  assert.doesNotMatch(page, /^"use client"/);
  assert.match(page, /buildLocalCurrencyEstimate\(\{ amountUsd: matter\.total_price, destination: matter\.destination_country \}\)/);
  // The amount due shown and the Wise payment link still use the canonical USD total.
  assert.match(page, /amountDue=\{matter\.total_price \?\? 0\}/);
  assert.match(page, /currency="USD"/);
});
