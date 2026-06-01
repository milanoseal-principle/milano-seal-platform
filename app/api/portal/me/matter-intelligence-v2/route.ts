import { NextRequest, NextResponse } from "next/server";
import { getAllClientDeals } from "@/lib/portalAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeMatterIntelligence, toClientMatterIntelligence } from "@/lib/matterIntelligence";
import type { MatterIntelligenceInput } from "@/lib/matterIntelligence";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const ctx = await getAllClientDeals();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!ctx.deals.length) {
    return NextResponse.json({ intelligence: null });
  }

  const deal = ctx.deals[0];
  const d = deal as unknown as Record<string, unknown>;

  // Fetch additional deal fields not included in PortalDeal via admin client
  // receiving_authority_slug, is_paid_and_released, scheduled_at may not be in the base select
  let receivingAuthoritySlug: string | null = null;
  let isPaidAndReleased = false;
  let scheduledAt: string | null = null;
  let courierTrackingStatus: string | null = null;
  let matterStatus: string | null = (d.status as string | null) ?? null;

  try {
    const admin = createAdminClient();
    const { data: extra } = await admin
      .from("deals")
      .select(
        "receiving_authority_slug, is_paid_and_released, scheduled_at, courier_tracking_status, matter_status",
      )
      .eq("id", deal.id)
      .single();

    if (extra) {
      receivingAuthoritySlug =
        (extra as Record<string, unknown>).receiving_authority_slug as string | null ?? null;
      isPaidAndReleased = !!(extra as Record<string, unknown>).is_paid_and_released;
      scheduledAt = (extra as Record<string, unknown>).scheduled_at as string | null ?? null;
      courierTrackingStatus =
        (extra as Record<string, unknown>).courier_tracking_status as string | null ?? null;
      matterStatus =
        (extra as Record<string, unknown>).matter_status as string | null ?? matterStatus;
    }
  } catch {
    // If these columns don't exist yet, fall back to what we have
  }

  const countryId = (deal.country ?? deal.destination_country ?? "").toLowerCase().replace(/\s+/g, "-");
  const documentId = (deal.document_type ?? "").toLowerCase().replace(/\s+/g, "-");

  if (!countryId || !documentId) {
    return NextResponse.json({ intelligence: null });
  }

  const input: MatterIntelligenceInput = {
    country_id: countryId,
    document_id: documentId,
    matter_type: "general",
    receiving_authority_slug: receivingAuthoritySlug,
    is_paid:
      isPaidAndReleased ||
      deal.payment_status === "paid" ||
      deal.payment_status === "payment_confirmed",
    has_scheduled: !!scheduledAt,
    courier_status: courierTrackingStatus,
    deal_status: matterStatus,
  };

  const result = computeMatterIntelligence(input);
  const clientResult = toClientMatterIntelligence(result);

  return NextResponse.json({ intelligence: clientResult });
}
