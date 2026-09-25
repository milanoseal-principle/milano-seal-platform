import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireDashboardAccess } from "@/lib/dashboardAuth";

export const runtime = "nodejs";

export async function GET() {
  await requireDashboardAccess();
  const { data, error } = await createAdminClient()
    .from("authority_review_required")
    .select("id, authority_id, source_url, previous_snapshot_hash, new_snapshot_hash, change_detected, detected_at, review_status, reviewed_at, review_notes")
    .order("detected_at", { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: "REVIEWS_UNAVAILABLE" }, { status: 500 });
  return NextResponse.json({ reviews: data ?? [] });
}
