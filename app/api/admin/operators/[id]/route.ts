import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { persistEligibilityCheck } from "@/lib/alliance/operatorEligibilityGate";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

// GET /api/admin/operators/[id] — operator profile + toolbelt + compliance + eligibility
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const admin = createAdminClient();

  const [profileRes, toolbeltRes, complianceRes, eligibilityRes, availabilityRes] =
    await Promise.all([
      admin.from("operator_profiles").select("*").eq("id", id).single(),
      admin.from("operator_toolbelt_summary").select("*").eq("operator_id", id).single(),
      admin.from("operator_compliance_status").select("*").eq("operator_id", id).single(),
      admin.from("operator_routing_eligibility").select("*").eq("operator_id", id).single(),
      admin.from("operator_current_availability").select("*").eq("operator_id", id).single(),
    ]);

  if (profileRes.error || !profileRes.data) {
    return NextResponse.json({ error: "Operator not found" }, { status: 404 });
  }

  return NextResponse.json({
    operator: profileRes.data,
    toolbelt: toolbeltRes.data ?? null,
    compliance: complianceRes.data ?? null,
    eligibility: eligibilityRes.data ?? null,
    availability: availabilityRes.data ?? null,
  });
}

// PATCH /api/admin/operators/[id] — update operator fields (admin-gated)
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const admin = createAdminClient();

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Whitelist of fields admin may update
  const ALLOWED_FIELDS = [
    "full_name", "phone", "firm_name", "region", "state", "city",
    "coverage_radius_miles", "onboarding_status",
    "background_verified", "identity_verified",
    "ron_capable", "mobile_capable", "apostille_runner_capable", "courier_capable",
    "notes",
  ] as const;

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const field of ALLOWED_FIELDS) {
    if (field in body) update[field] = body[field];
  }

  const { data, error } = await admin
    .from("operator_profiles")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Re-evaluate eligibility after any profile change
  try {
    await persistEligibilityCheck(id);
  } catch {
    // Non-fatal: eligibility table may not exist in dev
  }

  return NextResponse.json({ operator: data });
}
