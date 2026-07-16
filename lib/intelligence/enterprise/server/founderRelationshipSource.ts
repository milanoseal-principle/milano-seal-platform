// SERVER-ONLY loader for canonical relationship evidence. Read-only SELECTs of
// explicit safe columns on `deals` (org key) and `deal_activities` (interactions);
// no writes, no outbound requests. Founder/admin only. Never serializes notes,
// descriptions, emails, phones, or raw rows — returns a computed snapshot.

import { createClient } from "@/lib/supabase/server";
import { resolveServerRole } from "@/lib/auth/server-role";
import { fetchCanonicalDeals, DealsSchemaError } from "@/lib/deals/canonicalDealReadModel";
import { buildRelationshipNetworkSnapshot } from "../snapshots";
import {
  mapDealsToRelationshipMatterRefs,
  mapDealActivitiesToInteractions,
  type DealRow,
  type DealActivityRow,
} from "../matterStateMapper";
import type { RelationshipNetworkSnapshot } from "../types";
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

function emptySnapshot(nowIso: string, note: string): RelationshipNetworkSnapshot {
  const s = buildRelationshipNetworkSnapshot({ matters: [], interactions: [] }, { generatedAt: nowIso });
  return { ...s, limitations: [note, ...s.limitations] };
}

function unavailableSnapshot(nowIso: string): RelationshipNetworkSnapshot {
  const s = buildRelationshipNetworkSnapshot({ matters: [], interactions: [] }, { generatedAt: nowIso });
  return { ...s, evidenceStatus: "unavailable", limitations: ["canonical_source_unavailable"] };
}

/**
 * Founder/admin-only, read-only relationship snapshot for the last `range`.
 * org↔Matter edges from `deals`; interaction evidence from `deal_activities`.
 * Honest empty/unavailable evidence when not authorized or on schema failure.
 */
export async function loadFounderRelationshipSnapshot(range: IntelRange = 30): Promise<RelationshipNetworkSnapshot> {
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

    // org↔Matter refs via the canonical deals adapter (schema failure → unavailable).
    const { rows } = await fetchCanonicalDeals(supabase, fromIso);
    const matters = mapDealsToRelationshipMatterRefs(rows as unknown as DealRow[]);

    // Interaction evidence — explicit safe columns only (no description/notes).
    let interactions: ReturnType<typeof mapDealActivitiesToInteractions> = [];
    const activities = await supabase
      .from("deal_activities")
      .select("deal_id, activity_type, created_at")
      .gte("created_at", fromIso);
    if (!activities.error && Array.isArray(activities.data)) {
      interactions = mapDealActivitiesToInteractions(activities.data as DealActivityRow[]);
    }

    return buildRelationshipNetworkSnapshot({ matters, interactions }, { generatedAt: nowIso });
  } catch (e) {
    if (e instanceof DealsSchemaError) return unavailableSnapshot(nowIso);
    return emptySnapshot(nowIso, "Relationship records unavailable.");
  }
}
