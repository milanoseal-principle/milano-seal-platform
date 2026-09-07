import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveServerRole } from "@/lib/auth/server-role";
import { canTransition, normalizeMatterStatus } from "@/lib/stateMachine";
import { validateExecutionTruth } from "@/lib/matter/executionTruth";
import { evaluateSchedulingGate } from "@/lib/scheduling/complimentarySchedulingGate";
import { logActivity } from "@/lib/activity";

export const runtime = "nodejs";

const VALID_STATUSES = [
  "intake_received",
  "under_review",
  "quoted",
  "awaiting_payment",
  "scheduled",
  "in_execution",
  "apostille_processing",
  "in_transit",
  "delivered",
  "completed",
] as const;

type MatterStatus = (typeof VALID_STATUSES)[number];

const DEDICATED_TRANSITIONS = new Set<MatterStatus>([
  "scheduled",
  "in_execution",
  "apostille_processing",
]);
const EXECUTION_GATED = new Set<MatterStatus>([
  "apostille_processing",
  "in_transit",
  "delivered",
  "completed",
]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  }

  const role = await resolveServerRole(user);
  if (role !== "founder_admin") {
    return NextResponse.json({ ok: false, code: "FOUNDER_ONLY" }, { status: 403 });
  }

  if (!id) {
    return NextResponse.json({ ok: false, code: "MISSING_MATTER_ID" }, { status: 422 });
  }

  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, code: "INVALID_JSON" }, { status: 400 });
  }

  const status = body.status as MatterStatus;
  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { ok: false, code: "INVALID_STATUS", allowed: VALID_STATUSES },
      { status: 422 },
    );
  }

  if (DEDICATED_TRANSITIONS.has(status)) {
    const messages: Record<MatterStatus, string> = {
      intake_received: "",
      under_review: "",
      quoted: "",
      awaiting_payment: "",
      scheduled: "Use the canonical scheduling action for this transition.",
      in_execution: "Use the canonical execution action for this transition.",
      apostille_processing:
        "Use the governed RON Apostille QA action for this transition.",
      in_transit: "",
      delivered: "",
      completed: "",
    };

    return NextResponse.json(
      {
        ok: false,
        code: "USE_GOVERNED_TRANSITION_ENDPOINT",
        message: messages[status],
      },
      { status: 409 },
    );
  }

  const admin = createAdminClient();
  const { data: matter, error: matterError } = await admin
    .from("deals")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (matterError || !matter) {
    return NextResponse.json({ ok: false, code: "MATTER_NOT_FOUND" }, { status: 404 });
  }

  if (
    status === "apostille_processing" &&
    matter.execution_truth?.execution_method === "ron"
  ) {
    return NextResponse.json(
      {
        ok: false,
        code: "USE_GOVERNED_RON_APOSTILLE_QA",
        message: "RON Matters must use the session Apostille QA endpoint.",
      },
      { status: 409 },
    );
  }

  const currentRaw = String(matter.deal_status ?? matter.status ?? "");
  const current = normalizeMatterStatus(currentRaw);
  if (!current || !canTransition(currentRaw, status) || current === status) {
    return NextResponse.json(
      {
        ok: false,
        code: "INVALID_STATE_TRANSITION",
        current_status: currentRaw || null,
        requested_status: status,
      },
      { status: 409 },
    );
  }

  if (EXECUTION_GATED.has(status)) {
    const executionTruth = matter.execution_truth;
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
          ok: false,
          code: "EXECUTION_REVIEW_REQUIRED",
          remaining: executionValidation.errors,
        },
        { status: 409 },
      );
    }

    const paymentGate = evaluateSchedulingGate({ matter });
    if (!paymentGate.schedulingEligible) {
      return NextResponse.json(
        {
          ok: false,
          code: "PAYMENT_REQUIRED",
          paymentRequirementMethod: paymentGate.paymentRequirementMethod,
        },
        { status: 402 },
      );
    }
  }

  const actorEmail = user.email ?? user.id;
  const now = new Date().toISOString();
  const timestamps: Partial<Record<MatterStatus, Record<string, string>>> = {
    apostille_processing: { apostille_at: now },
    in_transit: { shipped_at: now, delivery_at: now },
    delivered: { delivered_at: now },
    completed: { completed_at: now },
  };

  let updateQuery = admin
    .from("deals")
    .update({
      status,
      deal_status: status,
      last_activity: now,
      ...(timestamps[status] ?? {}),
    })
    .eq("id", id)
    .eq("status", matter.status);

  updateQuery =
    matter.deal_status == null
      ? updateQuery.is("deal_status", null)
      : updateQuery.eq("deal_status", matter.deal_status);

  const { data: updated, error } = await updateQuery.select("id").maybeSingle();

  if (error || !updated) {
    return NextResponse.json(
      {
        ok: false,
        code: "STALE_MATTER_STATE",
        message: "Matter state changed before the transition completed. Refresh and retry.",
      },
      { status: 409 },
    );
  }

  try {
    await logActivity({
      deal_id: matter.deal_id ?? id,
      actor: actorEmail,
      action: "status_advanced",
      detail: `Matter status advanced to ${status}.`,
      meta: { actor: actorEmail, status, timestamp: now },
    });
  } catch {}

  return NextResponse.json({ ok: true, status });
}
