import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { appendLedger, CUSTODY_EVENTS } from "@/lib/custodyLedger";
import { logActivity } from "@/lib/activity";
import { notifyClient } from "@/lib/notifications/orchestrator";
import { recordSecurityEvent } from "@/lib/security/security-events";

export const runtime = "nodejs";

// POST /api/admin/matters/[id]/confirm-payment
// founder_admin only — manually confirms a client payment and unlocks scheduling.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    await recordSecurityEvent({
      event_name: "ADMIN_ACTION_DENIED",
      severity: "high",
      route: "/api/admin/matters/[id]/confirm-payment",
      client_safe: false,
      metadata: { reason: "unauthenticated" },
    });
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  }

  const role = user.app_metadata?.role ?? user.user_metadata?.role;
  if (role !== "founder_admin") {
    await recordSecurityEvent({
      event_name: "ADMIN_ACTION_DENIED",
      severity: "high",
      actor: user.email ?? user.id,
      route: "/api/admin/matters/[id]/confirm-payment",
      client_safe: false,
      metadata: { role: String(role), reason: "insufficient_role" },
    });
    return NextResponse.json(
      { ok: false, code: "FOUNDER_ONLY" },
      { status: 403 },
    );
  }

  if (!id) {
    return NextResponse.json({ ok: false, code: "MISSING_MATTER_ID" }, { status: 422 });
  }

  const admin = createAdminClient();
  const actorEmail = user.email ?? user.id;
  const now = new Date().toISOString();

  // Idempotency guard — if already confirmed, return success without re-writing
  const { data: current } = await admin
    .from("deals")
    .select("payment_confirmed, payment_status")
    .eq("id", id)
    .single();
  if (current?.payment_confirmed === true) {
    return NextResponse.json({ ok: true, already_confirmed: true });
  }

  const { error } = await admin
    .from("deals")
    .update({
      payment_confirmed: true,
      payment_confirmed_at: now,
      payment_status: "confirmed",
      paid_at: now,
      // Operator confirms a *visible* payment — this unlocks scheduling/execution,
      // but is "observed" not "cleared". Final packet release still requires
      // settled funds (Wise webhook → cleared) or a recorded founder override.
      payment_settlement_status: "observed_available",
      payment_observed_at: now,
    })
    .eq("id", id);

  if (error) {
    console.error("[confirm-payment] update failed:", error.message);
    return NextResponse.json(
      { ok: false, code: "PAYMENT_CONFIRM_FAILED", message: error.message },
      { status: 500 },
    );
  }

  // Audit: custody ledger + activity log (best-effort, never blocks the response)
  try {
    await appendLedger({
      deal_id: id,
      event: CUSTODY_EVENTS.PAYMENT_RECONCILED,
      actor_type: "operator",
      actor_id: actorEmail,
      method: "manual",
      status: "confirmed",
      notes: "Payment manually confirmed by founder.",
      metadata: { confirmed_by: actorEmail, confirmed_at: now },
    });
  } catch (err) {
    console.error("[confirm-payment] ledger failed:", err instanceof Error ? err.message : err);
  }

  try {
    await logActivity({
      deal_id: id,
      actor: actorEmail,
      action: "payment_confirmed",
      detail: "Payment manually confirmed by founder.",
      meta: { actor: actorEmail, timestamp: now },
    });
  } catch {}

  // Mirror the observed payment into the client notification log. Runs only after
  // the existing observed-confirmation logic above; non-blocking and client-safe.
  await notifyClient(id, "payment_observed");

  return NextResponse.json({ ok: true });
}
