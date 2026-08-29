import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendOperatorIntakeAlerts,
  sendPaymentObservedAlerts,
  sendPaymentClearedAlerts,
} from "@/lib/notifications/transactionalEmailAlerts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const bearer = req.headers.get("authorization");
  const legacy = req.headers.get("x-cron-secret");
  return bearer === `Bearer ${expected}` || legacy === expected;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const { data, error } = await admin
    .from("deals")
    .select("id,deal_id,client_name,email,document_type,destination_country,final_total,amount_due,amount_paid,currency,payment_status,payment_confirmed,payment_observed_at,payment_confirmed_at,created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(250);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const summary = { scanned: 0, intake: 0, observed: 0, cleared: 0 };

  for (const row of data ?? []) {
    summary.scanned += 1;
    const matterId = String(row.id);
    const matterReference = String(row.deal_id ?? row.id);
    const currency = String(row.currency ?? "USD");

    await sendOperatorIntakeAlerts({
      matterId,
      matterReference,
      clientName: row.client_name,
      clientEmail: row.email,
      documentType: row.document_type,
      destination: row.destination_country,
      finalTotal: Number(row.final_total ?? 0),
      amountDue: Number(row.amount_due ?? 0),
      currency,
    });
    summary.intake += 1;

    if (row.payment_observed_at && !row.payment_confirmed) {
      await sendPaymentObservedAlerts({
        matterId,
        matterReference,
        clientName: row.client_name,
        clientEmail: row.email,
        amountDue: Number(row.amount_due ?? 0),
        currency,
      });
      summary.observed += 1;
    }

    const paid = Boolean(row.payment_confirmed) || String(row.payment_status ?? "").toLowerCase() === "paid";
    if (paid) {
      await sendPaymentClearedAlerts({
        matterId,
        matterReference,
        clientEmail: row.email,
        amountPaid: Number(row.amount_paid ?? row.amount_due ?? 0),
        currency,
      });
      summary.cleared += 1;
    }
  }

  return NextResponse.json({ success: true, ...summary });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
