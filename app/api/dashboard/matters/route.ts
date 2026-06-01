import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireDashboardAccess } from "@/lib/dashboardAuth";

export const runtime = "nodejs";

export async function GET() {
  await requireDashboardAccess();
  const supabase = createAdminClient();

  const { data: rows, error } = await supabase
    .from("deals")
    .select("id, client_name, deal_status, payment_status, destination_country, updated_at, created_at, due_at")
    .order("updated_at", { ascending: false })
    .limit(25);

  if (error) {
    return NextResponse.json({ matters: [], error: "Failed to load matters" }, { status: 500 });
  }

  return NextResponse.json({ matters: rows ?? [] });
}
