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
    ((user.app_metadata?.role ?? user.app_metadata?.role) as string) ?? "";

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

    if (taskError) {
      return NextResponse.json({ error: "VA_TASK_STORE_UNAVAILABLE", matters: null }, { status: 503 });
    }

    const matterIds = [
      ...new Set((taskRows ?? []).map((r) => r.matter_id).filter(Boolean)),
    ] as string[];

    if (matterIds.length === 0) {
      return NextResponse.json({ matters: [] });
    }

    const { data: deals, error: dealError } = await admin
      .from("deals")
      // Real deals columns only; projectMatter derives the VA-safe view (no client name).
      .select(
        "id, deal_id, destination_country, document_type, deal_status, due_at"
      )
      .in("id", matterIds);

    if (dealError) {
      return NextResponse.json({ error: "VA_TASK_STORE_UNAVAILABLE", matters: null }, { status: 503 });
    }

    const matters = (deals ?? []).map((row) =>
      projectMatter(row as Record<string, unknown>)
    );

    return NextResponse.json({ matters });
  } catch {
    return NextResponse.json({ error: "VA_TASK_STORE_UNAVAILABLE", matters: null }, { status: 503 });
  }
}
