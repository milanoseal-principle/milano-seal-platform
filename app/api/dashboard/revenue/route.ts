import { evaluatePaymentGate } from '@/lib/payments/paymentGate';
import { readAllKeyset } from '@/lib/data/keyset';
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
    deals=await readAllKeyset<Record<string,unknown>>(async cursor=>{
      let query=supabase.from('deals').select('id,display_id,deal_status,created_at,destination_country,amount_due,amount_paid,payment_status,payment_confirmed,payment_settlement_status,currency,last_contact_at,completed_at,lost_reason').order('id').limit(250);
      if(cursor)query=query.gt('id',String(cursor.id));const result=await query;if(result.error)throw Error('REVENUE_READ_UNAVAILABLE');return result.data??[];
    },row=>String(row.id));
  } catch {return NextResponse.json({error:'REVENUE_NOT_VERIFIED',owner:'MILANO'},{status:503,headers:{'Cache-Control':'private, no-store'}});}
  if(new Set(deals.map(row=>row.currency)).size>1)return NextResponse.json({error:'MULTI_CURRENCY_TOTAL_REQUIRES_SCOPED_REPORT'},{status:409});

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
      if (stage === "closed_won" && evaluatePaymentGate({id:String(deal.id),payment_status:String(deal.payment_status??''),payment_confirmed:deal.payment_confirmed===true,payment_settlement_status:String(deal.payment_settlement_status??''),amount_due:deal.amount_due==null?null:Number(deal.amount_due),amount_paid:deal.amount_paid==null?null:Number(deal.amount_paid)})==='PAYMENT_CONFIRMED') {
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
