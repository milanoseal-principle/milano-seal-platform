import { ReactNode } from "react";
import { PortalFrame } from "@/components/portal/portal-frame";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export const metadata = {
  title: "Private Matter Access | The Milano Seal™",
  robots: { index: false, follow: false },
};

const DASHBOARD_ROLES = new Set(["admin", "ops_manager", "finance", "founder_admin"]);
const ALLIANCE_ROLES = new Set(["alliance", "alliance_partner", "alliance_member"]);
const VA_ROLES = new Set([
  "virtual_assistant", "va_manager", "intake_assistant", "scheduling_assistant",
  "document_coordinator", "translation_coordinator", "courier_assistant",
  "followup_coordinator", "escalation_assistant",
]);

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Read current pathname injected by middleware so the login redirect
  // returns the client to the exact portal sub-route they requested.
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "/portal";
  const loginTarget = encodeURIComponent(pathname);

  // proxy.ts already redirects unauthenticated users to /login?next=<path>.
  // This is defense-in-depth in case the layout is reached without the proxy.
  if (!user) redirect(`/login?next=${loginTarget}`);

  const role = ((user.user_metadata?.role ?? user.app_metadata?.role) as string) ?? "";

  // Operator/alliance/VA roles bypass portal; portal is for clients only
  if (DASHBOARD_ROLES.has(role)) redirect("/dashboard");
  if (ALLIANCE_ROLES.has(role)) redirect("/alliance/dashboard");
  if (VA_ROLES.has(role)) redirect("/va/dashboard");

  return <PortalFrame>{children}</PortalFrame>;
}
