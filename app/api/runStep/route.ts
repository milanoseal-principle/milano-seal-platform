import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requirePaid, validateTransition } from "@/lib/gate";
import { canTransition } from "@/lib/stateMachine";
import { logActivity } from "@/lib/activity";
import { appendLedger, CUSTODY_EVENTS } from "@/lib/custodyLedger";
import { sendAdminAlert } from "@/lib/whatsapp";
import { enforceRules, RuleViolation } from "@/lib/core/enforceRules";
import { uploadEvidencePacket } from "@/lib/evidenceStorage";
import { snapshotDeal } from "@/lib/dealBackup";
import { institutionalRouteRefusal } from "@/lib/institutional/executionGate";

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
      { status: 400 },
    );
  }

  if (!STEP_TRANSITIONS[step]) {
    return NextResponse.json(
      { error: `Invalid step: ${step}` },
      { status: 400 },
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
  try {
    requirePaid(deal);
  } catch {
    return NextResponse.json(
      { error: "Payment must be confirmed before advancing this step.", code: "PAYMENT_REQUIRED" },
      { status: 402 },
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
      { status: 409 },
    );
  }

  try {
    enforceRules(deal, to);
  } catch (err) {
    if (err instanceof RuleViolation) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 409 },
      );
    }
    throw err;
  }

  const institutionalRefusal = await institutionalRouteRefusal(supabase, String(deal.id));
  if (institutionalRefusal) return institutionalRefusal;

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
      { status: 500 },
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

  void (async () => {
    if (!deal?.id) return;
    try {
      const actorEmail = await (async () => {
        try {
          const ssr = await createClient();
          const {
            data: { user },
          } = await ssr.auth.getUser();
          return user?.email ?? "operator";
        } catch {
          return "operator";
        }
      })();

      if (step === "execution") {
        await appendLedger({
          deal_id: deal.id,
          event: CUSTODY_EVENTS.DOC_NOTARIZED,
          actor_type: "notary",
          actor_id: actorEmail,
          location: deal.mobile
            ? "Mobile Notarization"
            : "Remote Online Notary",
          method: "notarization",
          status: "in_possession",
          metadata: { deal_code: deal_id },
        });
        await appendLedger({
          deal_id: deal.id,
          event: CUSTODY_EVENTS.DOC_APOSTILLE_SUBMITTED,
          actor_type: "operator",
          actor_id: actorEmail,
          location: "FL Department of State",
          method: "handoff",
          status: "transferred",
          metadata: { deal_code: deal_id },
        });
      }

      if (step === "apostille") {
        await appendLedger({
          deal_id: deal.id,
          event: CUSTODY_EVENTS.DOC_APOSTILLE_RECEIVED,
          actor_type: "state",
          location: "FL Department of State",
          method: "pickup",
          status: "in_possession",
          metadata: { deal_code: deal_id },
        });
      }

      if (step === "delivery") {
        await appendLedger({
          deal_id: deal.id,
          event: CUSTODY_EVENTS.DOC_RELEASE_CONFIRMED,
          actor_type: "system",
          location: "Destination",
          method: "delivery",
          status: "released",
          metadata: { deal_code: deal_id },
        });
      }
    } catch (err) {
      console.error(
        "[runStep] custody ledger failed:",
        err instanceof Error ? err.message : err,
      );
    }

    try {
      if (step === "execution") {
        await snapshotDeal({
          deal_id: deal.id,
          trigger: "shipment",
          deal,
        });
      } else if (step === "apostille") {
        await snapshotDeal({
          deal_id: deal.id,
          trigger: "delivery",
          deal,
        });
      } else if (step === "delivery") {
        await snapshotDeal({
          deal_id: deal.id,
          trigger: "completion",
          deal,
        });
        await uploadEvidencePacket(deal.id);
      }
    } catch (err) {
      console.error(
        "[runStep] snapshot/evidence failed:",
        err instanceof Error ? err.message : err,
      );
    }
  })();

  void sendAdminAlert(`Deal ${deal_id} moved to ${to}`).catch(() => {});

  return NextResponse.json({
    ok: true,
    deal_id,
    step,
    from,
    to,
    timestamp: new Date().toISOString(),
  });
}
