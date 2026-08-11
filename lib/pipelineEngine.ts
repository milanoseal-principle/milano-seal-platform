import { createAdminClient } from "@/lib/supabase/admin";
import { canTransition } from "@/lib/stateMachine";
import { createWisePaymentRequest } from "@/lib/wise";
import { logActivity } from "@/lib/activity";
import { validateExecutionTruth } from "@/lib/matter/executionTruth";
import { evaluateSchedulingGate } from "@/lib/scheduling/complimentarySchedulingGate";

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

const HALTED_PAYMENT_STATUSES = ["refunded", "disputed", "failed"];

export async function moveDeal(
  deal_id: string,
  stage: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!VALID_STAGES.includes(stage))
    return { ok: false, error: `Invalid stage: ${stage}` };

  const supabase = createAdminClient();

  const { data: deal, error: fetchErr } = await supabase
    .from("deals")
    .select(
      "id, deal_id, status, payment_status, amount_due, amount_paid, verified_revenue, payment_disposition, comp_authorized, comp_authorization_id, comp_authorized_at, comp_revoked_at, execution_truth, invoice_balance, balance_payment_link, balance_payment_status, client_name, email, document_type, country, amount",
    )
    .eq("deal_id", deal_id)
    .single();

  if (fetchErr || !deal) return { ok: false, error: "Deal not found" };

  if (
    stage !== "lost" &&
    HALTED_PAYMENT_STATUSES.includes(deal.payment_status)
  ) {
    return {
      ok: false,
      error: `Payment status is ${deal.payment_status} — resolve before advancing.`,
    };
  }

  const gatedStages = [
    "scheduled",
    "in_execution",
    "apostille",
    "shipped",
    "completed",
  ];

  if (gatedStages.includes(stage)) {
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
      return {
        ok: false,
        error: `EXECUTION_REVIEW_REQUIRED: ${executionValidation.errors.join(", ")}`,
      };
    }

    const schedulingGate = evaluateSchedulingGate({ matter: deal });
    if (!schedulingGate.schedulingEligible) {
      return {
        ok: false,
        error:
          "Payment required before advancing to this stage — verified Wise settlement or an active Complimentary Authorization is required.",
      };
    }
  }

  // Enforce state machine
  if (!canTransition(deal.status, stage) && deal.status !== stage) {
    return {
      ok: false,
      error: `Invalid transition: ${deal.status} → ${stage}`,
    };
  }

  const now = new Date().toISOString();
  const stageTimestamps: Record<string, Record<string, string>> = {
    in_execution: { execution_at: now, executed_at: now },
    apostille: { apostille_at: now },
    shipped: { shipped_at: now, delivery_at: now },
    completed: { completed_at: now },
  };

  const { error: updateErr } = await supabase
    .from("deals")
    .update({
      status: stage,
      deal_status: stage,
      last_activity: now,
      ...stageTimestamps[stage],
    })
    .eq("deal_id", deal_id);

  if (updateErr) return { ok: false, error: updateErr.message };

  if (
    stage === "shipped" &&
    Number(deal.invoice_balance ?? 0) > 0 &&
    !deal.balance_payment_link
  ) {
    void issueBalanceInvoice(deal_id, deal).catch((err) => {
      // Non-fatal — operator can retry manually if Wise call failed
      console.error("[pipelineEngine] balance invoice failed:", err);
    });
  }

  return { ok: true };
}

interface DealForBalance {
  invoice_balance?: number | null;
  client_name?: string | null;
  email?: string | null;
  document_type?: string | null;
  country?: string | null;
}

async function issueBalanceInvoice(
  deal_id: string,
  deal: DealForBalance,
): Promise<void> {
  const supabase = createAdminClient();
  const balance = Number(deal.invoice_balance ?? 0);
  if (!balance) return;

  const wise = await createWisePaymentRequest({
    dealId: `${deal_id}-BAL`,
    amount: balance,
    currency: "USD",
    description: `The Milano Seal™ — Balance · ${
      deal.document_type || "Document"
    } · ${deal.country || ""}`,
    clientName: deal.client_name ?? null,
    clientEmail: deal.email ?? null,
  });

  await supabase
    .from("deals")
    .update({
      balance_payment_link: wise.url,
      balance_payment_id: wise.id,
      balance_payment_status: "pending",
      balance_invoiced_at: new Date().toISOString(),
    })
    .eq("deal_id", deal_id);

  await logActivity({
    deal_id,
    actor: "system",
    action: "payment_updated",
    detail: `Balance invoice generated · $${balance} via Wise (${wise.mode})`,
    meta: {
      status: "balance_invoiced",
      amount: balance,
      wise_mode: wise.mode,
      wise_id: wise.id,
    },
  });
}

export async function getPipeline() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("deals")
    .select(
      "deal_id, client_name, status, payment_status, execution_tier, amount, country, destination_country, document_type, use_case, created_at, priority_score, priority_tier, conversion_score, sla_deadline, last_activity, has_messages",
    )
    .order("conversion_score", { ascending: false, nullsFirst: false })
    .limit(200);
  return data || [];
}