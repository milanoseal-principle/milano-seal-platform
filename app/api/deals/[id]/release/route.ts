import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { appendLedger, CUSTODY_EVENTS } from "@/lib/custodyLedger";
import { roleFromEmail } from "@/lib/rbac";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Auth check
  const supabase = createClient();
  const {
    data: { user },
  } = await (await supabase).auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = roleFromEmail(user.email);
  if (!["founder_admin", "admin_operator"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Resolve deal UUID (id may be deal_id slug or UUID)
  const adminClient = createAdminClient();
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      id,
    );
  const { data: deal, error: dealErr } = await adminClient
    .from("deals")
    .select("id, deal_id, deal_status")
    .eq(isUuid ? "id" : "deal_id", id)
    .single();

  if (dealErr || !deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  const previousStatus = deal.deal_status;
  const newStatus = "released";

  const result = await appendLedger({
    deal_id: deal.id,
    event: CUSTODY_EVENTS.DOC_RELEASE_CONFIRMED,
    actor_type: "operator",
    actor_id: user.email ?? user.id,
    notes: `Document release confirmed by operator | previous_status=${previousStatus} | new_status=${newStatus} | release_action=DOC_RELEASE_CONFIRMED | operator=${user.email ?? user.id}`,
  });

  if (!result) {
    return NextResponse.json(
      { error: "Failed to append custody ledger" },
      { status: 500 },
    );
  }

  // Attempt durable audit log entry
  let auditFailed = false;
  try {
    const { error: auditErr } = await adminClient.from("audit_logs").insert({
      event: "DOC_RELEASE_CONFIRMED",
      actor: user.email ?? user.id,
      resource: deal.deal_id ?? deal.id,
      detail: `previous_status=${previousStatus} new_status=${newStatus}`,
      created_at: new Date().toISOString(),
    });
    if (auditErr) auditFailed = true;
  } catch {
    auditFailed = true;
  }

  // If audit insert failed, append AUDIT_PENDING_SYNC to custody chain — do NOT silently continue
  if (auditFailed) {
    await appendLedger({
      deal_id: deal.id,
      event: "AUDIT_PENDING_SYNC",
      actor_type: "system",
      actor_id: "system",
      notes: `audit_logs insert failed for DOC_RELEASE_CONFIRMED by ${user.email ?? user.id} — chain requires manual reconciliation`,
    });
  }

  return NextResponse.json({ ok: true, hash: result.hash, audit_ok: !auditFailed });
}
