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
export async function resolveServerRole(user: User): Promise<string> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.getUserById(user.id);

    if (!error) {
      const authoritativeRole = metadataRole(data.user);
      if (authoritativeRole) return authoritativeRole;
    }
  } catch {
    // Preserve access through the verified server session if the admin lookup
    // is temporarily unavailable or not configured in a local environment.
  }

  return metadataRole(user);
}
