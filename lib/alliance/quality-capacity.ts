import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { ALLIANCE_ACCOUNT_ROLES } from "@/lib/alliance/partnerContext";
import {
  mapAllianceState,
  type AllianceOperatingState,
} from "@/lib/alliance/quality-policy";

export type { AllianceOperatingState } from "@/lib/alliance/quality-policy";
export type AllianceEvidenceState = "OBSERVED" | "UNKNOWN";

export interface AllianceQualityRecord {
  id: string;
  name: string;
  firm: string | null;
  operatingState: AllianceOperatingState;
  coverage: string[];
  credentialStatus: AllianceEvidenceState;
  availability: AllianceEvidenceState;
  acceptance: AllianceEvidenceState;
  completion: AllianceEvidenceState;
  cost: AllianceEvidenceState;
  quality: AllianceEvidenceState;
  rework: AllianceEvidenceState;
  complaint: AllianceEvidenceState;
  capacity: AllianceEvidenceState;
  lastVerified: string | null;
}

export interface AllianceQualitySnapshot {
  generatedAt: string;
  degraded: boolean;
  warning: string | null;
  records: AllianceQualityRecord[];
}

type PartnerRow = {
  id?: string | null;
  full_name?: string | null;
  firm_name?: string | null;
  status?: string | null;
  updated_at?: string | null;
};
type CorridorRow = {
  partner_id?: string | null;
  country_code?: string | null;
  verified?: boolean | null;
  verified_at?: string | null;
};

function clean(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s || null;
}

export async function loadAllianceQualityCapacity(): Promise<AllianceQualitySnapshot> {
  const generatedAt = new Date().toISOString();
  const supabase = createAdminClient();
  // Canonical partner identity: active operator accounts in an Alliance role; firm and status
  // come from the bound operator profile (operators.profile_id).
  const accounts = await supabase
    .from("operators")
    .select("id, full_name, role, is_active, profile_id, updated_at")
    .in("role", [...ALLIANCE_ACCOUNT_ROLES])
    .order("updated_at", { ascending: false });
  const profileIds = (accounts.data ?? []).map((a) => a.profile_id).filter((id): id is string => Boolean(id));
  const profiles = profileIds.length
    ? await supabase.from("operator_profiles").select("id, firm_name, onboarding_status").in("id", profileIds)
    : { data: [] as { id: string; firm_name: string | null; onboarding_status: string | null }[], error: null };
  const profileById = new Map((profiles.data ?? []).map((p) => [p.id as string, p]));
  const partners = {
    error: accounts.error ?? profiles.error,
    data: (accounts.data ?? []).map((a) => {
      const profile = a.profile_id ? profileById.get(a.profile_id as string) : undefined;
      return {
        id: a.id as string,
        full_name: (a.full_name as string | null) ?? null,
        firm_name: profile?.firm_name ?? null,
        status: a.is_active === false ? "inactive" : profile?.onboarding_status ?? "unbound",
        updated_at: (a.updated_at as string | null) ?? null,
      };
    }),
  };

  if (partners.error) {
    return {
      generatedAt,
      degraded: true,
      warning:
        "Alliance partner source unavailable; no partner quality or capacity all-clear may be inferred.",
      records: [],
    };
  }

  const corridorsByPartner = new Map<string, string[]>();
  const verifiedAt = new Map<string, string>();
  const corridors = await supabase
    .from("partner_corridors")
    .select("partner_id, country_code, verified, verified_at");

  if (!corridors.error) {
    for (const row of (corridors.data ?? []) as CorridorRow[]) {
      if (!row.partner_id || !row.country_code || row.verified !== true) continue;
      corridorsByPartner.set(row.partner_id, [
        ...(corridorsByPartner.get(row.partner_id) ?? []),
        row.country_code,
      ]);
      if (row.verified_at) verifiedAt.set(row.partner_id, row.verified_at);
    }
  }

  const records = ((partners.data ?? []) as PartnerRow[]).map((partner) => {
    const id = clean(partner.id) ?? "unknown";
    return {
      id,
      name: clean(partner.full_name) ?? "Unnamed partner",
      firm: clean(partner.firm_name),
      operatingState: mapAllianceState(partner.status),
      coverage: corridorsByPartner.get(id) ?? [],
      credentialStatus: "UNKNOWN" as const,
      availability: "UNKNOWN" as const,
      acceptance: "UNKNOWN" as const,
      completion: "UNKNOWN" as const,
      cost: "UNKNOWN" as const,
      quality: "UNKNOWN" as const,
      rework: "UNKNOWN" as const,
      complaint: "UNKNOWN" as const,
      capacity: "UNKNOWN" as const,
      lastVerified: verifiedAt.get(id) ?? null,
    };
  });

  return {
    generatedAt,
    degraded: false,
    warning: corridors.error
      ? "Verified corridor coverage source unavailable; coverage is not inferred."
      : null,
    records,
  };
}
