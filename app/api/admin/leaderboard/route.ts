import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isClosedWon, isOpenStage } from "@/lib/stateMachine";
import { serializeDealMS } from "@/lib/milanoSerialize";
import { requireOperator, isGuardFailure } from "@/lib/auth-guards";

export const runtime = "nodejs";

export async function GET() {
  const guard = await requireOperator();
  if (isGuardFailure(guard)) return guard.response;

  const supabase = createAdminClient();
  const { data } = await supabase.from("deals").select("*");

  const map = new Map<
    string,
    {
      assignee: string;
      deals_closed: number;
      deals_open: number;
      revenue: number;
    }
  >();

  for (const row of data ?? []) {
    const d = serializeDealMS(row);
    const who = (d.assignee ?? "").trim();
    if (!who) continue;
    const cur = map.get(who) ?? {
      assignee: who,
      deals_closed: 0,
      deals_open: 0,
      revenue: 0,
    };
    if (isClosedWon(d.deal_status)) {
      cur.deals_closed += 1;
      cur.revenue += d.total_price;
    } else if (isOpenStage(d.deal_status)) {
      cur.deals_open += 1;
    }
    map.set(who, cur);
  }

  return NextResponse.json(
    Array.from(map.values()).sort((a, b) => b.revenue - a.revenue)
  );
}
