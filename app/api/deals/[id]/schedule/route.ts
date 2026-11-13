import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveServerRole } from "@/lib/auth/server-role";
import { canPerformProtectedMatterTransition } from "@/lib/auth/protectedMatterTransitions";
import { canTransition, normalizeMatterStatus } from "@/lib/stateMachine";
import { evaluateSchedulingGate } from "@/lib/scheduling/complimentarySchedulingGate";
import { validateExecutionTruth } from "@/lib/matter/executionTruth";
import { logActivity } from "@/lib/activity";
import { institutionalRouteRefusal } from "@/lib/institutional/executionGate";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(
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
      !["awaiting_payment", "payment_confirmed"].includes(normalizedCurrent ?? "") ||
      !canTransition(currentStatus, "scheduled")
    ) {
      return NextResponse.json(
        {
          error: "INVALID_STATE_TRANSITION",
          message: `Matter cannot transition from ${currentStatus || "unknown"} to scheduled.`,
          current_status: currentStatus || null,
          required_status: ["awaiting_payment", "payment_confirmed"],
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
            "Verified Wise settlement is required before scheduling can begin.",
        },
        { status: 402 },
      );
    }

    // Institutional documents: an unverified or lapsed route approval blocks progression. This only
    // adds a refusal after the checks above; it never satisfies the payment requirement.
    const institutionalRefusal = await institutionalRouteRefusal(supabase, String(deal.id));
    if (institutionalRefusal) return institutionalRefusal;

    const body = await req.json().catch(() => ({}));
    const scheduledAt =
      typeof body.scheduled_at === "string" && body.scheduled_at.trim()
        ? body.scheduled_at
        : typeof deal.scheduled_at === "string"
          ? deal.scheduled_at
          : null;
    const note = typeof body.notes === "string" ? body.notes.trim() : "";
    const nextNotes = note
      ? [typeof deal.notes === "string" ? deal.notes.trim() : "", note]
          .filter(Boolean)
          .join("\n")
      : deal.notes;
    const now = new Date().toISOString();

    let updateQuery = supabase
      .from("deals")
      .update({
        status: "scheduled",
        deal_status: "scheduled",
        scheduled_at: scheduledAt,
        notes: nextNotes,
        last_activity: now,
      })
      .eq("id", deal.id)
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
          error: "STALE_MATTER_STATE",
          message:
            "The Matter changed before scheduling completed. Refresh and retry; no scheduling state was fabricated.",
        },
        { status: 409 },
      );
    }

    void logActivity({
      deal_id: (updated.deal_id as string) ?? id,
      actor: user.email ?? user.id,
      action: "scheduled",
      detail: scheduledAt ? `Scheduled for ${scheduledAt}` : "Marked scheduled",
      meta: {
        scheduled_at: scheduledAt,
        payment_requirement_method: schedulingGate.paymentRequirementMethod,
        canonical_status: "scheduled",
      },
    }).catch((error) =>
      console.error("[activity] scheduling log failed:", error),
    );

    return NextResponse.json({ success: true, deal: updated });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
