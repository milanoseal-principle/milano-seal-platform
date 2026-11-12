import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { isVARole } from "@/lib/vaAuth";
import { projectTask } from "@/lib/va/vaProjection";

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
    ((user.app_metadata?.role ?? user.app_metadata?.role) as string) ?? "";

  if (!isVARole(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("va_tasks")
      .select(
        "id, matter_id, task_type, status, urgency, assigned_to, due_at, created_at, completed_at, escalated_at, notes_public, next_action"
      )
      .eq("assigned_to", user.id)
      .eq("task_type", "checklist")
      .order("due_at", { ascending: true, nullsFirst: false });

    if (error) {
      return NextResponse.json({ error: "VA_TASK_STORE_UNAVAILABLE", checklists: null }, { status: 503 });
    }

    const checklists = (data ?? []).map((row) =>
      projectTask(row as Record<string, unknown>)
    );

    return NextResponse.json({ checklists });
  } catch {
    return NextResponse.json({ error: "VA_TASK_STORE_UNAVAILABLE", checklists: null }, { status: 503 });
  }
}
