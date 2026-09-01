import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActivityForDeal } from "@/lib/activity";
import { isE2EDemoModeEnabled } from "@/lib/testing/e2eDemoMode";

export const runtime = "nodejs";

// Portal token is stored as access_token on the deals row.
// /portal/[token] queries deals.access_token directly.

export async function GET(_req: NextRequest) {
  if (!isE2EDemoModeEnabled()) {
    return NextResponse.json({ error: "E2E demo mode is not available." }, { status: 403 });
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
      "id, deal_id, status, payment_status, payment_amount_due, amount_due, payment_reference, payment_amount_received, discount_code_id, tracking_number, carrier, scheduled_at, execution_at, apostille_at, shipped_at, completed_at, invoice_status, wise_reference, assigned_lane, access_token",
    )
    .eq("deal_id", DEMO_REF)
    .maybeSingle();

  if (!deal) {
    return NextResponse.json({ exists: false, matter_ref: DEMO_REF });
  }

  const activity = await getActivityForDeal(deal.deal_id as string, 50);
  const accessToken = deal.access_token as string | null;

  return NextResponse.json({
    exists: true,
    matter_ref: DEMO_REF,
    deal,
    portal_token: accessToken,
    portal_path: accessToken ? `/portal/${accessToken}` : null,
    activity: activity ?? [],
  });
}
