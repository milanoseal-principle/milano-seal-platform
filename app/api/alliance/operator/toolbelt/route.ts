import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOperatorApiAccess } from "@/lib/auth/operatorApiAccess";
import { persistEligibilityCheck } from "@/lib/alliance/operatorEligibilityGate";

export const runtime = "nodejs";

// PATCH /api/alliance/operator/toolbelt — update tool status (by operator or admin)
// Triggers eligibility re-evaluation after update.
export async function PATCH(req: NextRequest) {
  const access = await requireOperatorApiAccess();
  if (!access.ok) return access.response;
  const admin = createAdminClient();

  let body: {
    operator_id?: string;
    tool_name?: string;
    status?: "verified" | "pending" | "not_configured";
    completion_pct?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { operator_id, tool_name, status, completion_pct } = body;

  if (!operator_id || !tool_name || !status) {
    return NextResponse.json(
      { error: "operator_id, tool_name, and status are required" },
      { status: 422 },
    );
  }

  const { data, error } = await admin
    .from("operator_toolbelt_status")
    .update({
      status,
      completion_pct: completion_pct ?? (status === "verified" ? 100 : 0),
      verified_at: status === "verified" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("operator_id", operator_id)
    .eq("tool_name", tool_name)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Re-evaluate eligibility after toolbelt change
  let eligibility = null;
  try {
    eligibility = await persistEligibilityCheck(operator_id);
  } catch {
    // Non-fatal
  }

  return NextResponse.json({ tool: data, eligibility });
}
