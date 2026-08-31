import { getSeoNode } from "@/lib/seo/authority/graph";
import { LOCALIZED_SEO_RECORDS } from "@/lib/seo/localization/registry";
import { localizedSeoRecordRequiresReview } from "@/lib/seo/localization/runtime";
import type {
  AuthorityEvidenceSummary,
  SeoActivationBuildInput,
  SeoActivationCandidate,
  SeoActivationPriority,
  SeoAuthorityPlacement,
} from "./types";

const STALE_AFTER_DAYS = 180;
const DAY_MS = 86_400_000;

export function normalizeMilanoPath(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/")) return trimmed.split("?")[0].split("#")[0] || "/";
  try {
    const url = new URL(trimmed);
    const hostname = url.hostname.toLowerCase();
    if (hostname !== "themilanoseal.com" && hostname !== "www.themilanoseal.com") return null;
    return url.pathname || "/";
  } catch {
    return null;
  }
}

export function isFreshVerifiedPlacement(placement: SeoAuthorityPlacement, now = new Date()) {
  if (placement.status !== "VERIFIED" || !placement.last_verified_at || !placement.verified_by || !placement.verification_method) {
    return false;
  }
  const verifiedAt = Date.parse(placement.last_verified_at);
  if (!Number.isFinite(verifiedAt)) return false;
  return now.getTime() - verifiedAt <= STALE_AFTER_DAYS * DAY_MS;
}

export function isStaleVerifiedPlacement(placement: SeoAuthorityPlacement, now = new Date()) {
  if (placement.status === "STALE") return true;
  if (placement.status !== "VERIFIED" || !placement.last_verified_at) return false;
  const verifiedAt = Date.parse(placement.last_verified_at);
  return Number.isFinite(verifiedAt) && now.getTime() - verifiedAt > STALE_AFTER_DAYS * DAY_MS;
}

export function summarizeAuthorityEvidence(placements: SeoAuthorityPlacement[], relationships: SeoActivationBuildInput["relationships"], now = new Date()) {
  const paths = new Set<string>();
  for (const placement of placements) paths.add(placement.target_page);
  for (const relationship of relationships) paths.add(relationship.target_page);

  return [...paths].sort().map<AuthorityEvidenceSummary>((targetPage) => ({
    targetPage,
    verifiedPlacements: placements.filter((placement) => placement.target_page === targetPage && isFreshVerifiedPlacement(placement, now)).length,
    stalePlacements: placements.filter((placement) => placement.target_page === targetPage && isStaleVerifiedPlacement(placement, now)).length,
    pendingPlacements: placements.filter((placement) => placement.target_page === targetPage && placement.status === "PENDING").length,
    activeRelationships: relationships.filter((relationship) => relationship.target_page === targetPage && !["LOST", "RETIRED"].includes(relationship.status)).length,
  }));
}

