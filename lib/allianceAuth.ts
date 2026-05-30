import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function requireAllianceAccess(): Promise<{
  userId: string;
  email: string;
  role: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/alliance/dashboard");

  const role =
    (user.user_metadata?.role as string | undefined) ??
    (user.app_metadata?.role as string | undefined) ??
    "";

  const allowed = ["founder_admin", "alliance", "alliance_partner", "alliance_member"];
  if (!allowed.includes(role)) {
    redirect("/login?error=access_denied");
  }

  return {
    userId: user.id,
    email: user.email ?? "",
    role,
  };
}
