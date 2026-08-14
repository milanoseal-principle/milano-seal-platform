import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { evaluateSchedulingGate } from "@/lib/scheduling/complimentarySchedulingGate";
import { validateExecutionTruth } from "@/lib/matter/executionTruth";
import { logActivity } from "@/lib/activity";
import { resolveServerRole } from "@/lib/auth/server-role";
import { canManageProtectedMatterTransition } from "@/lib/auth/protectedMatterTransitions";
import { canTransition } from "@/lib/stateMachine";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    const role = await resolveServerRole(user);
    if (!canManageProtectedMatterTransition(role)) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    let { data: deal } = await supabase
      .from("deals")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!deal) {
      const fallback = await supabase
        .from("deals")
        .select("*")
        .eq("deal_id", id)
        .maybeSingle();
      deal = fallback.data;
    }

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    if (!canTransition(deal.status, "scheduled")) {
      return NextResponse.json(
        {
          error: "INVALID_STATE_TRANSITION",
          message: `The Matter cannot move from ${deal.status} to scheduled.`,
        },
        { status: 409 },
      );
    }

    const executionTruth = deal.execution_truth;
    const executionValidation =
      executionTruth && typeof executionTruth === "object"
        ? validateExecutionTruth(executionTruth)
        : {
            valid: false,
            reviewRequired: true,
            errors: ["EXECUTION_TRUTH_MISSING"],
          };

    if (!executionValidation.valid || executionValidation.reviewRequired) {
      return NextResponse.json(
        {
          error: "EXECUTION_REVIEW_REQUIRED",
          message:
            "Execution requirements must be fully resolved before scheduling can begin.",
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
          paymentRequirementSatisfied:
            schedulingGate.paymentRequirementSatisfied,
          paymentRequirementMethod: schedulingGate.paymentRequirementMethod,
          message:
            "Verified payment or an active Complimentary Authorization is required before scheduling can begin.",
        },
        { status: 402 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const now = new Date().toISOString();
    const { data: updated, error: updateError } = await supabase
      .from("deals")
      .update({
        status: "scheduled",
        deal_status: "scheduled",
        last_activity: now,
        ...(body.scheduled_at
          ? { scheduled_at: body.scheduled_at }
          : {}),
        ...(typeof body.notes === "string" && body.notes.trim()
          ? { notes: body.notes.trim() }
          : {}),
      })
      .eq("id", deal.id)
      .eq("status", deal.status)
      .select()
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        {
          error: "SCHEDULING_TRANSITION_FAILED",
          message:
            "The Matter could not be moved to scheduled. No scheduling state was fabricated.",
        },
        { status: 409 },
      );
    }

    void (async () => {
      await logActivity({
        deal_id: (updated?.deal_id as string) ?? id,
        actor: user?.email ?? "admin",
        action: "scheduled",
        detail: body.scheduled_at
          ? `Scheduled for ${body.scheduled_at}`
          : "Marked scheduled",
        meta: {
          scheduled_at: body.scheduled_at ?? null,
          payment_requirement_method:
            schedulingGate.paymentRequirementMethod,
          canonical_status: "scheduled",
        },
      });
    })();

    return NextResponse.json({ success: true, deal: updated });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
