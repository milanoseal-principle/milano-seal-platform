// Milano Seal™ Canonical Pricing Configuration
// Source: Official rate sheet — all revenue streams
// Used by: operator dashboard, invoice generation, quote builder, intake
// NOT rendered on public homepage (quote-first model)

// ── Statutory Fees (Florida) ──────────────────────────────────────────────────

export const STATUTORY_FEES = {
  inPersonPerSignature: 10,
  ronPerSignature: 25,
  note: "Florida statutory notarial fees per notarized signature — included in professional service rates",
} as const;

// ── Remote Online Notarization (RON) ─────────────────────────────────────────

export const RON_PRICING = [
  {
    id: "ron_standard",
    name: "Standard RON Session",
    price: 125,
    priceLabel: "$125",
    note: "1 signer, up to 2 notarized signatures",
  },
  {
    id: "ron_additional_signature",
    name: "Additional Notarized Signature (same session)",
    price: 25,
    priceLabel: "$25 per signature",
    note: "Same session only",
  },
  {
    id: "ron_additional_signer",
    name: "Additional Signer (same session)",
    price: 75,
    priceLabel: "$75",
    note: "Same session only",
  },
  {
    id: "ron_priority",
    name: "Priority / Same-Day RON",
    price: 175,
    priceLabel: "$175",
    note: "Priority scheduling, same-day execution",
  },
  {
    id: "ron_after_hours",
    name: "After-Hours RON Session",
    price: 225,
    priceLabel: "$225",
    note: "Outside standard business hours",
  },
  {
    id: "ron_holiday",
    name: "Holiday RON Session",
    price: 250,
    priceLabel: "$250",
    note: "Recognized holiday scheduling",
  },
] as const;

// ── Florida Mobile Notary ─────────────────────────────────────────────────────

export const MOBILE_NOTARY_PRICING = [
  {
    id: "mobile_standard",
    name: "Standard Mobile Appointment",
    price: 125,
    priceLabel: "$125",
    note: "In-person signing at client location",
  },
  {
    id: "mobile_priority",
    name: "Priority / Same-Day Mobile",
    price: 175,
    priceLabel: "$175",
    note: "Priority scheduling, same-day appointment",
  },
  {
    id: "mobile_after_hours",
    name: "After-Hours Mobile Appointment",
    price: 225,
    priceLabel: "$225",
    note: "Outside standard business hours",
  },
  {
    id: "mobile_holiday",
    name: "Holiday Mobile Appointment",
    price: 275,
    priceLabel: "$275",
    note: "Recognized holiday scheduling",
  },
  {
    id: "mobile_mileage",
    name: "Mileage",
    price: 0.72,
    priceLabel: "$0.72 per mile (round trip)",
    note: "IRS standard rate — round trip from notary location",
  },
  {
    id: "mobile_statutory",
    name: "Statutory Notarial Fee",
    price: 10,
    priceLabel: "$10 per notarized signature",
    note: "Florida statutory fee — per notarized signature",
  },
  {
    id: "mobile_wait_time",
    name: "Wait Time (after 15 minutes)",
    price: 50,
    priceLabel: "$50 per 30 minutes",
    note: "Billed in 30-minute increments after first 15 minutes",
  },
] as const;

// ── Apostille Coordination (Florida Department of State) ──────────────────────

