import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity";

export const runtime = "nodejs";

const VALID_STATUSES = [
  "intake_received",
  "under_review",
  "quoted",
  "awaiting_payment",
  "scheduled",
  "in_execution",
  "apostille_processing",
  "in_transit",
  "delivered",
  "completed",
] as const;

type MatterStatus = (typeof VALID_STATUSES)[number];

// POST /api/admin/matters/[id]/status
// founder_admin only — advances matter status through the execution state machine.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  }

  const role = user.app_metadata?.role ?? user.app_metadata?.role;
  if (role !== "founder_admin") {
    return NextResponse.json({ ok: false, code: "FOUNDER_ONLY" }, { status: 403 });
  }

  if (!id) {
    return NextResponse.json({ ok: false, code: "MISSING_MATTER_ID" }, { status: 422 });
  }

  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, code: "INVALID_JSON" }, { status: 400 });
  }

  const status = body.status as MatterStatus;
  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { ok: false, code: "INVALID_STATUS", allowed: VALID_STATUSES },
      { status: 422 },
    );
  }

  const admin = createAdminClient();
  const actorEmail = user.email ?? user.id;
  const now = new Date().toISOString();

  const { error } = await admin
    .from("deals")
    .update({ deal_status: status })
    .eq("id", id);

  if (error) {
    console.error("[matter-status] update failed:", error.message);
    return NextResponse.json(
      { ok: false, code: "STATUS_UPDATE_FAILED", message: error.message },
      { status: 500 },
    );
  }

  try {
    await logActivity({
      deal_id: id,
      actor: actorEmail,
      action: "status_advanced",
      detail: `Matter status set to ${status}.`,
      meta: { actor: actorEmail, status, timestamp: now },
    });
  } catch {}

  return NextResponse.json({ ok: true, status });
}
