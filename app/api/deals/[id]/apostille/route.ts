import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { evaluateSchedulingGate } from "@/lib/scheduling/complimentarySchedulingGate";
import { validateExecutionTruth } from "@/lib/matter/executionTruth";
import { assertCanAdvanceToApostille, RONGuardError } from "@/lib/bluenotary/guards";
import { logActivity } from "@/lib/activity";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await requireDashboardAccess();
    const admin = createAdminClient();

    const { data: deal, error: dealError } = await admin
      .from("deals")
      .select("*")
      .eq("id", id)
      .single();

    if (dealError || !deal) {
      return NextResponse.json({ ok: false, code: "MATTER_NOT_FOUND" }, { status: 404 });
    }

    const current = String(deal.deal_status ?? deal.status ?? "");
    if (current !== "in_execution") {
      return NextResponse.json(
        {
          ok: false,
          code: "INVALID_STATE_TRANSITION",
          current_status: current || null,
          requested_status: "apostille_processing",
        },
        { status: 409 }
      );
    }

    const executionValidation = deal.execution_truth && typeof deal.execution_truth === "object"
      ? validateExecutionTruth(deal.execution_truth)
      : { valid: false, reviewRequired: true, errors: ["EXECUTION_TRUTH_MISSING"] };

    if (!executionValidation.valid || executionValidation.reviewRequired) {
      return NextResponse.json(
        { ok: false, code: "EXECUTION_REVIEW_REQUIRED", remaining: executionValidation.errors },
        { status: 409 }
      );
    }

    const paymentGate = evaluateSchedulingGate({ matter: deal });
    if (!paymentGate.schedulingEligible) {
      return NextResponse.json(
        { ok: false, code: "PAYMENT_REQUIRED", paymentRequirementMethod: paymentGate.paymentRequirementMethod },
        { status: 402 }
      );
    }

    const { data: ronSession } = await admin
      .from("ron_sessions")
      .select("id, milano_ron_status")
      .eq("matter_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (ronSession) {
      await assertCanAdvanceToApostille(admin, id, ronSession.id);
    }

    const body = await req.json().catch(() => ({}));
    const now = new Date().toISOString();
    let update = admin
      .from("deals")
      .update({
        status: "apostille_processing",
        deal_status: "apostille_processing",
        apostille_at: now,
        last_activity: now,
        ...(body.execution_date ? { execution_date: body.execution_date } : {}),
      })
      .eq("id", id)
      .eq("status", deal.status);

    update = deal.deal_status == null
      ? update.is("deal_status", null)
      : update.eq("deal_status", deal.deal_status);

    const { data: updated, error: updateError } = await update.select().maybeSingle();
    if (updateError || !updated) {
      return NextResponse.json(
        { ok: false, code: "STALE_MATTER_STATE" },
        { status: 409 }
      );
    }

    if (ronSession?.milano_ron_status === "SIGNED_DOCS_RETRIEVED") {
      await admin
        .from("ron_sessions")
        .update({ milano_ron_status: "READY_FOR_APOSTILLE", updated_at: now })
        .eq("id", ronSession.id)
        .eq("milano_ron_status", "SIGNED_DOCS_RETRIEVED");
    }

    await logActivity({
      deal_id: (updated.deal_id as string) ?? id,
      actor: userId,
      action: "apostille_processing",
      detail: "Matter advanced to governed apostille/authentication processing.",
    });

    return NextResponse.json({ ok: true, status: "apostille_processing", deal: updated });
  } catch (error) {
    if (error instanceof RONGuardError) {
      return NextResponse.json(
        { ok: false, code: error.code, error: error.message },
        { status: 409 }
      );
    }
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message.includes("Unauthorized") || message.includes("access_denied")) {
      return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
    }
    console.error("[apostille transition]", message);
    return NextResponse.json({ ok: false, code: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
