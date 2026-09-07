import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { roleFromEmail } from "@/lib/rbac";
import {
  getShippoShipment,
  purchaseShippoLabel,
  registerShippoTrackingWebhook,
} from "@/lib/shippo/client";
import { filterApprovedRates } from "@/lib/shippo/carrierPolicy";
import { assertCanCreateLabel, ShippoGateError } from "@/lib/shippo/gates";
import { audit } from "@/lib/audit";
import { calculateCourierCharge } from "@/lib/shippo/courierCredit";
import { appendLedger, CUSTODY_EVENTS } from "@/lib/custodyLedger";

export const dynamic = "force-dynamic";

async function loadMatter(matterId: string) {
  const admin = createAdminClient();
  const fields = [
    "id",
    "deal_id",
    "payment_status",
    "status",
    "deal_status",
    "apostille_required",
    "shipping_street1",
    "document_type",
    "client_name",
    "destination_country",
    "country",
    "lane",
    "courier_shippo_shipment_id",
    "courier_shippo_rate_id",
    "courier_carrier",
    "courier_service_level",
    "courier_provider_rate",
    "courier_tier_credit",
    "courier_client_charge",
    "courier_currency",
  ].join(",");

  const byId = await admin.from("deals").select(fields).eq("id", matterId).maybeSingle();
  if (byId.data) return byId;
  return admin.from("deals").select(fields).eq("deal_id", matterId).maybeSingle();
}

