export type ReceivingAuthorityRow = {
  id: string;
  country?: string | null;
  authority_name?: string | null;
  source_url?: string | null;
  last_verified_at?: string | null;
  stale_after_days?: number | null;
  confidence_level?: string | null;
  manual_review_required?: boolean | null;
  routing_status?: string | null;
};

export type AuthorityReconciliationDecision = {
  desiredRoutingStatus: "ACTIVE" | "REVIEW_REQUIRED";
  manualReviewRequired: boolean;
  reviewDueSoon: boolean;
  stale: boolean;
  reason: string;
};

const ROUTING_CONFIDENCE = new Set([
  "VERIFIED_OFFICIAL",
  "VERIFIED_OPERATOR",
  "PARTNER_CONFIRMED",
]);

const REVIEW_WINDOW_DAYS = 30;
const DEFAULT_STALE_AFTER_DAYS = 180;
const DAY_MS = 86_400_000;

export function reconcileAuthorityFreshness(
  row: ReceivingAuthorityRow,
  now = new Date(),
): AuthorityReconciliationDecision {
  const sourceUrl = row.source_url?.trim() ?? "";
  const confidence = row.confidence_level?.trim() ?? "UNVERIFIED_REVIEW_REQUIRED";
  const staleAfterDays =
    typeof row.stale_after_days === "number" && row.stale_after_days > 0
      ? row.stale_after_days
      : DEFAULT_STALE_AFTER_DAYS;

  if (!sourceUrl) {
    return {
      desiredRoutingStatus: "REVIEW_REQUIRED",
      manualReviewRequired: true,
      reviewDueSoon: false,
      stale: false,
      reason: "Missing authoritative provenance.",
    };
  }

  if (!row.last_verified_at) {
    return {
      desiredRoutingStatus: "REVIEW_REQUIRED",
      manualReviewRequired: true,
      reviewDueSoon: false,
      stale: false,
      reason: "Authority has not been verified.",
    };
  }

  const verifiedAt = new Date(row.last_verified_at);
  if (Number.isNaN(verifiedAt.getTime())) {
    return {
      desiredRoutingStatus: "REVIEW_REQUIRED",
      manualReviewRequired: true,
      reviewDueSoon: false,
      stale: false,
      reason: "Authority verification timestamp is invalid.",
    };
  }

  if (!ROUTING_CONFIDENCE.has(confidence)) {
    return {
      desiredRoutingStatus: "REVIEW_REQUIRED",
      manualReviewRequired: true,
      reviewDueSoon: false,
      stale: false,
      reason: "Authority confidence cannot drive canonical routing.",
    };
  }

  const staleAt = verifiedAt.getTime() + staleAfterDays * DAY_MS;
  const remainingMs = staleAt - now.getTime();
  const stale = remainingMs < 0;

  if (stale) {
    return {
      desiredRoutingStatus: "REVIEW_REQUIRED",
      manualReviewRequired: true,
      reviewDueSoon: false,
      stale: true,
      reason: "Authority verification is stale.",
    };
  }

  return {
    desiredRoutingStatus: "ACTIVE",
    manualReviewRequired: false,
    reviewDueSoon: remainingMs <= REVIEW_WINDOW_DAYS * DAY_MS,
    stale: false,
    reason:
      remainingMs <= REVIEW_WINDOW_DAYS * DAY_MS
        ? "Authority remains active but is due for review soon."
        : "Authority provenance and freshness remain valid.",
  };
}
