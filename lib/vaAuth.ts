import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const VA_ROLES = new Set([
  "virtual_assistant",
  "va_manager",
  "intake_assistant",
  "scheduling_assistant",
  "document_coordinator",
  "translation_coordinator",
  "courier_assistant",
  "followup_coordinator",
  "alliance_support_assistant",
  "escalation_assistant",
]);

export function isVARole(role: string): boolean {
  return role === "founder_admin" || VA_ROLES.has(role);
}

export async function requireVAAccess(): Promise<{
  userId: string;
  role: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/va/dashboard");
  const role =
    ((user.user_metadata?.role ?? user.app_metadata?.role) as string) ?? "";
  if (!isVARole(role)) redirect("/login?error=access_denied");
  return { userId: user.id, role };
}
