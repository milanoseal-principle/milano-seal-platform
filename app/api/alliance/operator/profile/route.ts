import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOperatorApiAccess } from "@/lib/auth/operatorApiAccess";
import { evaluateEligibilityGate } from "@/lib/alliance/operatorEligibilityGate";

export const runtime = "nodejs";

// GET /api/alliance/operator/profile — fetch operator profile + toolbelt + compliance + eligibility
// Used by the alliance portal (read-only, no internal cost/margin data)
export async function GET(req: NextRequest) {
  const access = await requireOperatorApiAccess();
  if (!access.ok) return access.response;
  const admin = createAdminClient();
  const operatorId = req.nextUrl.searchParams.get("operator_id");

  if (!operatorId) {
    return NextResponse.json({ error: "operator_id is required" }, { status: 422 });
  }

  const [profileRes, toolbeltRes, complianceRes, eligibilityRes, availabilityRes] =
    await Promise.all([
      admin
        .from("operator_profiles")
        .select(
          `id, full_name, email, firm_name, region, state, city,
           onboarding_status, ron_capable, mobile_capable,
           apostille_runner_capable, courier_capable, admin_approved,
           approved_at, created_at`,
        )
        .eq("id", operatorId)
        .single(),
      admin
        .from("operator_toolbelt_summary")
        .select("total_tools, verified_tools, completion_pct, compliance_gates_met")
        .eq("operator_id", operatorId)
        .single(),
      admin
        .from("operator_compliance_status")
        .select(
          `compliance_ready, e_o_insurance_verified, background_check_passed,
           notary_commission_verified, nna_certified, state_license_verified,
           data_handling_agreement, brand_guidelines_accepted`,
        )
        .eq("operator_id", operatorId)
        .single(),
      admin
        .from("operator_routing_eligibility")
        .select("eligible, toolbelt_score, blockers, last_evaluated_at")
        .eq("operator_id", operatorId)
        .single(),
      admin
        .from("operator_current_availability")
        .select("availability, set_by, created_at")
        .eq("operator_id", operatorId)
        .single(),
    ]);

  if (profileRes.error || !profileRes.data) {
    return NextResponse.json(
      { error: "Operator profile not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    profile: profileRes.data,
    toolbelt: toolbeltRes.data ?? null,
    compliance: complianceRes.data ?? null,
    eligibility: eligibilityRes.data ?? null,
    availability: availabilityRes.data ?? null,
  });
}
