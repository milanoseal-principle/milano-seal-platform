import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { isVARole } from "@/lib/vaAuth";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;

  try {
    const admin = createAdminClient();

    const { data: task, error: fetchError } = await admin
      .from("va_tasks")
      .select("id, assigned_to, status, matter_id")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      if (
        fetchError.message?.includes("does not exist") ||
        fetchError.code === "42P01"
      ) {
        return NextResponse.json(
          { error: "Task system not yet provisioned" },
          { status: 503 }
        );
      }
      throw fetchError;
    }

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (task.assigned_to !== user.id) {
      return NextResponse.json(
        { error: "Not assigned to this task" },
        { status: 403 }
      );
    }

    const now = new Date().toISOString();

    const { error: updateError } = await admin
      .from("va_tasks")
      .update({ status: "completed", completed_at: now, updated_at: now })
      .eq("id", id);

    if (updateError) throw updateError;

    await admin.from("va_task_events").insert({
      task_id: id,
      matter_id: (task as { matter_id?: string | null }).matter_id ?? null,
      actor_id: user.id,
      event_type: "VA_TASK_COMPLETED",
      description: "Task marked complete by VA",
      severity: "info",
      created_at: now,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to complete task" },
      { status: 500 }
    );
  }
}
