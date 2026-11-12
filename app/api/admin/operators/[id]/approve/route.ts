import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOperatorApiAccess } from "@/lib/auth/operatorApiAccess";
import { persistEligibilityCheck } from "@/lib/alliance/operatorEligibilityGate";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

// POST /api/admin/operators/[id]/approve — admin approves operator for routing
export async function POST(req: NextRequest, { params }: Params) {
  const access = await requireOperatorApiAccess();
  if (!access.ok) return access.response;
  const { id } = await params;
  const admin = createAdminClient();

  let body: { notes?: string } = {};
  try {
    body = await req.json();
  } catch {
    // body is optional
  }

  // Attribution comes from the verified operator session, never the request body.
  const approvedBy = access.actor;

  const { data: profile, error: profileError } = await admin
    .from("operator_profiles")
    .select("id, onboarding_status, full_name")
    .eq("id", id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Operator not found" }, { status: 404 });
  }

  const { error: updateError } = await admin
    .from("operator_profiles")
    .update({
      admin_approved: true,
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
      onboarding_status: "approved",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Set availability to AVAILABLE upon admin approval
  await admin.from("operator_availability_log").insert({
    operator_id: id,
    availability: "AVAILABLE",
    set_by: approvedBy,
    reason: "Admin approval granted",
  });

  // Persist eligibility evaluation
  let eligibility = null;
  try {
    eligibility = await persistEligibilityCheck(id);
  } catch {
    // Non-fatal
  }

  return NextResponse.json({
    success: true,
    operator_id: id,
    approved_by: approvedBy,
    eligibility,
  });
}
