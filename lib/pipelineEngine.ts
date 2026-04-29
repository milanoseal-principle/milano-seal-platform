import { createAdminClient } from "@/lib/supabase/admin";
import { canTransition } from "@/lib/stateMachine";

const VALID_STAGES = [
  "new",
  "reviewing",
  "quoted",
  "awaiting_payment",
  "scheduled",
  "in_execution",
  "apostille",
  "shipped",
  "completed",
  "lost",
];

export async function moveDeal(
  deal_id: string,
  stage: string
): Promise<{ ok: boolean; error?: string }> {
  if (!VALID_STAGES.includes(stage))
    return { ok: false, error: `Invalid stage: ${stage}` };

  const supabase = createAdminClient();

  const { data: deal, error: fetchErr } = await supabase
    .from("deals")
    .select("status, payment_status")
    .eq("deal_id", deal_id)
    .single();

  if (fetchErr || !deal) return { ok: false, error: "Deal not found" };

  // Enforce payment gate — cannot move past awaiting_payment without payment
  const gatedStages = [
    "scheduled",
    "in_execution",
    "apostille",
    "shipped",
    "completed",
  ];
  if (gatedStages.includes(stage) && deal.payment_status !== "paid") {
    return {
      ok: false,
      error: "Payment required before advancing to this stage",
    };
  }

  // Enforce state machine
  if (!canTransition(deal.status, stage) && deal.status !== stage) {
    return {
      ok: false,
      error: `Invalid transition: ${deal.status} → ${stage}`,
    };
  }

  const { error: updateErr } = await supabase
    .from("deals")
    .update({ status: stage, last_activity: new Date().toISOString() })
    .eq("deal_id", deal_id);

  if (updateErr) return { ok: false, error: updateErr.message };
  return { ok: true };
}

export async function getPipeline() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("deals")
    .select(
      "deal_id, client_name, status, payment_status, execution_tier, amount, country, destination_country, document_type, use_case, created_at, priority_score, priority_tier, conversion_score, sla_deadline, last_activity, has_messages"
    )
    .order("conversion_score", { ascending: false, nullsFirst: false })
    .limit(200);
  return data || [];
}
