import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveServerRole } from "@/lib/auth/server-role";
import { canPerformProtectedMatterTransition } from "@/lib/auth/protectedMatterTransitions";
import { normalizeExecutionTruth } from "@/lib/matter/executionTruth";
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

  const nextTruth = normalizeExecutionTruth({
    ...currentTruth,
    notarial_act: notarialAct,
  });
  const now = new Date().toISOString();

  let updateQuery = supabase
    .from("deals")
    .update({
      execution_truth: nextTruth,
      last_activity: now,
      updated_at: now,
    })
    .eq("id", matter.id);

  updateQuery = matter.updated_at
    ? updateQuery.eq("updated_at", matter.updated_at)
    : updateQuery.is("updated_at", null);

  const { data: updated, error: updateError } = await updateQuery
    .select("id, deal_id, execution_truth, updated_at")
    .maybeSingle();

  if (updateError || !updated) {
    return NextResponse.json(
      {
        error: "STALE_MATTER_STATE",
        message:
          "The Matter changed before the notarial act was saved. Refresh and confirm again; no execution truth was overwritten.",
      },
      { status: 409 },
    );
  }

  void logActivity({
    deal_id: updated.deal_id ?? id,
    actor: user.email ?? user.id,
    action: "execution_truth_notarial_act_confirmed",
    detail: `Notarial act confirmed: ${notarialAct}`,
    meta: {
      notarial_act: notarialAct,
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
