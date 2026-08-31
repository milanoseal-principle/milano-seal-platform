import type { SeoOpportunity as SearchConsoleOpportunity } from "@/lib/seo/search-console/reporting";

export const AUTHORITY_RELATIONSHIP_CLASSES = [
  "LAW_FIRM",
  "CITIZENSHIP_PROFESSIONAL",
  "PROFESSIONAL_ADVISOR",
  "CHAMBER_ASSOCIATION",
  "NOTARY_ORGANIZATION",
  "EDITORIAL_PUBLISHER",
  "DIRECTORY",
  "ALLIANCE_PARTNER",
  "OTHER",
] as const;

export const AUTHORITY_RELATIONSHIP_STATUSES = [
  "PROSPECT",
  "CONTACTED",
  "ENGAGED",
  "PLACEMENT_PENDING",
  "VERIFIED",
  "LOST",
  "RETIRED",
] as const;

export const AUTHORITY_PLACEMENT_TYPES = [
  "EDITORIAL_CITATION",
  "PROFESSIONAL_PROFILE",
  "DIRECTORY_LISTING",
  "PARTNER_PAGE",
  "RESOURCE_PAGE",
  "ASSOCIATION_MEMBER_PAGE",
  "REFERRAL_PAGE",
  "OTHER",
] as const;

export const AUTHORITY_PLACEMENT_STATUSES = ["PENDING", "VERIFIED", "STALE", "REMOVED", "REJECTED"] as const;
export const AUTHORITY_VERIFICATION_METHODS = ["MANUAL_REVIEW", "HTTP_CONFIRMED", "PARTNER_CONFIRMED"] as const;

export const SEO_ACTIVATION_ACTION_TYPES = [
  "REFRESH_CONTENT",
  "IMPROVE_SNIPPET",
  "BUILD_INTERNAL_LINKS",
  "LOCALIZE_AFTER_REVIEW",
  "EARN_AUTHORITY_CITATION",
  "PROFESSIONAL_OUTREACH",
  "HOLD",
] as const;

export const SEO_ACTIVATION_PRIORITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;
export const SEO_ACTIVATION_STATUSES = ["OPEN", "IN_PROGRESS", "COMPLETED", "DISMISSED", "SUPERSEDED"] as const;

export type AuthorityRelationshipClass = (typeof AUTHORITY_RELATIONSHIP_CLASSES)[number];
export type AuthorityRelationshipStatus = (typeof AUTHORITY_RELATIONSHIP_STATUSES)[number];
export type AuthorityPlacementType = (typeof AUTHORITY_PLACEMENT_TYPES)[number];
export type AuthorityPlacementStatus = (typeof AUTHORITY_PLACEMENT_STATUSES)[number];
export type AuthorityVerificationMethod = (typeof AUTHORITY_VERIFICATION_METHODS)[number];
export type SeoActivationActionType = (typeof SEO_ACTIVATION_ACTION_TYPES)[number];
export type SeoActivationPriority = (typeof SEO_ACTIVATION_PRIORITIES)[number];
export type SeoActivationStatus = (typeof SEO_ACTIVATION_STATUSES)[number];

export interface SeoAuthorityRelationship {
  id: string;
  organization_name: string;
  canonical_domain: string | null;
  relationship_class: AuthorityRelationshipClass;
  country_slug: string | null;
  locale: string | null;
  pillar: string | null;
  target_page: string;
  status: AuthorityRelationshipStatus;
  owner_user_id: string | null;
  created_by: string | null;
  notes: string | null;
  last_contacted_at: string | null;
  next_action_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SeoAuthorityPlacement {
  id: string;
  relationship_id: string;
  target_page: string;
  source_url: string;
  placement_type: AuthorityPlacementType;
  anchor_text: string | null;
  status: AuthorityPlacementStatus;
  verification_method: AuthorityVerificationMethod | null;
  first_seen_at: string | null;
  last_checked_at: string | null;
  last_verified_at: string | null;
  verified_by: string | null;
  evidence_snapshot: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SeoActivationCandidate {
  actionKey: string;
  targetPage: string;
  actionType: SeoActivationActionType;
  priority: SeoActivationPriority;
  score: number;
  rationale: string;
  sourceSignals: Record<string, string | number | boolean | null>;
}

export interface SeoActivationAction {
  id: string;
  action_key: string;
  target_page: string;
  action_type: SeoActivationActionType;
  priority: SeoActivationPriority;
  score: number;
  rationale: string;
  source_signals: Record<string, string | number | boolean | null>;
  status: SeoActivationStatus;
  owner_user_id: string | null;
  created_by: string | null;
  resolution_notes: string | null;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthorityEvidenceSummary {
  targetPage: string;
  verifiedPlacements: number;
  stalePlacements: number;
  pendingPlacements: number;
  activeRelationships: number;
}

export interface SeoActivationBuildInput {
  searchOpportunities: SearchConsoleOpportunity[];
  relationships: SeoAuthorityRelationship[];
  placements: SeoAuthorityPlacement[];
  now?: Date;
}

export interface SeoAuthorityActivationSnapshot {
  provisioned: boolean;
  provisioningMessage?: string;
  relationships: SeoAuthorityRelationship[];
  placements: SeoAuthorityPlacement[];
  actions: SeoActivationAction[];
  derivedCandidates: SeoActivationCandidate[];
  pendingLocalizedRoutes: Array<{
    locale: string;
    path: string;
    englishEquivalent: string;
    translationStatus: string;
    indexStatus: string;
  }>;
  evidenceSummary: AuthorityEvidenceSummary[];
  stalePlacementCount: number;
  verifiedPlacementCount: number;
  attributionBoundary: string;
}
