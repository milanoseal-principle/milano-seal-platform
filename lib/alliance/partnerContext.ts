import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

// Canonical Alliance partner identity. There is no alliance_partners table: a partner is an
// active `operators` account whose user_id is the verified auth user, bound by an authorized
// operator to its `operator_profiles` row (operators.profile_id). Credentials, compliance,
// routing eligibility and toolbelt live on that profile. Never resolved by email or by a
// client-supplied id; callers pass the id of the session user they already verified.

export const ALLIANCE_ACCOUNT_ROLES = new Set(["alliance", "alliance_partner", "alliance_member"]);

export type AlliancePartner = {
  id: string; // operators.id: the partner key in referral_ledger.partner_id
  profile_id: string | null;
  email: string;
  full_name: string | null;
  contact_name: string | null;
  firm_name: string | null;
  partner_type: string;
  status: string; // profile onboarding status, "unbound" until an operator binds the profile
  referral_code: string | null;
  partner_code: string | null;
  routing_eligible: boolean;
  compliance_verified: boolean;
  toolbelt_completed: boolean;
  security_attested: boolean;
  jurisdiction_codes: string[];
  document_categories: string[];
  created_at: string | null;
};

// operator_profiles.onboarding_status (constraint operator_profiles_onboarding_status_check) mapped
// to the Alliance lifecycle vocabulary the partner UI renders; an approved profile is "active".
const ONBOARDING_TO_ALLIANCE_STATUS: Record<string, string> = {
  invited: "invited",
  profile_started: "profile_started",
  documents_pending: "identity_pending",
  training_pending: "profile_completed",
  toolbelt_pending: "toolbelt_started",
  compliance_review: "compliance_pending",
  approved: "active",
  suspended: "suspended",
  rejected: "offboarded",
};
export function allianceStatus(onboardingStatus: unknown): string {
  return ONBOARDING_TO_ALLIANCE_STATUS[String(onboardingStatus ?? "")] ?? "invited";
}

export async function resolveAlliancePartner(
  verifiedUserId: string | null | undefined,
  db: SupabaseClient = createAdminClient(),
): Promise<AlliancePartner | null> {
  if (!verifiedUserId) return null;
  const { data: account, error } = await db
    .from("operators")
    .select("id, email, full_name, role, is_active, profile_id, referral_code, created_at")
    .eq("user_id", verifiedUserId)
    .maybeSingle();
  if (error) throw Error("ALLIANCE_IDENTITY_UNAVAILABLE");
  if (!account || account.is_active === false || !ALLIANCE_ACCOUNT_ROLES.has(String(account.role ?? ""))) return null;

  const profileId = (account.profile_id as string | null) ?? null;
  let profile: Record<string, unknown> | null = null;
  let eligible = false, compliance: Record<string, unknown> | null = null, toolbeltOpen = 1, categories: string[] = [];
  if (profileId) {
    const [p, e, c, t, k] = await Promise.all([
      db.from("operator_profiles").select("firm_name, full_name, onboarding_status, admin_approved, state, secondary_states").eq("id", profileId).maybeSingle(),
      db.from("operator_routing_eligibility").select("eligible").eq("operator_id", profileId).maybeSingle(),
      db.from("operator_compliance_status").select("compliance_ready, data_handling_agreement").eq("operator_id", profileId).maybeSingle(),
      db.from("operator_toolbelt_status").select("id").eq("operator_id", profileId).eq("required", true).neq("status", "verified"),
      db.from("operator_capabilities").select("capability_value").eq("operator_id", profileId).eq("capability_type", "document_category").eq("verified", true),
    ]);
    if (p.error || e.error || c.error || t.error || k.error) throw Error("ALLIANCE_IDENTITY_UNAVAILABLE");
    categories = (k.data ?? []).map((r) => String(r.capability_value));
    profile = p.data;
    eligible = e.data?.eligible === true;
    compliance = c.data;
    toolbeltOpen = t.data?.length ?? 0;
  }

  const code = (account.referral_code as string | null) ?? null;
  return {
    id: account.id as string,
    profile_id: profileId,
    email: account.email as string,
    full_name: (account.full_name as string | null) ?? (profile?.full_name as string | null) ?? null,
    contact_name: (account.full_name as string | null) ?? (profile?.full_name as string | null) ?? null,
    firm_name: (profile?.firm_name as string | null) ?? null,
    partner_type: String(account.role),
    status: profileId ? allianceStatus(profile?.onboarding_status) : "unbound",
    referral_code: code,
    partner_code: code,
    // Unbound accounts are never eligible: eligibility belongs to the verified profile.
    routing_eligible: Boolean(profileId) && eligible,
    compliance_verified: compliance?.compliance_ready === true,
    toolbelt_completed: Boolean(profileId) && toolbeltOpen === 0,
    security_attested: compliance?.data_handling_agreement === true,
    jurisdiction_codes: [profile?.state, ...((profile?.secondary_states as string[] | null) ?? [])].filter((x): x is string => typeof x === "string" && x.length > 0),
    document_categories: categories,
    created_at: (account.created_at as string | null) ?? null,
  };
}

// Referral attribution: the partner owning a referral code (exact, case-insensitive; LIKE
// wildcards are escaped so a code can never match another partner's), or null.
export async function partnerIdForReferralCode(code: string | null | undefined, db: SupabaseClient = createAdminClient()): Promise<string | null> {
  const normalized = String(code ?? "").trim();
  if (!normalized) return null;
  const { data, error } = await db.from("operators").select("id, role, is_active").ilike("referral_code", normalized.replace(/[\\%_]/g, (m) => "\\" + m)).maybeSingle();
  if (error) throw Error("ALLIANCE_IDENTITY_UNAVAILABLE");
  if (!data || data.is_active === false || !ALLIANCE_ACCOUNT_ROLES.has(String(data.role ?? ""))) return null;
  return data.id as string;
}
