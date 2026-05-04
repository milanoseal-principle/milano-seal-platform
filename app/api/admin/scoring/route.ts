import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { scoreDeal, scoreAllDeals } from "@/lib/scoringEngine";
import { isOpenStage } from "@/lib/stateMachine";
import { serializeDealMS } from "@/lib/milanoSerialize";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  if (!body.deal_id) {
    const result = await scoreAllDeals();
    return NextResponse.json(result);
  }

  const supabase = createAdminClient();
  const { data: deal } = await supabase
    .from("deals")
    .select("*")
    .eq("deal_id", body.deal_id)
    .single();
  if (!deal)
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });

  const scored = scoreDeal(deal);
  await supabase
    .from("deals")
    .update({ priority_score: scored.priority })
    .eq("deal_id", body.deal_id);

  return NextResponse.json({ deal_id: body.deal_id, ...scored });
}

export async function GET() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("deals")
    .select("*")
    .not("status", "in", '("completed","lost")')
    .limit(500);

  const rows = (data ?? []).map((row) => {
    const ms = serializeDealMS(row);
    const scored = scoreDeal(row);
    return {
      deal_id: ms.deal_id,
      client_name: ms.client_name,
      total_price: ms.total_price,
      deal_status: ms.deal_status,
      score: scored.score,
      factors: scored.signals.map((s) => ({
        label: s.replace(/:.*$/, "").trim(),
        weight: 0,
      })),
    };
  });

  return NextResponse.json(
    rows
      .filter((r) => isOpenStage(r.deal_status))
      .sort((a, b) => b.score - a.score)
  );
}
