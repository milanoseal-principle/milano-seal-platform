import type { CountryRecord } from "./types";

// Illustrative country registry. NOT authoritative. Every entry carries
// `verifyBeforeExecution: true`. Hague status and notes are operational
// starting points only and must be verified against primary sources
// (e.g. the HCCH status table and the receiving authority) before execution.
// Where authoritative specifics are uncertain, `requiresManualReview` is set.

export const COUNTRY_REGISTRY: CountryRecord[] = [
  {
    name: "Italy",
    iso: "IT",
    region: "Europe",
    hagueStatus: "member",
    operationalNotes: [
      "Commonly served via US state apostille routing.",
      "Certified Italian translation frequently expected — verify with receiving authority.",
    ],
    verifyBeforeExecution: true,
    requiresManualReview: false,
  },
  {
    name: "Spain",
    iso: "ES",
    region: "Europe",
    hagueStatus: "member",
    operationalNotes: ["Certified Spanish translation often expected."],
    verifyBeforeExecution: true,
    requiresManualReview: false,
  },
  {
    name: "France",
    iso: "FR",
    region: "Europe",
    hagueStatus: "member",
    operationalNotes: ["French translation may be required — verify."],
    verifyBeforeExecution: true,
    requiresManualReview: false,
  },
  {
    name: "Germany",
    iso: "DE",
    region: "Europe",
    hagueStatus: "member",
    verifyBeforeExecution: true,
    requiresManualReview: false,
  },
  {
    name: "Brazil",
    iso: "BR",
    region: "Americas",
    hagueStatus: "member",
    operationalNotes: ["Sworn (juramentada) translation often expected — verify."],
    verifyBeforeExecution: true,
    requiresManualReview: false,
  },
  {
    name: "Mexico",
    iso: "MX",
    region: "Americas",
    hagueStatus: "member",
    verifyBeforeExecution: true,
    requiresManualReview: false,
  },
  {
    name: "Japan",
    iso: "JP",
    region: "Asia",
    hagueStatus: "member",
    verifyBeforeExecution: true,
    requiresManualReview: false,
  },
  {
    name: "United Arab Emirates",
    iso: "AE",
    region: "Middle East",
    hagueStatus: "member",
    operationalNotes: [
      "Historically consular legalization; status changes over time — verify current requirement.",
    ],
    verifyBeforeExecution: true,
    requiresManualReview: true,
  },
  {
    name: "China",
    iso: "CN",
    region: "Asia",
    hagueStatus: "member",
    operationalNotes: ["Requirements evolving — verify current process for the specific authority."],
    verifyBeforeExecution: true,
    requiresManualReview: true,
  },
  {
    name: "Placeholder Jurisdiction",
    iso: "??",
    region: "Unknown",
    hagueStatus: "unknown",
    operationalNotes: ["Unsourced example — do not execute against this record."],
    verifyBeforeExecution: true,
    requiresManualReview: true,
  },
];

export function getCountryByIso(iso: string): CountryRecord | undefined {
  const target = iso.trim().toUpperCase();
  return COUNTRY_REGISTRY.find((c) => c.iso.toUpperCase() === target);
}

export function getCountryByName(name: string): CountryRecord | undefined {
  const target = name.trim().toLowerCase();
  return COUNTRY_REGISTRY.find((c) => c.name.toLowerCase() === target);
}

export function listCountries(): CountryRecord[] {
  return [...COUNTRY_REGISTRY];
}
