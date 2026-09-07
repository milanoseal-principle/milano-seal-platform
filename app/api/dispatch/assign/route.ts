import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canOperatorReceiveAssignment } from "@/lib/alliance/operatorEligibilityGate";
import { isRoutingEligible, type OperatorAvailabilityState } from "@/lib/alliance/operatorAvailability";
import { requireDispatchOperator } from "@/lib/dispatch/serverAuth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = await requireDispatchOperator();
  if (!auth.ok) return auth.response;

  let body: { dispatch_id?: string; operator_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const dispatchId = String(body.dispatch_id ?? "").trim();
  const operatorId = String(body.operator_id ?? "").trim();
  if (!dispatchId || !operatorId) {
    return NextResponse.json({ error: "DISPATCH_ID_AND_OPERATOR_ID_REQUIRED" }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data: dispatch, error: dispatchError } = await admin
    .from("dispatch_requests")
    .select("id,matter_id,status")
    .eq("id", dispatchId)
    .maybeSingle();
  if (dispatchError || !dispatch) {
    return NextResponse.json({ error: "DISPATCH_NOT_FOUND" }, { status: 404 });
  }

  const eligibility = await canOperatorReceiveAssignment(operatorId);
  if (!eligibility.eligible) {
    return NextResponse.json(
      {
        error: "OPERATOR_NOT_ROUTING_ELIGIBLE",
        blockers: eligibility.blockers,
        toolbelt_score: eligibility.toolbelt_score,
      },
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
    return NextResponse.json(
      { error: "OPERATOR_NOT_AVAILABLE", availability },
      { status: 403 },
    );
  }

  const { data, error } = await admin.rpc("assign_dispatch_request", {
    p_dispatch_id: dispatchId,
    p_operator_id: operatorId,
    p_assigned_by: auth.actor,
  });

  if (error || !data) {
    const conflict = String(error?.message ?? "").includes("STATE_CONFLICT");
    return NextResponse.json(
      { error: conflict ? "DISPATCH_STATE_CONFLICT" : "DISPATCH_ASSIGNMENT_FAILED" },
      { status: conflict ? 409 : 500 },
    );
  }

  return NextResponse.json({ dispatch: data });
}

export async function GET() {
  return NextResponse.json({ error: "METHOD_NOT_ALLOWED" }, { status: 405 });
}
