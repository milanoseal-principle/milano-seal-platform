export type FreshnessState = "CURRENT" | "WATCH" | "STALE" | "CONFLICT" | "REVIEW_REQUIRED";

export interface FreshnessPolicyInput {
  source_url?: string | null;
  last_verified_at?: string | null;
  stale_after_days?: number | null;
  manual_review_required?: boolean | null;
  routing_status?: string | null;
}

function clean(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export function deriveFreshnessState(row: FreshnessPolicyInput, nowMs = Date.now()): FreshnessState {
  if (row.manual_review_required === true || row.routing_status === "REVIEW_REQUIRED") return "REVIEW_REQUIRED";
  if (row.routing_status === "INACTIVE") return "WATCH";
  const source = clean(row.source_url);
  const verified = clean(row.last_verified_at);
  if (!source || !verified) return "REVIEW_REQUIRED";
  const verifiedMs = new Date(verified).getTime();
  if (!Number.isFinite(verifiedMs)) return "REVIEW_REQUIRED";
  const staleDays = typeof row.stale_after_days === "number" && row.stale_after_days > 0 ? row.stale_after_days : 180;
  const ageDays = (nowMs - verifiedMs) / 86_400_000;
  if (ageDays > staleDays) return "STALE";
  if (ageDays > staleDays * 0.8) return "WATCH";
  return "CURRENT";
}
