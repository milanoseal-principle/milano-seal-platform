import { createClient } from "@/lib/supabase/server";
import { resolveServerRole } from "@/lib/auth/server-role";
import { redirect } from "next/navigation";

const ADMIN_ROLES = new Set([
  "founder",
  "founder_admin",
  "admin_operator",
  "virtual_assistant",
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

  const role = await resolveServerRole(user);

  if (!ADMIN_ROLES.has(role)) {
    redirect("/login?error=access_denied");
  }

  return { userId: user.id, role };
}
