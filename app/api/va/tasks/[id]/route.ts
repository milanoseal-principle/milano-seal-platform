import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { isVARole } from "@/lib/vaAuth";
import { projectTask } from "@/lib/va/vaProjection";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
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
    const { data, error } = await admin
      .from("va_tasks")
      .select(
        "id, matter_id, matter_display_id, task_type, title, status, urgency, priority, assigned_to, due_at, created_at, completed_at, notes_public, next_action, escalated_at, escalation_reason, client_safe_context"
      )
      .eq("id", params.id)
      .eq("assigned_to", user.id)
      .maybeSingle();

    if (error && (error.code === "42P01" || error.message?.includes("does not exist"))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ task: projectTask(data as Record<string, unknown>) });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
