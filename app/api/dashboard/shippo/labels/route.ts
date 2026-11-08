import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveServerRole } from '@/lib/auth/server-role';
import { evaluatePaymentGate } from '@/lib/payments/paymentGate';
import {
  getShippoShipment,
  purchaseShippoLabel,
  registerShippoTrackingWebhook,
} from "@/lib/shippo/client";
import { filterApprovedRates } from "@/lib/shippo/carrierPolicy";
import { selectRecommendedRate } from "@/lib/shippo/rateSelection";
import { assertCanCreateLabel, ShippoGateError } from "@/lib/shippo/gates";
import { audit } from "@/lib/audit";
import { calculateCourierCharge } from "@/lib/shippo/courierCredit";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function loadMatter(supabase: Awaited<ReturnType<typeof createClient>>, matterId: string) {
  const fields = "payment_confirmed,payment_settlement_status,amount_due,amount_paid,balance_amount_received,balance_payment_status,balance_paid_at,final_total,is_paid_and_released,status,id, deal_id, payment_status, apostille_required, shipping_street1, document_type, client_name, destination_country, country, tier";
  const byId = await supabase.from("deals").select(fields).eq("id", matterId).maybeSingle();
  if (byId.data) return byId;
  return supabase.from("deals").select(fields).eq("deal_id", matterId).maybeSingle();
}