export const APOSTILLE_PRICING = [
  {
    id: "apostille_first",
    name: "Apostille — First Document",
    price: 275,
    priceLabel: "$275",
    note: "Florida Department of State — first document per order",
  },
  {
    id: "apostille_additional",
    name: "Apostille — Each Additional Document (same order)",
    price: 195,
    priceLabel: "$195",
    note: "Same order, additional documents",
  },
  {
    id: "apostille_expedited",
    name: "Expedited Apostille Handling",
    price: 195,
    priceLabel: "$195",
    note: "Expedited submission and processing coordination",
  },
  {
    id: "apostille_same_day",
    name: "Same-Day / 24–48 Hour In-Person",
    price: 100,
    priceLabel: "$100 per hour",
    note: "In-person coordination at Florida Dept of State",
  },
  {
    id: "apostille_mileage",
    name: "Mileage (apostille in-person)",
    price: 0.72,
    priceLabel: "$0.72 per mile (round trip)",
    note: "IRS standard rate — round trip",
  },
  {
    id: "apostille_after_hours_prep",
    name: "After-Hours Intake & Rush Prep",
    price: 100,
    priceLabel: "$100",
    note: "After-hours document intake and rush preparation",
  },
] as const;

// ── International Courier & Dispatch ─────────────────────────────────────────

export const COURIER_PRICING = [
  {
    id: "courier_shipping",
    name: "Courier Shipping",
    price: null,
    priceLabel: "Carrier cost (FedEx, DHL, UPS)",
    note: "Billed at exact carrier cost — no markup. Confirmed after apostille completion.",
  },
  {
    id: "courier_dispatch_coordination",
    name: "International Dispatch & Coordination",
    price: 50,
    priceLabel: "$50",
    note: "Coordination fee for international release and dispatch",
  },
  {
    id: "courier_priority_dispatch",
    name: "Priority / Urgent Dispatch",
    price: 75,
    priceLabel: "$75",
    note: "Optional — priority dispatch coordination",
  },
] as const;

export const COURIER_STRUCTURE = {
  note: "International courier costs are maintained separately from professional fees to preserve financial transparency and eliminate ambiguity in cross-border operations.",
  carriers: ["DHL Express", "FedEx International", "UPS International"],
  billing: "Billed at carrier cost at time of shipment — exact cost confirmed after apostille completion",
  estimate: "$85–$120 USD (DHL Express, US → international, typical document packet)",
  customsClassification: {
    type: "Documents",
    contents: "Legal notarial documentation",
    commercialValue: "None",
    declaredValue: "$1 USD",
    purpose: "Legal documentation",
    hsCode: "490199 — printed legal documents",
    dutiesAndTaxes: "Not applicable",
  },
  tracking: "Tracking number and receipt transmitted immediately upon shipment",
} as const;

// ── Execution Lanes (bundled matters) ────────────────────────────────────────

export const PRICING_LANES = [
  {
    id: "signature",
    name: "Signature Lane",
    price: 750,
    priceLabel: "$750",
    description: "For one coordinated document execution matter — single document, single signer, Florida apostille.",
    inclusions: [
      "Controlled document drafting (English, Florida notarial standards)",
      "Draft transmitted for review before execution — no notarization without written approval",
      "One (1) Remote Online Notarization session",
      "One (1) signer, one (1) notarial act",
      "Florida Department of State apostille coordination",
      "Apostille returned to studio for controlled international release",
      "Secure matter tracking",
      "Statutory notarial fee ($10) included",
    ],
    notIncluded: [
      "International courier — billed separately at carrier cost",
      "International dispatch coordination ($50)",
      "Additional signers or notarial acts",
      "Translation services",
    ],
    cta: "Start Signature Lane",
  },
  {
    id: "priority",
    name: "Priority Lane",
    price: 975,
    priceLabel: "$975",
    description: "For urgent review, scheduling, and accelerated coordination with priority apostille handling.",
    inclusions: [
      "Everything in Signature Lane",
      "Priority scheduling coordination",
      "Accelerated operator review and state submission",
      "Expedited apostille handling",
      "Reduced transit delay prior to state intake",
      "Priority courier release coordination",
      "Courier visibility and tracking",
      "Statutory notarial fee ($10) included",
    ],
    notIncluded: [
      "International courier — billed separately at carrier cost",
      "International dispatch coordination ($50)",
      "Additional signers or notarial acts",
      "Translation services",
    ],
    cta: "Start Priority Lane",
  },
  {
    id: "executive",
    name: "Executive Lane",
    price: 1850,
    priceLabel: "$1,850",
    description: "For complex international matters, multiple parties, or white-glove chain-of-custody coordination.",
    inclusions: [
      "Everything in Priority Lane",
      "Multi-party or complex document execution support",
      "Same-day notarization scheduling priority",
      "White-glove matter coordination",
      "Direct chain-of-custody oversight",
      "Complex document path review",
      "Priority release oversight",
      "Statutory notarial fee ($10) included",
    ],
    notIncluded: [
      "International courier — billed separately at carrier cost",
      "International dispatch coordination ($50)",
      "Translation services",
    ],
    cta: "Start Executive Lane",
  },
] as const;

