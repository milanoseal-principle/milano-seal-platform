import type { EmbassyRecord } from "./types";

// Illustrative embassy registry. NOT authoritative directory data. All contact
// placeholders must be verified against official government sources before use.

export const EMBASSY_REGISTRY: EmbassyRecord[] = [
  {
    hostCountryIso: "US",
    representsCountryIso: "IT",
    city: "Washington, D.C.",
    label: "Embassy of Italy (illustrative)",
    contactNote: "Placeholder — verify official contact before use.",
    verifyBeforeUse: true,
    requiresManualReview: false,
  },
  {
    hostCountryIso: "US",
    representsCountryIso: "ES",
    city: "Washington, D.C.",
    label: "Embassy of Spain (illustrative)",
    contactNote: "Placeholder — verify official contact before use.",
    verifyBeforeUse: true,
    requiresManualReview: false,
  },
  {
    hostCountryIso: "US",
    representsCountryIso: "AE",
    city: "Washington, D.C.",
    label: "Embassy of the UAE (illustrative)",
    contactNote: "Placeholder — legalization requirements change; verify before use.",
    verifyBeforeUse: true,
    requiresManualReview: true,
  },
];

export function getEmbassiesForCountry(representsIso: string): EmbassyRecord[] {
  const target = representsIso.trim().toUpperCase();
  return EMBASSY_REGISTRY.filter(
    (e) => e.representsCountryIso.toUpperCase() === target,
  );
}

export function listEmbassies(): EmbassyRecord[] {
  return [...EMBASSY_REGISTRY];
}
