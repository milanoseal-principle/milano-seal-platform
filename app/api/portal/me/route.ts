import { NextRequest, NextResponse } from "next/server";
import { getAllClientDeals } from "@/lib/portalAuth";
import { getLedger } from "@/lib/custodyLedger";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const ctx = await getAllClientDeals();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!ctx.deals.length) {
    return NextResponse.json({
      deals: [],
      deal: null,
      ledger: [],
      message: `No matter is linked to ${ctx.email} yet. Contact your coordinator if you believe this is a mistake.`,
    });
  }

  const dealId = req.nextUrl.searchParams.get("deal_id");
  const activeDeal =
    (dealId ? ctx.deals.find((d) => d.id === dealId) : null) ?? ctx.deals[0];

  const ledger = await getLedger(activeDeal.id);
  return NextResponse.json({ deals: ctx.deals, deal: activeDeal, ledger });
}