async function hasApostilleReturnEvidence(matterId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("custody_ledger")
    .select("id")
    .eq("deal_id", matterId)
    .eq("event", CUSTODY_EVENTS.DOC_APOSTILLE_RECEIVED)
    .limit(1);
  if (error) throw error;
  return Boolean(data?.length);
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = roleFromEmail(user.email);
    if (!["founder_admin", "admin_operator"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!process.env.SHIPPO_API_KEY) {
      return NextResponse.json({ error: "Shippo not configured" }, { status: 503 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      matter_id?: string;
      selected_rate_id?: string;
      shipment_id?: string;
      package_template_id?: string;
      shipping_option_id?: string;
    };

    if (!body.matter_id) {
      return NextResponse.json({ error: "matter_id required" }, { status: 400 });
    }

    const { data: matter, error: matterError } = await loadMatter(body.matter_id);
    if (matterError || !matter) {
      return NextResponse.json({ error: "Matter not found" }, { status: 404 });
    }

    const shipmentId = String(matter.courier_shippo_shipment_id ?? "");
    const selectedRateId = String(matter.courier_shippo_rate_id ?? "");
    if (!shipmentId || !selectedRateId) {
      return NextResponse.json(
        { error: "COURIER_RATE_NOT_SELECTED" },
        { status: 422 },
      );
    }

    if (body.shipment_id && body.shipment_id !== shipmentId) {
      return NextResponse.json({ error: "SHIPMENT_MISMATCH" }, { status: 409 });
    }
    if (body.selected_rate_id && body.selected_rate_id !== selectedRateId) {
      return NextResponse.json({ error: "COURIER_RATE_LOCKED" }, { status: 409 });
    }

    const admin = createAdminClient();
    const { data: persistedShipment, error: persistedError } = await admin
      .from("shippo_shipments")
      .select("*")
      .eq("matter_id", matter.id)
      .eq("shippo_shipment_id", shipmentId)
      .maybeSingle();
    if (persistedError) throw persistedError;
    if (!persistedShipment) {
      return NextResponse.json({ error: "COURIER_QUOTE_EVIDENCE_MISSING" }, { status: 422 });
    }

    if (persistedShipment.shippo_transaction_id && persistedShipment.label_created_at) {
      return NextResponse.json({
        success: true,
        idempotent: true,
        matter_id: matter.id,
        matter_reference: matter.deal_id ?? matter.id,
        execution_lane: matter.lane ?? "Signature",
        shipment_id: shipmentId,
        selected_rate_id: selectedRateId,
        selected_servicelevel: persistedShipment.service_level,
        carrier: persistedShipment.carrier,
        tracking_number_display: persistedShipment.tracking_number,
        tracking_url: persistedShipment.tracking_url,
        courier_status: persistedShipment.courier_status,
        label_created_at: persistedShipment.label_created_at,
      });
    }

    const apostilleComplete = matter.apostille_required
      ? await hasApostilleReturnEvidence(matter.id)
      : true;

    try {
      assertCanCreateLabel({
        payment_status: matter.payment_status,
        status: matter.status,
        apostille_required: matter.apostille_required,
        apostille_complete: apostilleComplete,
        shipping_address: matter.shipping_street1,
        selected_rate_id: selectedRateId,
        selected_shipment_id: shipmentId,
      });
    } catch (gateError) {
      if (gateError instanceof ShippoGateError) {
        return NextResponse.json(
          { error: gateError.message, code: gateError.code },
          { status: 422 },
        );
      }
      throw gateError;
    }

    const shipment = await getShippoShipment(shipmentId);
    const approvedRates = filterApprovedRates(shipment.rates);
    const selected = approvedRates.find((rate) => rate.object_id === selectedRateId) ?? null;
    if (!selected) {
      return NextResponse.json(
        { error: "LOCKED_RATE_NO_LONGER_APPROVED_FOR_SHIPMENT" },
        { status: 422 },
      );
    }

    const courierPricing = calculateCourierCharge({
      providerRateAmount: selected.amount,
      currency: selected.currency,
      tier: matter.lane,
    });

    const persistedProviderRate = Number(persistedShipment.provider_rate_amount ?? matter.courier_provider_rate ?? 0);
    const persistedCredit = Number(persistedShipment.tier_courier_credit ?? matter.courier_tier_credit ?? 0);
    const persistedClientCharge = Number(persistedShipment.client_courier_charge ?? matter.courier_client_charge ?? 0);
    if (
      Math.abs(persistedProviderRate - Number(courierPricing.providerRateAmount)) > 0.009 ||
      Math.abs(persistedCredit - Number(courierPricing.tierCourierCredit)) > 0.009 ||
      Math.abs(persistedClientCharge - Number(courierPricing.clientCourierCharge)) > 0.009
    ) {
      return NextResponse.json(
        {
          error: "COURIER_RATE_CHANGED_AFTER_QUOTE",
          message: "Provider courier economics changed after Matter pricing was locked. Operator review is required before label purchase.",
        },
        { status: 409 },
      );
    }

    const transaction = await purchaseShippoLabel(selected.object_id);
    if (transaction.status !== "SUCCESS") {
      return NextResponse.json(
        { error: "Label purchase failed", messages: transaction.messages },
        { status: 502 },
      );
    }

    const carrier = selected.provider;
    const trackingNumber = transaction.tracking_number;
    const trackingUrl = transaction.tracking_url_provider ?? null;
    const now = new Date().toISOString();

    if (trackingNumber) {
      try {
        await registerShippoTrackingWebhook(carrier, trackingNumber, matter.id);
      } catch (error) {
        console.error("[shippo] tracking registration failed", {
          matterId: matter.id,
          trackingNumber,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const { error: updateError } = await admin
      .from("shippo_shipments")
      .update({
        shippo_transaction_id: transaction.object_id,
        shippo_rate_id: selected.object_id,
        carrier,
        service_level: selected.servicelevel.name,
        tracking_number: trackingNumber,
        tracking_url: trackingUrl,
        label_url: transaction.label_url,
        label_file_type: "PDF",
        shippo_status: transaction.status,
        courier_status: "LABEL_CREATED",
        label_created_at: now,
        tracking_registered_at: trackingNumber ? now : null,
        package_template_id:
          body.package_template_id ?? persistedShipment.package_template_id ?? "milano_folder_packet",
        shipping_option_id:
          body.shipping_option_id ?? persistedShipment.shipping_option_id ?? "milano_international_release",
        tax_id_policy: persistedShipment.tax_id_policy ?? "NO_TAX_ID",
        carrier_policy_status: "APPROVED",
        packaging_qa_status: persistedShipment.packaging_qa_status ?? "PENDING",
        actual_shippo_cost: Number(courierPricing.providerRateAmount),
        provider_rate_amount: Number(courierPricing.providerRateAmount),
        tier_courier_credit: Number(courierPricing.tierCourierCredit),
        client_courier_charge: Number(courierPricing.clientCourierCharge),
        shippo_currency: selected.currency || "USD",
        estimated_days: selected.estimated_days ?? persistedShipment.estimated_days ?? null,
        updated_at: now,
      })
      .eq("id", persistedShipment.id)
      .is("shippo_transaction_id", null);

    if (updateError) throw updateError;

    await appendLedger({
      deal_id: matter.id,
      event: CUSTODY_EVENTS.DOC_LABEL_CREATED,
      actor_type: "operator",
      actor_id: user.email,
      location: "The Milano Seal",
      method: "shippo_label",
      status: "label_created",
      metadata: {
        matter_reference: matter.deal_id,
        shippo_shipment_id: shipmentId,
        shippo_transaction_id: transaction.object_id,
        shippo_rate_id: selected.object_id,
        carrier,
        tracking_number: trackingNumber,
      },
    });

    await audit({
      event: "courier.label.created",
      actor: user.email,
      resource: `matter:${matter.id}`,
      payload: {
        matter_id: matter.id,
        matter_reference: matter.deal_id ?? matter.id,
        execution_lane: matter.lane ?? "Signature",
        shippo_shipment_id: shipmentId,
        shippo_rate_id: selected.object_id,
        provider_rate_amount: courierPricing.providerRateAmount,
        tier_courier_credit: courierPricing.tierCourierCredit,
        client_courier_charge: courierPricing.clientCourierCharge,
        carrier,
        servicelevel: selected.servicelevel.token,
        tracking_number: trackingNumber,
        action: "created",
        status: "success",
        actorKind: "operator",
      },
    });

    return NextResponse.json({
      success: true,
      matter_id: matter.id,
      matter_reference: matter.deal_id ?? matter.id,
      execution_lane: matter.lane ?? "Signature",
      shipment_id: shipmentId,
      rate_selection: "PERSISTED_QUOTE",
      selected_rate_id: selected.object_id,
      selected_servicelevel: selected.servicelevel.name,
      carrier,
      tracking_number_display: trackingNumber,
      tracking_url: trackingUrl,
      courier_status: "LABEL_CREATED",
      courier_pricing: courierPricing,
      label_created_at: now,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
