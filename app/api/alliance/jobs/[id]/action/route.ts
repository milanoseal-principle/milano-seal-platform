import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const ALLOWED_ROLES = ["alliance_partner", "founder_admin", "admin_operator"];

type Action = "accept" | "decline" | "complete";

// Valid status transitions per current state
const STATUS_TRANSITIONS: Record<string, Partial<Record<Action, string>>> = {
  offered: { accept: "accepted", decline: "declined" },
  accepted: { complete: "in_progress" },
  in_progress: { complete: "completed" },
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
  if (!ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = body.action as Action | undefined;
  if (!action || !["accept", "decline", "complete"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 422 });
  }

  const { id: assignmentId } = await params;
  const admin = createAdminClient();

  // Verify ownership — matter-scoped, 404 on mismatch to avoid leaking existence
  const { data: existing, error: fetchError } = await admin
    .from("operator_assignments")
    .select("id, operator_id, assignment_status, deal_id")
    .eq("id", assignmentId)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  if (existing.operator_id !== user.id) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  const transitions = STATUS_TRANSITIONS[existing.assignment_status];
  if (!transitions || !transitions[action]) {
    return NextResponse.json(
      { error: `Cannot ${action} from status: ${existing.assignment_status}` },
      { status: 409 },
    );
  }

  const newStatus = transitions[action];

  const { data: updated, error: updateError } = await admin
    .from("operator_assignments")
    .update({ assignment_status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", assignmentId)
    .select("id, assignment_status, updated_at")
    .single();

  if (updateError) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  // Append audit event (non-fatal — activity_logs may not exist in all envs)
  try {
    await admin.from("activity_logs").insert({
      deal_id: existing.deal_id,
      action: `alliance.assignment.${action}`,
      detail: `Assignment ${assignmentId} — ${action} by operator ${user.id.slice(0, 8)}`,
    });
  } catch {
    // Non-fatal
  }

  return NextResponse.json({ assignment: updated });
}
