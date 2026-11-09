// Every Milano-controlled monetizable service in the canonical catalog must have
// a clear public acquisition path. Keys are read from the catalog at runtime, so
// a newly added priced service with no entry path fails here instead of silently
// becoming a commercial dead end. No prices are read or published by this test.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import * as catalog from "@/lib/pricing/pricingCatalog";
import { EXECUTION_LANES, PRICING_ADDONS } from "@/lib/pricing";
import { SERVICE_LANES } from "@/lib/intake/serviceIntent";

/** Public entry path for each catalog key (route path, optional ?query). */
export const PRICED_SERVICE_ENTRY: Record<string, string> = {
  // Matter bases / execution tiers — chosen by Milano review from any intake lane.
  authentication: "/services/apostille-authentication",
  signature: "/intake?intent=international",
  priority: "/intake?intent=international",
  executive: "/intake?intent=international",
  international_passport_execution: "/services/international-passport-document-execution",
  // Document handling.
  additional_apostilled_document: "/intake?intent=apostille",
  additional_non_apostille_document: "/intake?intent=unsure",
  fbi_federal_apostille_coordination: "/services/fbi-background-check-apostille",
  multi_jurisdiction_handling: "/intake?intent=international",
  // Notary / signer / witness.
  florida_notarial_act: "/intake?intent=notary",
  additional_signer: "/intake?intent=notary",
  remote_witness: "/intake?intent=witness",
  in_person_witness: "/intake?intent=witness",
  international_signer_coordination: "/intake?intent=international",
  // Mobile travel.
  local_radius_miles: "/services/mobile-notary",
  tier_11_25: "/services/mobile-notary",
  tier_26_50: "/services/mobile-notary",
  // Timing.
  expedited: "/intake?intent=unsure",
  rush_same_day: "/services/airport-emergency-document-execution",
  after_hours_evening: "/intake?intent=notary",
  weekend: "/intake?intent=notary",
  holiday: "/intake?intent=notary",
  // Language / special handling.
  translation_coordination: "/services/translation-coordination",
  executive_in_person_state_handling: "/services/florida-apostille-courier",
  // Quote-review-only services (priced after review, never a public fee).
  consular_legalization: "/services/embassy-consular-legalization",
  document_preparation_execution_formatting: "/intake?intent=unsure",
  certified_translation: "/services/translation-coordination",
  mobile_travel_over_50_miles: "/services/mobile-notary",
  special_handling: "/speak-with-nicholas",
  unknown_authority_fee: "/intake?intent=apostille",
  // Legacy lane add-ons.
  apostille: "/services/apostille",
  rush: "/services/airport-emergency-document-execution",
  extraSigner: "/intake?intent=notary",
  witnessRemote: "/intake?intent=witness",
  witnessInPerson: "/intake?intent=witness",
  translationReview: "/services/translation-coordination",
  courier: "/services/florida-apostille-courier",
};

const CATALOG_GROUPS: Record<string, Record<string, unknown>> = {
  MATTER_BASES: catalog.MATTER_BASES,
  DOCUMENT_FEES: catalog.DOCUMENT_FEES,
  NOTARY_SIGNER_FEES: catalog.NOTARY_SIGNER_FEES,
  MOBILE_TRAVEL_FEES: catalog.MOBILE_TRAVEL_FEES,
  TIMING_FEES: catalog.TIMING_FEES,
  LANGUAGE_PREP_FEES: catalog.LANGUAGE_PREP_FEES,
  SPECIAL_HANDLING_FEES: catalog.SPECIAL_HANDLING_FEES,
  EXECUTION_LANES,
  PRICING_ADDONS,
};

function routeExists(href: string): boolean {
  const [path] = href.split("?");
  const segments = path.replace(/^\//, "");
  return existsSync(`app/${segments}/page.tsx`) || existsSync(`app/(public)/${segments}/page.tsx`);
}

test("every canonical priced service key has a public entry path", () => {
  const keys = [
    ...Object.values(CATALOG_GROUPS).flatMap((group) => Object.keys(group)),
    ...catalog.QUOTE_REVIEW_ONLY,
  ];
  const missing = keys.filter((key) => !(key in PRICED_SERVICE_ENTRY));
  assert.deepEqual(missing, [], `priced services without an acquisition path: ${missing.join(", ")}`);
});

test("every entry path resolves to an existing public page", () => {
  const broken = Object.entries(PRICED_SERVICE_ENTRY).filter(([, href]) => !routeExists(href));
  assert.deepEqual(broken, []);
});

test("intake entry paths use the governed intent vocabulary", () => {
  const intents = new Set(SERVICE_LANES.map((lane) => lane.intent));
  for (const href of Object.values(PRICED_SERVICE_ENTRY)) {
    const intent = /[?&]intent=([a-z_]+)/.exec(href)?.[1];
    if (intent) assert.ok(intents.has(intent as never), href);
  }
});

test("the coverage map publishes no prices or formulas", () => {
  const source = readFileSync("tests/unit/pricedServiceEntryCoverage.test.ts", "utf8");
  const map = source.slice(source.indexOf("PRICED_SERVICE_ENTRY"), source.indexOf("const CATALOG_GROUPS"));
  assert.doesNotMatch(map, /\$\s?\d|\b\d{3,4}\b/);
});
