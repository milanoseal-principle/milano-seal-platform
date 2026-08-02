import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { isVARole } from "@/lib/vaAuth";
import { projectTask } from "@/lib/va/vaProjection";

export const dynamic = "force-dynamic";

const COURIER_TASK_TYPES = ["courier_review", "packaging_checklist", "address_flag"];

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
    // Safe fields only — never return label_url, actual_shippo_cost, carrier_account, raw_shippo_response
    const { data, error } = await admin
      .from("va_tasks")
      .select(
        "id, matter_id, matter_display_id, task_type, title, status, urgency, priority, assigned_to, due_at, created_at, completed_at, notes_public, escalation_reason, client_safe_context"
      )
      .eq("assigned_to", user.id)
      .in("task_type", COURIER_TASK_TYPES)
      .order("due_at", { ascending: true, nullsFirst: false });

    if (error && (error.code === "42P01" || error.message?.includes("does not exist"))) {
      return NextResponse.json({ tasks: [], migration_needed: true });
    }

    const tasks = (data ?? []).map((row) =>
      projectTask(row as Record<string, unknown>)
    );

    return NextResponse.json({ tasks });
  } catch {
    return NextResponse.json({ tasks: [], migration_needed: true });
  }
}
