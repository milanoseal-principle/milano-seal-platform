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

  let reason = "";
  try {
    const body = await request.json();
    reason = typeof body?.reason === "string" ? body.reason.slice(0, 500) : "";
  } catch {
    // reason stays empty
  }

  try {
    const admin = createAdminClient();
    // One locked transaction: ownership, allowed current state, update and audit event.
    const { error } = await admin.rpc("va_task_transition", {
      p_task: id,
      p_actor: user.id,
      p_action: "escalate",
      p_reason: reason,
    });
    if (error) {
      const code = String(error.message ?? "");
      if (code.includes("VA_TASK_NOT_FOUND")) return NextResponse.json({ error: "Task not found" }, { status: 404 });
      if (code.includes("VA_TASK_NOT_ASSIGNED")) return NextResponse.json({ error: "Not assigned to this task" }, { status: 403 });
      if (code.includes("VA_TASK_STATE_CONFLICT")) return NextResponse.json({ error: "Task is not in a state that allows this action" }, { status: 409 });
      // Missing schema or any database failure is an error, never a silent success.
      return NextResponse.json({ error: "Task system unavailable" }, { status: 503 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to escalate task" },
      { status: 500 }
    );
  }
}
