import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadExceptionQueue } from "@/lib/dashboard/exceptionQueue";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireDashboardAccess();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await loadExceptionQueue(createAdminClient()));
}
