import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireOperatorApiAccess, type OperatorApiAccess } from "@/lib/auth/operatorApiAccess";
import { ALLIANCE_ACCOUNT_ROLES } from "@/lib/alliance/partnerContext";

// Admin-only binding of an Alliance account (operators row) to its operator profile, and
// referral-code management. All writes go through the database functions
// bind_operator_profile / rotate_operator_referral_code, which re-verify the administrator,
// lock the account, apply the change and append the audit record in one transaction. The
// acting administrator is always the verified session user, never a request field.

export const ALLIANCE_BINDING_ADMIN_ROLES = new Set(["founder", "founder_admin", "admin", "owner"]);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const isUuid = (value: unknown): value is string => typeof value === "string" && UUID.test(value);

export async function requireBindingAdmin(access?: OperatorApiAccess): Promise<OperatorApiAccess> {
  const resolved = access ?? (await requireOperatorApiAccess());
  if (!resolved.ok) return resolved;
  if (!ALLIANCE_BINDING_ADMIN_ROLES.has(resolved.role)) {
    return { ok: false, response: NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }) };
  }
  return resolved;
}

export type BindingResult =
  | { ok: true; operator_id: string; profile_id: string | null; referral_code: string | null; changed: boolean }
  | { ok: false; status: number; code: string; message: string };

const FAILURES: Record<string, { status: number; message: string }> = {
  FORBIDDEN: { status: 403, message: "You are not authorized to manage Alliance account bindings." },
  OPERATOR_NOT_FOUND: { status: 404, message: "That account no longer exists." },
  PROFILE_NOT_FOUND: { status: 404, message: "That operator profile no longer exists." },
  OPERATOR_HAS_NO_USER: { status: 409, message: "This account has no sign-in user, so it cannot be bound." },
  OPERATOR_USER_DUPLICATE: { status: 409, message: "This sign-in user is linked to more than one account. Resolve the duplicate before binding." },
  PROFILE_ALREADY_BOUND: { status: 409, message: "That profile is already bound to another account." },
  OPERATOR_NOT_BOUND: { status: 409, message: "Bind a profile before issuing a new referral code." },
  REASON_REQUIRED: { status: 400, message: "A reason is required for this change." },
};

function toResult(data: unknown, error: { message?: string } | null): BindingResult {
  if (error) {
    const code = Object.keys(FAILURES).find((key) => String(error.message ?? "").includes(key));
    // Anything unrecognized (missing function, outage) is unavailable, never a success.
    return code ? { ok: false, code, ...FAILURES[code] } : { ok: false, status: 503, code: "BINDING_UNAVAILABLE", message: "Account binding is unavailable right now." };
  }
  const row = data as { operator_id?: string; profile_id?: string | null; referral_code?: string | null; changed?: boolean } | null;
  if (!row?.operator_id) return { ok: false, status: 503, code: "BINDING_UNAVAILABLE", message: "Account binding is unavailable right now." };
  return { ok: true, operator_id: row.operator_id, profile_id: row.profile_id ?? null, referral_code: row.referral_code ?? null, changed: row.changed === true };
}

export async function bindOperatorProfile(db: SupabaseClient, input: { operatorId: string; profileId: string | null; actorId: string; reason?: string | null }): Promise<BindingResult> {
  const { data, error } = await db.rpc("bind_operator_profile", { p_operator: input.operatorId, p_profile: input.profileId, p_actor: input.actorId, p_reason: input.reason ?? null });
  return toResult(data, error);
}

export async function rotateReferralCode(db: SupabaseClient, input: { operatorId: string; actorId: string; reason: string }): Promise<BindingResult> {
  const { data, error } = await db.rpc("rotate_operator_referral_code", { p_operator: input.operatorId, p_actor: input.actorId, p_reason: input.reason });
  return toResult(data, error);
}

export type BindingAccount = {
  id: string; email: string; full_name: string | null; role: string; is_active: boolean;
  has_user: boolean; duplicate_user: boolean; profile_id: string | null; referral_code: string | null;
  profile: { id: string; full_name: string | null; firm_name: string | null; onboarding_status: string | null } | null;
};
export type BindingProfile = { id: string; full_name: string | null; firm_name: string | null; email: string | null; state: string | null; onboarding_status: string | null; bound: boolean };

export const BINDING_PAGE_SIZE = 1000;
const MAX_PAGES = 200;

type Page = PromiseLike<{ data: Record<string, unknown>[] | null; error: unknown }>;
async function readAllPages(page: (from: number, to: number) => Page): Promise<Record<string, unknown>[]> {
  const all: Record<string, unknown>[] = [];
  for (let i = 0; i < MAX_PAGES; i++) {
    const { data, error } = await page(i * BINDING_PAGE_SIZE, (i + 1) * BINDING_PAGE_SIZE - 1);
    if (error || !data) throw Error("BINDING_ACCOUNTS_UNAVAILABLE");
    all.push(...data);
    if (data.length < BINDING_PAGE_SIZE) return all;
  }
  // More rows than this screen can list: refuse rather than present a partial identity list.
  throw Error("BINDING_ACCOUNTS_UNAVAILABLE");
}

// Alliance accounts and the profiles they can be bound to. Throws on any read failure so the
// caller reports "unavailable" instead of an empty list.
export async function listBindingAccounts(db: SupabaseClient): Promise<{ accounts: BindingAccount[]; profiles: BindingProfile[] }> {
  // Every page is read: the API returns at most PAGE_SIZE rows per request, and a truncated list
  // would show a bound account as unbound. A stable secondary order keeps pages disjoint.
  const [rows, profileRows] = await Promise.all([
    readAllPages((from, to) => db.from("operators").select("id, user_id, email, full_name, role, is_active, profile_id, referral_code").in("role", [...ALLIANCE_ACCOUNT_ROLES]).order("email").order("id").range(from, to)),
    readAllPages((from, to) => db.from("operator_profiles").select("id, full_name, firm_name, email, state, onboarding_status").order("full_name").order("id").range(from, to)),
  ]);
  const profiles = { data: profileRows };
  const userCounts = new Map<string, number>();
  for (const row of rows) if (row.user_id) userCounts.set(row.user_id as string, (userCounts.get(row.user_id as string) ?? 0) + 1);
  const profileById = new Map((profiles.data ?? []).map((p) => [p.id as string, p]));
  const boundIds = new Set(rows.map((r) => r.profile_id).filter(Boolean) as string[]);
  return {
    accounts: rows.map((row) => {
      const p = row.profile_id ? profileById.get(row.profile_id as string) : null;
      return {
        id: row.id as string, email: row.email as string, full_name: (row.full_name as string | null) ?? null, role: String(row.role ?? ""),
        is_active: row.is_active !== false, has_user: Boolean(row.user_id), duplicate_user: Boolean(row.user_id && (userCounts.get(row.user_id as string) ?? 0) > 1),
        profile_id: (row.profile_id as string | null) ?? null, referral_code: (row.referral_code as string | null) ?? null,
        profile: p ? { id: p.id as string, full_name: (p.full_name as string | null) ?? null, firm_name: (p.firm_name as string | null) ?? null, onboarding_status: (p.onboarding_status as string | null) ?? null } : null,
      };
    }),
    profiles: (profiles.data ?? []).map((p) => ({
      id: p.id as string, full_name: (p.full_name as string | null) ?? null, firm_name: (p.firm_name as string | null) ?? null, email: (p.email as string | null) ?? null,
      state: (p.state as string | null) ?? null, onboarding_status: (p.onboarding_status as string | null) ?? null, bound: boundIds.has(p.id as string),
    })),
  };
}
