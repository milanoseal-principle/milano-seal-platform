// Type definitions for the Client Acquisition Engine (Task 1).
// Pure types only — no runtime values, no fabricated data.

export type LeadSource =
  | "organic_search"
  | "referral"
  | "attorney_network"
  | "university_partner"
  | "healthcare_partner"
  | "immigration_professional"
  | "airport_emergency"
  | "direct"
  | "paid"
  | "unknown";

export type ClientVertical =
  | "attorney"
  | "university"
  | "healthcare"
  | "immigration_professional"
  | "airport_emergency"
  | "general";

export type LeadBand = "cold" | "warm" | "hot";

export interface LeadScore {
  score: number;
  band: LeadBand;
  reasons: string[];
}

export type UrgencyLevel = "standard" | "priority" | "emergency";

export type DocumentComplexity = "simple" | "moderate" | "complex";

export interface LeadScoringInput {
  vertical: ClientVertical;
  urgency: UrgencyLevel;
  documentComplexity: DocumentComplexity;
  source: LeadSource;
  destinationCountry?: string | null;
  hasReferralCode?: boolean;
}

export interface DynamicCtaContext {
  vertical: ClientVertical;
  country?: string | null;
  urgency?: UrgencyLevel;
  source?: LeadSource;
}

export interface ResolvedCta {
  label: string;
  href: string;
  note: string;
}

export type AcquisitionFunnelStage =
  | "visitor"
  | "intake_started"
  | "intake_completed"
  | "quoted"
  | "payment_confirmed";

export interface FunnelStageCount {
  stage: AcquisitionFunnelStage;
  count: number;
}

export interface ReferralCapture {
  id: string;
  rawSource: string | null;
  normalizedSource: LeadSource;
  vertical: ClientVertical;
  referralCode: string | null;
  capturedAt: string;
}

export interface AbandonedIntake {
  id: string;
  clientLabel: string | null;
  vertical: ClientVertical;
  lastActivityAt: string;
  stage: AcquisitionFunnelStage;
}

export type FounderReviewStatus = "pending" | "reviewed" | "dismissed";

export interface FounderReviewItem {
  id: string;
  title: string;
  vertical: ClientVertical;
  leadScore: LeadScore;
  createdAt: string;
  status: FounderReviewStatus;
  note?: string | null;
}
