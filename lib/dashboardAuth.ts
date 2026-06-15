import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const ADMIN_ROLES = new Set([
  "founder_admin",
  "admin",
  "admin_operator",
  "ops_manager",
  "finance",
  "finance_operator",
  "execution_coordinator",
  "apostille_coordinator",
  "client_support",
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

export async function requireDashboardAccess(): Promise<{
  userId: string;
  role: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard");

  const role =
    ((user.user_metadata?.role ?? user.app_metadata?.role) as string) ?? "";

  if (!ADMIN_ROLES.has(role)) {
    redirect("/login?error=access_denied");
  }

  return { userId: user.id, role };
}
