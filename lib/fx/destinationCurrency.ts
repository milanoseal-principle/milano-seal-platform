// Destination-country → local currency (ISO 3166-1 alpha-2 → ISO 4217).
//
// Display intelligence only. The destination currency is NOT the client's
// payment currency and never changes the canonical USD invoice. Currency
// precision comes from the runtime's ISO data (Intl), not a hand-kept table.
// Jurisdictions whose everyday currency is genuinely ambiguous resolve to
// null so the UI falls back to "estimate unavailable" instead of guessing.

const COUNTRY_CURRENCY: Readonly<Record<string, string | null>> = Object.freeze({
  // Euro area and euro-using territories (Bulgaria from 2026-01-01).
  AD: "EUR", AT: "EUR", AX: "EUR", BE: "EUR", BG: "EUR", BL: "EUR", CY: "EUR", DE: "EUR", EE: "EUR",
  ES: "EUR", FI: "EUR", FR: "EUR", GF: "EUR", GP: "EUR", GR: "EUR", HR: "EUR", IE: "EUR", IT: "EUR",
  LT: "EUR", LU: "EUR", LV: "EUR", MC: "EUR", ME: "EUR", MF: "EUR", MQ: "EUR", MT: "EUR", NL: "EUR",
  PM: "EUR", PT: "EUR", RE: "EUR", SI: "EUR", SK: "EUR", SM: "EUR", TF: "EUR", VA: "EUR", YT: "EUR",
  // US dollar.
  US: "USD", AS: "USD", BQ: "USD", EC: "USD", FM: "USD", GU: "USD", IO: "USD", MH: "USD", MP: "USD",
  PA: "USD", PR: "USD", PW: "USD", SV: "USD", TC: "USD", TL: "USD", UM: "USD", VG: "USD", VI: "USD",
  // Shared regional currencies.
  BJ: "XOF", BF: "XOF", CI: "XOF", GW: "XOF", ML: "XOF", NE: "XOF", SN: "XOF", TG: "XOF",
  CM: "XAF", CF: "XAF", TD: "XAF", CG: "XAF", GQ: "XAF", GA: "XAF",
  AG: "XCD", AI: "XCD", DM: "XCD", GD: "XCD", KN: "XCD", LC: "XCD", MS: "XCD", VC: "XCD",
  NC: "XPF", PF: "XPF", WF: "XPF",
  AU: "AUD", CC: "AUD", CX: "AUD", HM: "AUD", KI: "AUD", NF: "AUD", NR: "AUD", TV: "AUD",
  NZ: "NZD", CK: "NZD", NU: "NZD", PN: "NZD", TK: "NZD",
  CH: "CHF", LI: "CHF",
  GB: "GBP", GG: "GBP", GS: "GBP", IM: "GBP", JE: "GBP",
  DK: "DKK", FO: "DKK", GL: "DKK",
  NO: "NOK", BV: "NOK", SJ: "NOK",
  MA: "MAD", EH: "MAD",
  CW: "XCG", SX: "XCG",
  // Single-country currencies.
  AE: "AED", AF: "AFN", AL: "ALL", AM: "AMD", AO: "AOA", AR: "ARS", AW: "AWG", AZ: "AZN", BA: "BAM",
  BB: "BBD", BD: "BDT", BH: "BHD", BI: "BIF", BM: "BMD", BN: "BND", BO: "BOB", BR: "BRL", BS: "BSD",
  BT: "BTN", BW: "BWP", BY: "BYN", BZ: "BZD", CA: "CAD", CD: "CDF", CL: "CLP", CN: "CNY", CO: "COP",
  CR: "CRC", CU: "CUP", CV: "CVE", CZ: "CZK", DJ: "DJF", DO: "DOP", DZ: "DZD", EG: "EGP", ER: "ERN",
  ET: "ETB", FJ: "FJD", FK: "FKP", GE: "GEL", GH: "GHS", GI: "GIP", GM: "GMD", GN: "GNF", GT: "GTQ",
  GY: "GYD", HK: "HKD", HN: "HNL", HT: "HTG", HU: "HUF", ID: "IDR", IL: "ILS", IN: "INR", IQ: "IQD",
  IR: "IRR", IS: "ISK", JM: "JMD", JO: "JOD", JP: "JPY", KE: "KES", KG: "KGS", KH: "KHR", KM: "KMF",
  KP: "KPW", KR: "KRW", KW: "KWD", KY: "KYD", KZ: "KZT", LA: "LAK", LB: "LBP", LK: "LKR", LR: "LRD",
  LS: "LSL", LY: "LYD", MD: "MDL", MG: "MGA", MK: "MKD", MM: "MMK", MN: "MNT", MO: "MOP", MR: "MRU",
  MU: "MUR", MV: "MVR", MW: "MWK", MX: "MXN", MY: "MYR", MZ: "MZN", NA: "NAD", NG: "NGN", NI: "NIO",
  NP: "NPR", OM: "OMR", PE: "PEN", PG: "PGK", PH: "PHP", PK: "PKR", PL: "PLN", PY: "PYG", QA: "QAR",
  RO: "RON", RS: "RSD", RU: "RUB", RW: "RWF", SA: "SAR", SB: "SBD", SC: "SCR", SD: "SDG", SE: "SEK",
  SG: "SGD", SH: "SHP", SL: "SLE", SO: "SOS", SR: "SRD", SS: "SSP", ST: "STN", SY: "SYP", SZ: "SZL",
  TH: "THB", TJ: "TJS", TM: "TMT", TN: "TND", TO: "TOP", TR: "TRY", TT: "TTD", TW: "TWD", TZ: "TZS",
  UA: "UAH", UG: "UGX", UY: "UYU", UZ: "UZS", VE: "VES", VN: "VND", VU: "VUV", WS: "WST", YE: "YER",
  ZA: "ZAR", ZM: "ZMW",
  // Ambiguous everyday currency or no resident currency: no estimate.
  ZW: null, AQ: null,
});

