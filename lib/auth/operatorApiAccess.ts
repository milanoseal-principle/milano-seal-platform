import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { resolveServerRole } from "@/lib/auth/server-role";
import { isRouteAllowedForRole } from "@/lib/auth/roleRedirect";

/**
 * API guard for operator-only endpoints that live outside the proxy's role-checked
 * prefixes. It admits exactly the role family the proxy admits to /dashboard and
 * /api/dashboard (operator aliases, admin, owner), so the approved operator access
 * model is unchanged: no assignment-only restriction, no new roles.
 *
 * Identity comes from the validated Supabase session; the role comes only from the
 * service-role-controlled app_metadata (never user_metadata). A missing, unknown,
 * disabled or banned role fails closed.
 */
export function isOperatorApiRole(role: string | null | undefined): boolean {
  return isRouteAllowedForRole("/dashboard", role);
}

export type OperatorApiAccess =
  | { ok: true; userId: string; actor: string; role: string }
  | { ok: false; response: NextResponse };

type Deps = {
  getUser: () => Promise<User | null>;
  resolveRole: (user: User) => Promise<string>;
};

const defaultDeps: Deps = {
  getUser: async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  },
  resolveRole: (user) => resolveServerRole(user),
};

export async function requireOperatorApiAccess(deps: Deps = defaultDeps): Promise<OperatorApiAccess> {
  const user = await deps.getUser();
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 }) };
  }
  const role = await deps.resolveRole(user);
  if (!isOperatorApiRole(role)) {
    return { ok: false, response: NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }) };
  }
  return { ok: true, userId: user.id, actor: user.email ?? user.id, role };
}
