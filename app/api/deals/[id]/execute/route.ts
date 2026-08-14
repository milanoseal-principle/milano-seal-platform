import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveServerRole } from "@/lib/auth/server-role";
import { canPerformProtectedMatterTransition } from "@/lib/auth/protectedMatterTransitions";
import { canTransition, normalizeMatterStatus } from "@/lib/stateMachine";
import { evaluateSchedulingGate } from "@/lib/scheduling/complimentarySchedulingGate";
import { validateExecutionTruth } from "@/lib/matter/executionTruth";
import { logActivity } from "@/lib/activity";
import { resolveServerRole } from "@/lib/auth/server-role";
import { canManageProtectedMatterTransition } from "@/lib/auth/protectedMatterTransitions";
import { canTransition } from "@/lib/stateMachine";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(
  _req: NextRequest,
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
    if (!deal)
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const ssr = await createClient();
    const {
      data: { user },
    } = await ssr.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }

    const role = await resolveServerRole(user);
    if (!canPerformProtectedMatterTransition(role)) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const supabase = createAdminClient();
    const baseQuery = supabase.from("deals").select("*");
    const { data: deal, error: fetchError } = UUID_RE.test(id)
      ? await baseQuery.or(`id.eq.${id},deal_id.eq.${id}`).maybeSingle()
      : await baseQuery.eq("deal_id", id).maybeSingle();

    if (fetchError || !deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    const currentStatus = String(deal.deal_status ?? deal.status ?? "");
    const normalizedCurrent = normalizeMatterStatus(currentStatus);
    if (
      normalizedCurrent !== "scheduled" ||
      !canTransition(currentStatus, "in_execution")
    ) {
      return NextResponse.json(
        {
          error: "INVALID_STATE_TRANSITION",
          message: `Matter cannot transition from ${currentStatus || "unknown"} to in_execution.`,
          current_status: currentStatus || null,
          required_status: "scheduled",
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

    if (!canTransition(deal.status, "in_execution")) {
      return NextResponse.json(
        {
          error: "INVALID_STATE_TRANSITION",
          message: `The Matter cannot move from ${deal.status} to in_execution.`,
        },
        { status: 409 },
      );
    }

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

    const now = new Date().toISOString();
    const { data: updated, error: updateError } = await supabase
          message:
            "Execution requirements must be fully resolved before execution can begin.",
          remaining: executionValidation.errors,
        },
        { status: 409 },
      );
    }

    const executionGate = evaluateSchedulingGate({ matter: deal });
    if (!executionGate.schedulingEligible) {
      return NextResponse.json(
        {
          error: "PAYMENT_REQUIRED",
          paymentRequirementSatisfied:
            executionGate.paymentRequirementSatisfied,
          paymentRequirementMethod: executionGate.paymentRequirementMethod,
          message:
            "Verified payment or an active Complimentary Authorization is required before execution can begin.",
        },
        { status: 402 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const now = new Date().toISOString();
    const executionDate =
      typeof body.execution_date === "string" && body.execution_date.trim()
        ? body.execution_date
        : now;

    let updateQuery = supabase
      .from("deals")
      .update({
        status: "in_execution",
        deal_status: "in_execution",
        execution_date: executionDate,
        execution_at: now,
        executed_at: now,
        last_activity: now,
      })
      .eq("id", deal.id)
      .eq("status", deal.status)
      .select()
      .single();
      .eq("status", deal.status);

    updateQuery =
      deal.deal_status == null
        ? updateQuery.is("deal_status", null)
        : updateQuery.eq("deal_status", deal.deal_status);

    const { data: updated, error: updateError } = await updateQuery
      .select()
      .maybeSingle();

    if (updateError || !updated) {
      return NextResponse.json(
        {
          error: "EXECUTION_TRANSITION_FAILED",
          message: "The Matter could not be moved to execution. No execution state was fabricated.",
          error: "STALE_MATTER_STATE",
          message:
            "The Matter changed before execution began. Refresh and retry; no execution state was fabricated.",
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
    void logActivity({
      deal_id: (updated.deal_id as string) ?? id,
      actor: user.email ?? user.id,
      action: "executed",
      detail: "Execution started",
      meta: {
        executed_at: now,
        payment_requirement_method: executionGate.paymentRequirementMethod,
        canonical_status: "in_execution",
      },
    }).catch((error) =>
      console.error("[activity] execution log failed:", error),
    );

    return NextResponse.json({ success: true, deal: updated });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
