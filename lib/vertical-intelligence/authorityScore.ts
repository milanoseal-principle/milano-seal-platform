/**
 * authorityScore — internal, evidence-based organization score. Never public;
 * never fabricated; no scoring without evidence; never used to deny a legally
 * required service.
 */

export interface AuthorityEvidence {
  verifiedReferrals: number;
  repeatPaidMatters: number;
  verifiedRevenue: number;
  documentedInteractions: number;
}

export type AuthorityTier = "developing" | "established" | "strategic" | "priority" | "enterprise";

export interface AuthorityScoreResult {
  score: number;
  tier: AuthorityTier;
  hasEvidence: boolean;
  internalOnly: true;
}

/** Score is derived only from documented evidence; zero evidence => no score. */
export function computeAuthorityScore(e: AuthorityEvidence): AuthorityScoreResult {
  const hasEvidence =
    e.verifiedReferrals > 0 || e.repeatPaidMatters > 0 || e.verifiedRevenue > 0 || e.documentedInteractions > 0;

  const raw =
    e.verifiedReferrals * 12 +
    e.repeatPaidMatters * 18 +
    Math.min(40, e.verifiedRevenue / 1000) +
    Math.min(20, e.documentedInteractions * 2);
  const score = hasEvidence ? Math.min(100, Math.round(raw)) : 0;

  const tier: AuthorityTier =
    score >= 80 ? "enterprise" : score >= 60 ? "priority" : score >= 40 ? "strategic" : score >= 20 ? "established" : "developing";

  return { score, tier, hasEvidence, internalOnly: true };
}
