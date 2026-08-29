import type { IndexationState } from "@/lib/topical-authority/programmatic/pageEligibility";

export type SupportedSeoLocale = "en-US" | "it-IT" | "es-ES" | "pt-BR" | "de-DE" | "fr-FR";

export interface LocalizedSeoRecord {
  locale: SupportedSeoLocale;
  path: string;
  englishEquivalent: string;
  title: string;
  description: string;
  h1: string;
  bodySections: Record<string, string>;
  translationStatus: "DRAFT" | "MACHINE_DRAFT" | "HUMAN_REVIEW_REQUIRED" | "HUMAN_REVIEWED";
  reviewedBy?: string;
  reviewedAt?: string;
  indexationState: IndexationState;
}
import type { SeoIndexStatus } from "../authority/types";
export type SupportedSeoLocale = "en-US" | "it-IT" | "es-ES" | "pt-BR" | "de-DE" | "fr-FR";
export interface LocalizedSeoRecord { locale: SupportedSeoLocale; path: string; englishEquivalent: string; title: string; description: string; h1: string; bodySections: Record<string, string>; translationStatus: "DRAFT" | "MACHINE_DRAFT" | "HUMAN_REVIEW_REQUIRED" | "HUMAN_REVIEWED"; reviewedBy?: string; reviewedAt?: string; indexStatus: SeoIndexStatus }
