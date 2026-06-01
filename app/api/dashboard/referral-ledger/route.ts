import { NextRequest, NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_req: NextRequest) {
  try { await requireDashboardAccess(); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("referral_ledger")
      .select("id, matter_id, partner_id, referral_code, source_type, attribution_status, captured_at, locked_at, locked_by, utm_source, utm_medium, utm_campaign, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) return NextResponse.json({ entries: [], error: error.message });
    return NextResponse.json({ entries: data ?? [] });
  } catch {
    return NextResponse.json({ entries: [] });
  }
}

export async function POST(req: NextRequest) {
  try { await requireDashboardAccess(); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { action, ledger_id, matter_id, locked_by } = body;

    if (action === "lock_attribution") {
      if (!ledger_id || !matter_id || !locked_by) {
        return NextResponse.json({ error: "ledger_id, matter_id, and locked_by are required" }, { status: 400 });
      }
      const supabase = createAdminClient();

      // Verify matter has not passed EXECUTION_SCHEDULED (attribution lock rule)
      const { data: deal } = await supabase
        .from("deals")
        .select("matter_status")
        .eq("id", matter_id)
        .single();

      const postLockStatuses = ["in_execution", "apostille_processing", "courier_ready", "shipped", "delivered", "completed"];
      if (deal && postLockStatuses.includes(deal.matter_status ?? "")) {
        // Still allow with audit note — but flag it
        console.warn(`[ATTRIBUTION_LOCK_LATE] matter ${matter_id} is already in status ${deal.matter_status}`);
      }

      const { data, error } = await supabase
        .from("referral_ledger")
        .update({ attribution_status: "locked", locked_at: new Date().toISOString(), locked_by })
        .eq("id", ledger_id)
        .select("id, attribution_status, locked_at")
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, entry: data });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
