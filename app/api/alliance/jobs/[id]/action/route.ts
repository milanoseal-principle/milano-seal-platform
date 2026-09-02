import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveServerRole } from "@/lib/auth/server-role";
import { normalizeUserRole } from "@/lib/auth/roleRedirect";

export const runtime = "nodejs";

type Action = "accept" | "decline" | "complete";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const role = await resolveServerRole(user);
  const normalizedRole = normalizeUserRole(role);
  if (!normalizedRole || !["alliance", "operator", "admin", "owner"].includes(normalizedRole)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  let body: { action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const action = body.action as Action | undefined;
  if (!action || !["accept", "decline", "complete"].includes(action)) {
    return NextResponse.json({ error: "INVALID_ACTION" }, { status: 422 });
  }

  const { id: assignmentId } = await params;
  const admin = createAdminClient();

  const { data: existing, error: fetchError } = await admin
    .from("operator_assignments")
    .select("id,operator_id")
    .eq("id", assignmentId)
    .maybeSingle();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "ASSIGNMENT_NOT_FOUND" }, { status: 404 });
  }

  // Alliance users may only author their own assignment transition. Top-level
  // operator roles can inspect/assist elsewhere, but this partner action route
  // still never permits cross-operator mutation.
  if (existing.operator_id !== user.id) {
    return NextResponse.json({ error: "ASSIGNMENT_NOT_FOUND" }, { status: 404 });
  }

  const { data, error } = await admin.rpc("transition_dispatch_assignment", {
    p_assignment_id: assignmentId,
    p_operator_id: user.id,
    p_action: action,
  });

  if (error || !data) {
    const message = String(error?.message ?? "");
    const conflict = message.includes("INVALID_ASSIGNMENT_TRANSITION");
    return NextResponse.json(
      { error: conflict ? "INVALID_ASSIGNMENT_TRANSITION" : "ASSIGNMENT_UPDATE_FAILED" },
      { status: conflict ? 409 : 500 },
    );
  }

  return NextResponse.json({ dispatch: data });
}
