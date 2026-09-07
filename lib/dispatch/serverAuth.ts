import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveServerRole } from "@/lib/auth/server-role";
import { normalizeUserRole, type UserRole } from "@/lib/auth/roleRedirect";

export async function requireDispatchOperator(): Promise<
  | { ok: true; userId: string; actor: string; role: string; normalizedRole: UserRole }
  | { ok: false; response: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 }) };
  }

  const role = await resolveServerRole(user);
  const normalizedRole = normalizeUserRole(role);
  if (!normalizedRole || !["operator", "admin", "owner"].includes(normalizedRole)) {
    return { ok: false, response: NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }) };
  }

  return {
    ok: true,
    userId: user.id,
    actor: user.email ?? user.id,
    role,
    normalizedRole,
  };
}
