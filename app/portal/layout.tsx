import { ReactNode } from "react";
import { PortalFrame } from "@/components/portal/portal-frame";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Private Matter Access | The Milano Seal™",
  robots: { index: false, follow: false },
};

const DASHBOARD_ROLES = new Set(["admin", "admin_operator", "ops_manager", "finance", "execution_coordinator", "apostille_coordinator", "finance_operator", "client_support"]);
const ALLIANCE_ROLES = new Set(["alliance", "alliance_partner", "alliance_member"]);
const VA_ROLES = new Set([
  "virtual_assistant", "va_manager", "intake_assistant", "scheduling_assistant",
  "document_coordinator", "translation_coordinator", "courier_assistant",
  "followup_coordinator", "escalation_assistant",
]);

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/portal");

  const role = ((user.user_metadata?.role ?? user.app_metadata?.role) as string) ?? "";

  if (DASHBOARD_ROLES.has(role)) redirect("/dashboard");
  if (ALLIANCE_ROLES.has(role)) redirect("/alliance/dashboard");
  if (VA_ROLES.has(role)) redirect("/va/dashboard");

  return <PortalFrame>{children}</PortalFrame>;
}
