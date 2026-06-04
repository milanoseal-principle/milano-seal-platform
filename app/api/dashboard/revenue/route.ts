import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const STAGE_MAP: Record<string, string> = {
  intake_received: "new_intake",
  intake_review: "new_intake",
  reviewed: "quote_needed",
  quote_pending: "quote_needed",
  invoice_sent: "invoice_sent",
  awaiting_payment: "payment_pending",
  completed: "closed_won",
  paid_and_released: "closed_won",
  cancelled: "closed_lost",
};

export async function GET() {
  try {
    await requireDashboardAccess();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  let deals: Array<Record<string, unknown>> = [];
  try {
    const { data } = await supabase
      .from("deals")
      .select(
        "id, display_id, deal_status, created_at, destination_country, amount_due, amount_paid, last_contact_at, completed_at, lost_reason"
      )
      .order("created_at", { ascending: false })
      .limit(500);
    deals = data ?? [];
  } catch {
    deals = [];
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  const pipeline: Record<string, Array<Record<string, unknown>>> = {
    new_intake: [],
    quote_needed: [],
    invoice_sent: [],
    payment_pending: [],
    follow_up_due: [],
    closed_won: [],
    closed_lost: [],
  };

  let pipeline_value = 0;
  let collected = 0;
  let won_this_month = 0;
  let lost_this_month = 0;

  for (const deal of deals) {
    const status = (deal.deal_status as string) ?? "";
    const stage = STAGE_MAP[status];

    if (stage) {
      const row: Record<string, unknown> = {
        id: deal.id,
        display_id: deal.display_id,
        deal_status: deal.deal_status,
      };

      if (stage === "new_intake") {
        row.created_at = deal.created_at;
        row.destination_country = deal.destination_country;
      } else if (stage === "invoice_sent") {
        row.amount_due = deal.amount_due;
      } else if (stage === "payment_pending") {
        row.amount_due = deal.amount_due;
        row.amount_paid = deal.amount_paid;
      } else if (stage === "closed_won") {
        row.amount_paid = deal.amount_paid;
        row.completed_at = deal.completed_at;
      } else if (stage === "closed_lost") {
        row.lost_reason = deal.lost_reason;
      }

      pipeline[stage].push(row);

      // Totals
      if (["new_intake", "quote_needed", "invoice_sent", "payment_pending"].includes(stage)) {
        pipeline_value += Number(deal.amount_due ?? 0);
      }
      if (stage === "closed_won") {
        collected += Number(deal.amount_paid ?? 0);
        if (deal.completed_at && new Date(deal.completed_at as string) >= startOfMonth) {
          won_this_month += Number(deal.amount_paid ?? 0);
        }
      }
      if (stage === "closed_lost") {
        if (deal.created_at && new Date(deal.created_at as string) >= startOfMonth) {
          lost_this_month++;
        }
      }
    }

    // Follow-up due: active matters with no update in 3+ days
    const activeStages = ["new_intake", "quote_needed", "invoice_sent", "payment_pending"];
    if (
      stage &&
      activeStages.includes(stage) &&
      deal.last_contact_at &&
      new Date(deal.last_contact_at as string) < threeDaysAgo
    ) {
      pipeline.follow_up_due.push({
        id: deal.id,
        display_id: deal.display_id,
        last_contact_at: deal.last_contact_at,
        deal_status: deal.deal_status,
      });
    }
  }

  return NextResponse.json({
    pipeline,
    totals: {
      pipeline_value,
      collected,
      won_this_month,
      lost_this_month,
    },
  });
}