function priorityForScore(score: number): SeoActivationPriority {
  if (score >= 88) return "CRITICAL";
  if (score >= 70) return "HIGH";
  if (score >= 50) return "MEDIUM";
  return "LOW";
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function searchBaseScore(impressions: number, position: number, ctr: number) {
  const impressionScore = Math.min(35, Math.log10(Math.max(1, impressions) + 1) * 10);
  const positionScore = position >= 4 && position <= 20 ? 28 - Math.abs(position - 8) * 0.8 : position < 4 ? 12 : 5;
  const ctrGap = position <= 10 ? Math.max(0, 0.035 - ctr) : Math.max(0, 0.02 - ctr);
  const ctrScore = Math.min(22, ctrGap * 700);
  return clampScore(impressionScore + positionScore + ctrScore);
}

function buildCandidate(
  actionKey: string,
  targetPage: string,
  actionType: SeoActivationCandidate["actionType"],
  score: number,
  rationale: string,
  sourceSignals: SeoActivationCandidate["sourceSignals"],
): SeoActivationCandidate {
  const normalizedScore = clampScore(score);
  return {
    actionKey,
    targetPage,
    actionType,
    score: normalizedScore,
    priority: priorityForScore(normalizedScore),
    rationale,
    sourceSignals,
  };
}

export function buildSeoActivationCandidates(input: SeoActivationBuildInput): SeoActivationCandidate[] {
  const now = input.now ?? new Date();
  const evidence = summarizeAuthorityEvidence(input.placements, input.relationships, now);
  const evidenceByPage = new Map(evidence.map((row) => [row.targetPage, row]));
  const candidates: SeoActivationCandidate[] = [];

  for (const opportunity of input.searchOpportunities) {
    const targetPage = normalizeMilanoPath(opportunity.page);
    if (!targetPage || opportunity.impressions < 50) continue;
    const base = searchBaseScore(opportunity.impressions, opportunity.position, opportunity.ctr);
    const signals = {
      source: "GOOGLE_SEARCH_CONSOLE",
      query: opportunity.query,
      impressions: opportunity.impressions,
      clicks: opportunity.clicks,
      ctr: Number(opportunity.ctr.toFixed(5)),
      position: Number(opportunity.position.toFixed(2)),
    };

    if (opportunity.position <= 10 && opportunity.ctr < 0.02 && opportunity.impressions >= 100) {
      candidates.push(buildCandidate(
        `snippet:${targetPage}:${opportunity.query.toLowerCase()}`,
        targetPage,
        "IMPROVE_SNIPPET",
        base + 10,
        "Verified search visibility is reaching page one while click-through remains below the governed 2% action threshold. Review title/description intent alignment; do not change execution claims.",
        signals,
      ));
    }

    if (opportunity.position >= 4 && opportunity.position <= 20 && opportunity.impressions >= 100) {
      candidates.push(buildCandidate(
        `content:${targetPage}:${opportunity.query.toLowerCase()}`,
        targetPage,
        "REFRESH_CONTENT",
        base + 6,
        "Verified impressions show meaningful demand with ranking headroom. Refresh evidence, clarity, and search-intent coverage without inventing acceptance certainty.",
        signals,
      ));
    }

    const node = getSeoNode(targetPage);
    const pageEvidence = evidenceByPage.get(targetPage);
    if (node && (pageEvidence?.verifiedPlacements ?? 0) === 0 && opportunity.impressions >= 100) {
      candidates.push(buildCandidate(
        `authority:${targetPage}`,
        targetPage,
        "EARN_AUTHORITY_CITATION",
        Math.max(62, base + 4),
        "This governed authority page has verified search demand but no fresh verified external authority placement in the private evidence ledger. Earn a legitimate professional/editorial citation; never manufacture or purchase deceptive authority evidence.",
        {
          source: "GSC_PLUS_AUTHORITY_LEDGER",
          impressions: opportunity.impressions,
          position: Number(opportunity.position.toFixed(2)),
          verifiedPlacements: pageEvidence?.verifiedPlacements ?? 0,
          stalePlacements: pageEvidence?.stalePlacements ?? 0,
        },
      ));
    }
  }

  for (const relationship of input.relationships) {
    if (["VERIFIED", "LOST", "RETIRED"].includes(relationship.status)) continue;
    const freshForRelationship = input.placements.some(
      (placement) => placement.relationship_id === relationship.id && isFreshVerifiedPlacement(placement, now),
    );
    if (freshForRelationship) continue;

    const scoreByStatus = {
      PROSPECT: 52,
      CONTACTED: 60,
      ENGAGED: 72,
      PLACEMENT_PENDING: 82,
    } as const;
    const score = scoreByStatus[relationship.status as keyof typeof scoreByStatus] ?? 50;
    candidates.push(buildCandidate(
      `outreach:${relationship.id}`,
      relationship.target_page,
      "PROFESSIONAL_OUTREACH",
      score,
      `${relationship.organization_name} is in ${relationship.status.replaceAll("_", " ").toLowerCase()} status without fresh verified placement evidence. Advance the relationship only through legitimate professional outreach and auditable follow-up.`,
      {
        source: "AUTHORITY_RELATIONSHIP_LEDGER",
        relationshipId: relationship.id,
        relationshipClass: relationship.relationship_class,
        relationshipStatus: relationship.status,
        countrySlug: relationship.country_slug,
      },
    ));
  }

  for (const record of LOCALIZED_SEO_RECORDS) {
    if (!localizedSeoRecordRequiresReview(record)) continue;
    candidates.push(buildCandidate(
      `localize:${record.path}`,
      record.path,
      "LOCALIZE_AFTER_REVIEW",
      68,
      "Localized route remains fail-closed. Supply complete professionally human-reviewed copy and explicit INDEXABLE approval before publication; machine translation must never unlock indexing.",
      {
        source: "LOCALIZATION_GOVERNANCE",
        locale: record.locale,
        englishEquivalent: record.englishEquivalent,
        translationStatus: record.translationStatus,
        indexStatus: record.indexStatus,
      },
    ));
  }

  const deduped = new Map<string, SeoActivationCandidate>();
  for (const candidate of candidates) {
    const current = deduped.get(candidate.actionKey);
    if (!current || candidate.score > current.score) deduped.set(candidate.actionKey, candidate);
  }

  return [...deduped.values()].sort((a, b) => b.score - a.score || a.actionKey.localeCompare(b.actionKey));
}

export const SEO_AUTHORITY_PLACEMENT_STALE_AFTER_DAYS = STALE_AFTER_DAYS;
