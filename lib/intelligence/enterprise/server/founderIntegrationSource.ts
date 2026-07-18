// SERVER-ONLY loader for integration reliability. Reads the SAME canonical
// evidence as the Integration Health Center (lib/integration-command/
// integrationReadModel) — no separate provider states, no provider SDK calls, no
// secret values, no writes. Founder/admin only. Emits computed counts only.

import { createClient } from "@/lib/supabase/server";
import { resolveServerRole } from "@/lib/auth/server-role";
import { allIntegrationHealth } from "@/lib/integration-command/integrationReadModel";
import { buildIntegrationHealthSnapshot } from "../snapshots";
import type { IntegrationHealthInput, IntegrationReliabilitySnapshot } from "../types";

const FOUNDER_ADMIN_ROLES = new Set(["founder", "founder_admin", "admin_operator", "admin"]);

function emptySnapshot(nowIso: string, note: string): IntegrationReliabilitySnapshot {
  const s = buildIntegrationHealthSnapshot([], { generatedAt: nowIso });
  return { ...s, limitations: [note, ...s.limitations] };
}

/**
 * Founder/admin-only, read-only integration reliability snapshot aligned to the
 * Health Center. No provider calls; configured ≠ active. Honest empty evidence
 * when not authorized.
 */
export async function loadFounderIntegrationSnapshot(): Promise<IntegrationReliabilitySnapshot> {
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

    // Canonical Health Center records (env-presence readiness; no provider calls).
    const records: IntegrationHealthInput[] = allIntegrationHealth().map((r) => ({
      provider: r.provider,
      configured: r.configured,
      health: r.health,
      lastVerifiedEventAt: r.lastVerifiedEventAt,
      lastFailureAt: null,
    }));
    return buildIntegrationHealthSnapshot(records, { generatedAt: nowIso });
  } catch {
    return emptySnapshot(nowIso, "Integration evidence unavailable.");
  }
}
