import type { CountryJurisdictionRecord } from "./types";
export const COUNTRY_JURISDICTION_REGISTRY: CountryJurisdictionRecord[] = [
  { slug: "italy", name: "Italy", hagueStatus: "Hague", translationRequired: "Often required depending on receiving authority", processingNote: "Verify consulate or comune expectations before execution.", manualReviewFlags: ["citizenship", "translation", "consulate"] },
  { slug: "uae", name: "UAE", hagueStatus: "Non-Hague", translationRequired: "Verify Arabic or certified translation expectations", processingNote: "Authentication/legalization path must be verified before execution.", manualReviewFlags: ["non-hague", "embassy", "translation"] },
];
