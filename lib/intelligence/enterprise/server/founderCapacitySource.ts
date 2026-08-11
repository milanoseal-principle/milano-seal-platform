// SERVER-ONLY loader for canonical workload capacity. Read-only via the canonical
// deals adapter (status + assignee presence). It never writes, never changes any
// assignment, and never mutates scheduling or tasks. Founder/admin only. Emits
// COUNTS only — the assignee id never reaches the client. No thresholds invented.

import { createClient } from "@/lib/supabase/server";
import { resolveServerRole } from "@/lib/auth/server-role";
import { fetchCanonicalDeals, DealsSchemaError, type NormalizedDealRow } from "@/lib/deals/canonicalDealReadModel";
import { buildWorkloadCapacitySnapshot } from "../snapshots";
import { mapDealsToCapacityMatterRefs } from "../matterStateMapper";
import type { CapacitySnapshot } from "../types";
import type { IntelRange } from "./founderMatterSource";

const FOUNDER_ADMIN_ROLES = new Set(["founder", "founder_admin", "admin_operator", "admin"]);

function rangeStartIso(range: IntelRange, nowIso: string): string {
  const now = new Date(nowIso);
  if (range === "quarter") {
    const q = Math.floor(now.getUTCMonth() / 3) * 3;
    return new Date(Date.UTC(now.getUTCFullYear(), q, 1)).toISOString();
  }
  return new Date(now.getTime() - range * 24 * 60 * 60 * 1000).toISOString();
}

function emptySnapshot(nowIso: string, note: string): CapacitySnapshot {
  const s = buildWorkloadCapacitySnapshot([], { generatedAt: nowIso });
  return { ...s, limitations: [note, ...s.limitations] };
}

function unavailableSnapshot(nowIso: string): CapacitySnapshot {
  const s = buildWorkloadCapacitySnapshot([], { generatedAt: nowIso });
  return { ...s, evidenceStatus: "unavailable", limitations: ["canonical_source_unavailable"] };
}

/**
 * Founder/admin-only, read-only workload capacity for the last `range`.
 * Honest empty/unavailable evidence when not authorized or on schema failure.
 */
export async function loadFounderCapacitySnapshot(range: IntelRange = 30): Promise<CapacitySnapshot> {
  const nowIso = new Date().toISOString();
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return emptySnapshot(nowIso, "Not authenticated.");

    const role = await resolveServerRole(user);
    if (!FOUNDER_ADMIN_ROLES.has(role)) {
      return emptySnapshot(nowIso, "Enterprise intelligence is restricted to founder/admin.");
    }

    const fromIso = rangeStartIso(range, nowIso);
    const { rows } = await fetchCanonicalDeals(supabase, fromIso);
    const refs = mapDealsToCapacityMatterRefs(rows as NormalizedDealRow[]);
    return buildWorkloadCapacitySnapshot(refs, { generatedAt: nowIso });
  } catch (e) {
    if (e instanceof DealsSchemaError) return unavailableSnapshot(nowIso);
    return emptySnapshot(nowIso, "Capacity records unavailable.");
  }
}
