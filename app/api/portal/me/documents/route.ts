import { NextRequest, NextResponse } from "next/server";
import { getAllClientDeals } from "@/lib/portalAuth";
import { getVaultDocumentsForMatter } from "@/lib/vault";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const ctx = await getAllClientDeals();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!ctx.deals.length) {
    return NextResponse.json({ files: [] });
  }

  const dealId = req.nextUrl.searchParams.get("deal_id");
  const deal = dealId ? ctx.deals.find((d) => d.id === dealId) : ctx.deals[0];

  if (!deal) {
    return NextResponse.json({ error: "Matter not found" }, { status: 404 });
  }

  // STORAGE-VAULT-01: all document access goes through vault — signed URLs only,
  // storage_path is never returned to the client.
  const documents = await getVaultDocumentsForMatter(deal.id, ctx.email);

  return NextResponse.json({ files: documents });
}
