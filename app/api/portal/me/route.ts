import { NextRequest, NextResponse } from "next/server";
import { getAllClientDeals } from "@/lib/portalAuth";
import { getLedger } from "@/lib/custodyLedger";
import { PORTAL_BLOCKED_FIELDS } from "@/lib/portalProjection";

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

  // Strip any operator-only fields defensively before serializing
  const safeDeal = { ...activeDeal };
  for (const field of PORTAL_BLOCKED_FIELDS) {
    delete (safeDeal as Record<string, unknown>)[field];
  }

  const ledger = await getLedger(activeDeal.id);
  return NextResponse.json({ deals: ctx.deals, deal: safeDeal, ledger });
}
