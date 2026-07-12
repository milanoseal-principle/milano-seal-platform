import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { isVARole } from "@/lib/vaAuth";
import { projectMatter } from "@/lib/va/vaProjection";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    // Security gate: VA must have at least one task on this matter
    const { data: taskCheck } = await admin
      .from("va_tasks")
      .select("id")
      .eq("matter_id", id)
      .eq("assigned_to", user.id)
      .limit(1)
      .maybeSingle();

    if (!taskCheck) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await admin
      .from("deals")
      .select(
        "id, deal_id, display_id, client_display_name, destination_country, document_type, deal_status, client_safe_status, next_step, assigned_lane_name, due_at, priority, missing_info_count, assigned_task_count"
      )
      .eq("id", id)
      .maybeSingle();

    if (error && (error.code === "42P01" || error.message?.includes("does not exist"))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ matter: projectMatter(data as Record<string, unknown>) });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
