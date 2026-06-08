import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { track, ShippoTrack } from "@/lib/shippo";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = new Set(["founder_admin", "admin_operator"]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ matterId: string }> },
) {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role =
    ((user.user_metadata?.role ?? user.app_metadata?.role) as string) ?? "";

  if (!ALLOWED_ROLES.has(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { matterId } = await params;

  const admin = createAdminClient();
  const { data: deal, error: dealErr } = await admin
    .from("deals")
    .select(
      "id, deal_status, carrier, tracking_number, tracking_url_provider, delivery_status, delivery_eta, delivery_timestamp, shipped_at, signed_by, updated_at",
    )
    .eq("id", matterId)
    .single();

  if (dealErr || !deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  if (!deal.tracking_number) {
    return NextResponse.json({
      tracking: null,
      status: deal.deal_status,
    });
  }

  let liveTracking: ShippoTrack | null = null;
  try {
    liveTracking = await track(deal.carrier, deal.tracking_number);
  } catch {
    // Fall back to stored data if live call fails
    liveTracking = null;
  }

  return NextResponse.json({
    tracking: {
      carrier: deal.carrier,
      tracking_number: deal.tracking_number,
      tracking_url_provider: deal.tracking_url_provider ?? null,
      delivery_status: deal.delivery_status,
      delivery_eta: deal.delivery_eta,
      delivery_timestamp: deal.delivery_timestamp ?? null,
      shipped_at: deal.shipped_at ?? null,
      signed_by: deal.signed_by ?? null,
      live: liveTracking,
      last_updated: deal.updated_at,
    },
  });
}
