import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeUserRole } from "@/lib/auth/roleRedirect";
import { resolveServerRole } from "@/lib/auth/server-role";
import type { ProfessionalProfileRecord } from "./profile";

export type ProfessionalContext =
  | { ok: true; userId: string; email: string; profile: ProfessionalProfileRecord }
  | { ok: false; status: 401 | 403 | 404; error: string };

export const PROFESSIONAL_PROFILE_COLUMNS =
  "id,user_id,firm_name,contact_name,title,email,phone,country,city,website,practice_focus,preferred_language,preferred_destination_countries,typical_document_types,preferred_execution_method,default_receiving_authority,default_client_handoff_mode,client_instruction_template,notification_preference,status,created_at,updated_at";

/**
 * Resolves the signed-in professional and their canonical profile. Identity is
 * the authenticated session; authorization is the service-role-controlled
 * app_metadata role plus a profile bound to this exact user id. A professional
 * never gains operator permissions from this context.
 */
export async function requireProfessional(): Promise<ProfessionalContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: 401, error: "Unauthorized" };

  const role = normalizeUserRole(await resolveServerRole(user));
  if (role !== "professional") return { ok: false, status: 403, error: "Forbidden" };

  const { data: profile, error } = await createAdminClient()
    .from("professional_profiles")
    .select(PROFESSIONAL_PROFILE_COLUMNS)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !profile) {
    return { ok: false, status: 404, error: "Professional profile not found." };
  }

  return {
    ok: true,
    userId: user.id,
    email: user.email ?? "",
    profile: profile as unknown as ProfessionalProfileRecord,
  };
}
