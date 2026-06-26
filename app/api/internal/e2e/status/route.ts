import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActivityForDeal } from "@/lib/activity";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (process.env.MILANO_E2E_DEMO_MODE !== "true") {
    return NextResponse.json({ error: "E2E demo mode is not enabled." }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const year = new Date().getFullYear();
  const DEMO_REF = `MS-DEMO-${year}-000001`;

  const admin = createAdminClient();
  const { data: deal } = await admin
    .from("deals")
    .select(
      "id, deal_id, status, payment_status, payment_amount_due, amount_due, payment_reference, payment_amount_received, discount_code_id, tracking_number, carrier, scheduled_at, execution_at, apostille_at, shipped_at, completed_at, invoice_status, wise_reference, assigned_lane",
    )
    .eq("deal_id", DEMO_REF)
    .maybeSingle();

  if (!deal) {
    return NextResponse.json({ exists: false, matter_ref: DEMO_REF });
  }

  const activity = await getActivityForDeal(deal.deal_id as string, 50);

  // Portal token
  const { data: portalToken } = await admin
    .from("portal_tokens")
    .select("token")
    .eq("deal_id", deal.id)
    .maybeSingle();

  return NextResponse.json({
    exists: true,
    matter_ref: DEMO_REF,
    deal,
    portal_token: portalToken?.token ?? null,
    activity: activity ?? [],
  });
}
