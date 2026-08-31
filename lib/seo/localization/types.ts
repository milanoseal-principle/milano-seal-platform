import type { SeoIndexStatus } from "../authority/types";

export type SupportedSeoLocale = "en-US" | "it-IT" | "es-ES" | "pt-BR" | "de-DE" | "fr-FR";

export interface LocalizedSeoRecord {
  locale: SupportedSeoLocale;
  path: string;
  englishEquivalent: string;

  title: string;
  description: string;
  h1: string;
  bodySections: Record<string, string>;

  ctaLabel: string;
  englishVersionLabel: string;
  legalBoundary: string;

  translationStatus: "DRAFT" | "MACHINE_DRAFT" | "HUMAN_REVIEW_REQUIRED" | "HUMAN_REVIEWED";
  reviewedBy?: string;
  reviewedAt?: string;
  indexStatus: SeoIndexStatus;
}
