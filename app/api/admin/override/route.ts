import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type OverrideAction =
  | "request_missing_info"
  | "mark_review_complete"
  | "approve_quote"
  | "approve_message"
  | "update_courier_tracking"
  | "approve_release"
  | "pause_matter"
  | "reopen_matter";

// POST /api/admin/override — audited manual admin control
// Every override writes an audit event. Blocked overrides are rejected.
export async function POST(req: NextRequest) {
  const admin = createAdminClient();

  let body: {
    action?: OverrideAction;
    matter_id?: string;
    admin_id?: string;
    reason?: string;
    payload?: Record<string, unknown>;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { action, matter_id, admin_id, reason, payload = {} } = body;

  if (!action || !matter_id || !admin_id) {
    return NextResponse.json(
      { error: "action, matter_id, and admin_id are required" },
      { status: 422 },
    );
  }

  // Load current matter state
  const { data: matter, error: matterErr } = await admin
    .from("deals")
    .select("id, status, payment_status")
    .eq("id", matter_id)
    .single();

  if (matterErr || !matter) {
    return NextResponse.json({ error: "Matter not found" }, { status: 404 });
  }

  const previousStatus = matter.status;
  let newStatus: string | undefined;
  let updatePayload: Record<string, unknown> = {};

  switch (action) {
    case "request_missing_info":
      newStatus = "needs_info";
      updatePayload = { status: newStatus };
      break;

    case "mark_review_complete":
      newStatus = "quoted";
      updatePayload = { status: newStatus };
      break;

    case "approve_quote":
      newStatus = "awaiting_payment";
      updatePayload = { status: newStatus };
      break;

    case "update_courier_tracking":
      if (payload.tracking_number) {
        updatePayload = {
          tracking_number: payload.tracking_number,
          carrier: payload.carrier ?? matter.status,
        };
      }
      break;

    case "approve_release":
      // Cannot approve release if payment is not confirmed
      if (matter.payment_status !== "paid") {
        return NextResponse.json(
          { error: "Cannot approve release — payment not confirmed" },
          { status: 403 },
        );
      }
      newStatus = "completed";
      updatePayload = { status: newStatus };
      break;

    case "pause_matter":
      newStatus = "dormant";
      updatePayload = { status: newStatus };
      break;

    case "reopen_matter":
      newStatus = "under_review";
      updatePayload = { status: newStatus };
      break;

    case "approve_message":
      // Message approval is handled in message records, not deal status
      break;

    default:
      return NextResponse.json(
        { error: `Unknown override action: ${action}` },
        { status: 400 },
      );
  }

  // Apply update if status change
  if (Object.keys(updatePayload).length > 0) {
    const { error: updateErr } = await admin
      .from("deals")
      .update({ ...updatePayload, updated_at: new Date().toISOString() })
      .eq("id", matter_id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }
  }

  // Write audit event — every override is logged
  await admin.from("matter_events").insert({
    matter_id,
    event_type: `ADMIN_OVERRIDE_${action.toUpperCase()}`,
    actor_type: "administrator",
    actor_name: admin_id,
    client_visible: false,
    status_before: previousStatus,
    status_after: newStatus ?? previousStatus,
    payload: {
      action,
      reason: reason ?? null,
      admin_id,
      ...payload,
    },
    notes: reason ?? null,
  });

  return NextResponse.json({
    success: true,
    action,
    matter_id,
    previous_status: previousStatus,
    new_status: newStatus ?? previousStatus,
    admin_id,
    timestamp: new Date().toISOString(),
  });
}
