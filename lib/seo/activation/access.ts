import { NextResponse } from "next/server";
import { resolveServerRole } from "@/lib/auth/server-role";
import { createClient } from "@/lib/supabase/server";

const SEO_CONTROL_ROLES = new Set([
  "founder",
  "founder_admin",
  "admin",
  "admin_operator",
  "ops_manager",
]);

export async function requireSeoControlApiAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false as const, response: NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 }) };
  }
  const role = await resolveServerRole(user);
  if (!SEO_CONTROL_ROLES.has(role)) {
    return { ok: false as const, response: NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }) };
  }
  return { ok: true as const, userId: user.id, role };
}
