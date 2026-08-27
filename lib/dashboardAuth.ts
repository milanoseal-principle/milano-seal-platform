import { createClient } from "@/lib/supabase/server";
import { resolveServerRole } from "@/lib/auth/server-role";
import { normalizeUserRole } from "@/lib/auth/roleRedirect";
import { redirect } from "next/navigation";

const DASHBOARD_ROLES = new Set(["operator", "admin", "owner"]);

export async function requireDashboardAccess(): Promise<{
  userId: string;
  role: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard");

  const role = await resolveServerRole(user);
  const normalizedRole = normalizeUserRole(role);

  if (!normalizedRole || !DASHBOARD_ROLES.has(normalizedRole)) {
    redirect("/login?error=access_denied");
  }

  return { userId: user.id, role };
}
