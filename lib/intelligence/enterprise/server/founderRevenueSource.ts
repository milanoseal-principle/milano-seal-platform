// SERVER-ONLY loader for verified payment/revenue evidence. Read-only SELECT on
// canonical `deals` with an explicit safe column list; no writes and no outbound
// provider requests. Founder/admin only. Returns a computed
// MatterPerformanceSnapshot — raw payment rows never leave this module.

import { createClient } from "@/lib/supabase/server";
import { resolveServerRole } from "@/lib/auth/server-role";
import { fetchCanonicalDeals, DealsSchemaError } from "@/lib/deals/canonicalDealReadModel";
import { buildMatterPerformanceSnapshot } from "../snapshots";
import { mapDealsToCanonicalMatterRecords } from "../matterStateMapper";
import type { MatterPerformanceSnapshot } from "../types";
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

function emptySnapshot(nowIso: string, note: string): MatterPerformanceSnapshot {
  const s = buildMatterPerformanceSnapshot([], { generatedAt: nowIso });
  return { ...s, limitations: [note, ...s.limitations] };
}

function unavailableSnapshot(nowIso: string): MatterPerformanceSnapshot {
  const s = buildMatterPerformanceSnapshot([], { generatedAt: nowIso });
  return { ...s, evidenceStatus: "unavailable", limitations: ["canonical_source_unavailable"] };
}

/**
 * Founder/admin-only, read-only verified-revenue snapshot for the last `range`.
 * Honest empty evidence when the actor is not founder/admin or on error.
 */
export async function loadFounderRevenueSnapshot(range: IntelRange = 30): Promise<MatterPerformanceSnapshot> {
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
    const rows = await fetchCanonicalDeals(supabase, fromIso);
    const records = mapDealsToCanonicalMatterRecords(rows);
    return buildMatterPerformanceSnapshot(records, { generatedAt: nowIso });
  } catch (e) {
    if (e instanceof DealsSchemaError) return unavailableSnapshot(nowIso);
    return emptySnapshot(nowIso, "Payment records unavailable.");
  }
}