const REGION_NAMES = (() => {
  const names = new Map<string, string>();
  try {
    const display = new Intl.DisplayNames("en", { type: "region" });
    for (const iso2 of Object.keys(COUNTRY_CURRENCY)) {
      const name = display.of(iso2);
      if (name) names.set(name.toLowerCase(), iso2);
    }
  } catch {
    // Runtime without region names: ISO codes still resolve.
  }
  // Common alternate spellings seen in intake data.
  for (const [alias, iso2] of [
    ["united states of america", "US"], ["usa", "US"], ["uk", "GB"], ["england", "GB"], ["scotland", "GB"],
    ["wales", "GB"], ["great britain", "GB"], ["holland", "NL"], ["south korea", "KR"], ["korea", "KR"],
    ["czech republic", "CZ"], ["uae", "AE"], ["turkey", "TR"], ["ivory coast", "CI"], ["vatican", "VA"],
  ] as const) names.set(alias, iso2);
  return names;
})();

/** ISO 3166-1 alpha-2 for a destination given as a code or an English country name. */
export function resolveDestinationIso2(destination: string | null | undefined): string | null {
  const value = String(destination ?? "").trim();
  if (!value) return null;
  const upper = value.toUpperCase();
  if (/^[A-Z]{2}$/.test(upper) && upper in COUNTRY_CURRENCY) return upper;
  return REGION_NAMES.get(value.toLowerCase()) ?? null;
}

export interface DestinationCurrency {
  iso2: string;
  currency: string;
  currencyName: string;
  /** ISO 4217 minor-unit digits from the runtime's currency data. */
  minorDigits: number;
}

export function currencyMinorDigits(currency: string): number | null {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? null;
  } catch {
    return null;
  }
}

/** Local currency for a destination, or null when unknown/ambiguous. */
export function resolveDestinationCurrency(destination: string | null | undefined): DestinationCurrency | null {
  const iso2 = resolveDestinationIso2(destination);
  if (!iso2) return null;
  const currency = COUNTRY_CURRENCY[iso2];
  if (!currency) return null;
  const minorDigits = currencyMinorDigits(currency);
  if (minorDigits === null) return null;
  let currencyName = currency;
  try {
    currencyName = new Intl.DisplayNames("en", { type: "currency" }).of(currency) ?? currency;
  } catch {
    // keep ISO code
  }
  return { iso2, currency, currencyName, minorDigits };
}
