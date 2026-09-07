import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveServerRole } from "@/lib/auth/server-role";
import { canPerformProtectedMatterTransition } from "@/lib/auth/protectedMatterTransitions";
import { logActivity } from "@/lib/activity";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const RESOLVED_NOTARIAL_ACTS = new Set([
  "acknowledgment",
  "jurat",
  "oath_affirmation",
  "signature_witnessing",
  "other",
]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const body = (await req.json().catch(() => ({}))) as {
    notarial_act?: unknown;
  };
  const notarialAct = String(body.notarial_act ?? "").trim().toLowerCase();

  if (!RESOLVED_NOTARIAL_ACTS.has(notarialAct)) {
    return NextResponse.json(
      {
        error: "INVALID_NOTARIAL_ACT",
        message:
          "Choose a confirmed notarial act. Review-required and unknown values cannot clear the execution gate.",
      },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const baseQuery = supabase
    .from("deals")
    .select("id, deal_id, execution_truth, updated_at");
  const { data: matter, error: fetchError } = UUID_RE.test(id)
    ? await baseQuery.or(`id.eq.${id},deal_id.eq.${id}`).maybeSingle()
    : await baseQuery.eq("deal_id", id).maybeSingle();

  if (fetchError || !matter) {
    return NextResponse.json({ error: "MATTER_NOT_FOUND" }, { status: 404 });
  }

  const currentTruth =
    matter.execution_truth && typeof matter.execution_truth === "object"
      ? (matter.execution_truth as Record<string, unknown>)
      : {};
  const priorNotarialAct = String(
    currentTruth.notarial_act ?? "review_required",
  );

  const now = new Date().toISOString();

  const { data: transition, error: updateError } = await supabase.rpc(
    "confirm_matter_notarial_act",
    {
      p_matter_id: matter.id,
      p_expected_updated_at: matter.updated_at,
      p_notarial_act: notarialAct,
      p_actor_id: user.id,
      p_occurred_at: now,
      p_source: "operator_execution_readiness",
      p_reason:
        "Operator confirmed the required notarial act from the Matter package or authoritative execution instructions.",
    },
  );
  const result = Array.isArray(transition) ? transition[0] : transition;
  const updated = result?.matter;

  if (updateError?.code === "40001") {
    return NextResponse.json(
      {
        error: "STALE_MATTER_STATE",
        message:
          "The Matter changed before the notarial act was saved. Refresh and confirm again; no execution truth was overwritten.",
      },
      { status: 409 },
    );
  }
  if (updateError || !updated) {
    console.error(
      "[execution-truth] Atomic notarial transition failed:",
      updateError?.code ?? "missing_result",
    );
    return NextResponse.json(
      { error: "NOTARIAL_ACT_PERSISTENCE_FAILED" },
      { status: 500 },
    );
  }

  void logActivity({
    deal_id: updated.deal_id ?? id,
    actor: user.email ?? user.id,
    action: "execution_truth_notarial_act_confirmed",
    detail: `Notarial act confirmed: ${notarialAct}`,
    meta: {
      notarial_act: notarialAct,
      previous_notarial_act: priorNotarialAct,
      source: "operator_execution_readiness",
    },
  }).catch((error) =>
    console.error("[activity] notarial act confirmation log failed:", error),
  );

  return NextResponse.json({
    success: true,
    matter: updated,
    notarial_act: notarialAct,
  });
}
