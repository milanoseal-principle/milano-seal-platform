import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { isVARole } from "@/lib/vaAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role =
    ((user.user_metadata?.role ?? user.app_metadata?.role) as string) ?? "";

  if (!isVARole(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const admin = createAdminClient();
    const { data: events, error } = await admin
      .from("va_task_events")
      .select("id, task_id, event_type, actor_id, payload, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      if (
        error.message?.includes("does not exist") ||
        error.code === "42P01"
      ) {
        return NextResponse.json({ events: [], migration_needed: true });
      }
      throw error;
    }

    return NextResponse.json({ events: events ?? [] });
  } catch {
    return NextResponse.json({ events: [], migration_needed: true });
  }
}
