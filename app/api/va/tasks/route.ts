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
    const { data: tasks, error } = await admin
      .from("va_tasks")
      .select(
        "id, matter_id, task_type, urgency, status, assigned_to, due_at, notes_public, next_action, completed_at, escalated_at, created_at, updated_at"
      )
      .eq("assigned_to", user.id)
      .neq("status", "completed")
      .order("urgency", { ascending: false })
      .order("due_at", { ascending: true, nullsFirst: false });

    if (error) {
      if (
        error.message?.includes("does not exist") ||
        error.code === "42P01"
      ) {
        return NextResponse.json({ tasks: [], migration_needed: true });
      }
      throw error;
    }

    return NextResponse.json({ tasks: tasks ?? [] });
  } catch {
    return NextResponse.json({ tasks: [], migration_needed: true });
  }
}
