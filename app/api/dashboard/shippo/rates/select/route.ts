import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { roleFromEmail } from "@/lib/rbac";
import { getShippoShipment } from "@/lib/shippo/client";
import { filterApprovedRates } from "@/lib/shippo/carrierPolicy";
import { applySelectedShippoRate } from "@/src/features/pricing/courierPricingService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = roleFromEmail(user.email);
    if (!["founder_admin", "admin_operator"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!process.env.SHIPPO_API_KEY) {
      return NextResponse.json({ error: "Shippo not configured" }, { status: 503 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      matter_id?: string;
      shipment_id?: string;
      rate_id?: string;
      customs_declaration_id?: string | null;
      customs_required?: boolean;
    };

    if (!body.matter_id || !body.shipment_id || !body.rate_id) {
      return NextResponse.json(
        { error: "matter_id, shipment_id and rate_id are required" },
        { status: 400 },
      );
    }

    const { data: matter, error: matterError } = await supabase
      .from("deals")
      .select("id,deal_id")
      .or(`id.eq.${body.matter_id},deal_id.eq.${body.matter_id}`)
      .maybeSingle();

    if (matterError || !matter) {
      return NextResponse.json({ error: "Matter not found" }, { status: 404 });
    }

    const shipment = await getShippoShipment(body.shipment_id);
    const approvedRates = filterApprovedRates(shipment.rates);
    const selectedRate =
      approvedRates.find((rate) => rate.object_id === body.rate_id) ?? null;

    if (!selectedRate) {
      return NextResponse.json(
        { error: "SELECTED_RATE_NOT_APPROVED_FOR_SHIPMENT" },
        { status: 422 },
      );
    }

    const result = await applySelectedShippoRate({
      matterId: matter.id,
      shipmentId: shipment.object_id,
      rate: selectedRate,
      actorId: user.id,
      actorEmail: user.email,
      addressFrom: shipment.address_from,
      addressTo: shipment.address_to,
      customsDeclarationId: body.customs_declaration_id ?? null,
      customsRequired: Boolean(body.customs_required),
    });

    return NextResponse.json({ success: true, pricing: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const locked = message.includes("COURIER_PRICING_LOCKED_AFTER_WISE_SUBMISSION");
    const integrity = message.includes("COURIER_AMOUNT_INTEGRITY_FAILED");

    return NextResponse.json(
      {
        error: locked
          ? "COURIER_PRICING_LOCKED_AFTER_WISE_SUBMISSION"
          : integrity
            ? "COURIER_AMOUNT_INTEGRITY_FAILED"
            : "COURIER_RATE_SELECTION_FAILED",
        message: locked
          ? "Courier pricing cannot change after a governed Wise submission has started."
          : integrity
            ? "The provider rate and tier credit did not reconcile."
            : "The selected courier rate could not be applied to this Matter.",
      },
      { status: locked ? 409 : integrity ? 422 : 500 },
    );
  }
}
