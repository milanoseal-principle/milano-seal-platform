import type { JurisdictionRecord } from "./types";

export const GLOBAL_JURISDICTION_REGISTRY: JurisdictionRecord[] = [
  { country: "Italy", pathway: "hague", notes: "High-priority citizenship, affidavit, POA, vital record, and attorney-coordinated corridor.", verifyBeforeQuote: true },
  { country: "Spain", pathway: "hague", notes: "Apostille and translation coordination corridor.", verifyBeforeQuote: true },
  { country: "Portugal", pathway: "hague", notes: "Residency, citizenship, business, and personal document corridor.", verifyBeforeQuote: true },
  { country: "France", pathway: "hague", notes: "EU foreign-use document corridor.", verifyBeforeQuote: true },
  { country: "Germany", pathway: "hague", notes: "Corporate, education, and personal documentation corridor.", verifyBeforeQuote: true },
  { country: "Mexico", pathway: "hague", notes: "Bilingual and cross-border document coordination corridor.", verifyBeforeQuote: true },
  { country: "Brazil", pathway: "hague", notes: "Apostille and translation coordination corridor.", verifyBeforeQuote: true },
  { country: "United Kingdom", pathway: "hague", notes: "Apostille, corporate, education, and private client corridor.", verifyBeforeQuote: true },
  { country: "Canada", pathway: "complex", notes: "Province and receiving-authority requirements require matter-specific verification.", verifyBeforeQuote: true },
  { country: "United Arab Emirates", pathway: "non_hague", notes: "Embassy and consular legalization coordination may be required.", verifyBeforeQuote: true },
  { country: "Qatar", pathway: "non_hague", notes: "Authentication and consular steps may be required.", verifyBeforeQuote: true },
  { country: "Saudi Arabia", pathway: "non_hague", notes: "Authentication and embassy processing may be required.", verifyBeforeQuote: true }
];

export const GLOBAL_COVERAGE_NOTE = "The registry supports pathway selection and must be verified against current official guidance before quote finalization and execution routing.";