// ── Add-ons (itemized — can be added to any invoice) ─────────────────────────

export const PRICING_ADD_ONS = [
  { id: "addon_additional_sig",     name: "Additional notarized signature (same session)",     priceLabel: "$25 per signature" },
  { id: "addon_additional_signer",  name: "Additional signer (same session)",                  priceLabel: "$75" },
  { id: "addon_apostille_add",      name: "Apostille — each additional document (same order)", priceLabel: "$195" },
  { id: "addon_apostille_expedited",name: "Expedited apostille handling",                      priceLabel: "$195" },
  { id: "addon_rush_scheduling",    name: "Rush / same-day scheduling",                        priceLabel: "$175" },
  { id: "addon_after_hours_ron",    name: "After-hours RON session",                           priceLabel: "$225" },
  { id: "addon_holiday_ron",        name: "Holiday RON session",                               priceLabel: "$250" },
  { id: "addon_dispatch",           name: "International dispatch coordination",               priceLabel: "$50" },
  { id: "addon_priority_dispatch",  name: "Priority / urgent dispatch",                        priceLabel: "$75" },
  { id: "addon_mileage",            name: "Mileage (mobile notary, round trip)",               priceLabel: "$0.72 per mile — IRS rate" },
  { id: "addon_wait_time",          name: "Wait time after 15 minutes",                        priceLabel: "$50 per 30 min" },
  { id: "addon_after_hours_prep",   name: "After-hours intake & rush prep",                    priceLabel: "$100" },
] as const;

// ── Payment Structure ─────────────────────────────────────────────────────────

export const PAYMENT_STRUCTURE = {
  retainer: "50% upon engagement confirmation",
  balance: "50% balance prior to international release",
  note: "Drafting and apostille coordination begin upon 50% retainer confirmation. After apostille issuance, invoice for balance + exact courier cost is issued. International release occurs immediately upon final payment confirmation.",
  method: "U.S. wire transfer",
} as const;

// ── Revenue Stream Summary (for operator dashboard) ──────────────────────────

export const REVENUE_STREAMS = [
  { id: "ron",          label: "Remote Online Notarization",        ref: "RON_PRICING" },
  { id: "mobile",       label: "Florida Mobile Notary",             ref: "MOBILE_NOTARY_PRICING" },
  { id: "apostille",    label: "Apostille Coordination",            ref: "APOSTILLE_PRICING" },
  { id: "courier",      label: "International Courier & Dispatch",  ref: "COURIER_PRICING" },
  { id: "lanes",        label: "Execution Lanes (bundled matters)",  ref: "PRICING_LANES" },
  { id: "addons",       label: "Add-On Services",                   ref: "PRICING_ADD_ONS" },
] as const;

// ── Disclaimer ────────────────────────────────────────────────────────────────

export const PRICING_DISCLAIMER =
  "Final pricing depends on document type, origin jurisdiction, signer location, destination country, apostille requirements, courier needs, and urgency. Courier costs are billed separately at carrier cost. The Milano Seal™ supports document execution logistics, notarization coordination, apostille coordination, courier tracking, and release controls. Legal advice should come from a licensed attorney.";
