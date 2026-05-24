import { NextRequest, NextResponse } from "next/server";
import { getCurrentClientDeal } from "@/lib/portalAuth";
import { track } from "@/lib/shippo";
import { refreshEvidenceSignedUrl } from "@/lib/evidenceStorage";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const dealId = req.nextUrl.searchParams.get("deal_id");
  const ctx = await getCurrentClientDeal(dealId);
  if (!ctx)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ctx.deal) return NextResponse.json({ tracking: null });

  const d = ctx.deal;
  if (!d.tracking_number || !d.carrier) {
    return NextResponse.json({
      tracking: null,
      summary: {
        carrier: null,
        tracking_number: null,
        status: d.status,
        delivery_status: d.delivery_status,
      },
    });
  }

  let live = null;
  try {
    live = await track(d.carrier, d.tracking_number);
  } catch (err) {
    console.error(
      "[portal/tracking] Shippo pull failed:",
      err instanceof Error ? err.message : err,
    );
  }

  let evidence_signed_url: string | null = null;
  if (d.evidence_path) {
    try {
      evidence_signed_url = await refreshEvidenceSignedUrl(d.id);
    } catch {}
  }

  // STORAGE-VAULT-01: label_url (carrier packing slip) is internal-only.
  // evidence_url returned as a signed URL only; evidence_path never exposed.
  return NextResponse.json({
    tracking: {
      carrier: d.carrier,
      tracking_number: d.tracking_number,
      delivery_status: d.delivery_status,
      delivery_eta: d.delivery_eta,
      delivery_timestamp: d.delivery_timestamp,
      signed_by: d.signed_by,
      evidence_url: evidence_signed_url,
      evidence_generated_at: d.evidence_generated_at,
      live,
    },
  });
}
