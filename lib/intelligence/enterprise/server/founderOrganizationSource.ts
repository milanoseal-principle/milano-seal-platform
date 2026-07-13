// SERVER-ONLY loader for canonical Organization inventory. Read-only SELECT of
// an explicit safe column list on `deals` (the canonical org proxy: company_name
// + destination_country); no writes and no outbound requests. Founder/admin only.
// Commercial-account evidence comes from the canonical account registry.
// Returns a computed OrganizationInventorySnapshot — raw rows never leave here.

import { createClient } from "@/lib/supabase/server";
import { resolveServerRole } from "@/lib/auth/server-role";
import { listRealCommercialAccounts } from "@/lib/commercial-accounts/accountRegistry";
import { buildOrganizationInventorySnapshot } from "../snapshots";
import { mapDealsToOrganizationRecords, type DealRow } from "../matterStateMapper";
import type { OrganizationInventorySnapshot } from "../types";
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

function commercialAccountCount(): number {
  try {
    return listRealCommercialAccounts().length;
  } catch {
    return 0;
  }
}

function emptySnapshot(nowIso: string, note: string): OrganizationInventorySnapshot {
  const s = buildOrganizationInventorySnapshot([], {
    generatedAt: nowIso,
    commercialAccounts: commercialAccountCount(),
  });
  return { ...s, limitations: [note, ...s.limitations] };
}

/**
 * Founder/admin-only, read-only Organization inventory for the last `range`.
 * Honest empty evidence when the actor is not founder/admin or on error.
 */
export async function loadFounderOrganizationSnapshot(range: IntelRange = 30): Promise<OrganizationInventorySnapshot> {
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
    const { data, error } = await supabase
      .from("deals")
      .select("company_name, destination_country, created_at")
      .gte("created_at", fromIso);
    if (error || !data) return emptySnapshot(nowIso, "Organization records unavailable.");

    const records = mapDealsToOrganizationRecords(data as DealRow[]);
    return buildOrganizationInventorySnapshot(records, {
      generatedAt: nowIso,
      commercialAccounts: commercialAccountCount(),
      rangeFromIso: fromIso,
    });
  } catch {
    return emptySnapshot(nowIso, "Organization records unavailable.");
  }
}
