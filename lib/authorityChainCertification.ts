/**
 * Authority Chain Certification Engine
 *
 * Computes chain certification status and authority intelligence scores
 * from real registry data only.
 *
 * Never asserts readiness without verified data.
 * Never assigns scores based on synthetic or assumed data.
 * Operator-only output — no subset of this is exposed to portal.
 */

import {
  getAuthority,
  buildAuthorityChain,
  getDependencyChain,
  getSourceVault,
  RECEIVING_AUTHORITIES,
} from "@/data/authorities";
import type {
  AuthorityConfidence,
  AuthorityChain,
  AuthorityIntelligenceScore,
} from "@/data/authorities/types";

// ── Confidence weights ─────────────────────────────────────────────────────────

const CONFIDENCE_SCORES: Record<AuthorityConfidence, number> = {
  AUTHORITY_VERIFIED: 100,
  MULTI_SOURCE_CONFIRMED: 85,
  PARTNER_CONFIRMED: 65,
  OBSERVED: 40,
  UNVERIFIED: 15,
  VERIFICATION_REQUIRED: 0,
  DEMOTED: 0,
};

// ── Chain status labels ────────────────────────────────────────────────────────

export type ChainCertificationStatus =
  | "CERTIFIED"          // All nodes AUTHORITY_VERIFIED or MULTI_SOURCE_CONFIRMED
  | "HIGH_CONFIDENCE"    // All nodes PARTNER_CONFIRMED or above
  | "DEVELOPING"         // At least one node OBSERVED; none VERIFICATION_REQUIRED
  | "INCOMPLETE"         // One or more nodes VERIFICATION_REQUIRED or UNVERIFIED
  | "NO_CHAIN"           // No dependency data exists for this corridor
  | "DEMOTED";           // One or more nodes DEMOTED

export interface ChainCertificationResult {
  country: string;
  document_type_slug: string | null;
  status: ChainCertificationStatus;
  chain: AuthorityChain;
  lowest_confidence: AuthorityConfidence | null;
  bottleneck_authority: string | null;   // authority_name of weakest link
  bottleneck_id: string | null;
  chain_length: number;
  certified_steps: number;
  execution_confidence_score: number;   // 0–100 derived from chain
  operator_summary: string;             // plain-language operator note
}

// ── Authority Intelligence Score ──────────────────────────────────────────────

