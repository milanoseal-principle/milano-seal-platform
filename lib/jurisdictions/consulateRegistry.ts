import type { ConsulateRecord } from "./types";

// Illustrative consulate registry. NOT authoritative directory data. Consular
// jurisdiction (which consulate serves which US state) must be verified against
// official sources before use.

export const CONSULATE_REGISTRY: ConsulateRecord[] = [
  {
    hostCountryIso: "US",
    representsCountryIso: "IT",
    city: "Miami",
    label: "Consulate General of Italy — Miami (illustrative)",
    jurisdictionNote: "Placeholder consular jurisdiction — verify covered states.",
    verifyBeforeUse: true,
    requiresManualReview: false,
  },
  {
    hostCountryIso: "US",
    representsCountryIso: "IT",
    city: "New York",
    label: "Consulate General of Italy — New York (illustrative)",
    jurisdictionNote: "Placeholder consular jurisdiction — verify covered states.",
    verifyBeforeUse: true,
    requiresManualReview: false,
  },
  {
    hostCountryIso: "US",
    representsCountryIso: "BR",
    city: "Miami",
    label: "Consulate General of Brazil — Miami (illustrative)",
    jurisdictionNote: "Placeholder consular jurisdiction — verify covered states.",
    verifyBeforeUse: true,
    requiresManualReview: true,
  },
];

export function getConsulatesForCountry(representsIso: string): ConsulateRecord[] {
  const target = representsIso.trim().toUpperCase();
  return CONSULATE_REGISTRY.filter(
    (c) => c.representsCountryIso.toUpperCase() === target,
  );
}

export function listConsulates(): ConsulateRecord[] {
  return [...CONSULATE_REGISTRY];
}
