import type { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

export const POLICY_TYPES = [
  "TERMS_OF_SERVICE",
  "PRIVACY_ACKNOWLEDGEMENT",
  "CANCELLATION_POLICY",
  "REFUND_POLICY",
  "EXECUTION_SERVICE_DISCLOSURE",
  "RON_DISCLOSURE",
  "PROFESSIONAL_COUNSEL_TERMS",
] as const;
export const POLICY_ADMIN_ROLES = new Set(["founder", "founder_admin", "admin"]);
export const SURFACE_PATTERN = /^[a-z0-9_]{1,60}$/;
export const SHA256_PATTERN = /^[0-9a-f]{64}$/;

export interface PolicyVersionRow {
  id: string;
  policy_type: string;
  version: string;
  content_sha256: string;
  effective_at: string;
  status: string;
  required_surfaces: string[];
}

// The acceptance must name exactly the version and content hash the user was shown.
export function acceptanceMismatch(version: PolicyVersionRow | null, shownSha256: string, now = new Date()) {
  if (!version) return "POLICY_VERSION_NOT_FOUND";
  if (version.status !== "active" || new Date(version.effective_at) > now) return "POLICY_VERSION_NOT_ACTIVE";
  if (version.content_sha256 !== shownSha256) return "POLICY_ACCEPTANCE_VERSION_MISMATCH";
  return null;
}

export function missingAcceptances(active: PolicyVersionRow[], acceptedVersionIds: Set<string>, surface: string) {
  return active
    .filter((v) => v.status === "active" && v.required_surfaces.includes(surface) && !acceptedVersionIds.has(v.id))
    .map((v) => `${v.policy_type}:${v.version}`)
    .sort();
}

// Server-side gate. Fails closed if the registry cannot be evaluated.
export async function requiredPolicyBlockers(admin: Admin, matterId: string, surface: string): Promise<string[]> {
  const { data, error } = await admin.rpc("missing_required_policy_acceptances", { p_matter_id: matterId, p_surface: surface });
  if (error || !Array.isArray(data)) return ["POLICY_REGISTRY_UNAVAILABLE"];
  return data as string[];
}
