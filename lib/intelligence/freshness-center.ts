import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { deriveFreshnessState, type FreshnessState } from "@/lib/intelligence/freshness-policy";

export type { FreshnessState } from "@/lib/intelligence/freshness-policy";

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
};

function clean(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return v || null;
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
