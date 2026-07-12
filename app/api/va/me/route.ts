import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { isVARole } from "@/lib/vaAuth";
import { recordSecurityEvent } from "@/lib/security/security-events";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    await recordSecurityEvent({
      event_name: "VA_ACTION_DENIED",
      severity: "warning",
      route: "/api/va/me",
      client_safe: false,
      metadata: { reason: "unauthenticated" },
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role =
    ((user.app_metadata?.role ?? user.app_metadata?.role) as string) ?? "";

  if (!isVARole(role)) {
    await recordSecurityEvent({
      event_name: "VA_ACTION_DENIED",
      severity: "warning",
      actor: user.email ?? user.id,
      route: "/api/va/me",
      client_safe: false,
      metadata: { role: String(role), reason: "insufficient_role" },
    });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    id: user.id,
    email: user.email ?? null,
    role,
    display_name: (user.user_metadata?.display_name ?? user.user_metadata?.full_name ?? null) as string | null,
  });
}
