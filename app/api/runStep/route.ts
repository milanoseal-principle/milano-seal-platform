import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requirePaid, validateTransition } from "@/lib/gate";
import { canTransition } from "@/lib/stateMachine";
import { logActivity } from "@/lib/activity";

export const runtime = "nodejs";

type Step = "schedule" | "execution" | "apostille" | "delivery";

const STEP_TRANSITIONS: Record<Step, { from: string; to: string }> = {
  schedule: { from: "scheduled", to: "in_execution" },
  execution: { from: "in_execution", to: "apostille" },
  apostille: { from: "apostille", to: "delivery" },
  delivery: { from: "delivery", to: "completed" },
};

export async function POST(req: NextRequest) {
  let body: { deal_id: string; step: Step };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { deal_id, step } = body;

  if (!deal_id || !step) {
    return NextResponse.json(
      { error: "deal_id and step required" },
      { status: 400 }
    );
  }

  if (!STEP_TRANSITIONS[step]) {
    return NextResponse.json(
      { error: `Invalid step: ${step}` },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // Fetch deal
  const { data: deal, error: fetchError } = await supabase
    .from("deals")
    .select("*")
    .eq("deal_id", deal_id)
    .single();

  if (fetchError || !deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  // Gate: must be paid before any step
  const paidCheck = requirePaid(deal);
  if (!paidCheck.ok) {
    return NextResponse.json(
      { error: paidCheck.message, code: "PAYMENT_REQUIRED" },
      { status: 402 }
    );
  }

  const { from, to } = STEP_TRANSITIONS[step];

  // Idempotency: if already past this step, return success (no duplicate run)
  const statusOrder = [
    "new",
    "reviewing",
    "quoted",
    "awaiting_payment",
    "scheduled",
    "in_execution",
    "apostille",
    "delivery",
    "completed",
  ];
  const currentIdx = statusOrder.indexOf(deal.status);
  const toIdx = statusOrder.indexOf(to);

  if (currentIdx >= toIdx) {
    return NextResponse.json({
      ok: true,
      idempotent: true,
      message: `Step "${step}" already completed — current status: ${deal.status}`,
      deal_id,
      status: deal.status,
    });
  }

  // Must be in correct "from" state — enforced by global state machine
  if (deal.status !== from || !canTransition(deal.status, to)) {
    return NextResponse.json(
      {
        error: `Invalid transition: "${deal.status}" → "${to}"`,
        code: "INVALID_TRANSITION",
      },
      { status: 409 }
    );
  }

  // Execute transition
  const updatePayload: Record<string, any> = {
    status: to,
    [`${step}_at`]: new Date().toISOString(),
  };

  if (step === "delivery") {
    updatePayload.completed_at = new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from("deals")
    .update(updatePayload)
    .eq("deal_id", deal_id)
    .eq("status", from); // optimistic lock — prevents race condition duplicate runs

  if (updateError) {
    return NextResponse.json(
      { error: "Transition failed", detail: updateError.message },
      { status: 500 }
    );
  }

  void (async () => {
    const ssr = await createClient();
    const {
      data: { user },
    } = await ssr.auth.getUser();
    await logActivity({
      deal_id,
      actor: user?.email ?? "admin",
      action:
        to === "completed"
          ? "completed"
          : to === "apostille"
          ? "apostille"
          : to === "in_execution"
          ? "executed"
          : "stage_advanced",
      detail: `${from} → ${to}`,
      meta: { step, from, to },
    });
  })();

  return NextResponse.json({
    ok: true,
    deal_id,
    step,
    from,
    to,
    timestamp: new Date().toISOString(),
  });
}
