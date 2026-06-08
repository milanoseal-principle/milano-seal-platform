import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = new Set(["founder_admin", "admin_operator"]);

const VALID_TASK_TYPES = new Set([
  "verify_upload",
  "request_missing_id",
  "translation_follow_up",
  "courier_confirmation",
  "schedule_reminder",
  "apostille_follow_up",
  "embassy_dependency",
  "client_follow_up",
  "release_coordination",
  "document_correction_required",
]);

const VALID_URGENCY = new Set(["critical", "high", "medium", "low"]);

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role =
    ((user.user_metadata?.role ?? user.app_metadata?.role) as string) ?? "";

  if (!ALLOWED_ROLES.has(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { matter_id, task_type, urgency, due_at, notes_public, next_action, assigned_to } = body as {
    matter_id?: string;
    task_type?: string;
    urgency?: string;
    due_at?: string;
    notes_public?: string;
    next_action?: string;
    assigned_to?: string;
  };

  if (!task_type || !VALID_TASK_TYPES.has(task_type)) {
    return NextResponse.json(
      { error: `Invalid task_type. Must be one of: ${[...VALID_TASK_TYPES].join(", ")}` },
      { status: 400 }
    );
  }

  if (!urgency || !VALID_URGENCY.has(urgency)) {
    return NextResponse.json(
      { error: "Invalid urgency. Must be one of: critical, high, medium, low" },
      { status: 400 }
    );
  }

  if (!assigned_to || typeof assigned_to !== "string" || assigned_to.trim() === "") {
    return NextResponse.json(
      { error: "assigned_to is required (UUID of the VA user)" },
      { status: 400 }
    );
  }

  try {
    const admin = createAdminClient();
    const now = new Date().toISOString();

    const insertPayload: Record<string, unknown> = {
      task_type,
      urgency,
      status: "pending",
      assigned_to: assigned_to.trim(),
      assigned_by: user.id,
      created_at: now,
      updated_at: now,
    };

    if (matter_id && typeof matter_id === "string" && matter_id.trim() !== "") {
      insertPayload.matter_id = matter_id.trim();
    }
    if (due_at && typeof due_at === "string" && due_at.trim() !== "") {
      insertPayload.due_at = due_at.trim();
    }
    if (notes_public && typeof notes_public === "string") {
      insertPayload.notes_public = notes_public.slice(0, 2000);
    }
    if (next_action && typeof next_action === "string") {
      insertPayload.next_action = next_action.slice(0, 500);
    }

    const { data: task, error: insertError } = await admin
      .from("va_tasks")
      .insert(insertPayload)
      .select("id, matter_id")
      .single();

    if (insertError) {
      if (
        insertError.message?.includes("does not exist") ||
        insertError.code === "42P01"
      ) {
        return NextResponse.json(
          { error: "Task system not yet provisioned", migration_needed: true },
          { status: 503 }
        );
      }
      throw insertError;
    }

    const taskId = task.id;
    const taskMatterId = (task.matter_id as string | null) ?? null;

    await admin.from("va_task_events").insert([
      {
        task_id: taskId,
        matter_id: taskMatterId,
        actor_id: user.id,
        event_type: "VA_TASK_CREATED",
        description: `Task created: ${task_type}`,
        severity: "info",
        created_at: now,
      },
      {
        task_id: taskId,
        matter_id: taskMatterId,
        actor_id: user.id,
        event_type: "VA_TASK_ASSIGNED",
        description: `Task assigned to ${assigned_to.trim()}`,
        severity: "info",
        created_at: now,
      },
    ]);

    return NextResponse.json({ task_id: taskId, success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
