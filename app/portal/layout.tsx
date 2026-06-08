import { ReactNode } from "react";
import { PortalFrame } from "@/components/portal/portal-frame";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Private Matter Access | The Milano Seal™",
  robots: { index: false, follow: false },
};

const DASHBOARD_ROLES = new Set(["founder_admin", "admin_operator"]);
const ALLIANCE_ROLES = new Set(["alliance", "alliance_partner", "alliance_member"]);
const VA_ROLES = new Set(["virtual_assistant"]);

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
