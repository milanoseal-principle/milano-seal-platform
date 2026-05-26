import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createShipment,
  normalizeRates,
  selectRate,
  ShippoAddress,
  ShippoParcel,
  NormalizedRate,
} from "@/lib/shippo";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = new Set(["admin", "ops_manager"]);

interface Body {
  matter_id: string;
  from: ShippoAddress;
  to: ShippoAddress;
  parcel: ShippoParcel;
  urgent?: boolean;
  signature_required?: boolean;
}

export async function POST(req: NextRequest) {
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

  // Check Shippo key first
  if (!process.env.SHIPPO_API_KEY) {
    return NextResponse.json(
      { error: "Courier service unavailable" },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.matter_id || !body.from || !body.to || !body.parcel) {
    return NextResponse.json(
      { error: "Missing required fields: matter_id, from, to, parcel" },
      { status: 400 },
    );
  }

  // Verify deal exists
  const admin = createAdminClient();
  const { data: deal, error: dealErr } = await admin
    .from("deals")
    .select("id, destination_country, country")
    .eq("id", body.matter_id)
    .single();

  if (dealErr || !deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  try {
    const shipment = await createShipment({
      from: body.from,
      to: body.to,
      parcel: body.parcel,
    });

    if (!shipment.rates || shipment.rates.length === 0) {
      return NextResponse.json(
        { error: "No rates returned from carrier API" },
        { status: 502 },
      );
    }

    const rates: NormalizedRate[] = normalizeRates(shipment.rates);
    const decision = selectRate(shipment.rates, {
      destination_country:
        deal.destination_country || deal.country || "United States",
      urgent: body.urgent,
      signature_required: body.signature_required,
    });

    return NextResponse.json({
      matter_id: body.matter_id,
      shipment_id: shipment.object_id,
      rates,
      recommended: decision.chosen,
      cheapest: decision.cheapest,
      fastest: decision.fastest,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Failed to retrieve courier rates", details: msg },
      { status: 500 },
    );
  }
}
