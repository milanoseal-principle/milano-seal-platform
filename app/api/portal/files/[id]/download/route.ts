import { NextRequest, NextResponse } from "next/server";
import { getAllClientDeals } from "@/lib/portalAuth";
import { generateVaultSignedUrl } from "@/lib/vault";

export const runtime = "nodejs";

// STORAGE-VAULT-01: Single-document signed URL — 15-minute expiry, audited.
// Never returns storage paths. Access validated against session's deal scope.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getAllClientDeals();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: documentId } = await params;
  const dealId = req.nextUrl.searchParams.get("deal_id");
  const deal =
    (dealId ? ctx.deals.find((d) => d.id === dealId) : null) ?? ctx.deals[0];

  if (!deal) {
    return NextResponse.json({ error: "Matter not found" }, { status: 404 });
  }

  const result = await generateVaultSignedUrl(documentId, deal.id, ctx.email);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ url: result.url, expires_in: result.expires_in });
}
