import { NextRequest, NextResponse } from "next/server";
import { getAllClientDeals } from "@/lib/portalAuth";
import { getVaultDocumentsForMatter } from "@/lib/vault";

export const runtime = "nodejs";

// STORAGE-VAULT-01: Portal files endpoint — authenticates via Supabase session,
// returns documents with expiring signed URLs only. No raw storage paths returned.
export async function GET(req: NextRequest) {
  const ctx = await getAllClientDeals();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!ctx.deals.length) {
    return NextResponse.json({ files: [] });
  }

  const requestedDealId = req.nextUrl.searchParams.get("deal_id");
  const deal =
    (requestedDealId ? ctx.deals.find((d) => d.id === requestedDealId) : null) ??
    ctx.deals[0];

  if (!deal) {
    return NextResponse.json({ error: "Matter not found" }, { status: 404 });
  }

  const documents = await getVaultDocumentsForMatter(deal.id, ctx.email);

  return NextResponse.json({ files: documents });
}
