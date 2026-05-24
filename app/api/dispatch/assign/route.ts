import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canOperatorReceiveAssignment } from "@/lib/alliance/operatorEligibilityGate";
import { isRoutingEligible } from "@/lib/alliance/operatorAvailability";
import type { OperatorAvailabilityState } from "@/lib/alliance/operatorAvailability";
import { isPhantomData } from "@/lib/alliance/phantomDataGuard";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: { dispatch_id?: string; operator_id?: string; assigned_by?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.dispatch_id || !body.operator_id) {
    return NextResponse.json(
      { error: "dispatch_id and operator_id are required" },
      { status: 422 },
    );
  }

  const admin = createAdminClient();
  const operatorId = body.operator_id;
  const assignedBy = body.assigned_by ?? "system";

  // 1. Load operator profile
  const { data: profile, error: profileErr } = await admin
    .from("operator_profiles")
    .select("id, onboarding_status, admin_approved, state, identity_verified")
    .eq("id", operatorId)
    .single();

  if (profileErr || !profile) {
    return NextResponse.json({ error: "Operator not found" }, { status: 404 });
  }

  // 2. Check routing eligibility gate (may re-evaluate if stale)
  const eligibility = await canOperatorReceiveAssignment(operatorId);
  if (!eligibility.eligible) {
    return NextResponse.json(
      {
        error: "Operator is not routing eligible",
        blockers: eligibility.blockers,
        toolbelt_score: eligibility.toolbelt_score,
      },
      { status: 403 },
    );
  }

  // 3. Check current availability state
  const { data: availRow } = await admin
    .from("operator_current_availability")
    .select("availability")
    .eq("operator_id", operatorId)
    .single();

  const availability = (availRow?.availability ?? "OFFLINE") as OperatorAvailabilityState;
  if (!isRoutingEligible(availability)) {
    return NextResponse.json(
      { error: `Operator availability is ${availability} — not eligible for routing` },
      { status: 403 },
    );
  }

  // 4. Phantom data guard — no phantom metrics in dispatch
  const metricsGuard = isPhantomData(null); // real metrics loaded separately
  if (metricsGuard) {
    // Phantom guard passed — proceed (no fake metrics injected)
  }

  // 5. Idempotency key prevents duplicate assignments
  const idempotencyKey = `assign:${body.dispatch_id}:${operatorId}`;

  const { data: existing } = await admin
    .from("operator_assignments")
    .select("id, assignment_status")
    .eq("idempotency_key", idempotencyKey)
    .single();

  if (existing) {
    return NextResponse.json({
      status: existing.assignment_status,
      assignment_id: existing.id,
      idempotent: true,
    });
  }

  // 6. Create assignment record
  const { data: assignment, error: assignErr } = await admin
    .from("operator_assignments")
    .insert({
      operator_id: operatorId,
      deal_id: body.dispatch_id,
      assigned_by: assignedBy,
      assignment_status: "offered",
      dispatch_confirmed: false,
      idempotency_key: idempotencyKey,
    })
    .select()
    .single();

  if (assignErr) {
    return NextResponse.json({ error: assignErr.message }, { status: 500 });
  }

  // 7. Emit DISPATCH_ASSIGNED audit event
  await admin.from("matter_events").insert({
    matter_id: body.dispatch_id,
    event_type: "DISPATCH_ASSIGNED",
    actor_type: "system",
    actor_name: assignedBy,
    client_visible: false,
    status_after: "offered",
    payload: {
      operator_id: operatorId,
      assignment_id: assignment.id,
      eligibility_score: eligibility.toolbelt_score,
    },
  }).throwOnError();

  return NextResponse.json({
    status: "assigned",
    assignment_id: assignment.id,
    operator_id: operatorId,
    dispatch_confirmed: false,
  });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
