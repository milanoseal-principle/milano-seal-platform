// SERVER-ONLY loader. Imports the Supabase admin client and canonical auth, so
// it must never be imported by a client component. It performs READ-ONLY
// queries: no writes, no state/event mutation. Returns a computed
// MatterStateSnapshot (plain counts) — raw Matter rows never leave this module.

import { createClient } from "@/lib/supabase/server";
import { resolveServerRole } from "@/lib/auth/server-role";
import { buildMatterStateSnapshot } from "../snapshots";
import { mapDealsToMatterStateRecords, type DealRow } from "../matterStateMapper";
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
    const { data, error } = await supabase
      .from("deals")
      .select("id, deal_id, status, created_at, completed_at, execution_date, country, document_type")
      .gte("created_at", fromIso);
    if (error || !data) return emptySnapshot(nowIso, "Matter records unavailable.");

    const records = mapDealsToMatterStateRecords(data as DealRow[]);
    return buildMatterStateSnapshot(records, { generatedAt: nowIso });
  } catch {
    return emptySnapshot(nowIso, "Matter records unavailable.");
  }
}
