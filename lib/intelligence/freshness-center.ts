import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type FreshnessState = "CURRENT" | "WATCH" | "STALE" | "CONFLICT" | "REVIEW_REQUIRED";

export interface FreshnessRecord {
  id: string;
  authorityName: string;
  destination: string | null;
  source: string | null;
  sourceType: string | null;
  reviewDate: string | null;
  owner: string | null;
  confidence: string;
  knownCaveats: string[];
  freshnessState: FreshnessState;
  routingStatus: string;
}

export interface FreshnessSnapshot {
  generatedAt: string;
  degraded: boolean;
  warning: string | null;
  records: FreshnessRecord[];
  counts: Record<FreshnessState, number>;
}

type AuthorityRow = {
  id?: string | null;
  authority_name?: string | null;
  country?: string | null;
  source_url?: string | null;
  source_type?: string | null;
  last_verified_at?: string | null;
  stale_after_days?: number | null;
  verified_by?: string | null;
  confidence_level?: string | null;
  manual_review_required?: boolean | null;
  routing_status?: string | null;
  notes?: string | null;
};

function clean(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return v || null;
}

export function deriveFreshnessState(row: AuthorityRow, nowMs = Date.now()): FreshnessState {
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

export async function loadIntelligenceFreshness(): Promise<FreshnessSnapshot> {
  const generatedAt = new Date().toISOString();
  const supabase = createAdminClient();
  const result = await supabase
    .from("receiving_authorities")
    .select("id, authority_name, country, source_url, source_type, last_verified_at, stale_after_days, verified_by, confidence_level, manual_review_required, routing_status")
    .order("country", { ascending: true });

  const emptyCounts = { CURRENT: 0, WATCH: 0, STALE: 0, CONFLICT: 0, REVIEW_REQUIRED: 0 } satisfies Record<FreshnessState, number>;
  if (result.error) {
    return { generatedAt, degraded: true, warning: "Authority freshness source unavailable; do not treat authority intelligence as current.", records: [], counts: emptyCounts };
  }

  const records = ((result.data ?? []) as AuthorityRow[]).map((row) => ({
    id: clean(row.id) ?? "unknown",
    authorityName: clean(row.authority_name) ?? "Unnamed authority",
    destination: clean(row.country),
    source: clean(row.source_url),
    sourceType: clean(row.source_type),
    reviewDate: clean(row.last_verified_at),
    owner: clean(row.verified_by),
    confidence: clean(row.confidence_level) ?? "UNVERIFIED_REVIEW_REQUIRED",
    knownCaveats: row.manual_review_required ? ["Manual review required before routing."] : [],
    freshnessState: deriveFreshnessState(row),
    routingStatus: clean(row.routing_status) ?? "REVIEW_REQUIRED",
  }));
  const counts = { ...emptyCounts };
  for (const record of records) counts[record.freshnessState] += 1;

  return { generatedAt, degraded: false, warning: null, records, counts };
}
