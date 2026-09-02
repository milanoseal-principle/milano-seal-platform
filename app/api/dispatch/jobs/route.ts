import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireDispatchOperator } from "@/lib/dispatch/serverAuth";

const ALLOWED_STATUSES = new Set([
  "requested",
  "offered",
  "accepted",
  "declined",
  "reassigned",
  "escalated",
  "cancelled",
  "completed",
]);

export async function GET(req: NextRequest) {
  const auth = await requireDispatchOperator();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const status = String(url.searchParams.get("status") ?? "").trim().toLowerCase();
  const limitRaw = Number(url.searchParams.get("limit") ?? 50);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(100, Math.floor(limitRaw))) : 50;

  let query = createAdminClient()
    .from("dispatch_requests")
    .select(
      `id,matter_id,status,requested_service,priority,requirements,assigned_operator_id,assignment_id,escalation_reason,reassignment_reason,created_at,updated_at,offered_at,accepted_at,completed_at,escalated_at,
       deals!inner(id,deal_id,client_name,document_type,destination_country,status,deal_status,execution_lane,scheduled_at)`
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status && ALLOWED_STATUSES.has(status)) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "DISPATCH_QUEUE_READ_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ dispatches: data ?? [], count: data?.length ?? 0 });
}

export async function POST() {
  return NextResponse.json({ error: "METHOD_NOT_ALLOWED" }, { status: 405 });
}
