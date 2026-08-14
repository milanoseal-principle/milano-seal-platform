import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { evaluateSchedulingGate } from "@/lib/scheduling/complimentarySchedulingGate";
import { validateExecutionTruth } from "@/lib/matter/executionTruth";
import { logActivity } from "@/lib/activity";
import { resolveServerRole } from "@/lib/auth/server-role";

const EXECUTION_ROLES = new Set([
  "founder", "founder_admin", "admin", "admin_operator", "ops_manager",
  "execution_coordinator", "apostille_coordinator", "virtual_assistant",
]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    const role = await resolveServerRole(user);
    if (!EXECUTION_ROLES.has(role)) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const { data: deal } = await supabase
      .from("deals")
      .select("*")
      .eq("id", id)
      .single();
    if (!deal)
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });

    const executionTruth = deal.execution_truth;
    const executionValidation = executionTruth && typeof executionTruth === "object"
      ? validateExecutionTruth(executionTruth)
      : { valid: false, reviewRequired: true, errors: ["EXECUTION_TRUTH_MISSING"] };
    if (!executionValidation.valid || executionValidation.reviewRequired) {
      return NextResponse.json(
        {
          error: "EXECUTION_REVIEW_REQUIRED",
          message: "Execution requirements must be fully resolved before execution can begin.",
          remaining: executionValidation.errors,
        },
        { status: 409 },
      );
    }

    const schedulingGate = evaluateSchedulingGate({ matter: deal });
    if (!schedulingGate.schedulingEligible) {
      return NextResponse.json(
        {
          error: "PAYMENT_REQUIRED",
          paymentRequirementSatisfied: schedulingGate.paymentRequirementSatisfied,
          paymentRequirementMethod: schedulingGate.paymentRequirementMethod,
          message: "Verified payment or an active Complimentary Authorization is required before execution can begin.",
        },
        { status: 402 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const { data: updated, error: updateError } = await supabase
      .from("deals")
      .update({
        deal_status: "in_execution",
        ...(body.execution_date ? { execution_date: body.execution_date } : {}),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        {
          error: "EXECUTION_TRANSITION_FAILED",
          message: "The Matter could not be moved to execution. No execution state was fabricated.",
        },
        { status: 409 },
      );
    }

    void (async () => {
      await logActivity({
        deal_id: (updated?.deal_id as string) ?? id,
        actor: user?.email ?? "admin",
        action: "executed",
        detail: "Execution started",
      });
    })();

    return NextResponse.json({ success: true, deal: updated });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