export async function POST(req: NextRequest) {
  try {
    if(req.headers.get('origin')!==new URL(req.url).origin||req.headers.get('sec-fetch-site')==='cross-site')return NextResponse.json({error:'SAME_ORIGIN_REQUIRED'},{status:403});
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = await resolveServerRole(user);
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

    const incidents=await createAdminClient().from('compliance_incidents').select('id').eq('matter_id',matter.id).not('status','in','(CLOSED,MATTER_RESTORED_OR_CLOSED)').or('release_frozen.eq.true,severity.in.(HIGH,CRITICAL)').limit(1);
    if(incidents.error||incidents.data?.length)return NextResponse.json({error:'RELEASE_INCIDENT_REVIEW_REQUIRED'},{status:409});
    if(evaluatePaymentGate(matter)!=='PAYMENT_CONFIRMED'||matter.is_paid_and_released!==true||!(Number(matter.final_total)>0&&Number(matter.amount_paid)+(matter.balance_payment_status==='paid'&&matter.balance_paid_at?Number(matter.balance_amount_received??0):0)===Number(matter.final_total)))return NextResponse.json({error:'VERIFIED_PAYMENT_AND_RELEASE_REQUIRED',next_action:'Review the canonical settlement, final release and zero balance before purchasing a client-delivery label.'},{status:409});
    try {
      assertCanCreateLabel({
        payment_status: matter.payment_status,
        paid_and_released: matter.is_paid_and_released,
        matter_status: matter.status,
        apostille_required: matter.apostille_required,
        shipping_address: matter.shipping_street1,
      });
    } catch (gateErr) {
      if (gateErr instanceof ShippoGateError) {
        return NextResponse.json({ error: gateErr.message, code: gateErr.code }, { status: 422 });
      }
      throw gateErr;
    }

    const admin = createAdminClient();
    const { data: persistedShipment, error: persistedError } = await admin
      .from("shippo_shipments")
      .select("*")
      .eq("matter_id", matter.id)
      .eq("shippo_shipment_id", shipment_id)
      .maybeSingle();
    if (persistedError) return NextResponse.json({ error: "RATE_SNAPSHOT_LOOKUP_FAILED" }, { status: 500 });
    if(!persistedShipment?.id)return NextResponse.json({error:'PERSISTED_RATE_SNAPSHOT_REQUIRED',next_action:'Load rates and confirm the selected shipment before purchasing.'},{status:409});
    if (persistedShipment?.shippo_transaction_id) {
      return NextResponse.json({
        success: true,
        existing: true,
        matter_id: matter.id,
        shipment_id,
        selected_rate_id: persistedShipment.shippo_rate_id,
        carrier: persistedShipment.carrier,
        tracking_number_display: persistedShipment.tracking_number,
        tracking_url: persistedShipment.tracking_url,
        courier_status: persistedShipment.courier_status,
        label_created_at: persistedShipment.label_created_at,
      });
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

    const governedRateId = persistedShipment?.shippo_rate_id ?? selected_rate_id;
    if (persistedShipment?.shippo_rate_id && selected_rate_id && persistedShipment.shippo_rate_id !== selected_rate_id) {
      return NextResponse.json({ error: "SHIPPO_RATE_SELECTION_MISMATCH" }, { status: 409 });
    }
    const selected = governedRateId
      ? approvedRates.find((rate) => rate.object_id === governedRateId) ?? null
      : recommended?.rate ?? null;

    if (!selected) {
      return NextResponse.json({ error: persistedShipment ? "SHIPPO_RATE_UNAVAILABLE" : "SELECTED_RATE_NOT_APPROVED_FOR_SHIPMENT" }, { status: 422 });
    }

    if (persistedShipment?.id) {
      const {data:claimed,error:claimError}=await admin.rpc('claim_final_delivery_label',{p_actor:user.id,p_matter:matter.id,p_shipment:persistedShipment.id});
      if (claimError) return NextResponse.json({ error: "SHIPMENT_LABEL_CLAIM_FAILED" }, { status: 500 });
      if (!claimed) return NextResponse.json({ error: "SHIPMENT_LABEL_CREATION_IN_PROGRESS" }, { status: 409 });
    }

    const wasAutoSelected = !governedRateId;
    let transaction;
    try {
      transaction = await purchaseShippoLabel(selected.object_id);
    } catch (error) {
      if (persistedShipment?.id) {
        // A transport failure has an unknown purchase outcome. Keep the claim
        // for provider reconciliation instead of blindly buying another label.
      }
      return NextResponse.json({error:'LABEL_PURCHASE_OUTCOME_UNKNOWN',owner:'MILANO',next_action:'Reconcile the provider transaction for this persisted shipment before any retry. The purchase claim remains locked.'},{status:502});
    }

    if (transaction.status !== "SUCCESS") {
      if (persistedShipment?.id) {
        // A transport failure has an unknown purchase outcome. Keep the claim
        // for provider reconciliation instead of blindly buying another label.
      }
      return NextResponse.json({ error: 'LABEL_PURCHASE_FAILED_OR_PENDING',next_action:'Review the provider transaction. The purchase claim remains locked until its outcome is reconciled.', messages: transaction.messages }, { status: 502 });
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
    const courierPricing = calculateCourierCharge({
      providerRateAmount: selected.amount,
      currency: selected.currency,
      tier: matter.tier,
    });

    const shipmentRecord = {
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
      provider_rate_amount: courierPricing.providerRateAmount,
      tier_courier_credit: courierPricing.tierCourierCredit,
      client_courier_charge: courierPricing.clientCourierCharge,
      rate_currency: courierPricing.currency,
      selected_service_level: selected.servicelevel.token,
      rate_status: "LABEL_CREATED",
      updated_at: new Date().toISOString(),
    };
    const write = persistedShipment?.id
      ? await admin.from("shippo_shipments").update(shipmentRecord).eq("id", persistedShipment.id).select("id").single()
      : await admin.from("shippo_shipments").insert(shipmentRecord).select("id").single();
    if (write.error) {
      console.error("shippo_shipments continuity write error:", write.error.message);
      return NextResponse.json({ error: "SHIPMENT_CONTINUITY_WRITE_FAILED" }, { status: 500 });
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
        provider_rate_amount: courierPricing.providerRateAmount,
        tier_courier_credit: courierPricing.tierCourierCredit,
        client_courier_charge: courierPricing.clientCourierCharge,
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
      shipping_record_id: write.data.id,
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
      courier_pricing: courierPricing,
      label_created_at: new Date().toISOString(),
      package_template_used: packageTemplateId,
      shipping_option_used: shippingOptionId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
