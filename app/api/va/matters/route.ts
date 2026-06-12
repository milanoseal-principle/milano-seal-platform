import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { isVARole } from "@/lib/vaAuth";
import { projectMatter } from "@/lib/va/vaProjection";
import { recordSecurityEvent } from "@/lib/security/security-events";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    await recordSecurityEvent({
      event_name: "VA_ACTION_DENIED",
      severity: "warning",
      route: "/api/va/matters",
      client_safe: false,
      metadata: { reason: "unauthenticated" },
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role =
    ((user.user_metadata?.role ?? user.app_metadata?.role) as string) ?? "";

  if (!isVARole(role)) {
    await recordSecurityEvent({
      event_name: "VA_ACTION_DENIED",
      severity: "warning",
      actor: user.email ?? user.id,
      route: "/api/va/matters",
      client_safe: false,
      metadata: { role: String(role), reason: "insufficient_role" },
    });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const admin = createAdminClient();

    // Get distinct matter_ids from tasks assigned to this VA
    const { data: taskRows, error: taskError } = await admin
      .from("va_tasks")
      .select("matter_id")
      .eq("assigned_to", user.id)
      .not("matter_id", "is", null);

    if (taskError && (taskError.code === "42P01" || taskError.message?.includes("does not exist"))) {
      return NextResponse.json({ matters: [], migration_needed: true });
    }

    const matterIds = [
      ...new Set((taskRows ?? []).map((r) => r.matter_id).filter(Boolean)),
    ] as string[];

    if (matterIds.length === 0) {
      return NextResponse.json({ matters: [] });
    }

    const { data: deals, error: dealError } = await admin
      .from("deals")
      .select(
        "id, deal_id, display_id, client_display_name, destination_country, document_type, deal_status, client_safe_status, next_step, assigned_lane_name, due_at, priority, missing_info_count, assigned_task_count"
      )
      .in("id", matterIds);

    if (dealError && (dealError.code === "42P01" || dealError.message?.includes("does not exist"))) {
      return NextResponse.json({ matters: [], migration_needed: true });
    }

    const matters = (deals ?? []).map((row) =>
      projectMatter(row as Record<string, unknown>)
    );

    return NextResponse.json({ matters });
  } catch {
    return NextResponse.json({ matters: [], migration_needed: true });
  }
}
