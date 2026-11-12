import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordSecurityEvent } from "@/lib/security/security-events";

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
  // Auth gate — founder_admin only
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    await recordSecurityEvent({
      event_name: "ADMIN_ACTION_DENIED",
      severity: "high",
      route: "/api/admin/override",
      client_safe: false,
      metadata: { reason: "unauthenticated" },
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = user.app_metadata?.role ?? user.app_metadata?.role;
  if (role !== "founder_admin") {
    await recordSecurityEvent({
      event_name: "ADMIN_ACTION_DENIED",
      severity: "high",
      actor: user.email ?? user.id,
      route: "/api/admin/override",
      client_safe: false,
      metadata: { role: String(role), reason: "insufficient_role" },
    });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  const { action, matter_id, reason, payload = {} } = body;
  // Attribution is the verified founder session; a body-supplied admin_id is ignored.
  const admin_id = user.id;

  if (!action || !matter_id) {
    return NextResponse.json(
      { error: "action and matter_id are required" },
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
    actor: user.email ?? admin_id,
    client_visible: false,
    // matter_events has no status/payload columns; the override record lives in metadata.
    metadata: {
      ...payload,
      action,
      reason: reason ?? null,
      admin_id,
      status_before: previousStatus,
      status_after: newStatus ?? previousStatus,
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
