import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

// A disabled account (soft-disable flag in service-role-controlled app_metadata,
// complementing Supabase's native ban) resolves to NO role, so every guard
// blocks it exactly like a missing role.
export function isAccountDisabled(user: User | null | undefined): boolean {
  return user?.app_metadata?.disabled === true;
}

function metadataRole(user: User | null | undefined): string {
  if (!user) return "";
  if (isAccountDisabled(user)) return "";

  const appRole = user.app_metadata?.role;
  return typeof appRole === "string" ? appRole.trim() : "";
}

/**
 * Canonical synchronous role read from the VALIDATED session user.
 * Reads ONLY `app_metadata.role` (service-role controlled). `user_metadata`
 * is user-writable and must never be consulted for authorization.
 */
export function readAppRole(user: User | null | undefined): string {
  return metadataRole(user);
}

/**
 * Resolve authorization roles from the server-controlled user record.
 * The authenticated session remains the identity source; the service-role
 * lookup is used only to read authoritative app_metadata for that user.
 */
export async function resolveServerRole(
  user: User,
  lookup: (id: string) => Promise<{ data: { user: User | null }; error: unknown }> =
    (id) => createAdminClient().auth.admin.getUserById(id),
): Promise<string> {
  if (isAccountDisabled(user)) return "";
  try {
    const { data, error } = await lookup(user.id);
    if (error || !data.user || data.user.id !== user.id) return "";
    const bannedUntil = (data.user as User & { banned_until?: string }).banned_until;
    if (bannedUntil && (!Number.isFinite(Date.parse(bannedUntil)) || Date.parse(bannedUntil) > Date.now())) return "";
    return metadataRole(data.user);
  } catch {
    // A stale session cannot restore a revoked role or bypass a disabled account.
    // Protected operations can retry when authoritative identity is available.
    return "";
  }
}
