import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCommission, getCommissionSummary } from "@/lib/commissionEngine";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const partner_id = req.nextUrl.searchParams.get("partner_id") || undefined;
  const summary = await getCommissionSummary(partner_id);
  return NextResponse.json(summary);
}

export async function POST(req: NextRequest) {
  const { deal_id, partner_id, partner_name, partner_type } = await req.json();
  if (!deal_id || !partner_id || !partner_name) {
    return NextResponse.json(
      { error: "deal_id, partner_id, partner_name required" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { data: deal } = await supabase
    .from("deals")
    .select("amount")
    .eq("deal_id", deal_id)
    .single();
  if (!deal)
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });

  const result = await createCommission(
    deal_id,
    parseFloat(deal.amount),
    partner_id,
    partner_name,
    partner_type
  );
  if (!result.ok)
    return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json(result.commission);
}
