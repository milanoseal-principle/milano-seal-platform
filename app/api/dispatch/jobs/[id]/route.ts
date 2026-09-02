import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireDispatchOperator } from "@/lib/dispatch/serverAuth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireDispatchOperator();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("dispatch_requests")
    .select(
      `id,matter_id,status,requested_by_role,requested_service,priority,requirements,assigned_operator_id,assignment_id,escalation_reason,reassignment_reason,created_at,updated_at,offered_at,accepted_at,completed_at,escalated_at,
       deals!inner(id,deal_id,client_name,document_type,destination_country,status,deal_status,execution_lane,scheduled_at),
       operator_assignments(id,operator_id,assignment_status,dispatch_confirmed,notes,created_at,updated_at)`
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "DISPATCH_NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ dispatch: data });
}

export async function POST() {
  return NextResponse.json({ error: "METHOD_NOT_ALLOWED" }, { status: 405 });
}
