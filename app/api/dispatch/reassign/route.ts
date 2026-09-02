import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canOperatorReceiveAssignment } from "@/lib/alliance/operatorEligibilityGate";
import { isRoutingEligible, type OperatorAvailabilityState } from "@/lib/alliance/operatorAvailability";
import { requireDispatchOperator } from "@/lib/dispatch/serverAuth";

export async function POST(req: NextRequest) {
  const auth = await requireDispatchOperator();
  if (!auth.ok) return auth.response;

  let body: { dispatch_id?: string; operator_id?: string; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const dispatchId = String(body.dispatch_id ?? "").trim();
  const operatorId = String(body.operator_id ?? "").trim();
  const reason = String(body.reason ?? "Operator reassignment").trim().slice(0, 1000);
  if (!dispatchId || !operatorId) {
    return NextResponse.json({ error: "DISPATCH_ID_AND_OPERATOR_ID_REQUIRED" }, { status: 422 });
  }

  const admin = createAdminClient();
  const eligibility = await canOperatorReceiveAssignment(operatorId);
  if (!eligibility.eligible) {
    return NextResponse.json(
      { error: "OPERATOR_NOT_ROUTING_ELIGIBLE", blockers: eligibility.blockers },
      { status: 403 },
    );
  }

  const { data: availRow } = await admin
    .from("operator_current_availability")
    .select("availability")
    .eq("operator_id", operatorId)
    .maybeSingle();
  const availability = (availRow?.availability ?? "OFFLINE") as OperatorAvailabilityState;
  if (!isRoutingEligible(availability)) {
    return NextResponse.json({ error: "OPERATOR_NOT_AVAILABLE", availability }, { status: 403 });
  }

  const { data, error } = await admin.rpc("assign_dispatch_request", {
    p_dispatch_id: dispatchId,
    p_operator_id: operatorId,
    p_assigned_by: auth.actor,
  });
  if (error || !data) {
    const conflict = String(error?.message ?? "").includes("STATE_CONFLICT");
    return NextResponse.json(
      { error: conflict ? "DISPATCH_STATE_CONFLICT" : "DISPATCH_REASSIGNMENT_FAILED" },
      { status: conflict ? 409 : 500 },
    );
  }

  await admin
    .from("dispatch_requests")
    .update({ reassignment_reason: reason, updated_at: new Date().toISOString() })
    .eq("id", dispatchId);

  return NextResponse.json({ dispatch: { ...data, reassignment_reason: reason } });
}

export async function GET() {
  return NextResponse.json({ error: "METHOD_NOT_ALLOWED" }, { status: 405 });
}
