import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { checkFailurePatterns } from "@/lib/intelligence/failurePrevention";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ matterId: string }> }
) {
  await requireDashboardAccess();
  const { matterId } = await params;
  const adminClient = createAdminClient();

  try {
    // Fetch deal
    const { data: deal } = await adminClient
      .from("deals")
      .select(
        "id, deal_id, deal_status, payment_status, destination_country, document_type, client_user_id"
      )
      .eq("id", matterId)
      .single();

    if (!deal) {
      return NextResponse.json({ matched: false, patterns: [] });
    }

    // Fetch va_tasks
    const { data: tasks } = await adminClient
      .from("va_tasks")
      .select("id, task_type, status")
      .eq("matter_id", matterId);

    const taskList = (tasks ?? []) as Record<string, unknown>[];

    // Check for duplicate matters (same client, same doc type, not completed)
    let duplicateMatched = false;
    try {
      const { data: duplicates } = await adminClient
        .from("deals")
        .select("id")
        .eq("client_user_id", deal.client_user_id)
        .eq("document_type", deal.document_type)
        .neq("deal_status", "completed")
        .neq("id", deal.id);

      duplicateMatched = !!(duplicates && duplicates.length > 0);
    } catch {
      // graceful — skip duplicate check
    }

    const matter: Record<string, unknown> = {
      ...deal,
      _duplicateMatched: duplicateMatched,
    };

    const result = checkFailurePatterns(matter);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Unable to evaluate failure patterns" },
      { status: 500 }
    );
  }
}
