import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEAL_STAGES, isClosedWon, isOpenStage } from "@/lib/stateMachine";
import { serializeDealMS } from "@/lib/milanoSerialize";

export const runtime = "nodejs";

export async function GET() {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("deals")
    .select("*")
    .order("created_at", { ascending: false });

  const deals = (data ?? []).map(serializeDealMS);

  const stages = DEAL_STAGES.map((stage) => {
    const stageDeals = deals.filter((d) => d.deal_status === stage);
    return {
      stage,
      count: stageDeals.length,
      total_value: stageDeals.reduce((s, d) => s + d.total_price, 0),
      deals: stageDeals.slice(0, 20),
    };
  });

  const total_open = deals.filter((d) => isOpenStage(d.deal_status)).length;
  const total_value_open = deals
    .filter((d) => isOpenStage(d.deal_status))
    .reduce((s, d) => s + d.total_price, 0);
  const total_value_closed = deals
    .filter((d) => isClosedWon(d.deal_status))
    .reduce((s, d) => s + d.total_price, 0);

  return NextResponse.json({
    stages,
    total_open,
    total_value_open,
    total_value_closed,
  });
}