export function computeAuthorityIntelligenceScore(
  authorityId: string,
): AuthorityIntelligenceScore | null {
  const authority = getAuthority(authorityId);
  if (!authority) return null;

  // Source score: based on count and type quality
  const vaultEntries = getSourceVault(authorityId);
  const sourceTypeWeights: Record<string, number> = {
    RECEIVING_AUTHORITY: 100,
    STATE_AUTHORITY: 90,
    HCCH: 95,
    EMBASSY: 85,
    CONSULATE: 80,
    PARTNER_CONFIRMED: 65,
    OPERATOR_OBSERVED: 40,
    CLIENT_PROVIDED: 20,
    INTERNAL_CASE_MEMORY: 30,
  };
  const sourceScore = vaultEntries.length === 0
    ? 0
    : Math.min(
        100,
        vaultEntries.reduce(
          (sum, e) => sum + (sourceTypeWeights[e.source_type] ?? 30),
          0,
        ) / vaultEntries.length + (vaultEntries.length - 1) * 5,
      );

  // Freshness score: based on reviewed_at vs. review_cadence_months
  const today = new Date();
  let freshnessScore = 0;
  const reviewed = (authority as any).reviewed_at ?? authority.verified_at;
  if (reviewed) {
    const reviewedDate = new Date(reviewed);
    const monthsOld =
      (today.getTime() - reviewedDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    const cadence = authority.review_cadence_months;
    freshnessScore = Math.max(0, Math.min(100, 100 - (monthsOld / cadence) * 100));
  }

  // Confidence score
  const confidenceScore = CONFIDENCE_SCORES[authority.authority_confidence] ?? 0;

  // Dependency score: how complete is this authority's chain?
  const deps = getDependencyChain(authority.country, null);
  const relevantDeps = deps.filter(
    (d) =>
      d.upstream_authority_id === authorityId ||
      d.downstream_authority_id === authorityId,
  );
  let dependencyScore = 50; // neutral when no deps defined
  if (relevantDeps.length > 0) {
    const peerIds = new Set<string>();
    for (const d of relevantDeps) {
      peerIds.add(d.upstream_authority_id);
      peerIds.add(d.downstream_authority_id);
    }
    peerIds.delete(authorityId);
    const peerAuthorities = [...peerIds]
      .map((id) => getAuthority(id))
      .filter(Boolean);
    if (peerAuthorities.length > 0) {
      dependencyScore =
        peerAuthorities.reduce(
          (sum, a) => sum + (CONFIDENCE_SCORES[a!.authority_confidence] ?? 0),
          0,
        ) / peerAuthorities.length;
    }
  }

  // Rule coverage score
  const ruleCoverageScore = Math.min(100, authority.document_rules.length * 20);

  // Weighted composite
  const totalScore = Math.round(
    sourceScore * 0.25 +
      freshnessScore * 0.15 +
      confidenceScore * 0.35 +
      dependencyScore * 0.15 +
      ruleCoverageScore * 0.10,
  );

  const missing: string[] = [];
  if (vaultEntries.length === 0) missing.push("No source documents on file");
  if (!reviewed) missing.push("Not yet reviewed");
  if (authority.document_rules.length === 0) missing.push("No document rules verified");
  if (relevantDeps.length === 0) missing.push("Dependency chain not mapped");
  if (authority.authority_confidence === "VERIFICATION_REQUIRED")
    missing.push("Source verification required");

  let scoreInterpretation: AuthorityIntelligenceScore["score_interpretation"];
  if (totalScore >= 80) scoreInterpretation = "complete";
  else if (totalScore >= 60) scoreInterpretation = "solid";
  else if (totalScore >= 40) scoreInterpretation = "developing";
  else if (totalScore >= 20) scoreInterpretation = "minimal";
  else scoreInterpretation = "insufficient";

  return {
    authority_id: authorityId,
    authority_name: authority.authority_name,
    source_score: Math.round(sourceScore),
    freshness_score: Math.round(freshnessScore),
    confidence_score: confidenceScore,
    dependency_score: Math.round(dependencyScore),
    rule_coverage_score: ruleCoverageScore,
    total_score: totalScore,
    confidence_label: authority.authority_confidence,
    score_interpretation: scoreInterpretation,
    missing,
  };
}

// ── Chain Certification ────────────────────────────────────────────────────────

export function certifyAuthorityChain(
  countryIso: string,
  documentTypeSlug: string | null,
): ChainCertificationResult {
  const chain = buildAuthorityChain(countryIso, documentTypeSlug);

  if (chain.chain.length === 0) {
    return {
      country: countryIso,
      document_type_slug: documentTypeSlug,
      status: "NO_CHAIN",
      chain,
      lowest_confidence: null,
      bottleneck_authority: null,
      bottleneck_id: null,
      chain_length: 0,
      certified_steps: 0,
      execution_confidence_score: 0,
      operator_summary: "No authority dependency chain defined for this corridor.",
    };
  }

  const confidenceOrder: AuthorityConfidence[] = [
    "AUTHORITY_VERIFIED",
    "MULTI_SOURCE_CONFIRMED",
    "PARTNER_CONFIRMED",
    "OBSERVED",
    "UNVERIFIED",
    "VERIFICATION_REQUIRED",
    "DEMOTED",
  ];

  let lowestConfidence: AuthorityConfidence = "AUTHORITY_VERIFIED";
  let bottleneckName: string | null = null;
  let bottleneckId: string | null = null;
  let certifiedSteps = 0;

  for (const step of chain.chain) {
    const stepIdx = confidenceOrder.indexOf(step.confidence);
    const currentIdx = confidenceOrder.indexOf(lowestConfidence);
    if (stepIdx > currentIdx) {
      lowestConfidence = step.confidence;
      bottleneckName = step.authority_name;
      bottleneckId = step.authority_id;
    }
    if (
      step.confidence === "AUTHORITY_VERIFIED" ||
      step.confidence === "MULTI_SOURCE_CONFIRMED"
    ) {
      certifiedSteps++;
    }
  }

  const hasDemoted = chain.chain.some((s) => s.confidence === "DEMOTED");
  let status: ChainCertificationStatus;

  if (hasDemoted) {
    status = "DEMOTED";
  } else if (
    lowestConfidence === "VERIFICATION_REQUIRED" ||
    lowestConfidence === "UNVERIFIED"
  ) {
    status = "INCOMPLETE";
  } else if (lowestConfidence === "OBSERVED") {
    status = "DEVELOPING";
  } else if (lowestConfidence === "PARTNER_CONFIRMED") {
    status = "HIGH_CONFIDENCE";
  } else {
    status = "CERTIFIED";
  }

  const executionScore = Math.round(
    chain.chain.reduce(
      (sum, s) => sum + (CONFIDENCE_SCORES[s.confidence] ?? 0),
      0,
    ) / chain.chain.length,
  );

  const summaryMap: Record<ChainCertificationStatus, string> = {
    CERTIFIED: `All ${chain.chain.length} authority nodes verified. Chain ready for execution.`,
    HIGH_CONFIDENCE: `Chain confidence HIGH. Partner-confirmed at all nodes. Direct authority verification recommended.`,
    DEVELOPING: `Chain partially observed. ${certifiedSteps} of ${chain.chain.length} nodes certified. Bottleneck: ${bottleneckName ?? "unknown"}.`,
    INCOMPLETE: `Chain incomplete. ${bottleneckName ?? "One or more nodes"} requires source verification before chain can be certified.`,
    NO_CHAIN: `No dependency chain defined.`,
    DEMOTED: `Chain contains a DEMOTED node. Requirements may have changed. Review required before execution.`,
  };

  return {
    country: countryIso,
    document_type_slug: documentTypeSlug,
    status,
    chain,
    lowest_confidence: lowestConfidence,
    bottleneck_authority: bottleneckName,
    bottleneck_id: bottleneckId,
    chain_length: chain.chain.length,
    certified_steps: certifiedSteps,
    execution_confidence_score: executionScore,
    operator_summary: summaryMap[status],
  };
}

// ── Batch: all chains for a country ───────────────────────────────────────────

export function getCountryChainReport(countryIso: string): ChainCertificationResult[] {
  // Get distinct document types that have dependencies defined for this country
  const { AUTHORITY_DEPENDENCIES } = require("@/data/authorities");
  const docTypes = new Set<string | null>(
    AUTHORITY_DEPENDENCIES
      .filter((d: any) => d.country.toUpperCase() === countryIso.toUpperCase())
      .map((d: any) => d.document_type_slug),
  );
  if (docTypes.size === 0) docTypes.add(null);

  return [...docTypes].map((slug) => certifyAuthorityChain(countryIso, slug));
}

// ── Batch: intelligence scores for all active authorities ─────────────────────

export function getAllAuthorityIntelligenceScores(): AuthorityIntelligenceScore[] {
  return RECEIVING_AUTHORITIES
    .filter((a) => a.valid_to === null)
    .map((a) => computeAuthorityIntelligenceScore(a.id))
    .filter((s): s is AuthorityIntelligenceScore => s !== null)
    .sort((a, b) => b.total_score - a.total_score);
}
