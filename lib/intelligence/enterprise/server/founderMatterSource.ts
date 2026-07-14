// SERVER-ONLY loader. Imports the Supabase admin client and canonical auth, so
// it must never be imported by a client component. It performs READ-ONLY
// queries: no writes, no state/event mutation. Returns a computed
// MatterStateSnapshot (plain counts) — raw Matter rows never leave this module.

import { createClient } from "@/lib/supabase/server";
import { resolveServerRole } from "@/lib/auth/server-role";
import { fetchCanonicalDeals, DealsSchemaError } from "@/lib/deals/canonicalDealReadModel";
import { buildMatterStateSnapshot } from "../snapshots";
import { mapDealsToMatterStateRecords } from "../matterStateMapper";
import type { MatterStateSnapshot } from "../types";

const FOUNDER_ADMIN_ROLES = new Set(["founder", "founder_admin", "admin_operator", "admin"]);

export type IntelRange = 7 | 30 | 90 | "quarter";

function rangeStartIso(range: IntelRange, nowIso: string): string {
  const now = new Date(nowIso);
  if (range === "quarter") {
    const q = Math.floor(now.getUTCMonth() / 3) * 3;
    return new Date(Date.UTC(now.getUTCFullYear(), q, 1)).toISOString();
  }
  const days = range;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

function emptySnapshot(nowIso: string, note: string): MatterStateSnapshot {
  const s = buildMatterStateSnapshot([], { generatedAt: nowIso });
  return { ...s, limitations: [note, ...s.limitations] };
}

// Distinct from empty/insufficient: the canonical source could not be read.
function unavailableSnapshot(nowIso: string): MatterStateSnapshot {
  const s = buildMatterStateSnapshot([], { generatedAt: nowIso });
  return { ...s, evidenceStatus: "unavailable", limitations: ["canonical_source_unavailable"] };
}

/**
 * Founder/admin-only, read-only Matter-state snapshot for the last `range`.
 * Returns honest empty evidence when the actor is not founder/admin or on error.
 */
export async function loadFounderMatterStateSnapshot(range: IntelRange = 30): Promise<MatterStateSnapshot> {
  const nowIso = new Date().toISOString();
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return emptySnapshot(nowIso, "Not authenticated.");

    // Canonical app_metadata role resolution; founder/admin scope only.
    const role = await resolveServerRole(user);
    if (!FOUNDER_ADMIN_ROLES.has(role)) {
      return emptySnapshot(nowIso, "Enterprise intelligence is restricted to founder/admin.");
    }

    const fromIso = rangeStartIso(range, nowIso);
    const { rows, conflicts } = await fetchCanonicalDeals(supabase, fromIso);
    const records = mapDealsToMatterStateRecords(rows);
    const snap = buildMatterStateSnapshot(records, { generatedAt: nowIso });
    if (snap.evidenceStatus === "verified" && conflicts.length > 0) {
      return {
        ...snap,
        evidenceStatus: "verified_with_limitations",
        limitations: [...snap.limitations, ...conflicts.map((c) => `Legacy column conflict on ${c.field} (${c.count} Matters).`)],
      };
    }
    return snap;
  } catch (e) {
    // A schema/query failure is NOT "no records" — surface it as unavailable.
    if (e instanceof DealsSchemaError) return unavailableSnapshot(nowIso);
    return emptySnapshot(nowIso, "Matter records unavailable.");
  }
}
