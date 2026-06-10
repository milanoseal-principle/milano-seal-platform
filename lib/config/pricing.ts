// Milano Seal™ Canonical Pricing Configuration
// Source: Official rate sheet + execution architecture
// Used by: operator dashboard, invoice generation, quote builder
// NOT rendered on public homepage (quote-first model)

export const PRICING_LANES = [
  {
    id: "signature",
    name: "Signature Lane",
    price: 750,
    priceLabel: "$750",
    description:
      "For one coordinated document execution matter — single document, single signer, Florida apostille.",
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
      "International courier — billed separately at carrier cost (DHL/FedEx/UPS)",
      "International dispatch coordination fee ($50)",
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
    description:
      "For urgent review, scheduling, and accelerated coordination with priority apostille handling.",
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
      "International courier — billed separately at carrier cost (DHL/FedEx/UPS)",
      "International dispatch coordination fee ($50)",
      "Additional signers or notarial acts",
      "Translation services",
    ],
    cta: "Start Priority Lane",
  },
  {
    id: "executive",
    name: "Executive Lane",
    price: 1275,
    priceLabel: "$1,275",
    description:
      "For complex international matters, multiple parties, or white-glove chain-of-custody coordination.",
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
      "International courier — billed separately at carrier cost (DHL/FedEx/UPS)",
      "International dispatch coordination fee ($50)",
      "Translation services",
    ],
    cta: "Start Executive Lane",
  },
] as const;

// Add-on services — billed separately or added to invoice
export const PRICING_ADD_ONS = [
  { name: "Additional notarized signature (same session)", priceLabel: "$25 per signature" },
  { name: "Additional signer (same session)", priceLabel: "$75" },
  { name: "Apostille — each additional document (same order)", priceLabel: "$195" },
  { name: "Expedited apostille handling", priceLabel: "$195" },
  { name: "Rush / same-day scheduling", priceLabel: "$175" },
  { name: "After-hours RON session", priceLabel: "$225" },
  { name: "Holiday RON session", priceLabel: "$250" },
  { name: "International dispatch coordination", priceLabel: "$50" },
  { name: "Priority / urgent dispatch", priceLabel: "$75" },
  { name: "Mileage (mobile notary, round trip)", priceLabel: "$0.72 per mile — IRS rate" },
] as const;

// Courier structure — always separate from professional fees
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

// Payment structure
export const PAYMENT_STRUCTURE = {
  retainer: "50% upon engagement confirmation",
  balance: "50% balance prior to international release",
  note: "Drafting and apostille coordination begin upon 50% retainer confirmation. After apostille issuance, invoice for balance + exact courier cost is issued. International release occurs immediately upon final payment confirmation.",
  method: "U.S. wire transfer",
} as const;

// Florida notarial statutory fees (per Florida statute)
export const STATUTORY_FEES = {
  inPersonPerSignature: 10,
  ronPerSignature: 25,
  note: "Florida statutory notarial fees — per notarized signature",
} as const;

export const PRICING_DISCLAIMER =
  "Final pricing depends on document type, origin jurisdiction, signer location, destination country, apostille requirements, courier needs, and urgency. Courier costs are billed separately at carrier cost. The Milano Seal™ supports document execution logistics, notarization coordination, apostille coordination, courier tracking, and release controls. Legal advice should come from a licensed attorney.";
