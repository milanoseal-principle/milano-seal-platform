import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { roleFromEmail } from "@/lib/rbac";
import {
  getShippoShipment,
  purchaseShippoLabel,
  registerShippoTrackingWebhook,
} from "@/lib/shippo/client";
import { filterApprovedRates } from "@/lib/shippo/carrierPolicy";
import { selectRecommendedRate } from "@/lib/shippo/rateSelection";
import { assertCanCreateLabel, ShippoGateError } from "@/lib/shippo/gates";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

async function loadMatter(supabase: Awaited<ReturnType<typeof createClient>>, matterId: string) {
  const fields = "id, deal_id, payment_status, paid_and_released, matter_status, apostille_required, shipping_street1, document_type, client_name, destination_country, country, tier";
  const byId = await supabase.from("deals").select(fields).eq("id", matterId).maybeSingle();
  if (byId.data) return byId;
  return supabase.from("deals").select(fields).eq("deal_id", matterId).maybeSingle();
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = roleFromEmail(user.email);
    if (!["founder_admin", "admin_operator"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!process.env.SHIPPO_API_KEY) {
      return NextResponse.json({ error: "Shippo not configured" }, { status: 503 });
    }

    const body = await req.json();
    const { matter_id, selected_rate_id, shipment_id } = body;

    if (!matter_id || !shipment_id) {
      return NextResponse.json({ error: "matter_id and shipment_id required" }, { status: 400 });
    }

    const { data: matter, error: mErr } = await loadMatter(supabase, matter_id);
    if (mErr || !matter) return NextResponse.json({ error: "Matter not found" }, { status: 404 });

    try {
      assertCanCreateLabel({
        payment_status: matter.payment_status,
        paid_and_released: matter.paid_and_released,
        matter_status: matter.matter_status,
        apostille_required: matter.apostille_required,
        shipping_address: matter.shipping_street1,
      });
    } catch (gateErr) {
      if (gateErr instanceof ShippoGateError) {
        return NextResponse.json({ error: gateErr.message, code: gateErr.code }, { status: 422 });
      }
      throw gateErr;
    }

    const shipment = await getShippoShipment(shipment_id);
    const approvedRates = filterApprovedRates(shipment.rates);
    if (approvedRates.length === 0) {
      return NextResponse.json({ error: "NO_APPROVED_CARRIER_RATE" }, { status: 422 });
    }

    const destinationCountry = matter.destination_country ?? matter.country ?? "US";
    const recommended = selectRecommendedRate({
      rates: approvedRates,
      lane: matter.tier,
      destinationCountry,
    });

    const selected = selected_rate_id
      ? approvedRates.find((rate) => rate.object_id === selected_rate_id) ?? null
      : recommended?.rate ?? null;

    if (!selected) {
      return NextResponse.json({ error: "SELECTED_RATE_NOT_APPROVED_FOR_SHIPMENT" }, { status: 422 });
    }

    const wasAutoSelected = !selected_rate_id;
    const transaction = await purchaseShippoLabel(selected.object_id);

    if (transaction.status !== "SUCCESS") {
      return NextResponse.json({ error: "Label purchase failed", messages: transaction.messages }, { status: 502 });
    }

    const carrier = selected.provider;
    const trackingNumber = transaction.tracking_number;
    const trackingUrl = transaction.tracking_url_provider ?? null;
    const packageTemplateId = body.package_template_id ?? "milano_folder_packet";
    const shippingOptionId = body.shipping_option_id ?? "milano_international_release";

    if (trackingNumber) {
      try {
        await registerShippoTrackingWebhook(carrier, trackingNumber, matter.id);
      } catch {
        // Webhook registration failure must not block label creation.
      }
    }

    const parsedCost = Number.parseFloat(selected.amount);
    const actualShippoCost = Number.isFinite(parsedCost) ? parsedCost : null;

    const { error: insertErr } = await supabase.from("shippo_shipments").insert({
      matter_id: matter.id,
      shippo_shipment_id: shipment_id,
      shippo_transaction_id: transaction.object_id,
      shippo_rate_id: selected.object_id,
      carrier,
      tracking_number: trackingNumber,
      tracking_url: trackingUrl,
      label_url: transaction.label_url,
      label_file_type: "PDF",
      shippo_status: transaction.status,
      courier_status: "LABEL_CREATED",
      label_created_at: new Date().toISOString(),
      tracking_registered_at: trackingNumber ? new Date().toISOString() : null,
      created_by: user.id,
      package_template_id: packageTemplateId,
      shipping_option_id: shippingOptionId,
      tax_id_policy: "NO_TAX_ID",
      carrier_policy_status: "APPROVED",
      packaging_qa_status: "PENDING",
      actual_shippo_cost: actualShippoCost,
      shippo_currency: selected.currency || "USD",
    });

    if (insertErr) {
      console.error("shippo_shipments insert error:", insertErr.message);
    }

    await audit({
      event: "courier.label.created",
      actor: user.email,
      resource: `matter:${matter.id}`,
      payload: {
        matter_id: matter.id,
        matter_reference: matter.deal_id ?? matter.id,
        execution_lane: matter.tier ?? "signature",
        shippo_shipment_id: shipment_id,
        shippo_rate_id: selected.object_id,
        carrier,
        servicelevel: selected.servicelevel.token,
        selected_by_policy: wasAutoSelected,
        selection_policy: recommended?.selectionPolicy ?? null,
        tracking_number: trackingNumber,
        package_template_id: packageTemplateId,
        shipping_option_id: shippingOptionId,
        action: "created",
        status: "success",
        actorKind: "operator",
        events: [
          wasAutoSelected ? "SHIPPO_RATE_AUTO_SELECTED" : "SHIPPO_RATE_SELECTED",
          "COURIER_LABEL_CREATED",
          "COURIER_TRACKING_REGISTERED",
          "PACKAGE_PROFILE_SELECTED",
          "SHIPPING_OPTION_SELECTED",
        ],
      },
    });

    return NextResponse.json({
      success: true,
      matter_id: matter.id,
      matter_reference: matter.deal_id ?? matter.id,
      execution_lane: matter.tier ?? "signature",
      shipment_id,
      rate_selection: wasAutoSelected ? "AUTO" : "OPERATOR_CONFIRMED",
      selection_policy: recommended?.selectionPolicy ?? null,
      selected_rate_id: selected.object_id,
      selected_servicelevel: selected.servicelevel.name,
      carrier,
      tracking_number_display: trackingNumber,
      tracking_url: trackingUrl,
      courier_status: "LABEL_CREATED",
      label_created_at: new Date().toISOString(),
      package_template_used: packageTemplateId,
      shipping_option_used: shippingOptionId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
