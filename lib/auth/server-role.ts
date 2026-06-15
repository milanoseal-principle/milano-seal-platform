import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

function metadataRole(user: User | null | undefined): string {
  if (!user) return "";

  const appRole = user.app_metadata?.role;
  return typeof appRole === "string" ? appRole.trim() : "";
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
