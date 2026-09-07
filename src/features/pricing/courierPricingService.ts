import { createAdminClient } from "@/lib/supabase/admin";
import { buildPaymentLink } from "@/lib/dealId";
import { calculateCourierCharge } from "@/lib/shippo/courierCredit";
import type { ShippoAddress, ShippoParcel, ShippoRate } from "@/lib/shippo/types";
import { writeEventLedger } from "@/src/features/audit/eventLedgerService";

export interface ApplyShippoRateParams {
  matterId: string;
  shipmentId: string;
  rate: ShippoRate;
  actorId: string;
  actorEmail?: string | null;
  addressFrom: ShippoAddress;
  addressTo: ShippoAddress;
  parcel: ShippoParcel;
  customsDeclarationId?: string | null;
  customsRequired?: boolean;
}

interface PricingRpcRow {
  matter_id: string;
  final_total: number | string;
  invoice_retainer: number | string;
  invoice_balance: number | string;
  amount_due: number | string;
  courier_client_charge: number | string;
}

function money(value: number | string | null | undefined): number {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed)) throw new Error("COURIER_PRICING_INVALID_TOTAL");
  return Math.round(parsed * 100) / 100;
}

export async function applySelectedShippoRate(params: ApplyShippoRateParams) {
  const admin = createAdminClient();
  const courier = calculateCourierCharge({
    providerRateAmount: params.rate.amount,
    currency: params.rate.currency,
    tier: await resolveMatterLane(params.matterId),
  });

  const { data, error } = await admin.rpc("apply_shippo_rate_to_matter", {
    p_matter_id: params.matterId,
    p_shippo_shipment_id: params.shipmentId,
    p_shippo_rate_id: params.rate.object_id,
    p_carrier: params.rate.provider,
    p_service_level: params.rate.servicelevel.name,
    p_provider_rate: money(courier.providerRateAmount),
    p_tier_credit: money(courier.tierCourierCredit),
    p_client_charge: money(courier.clientCourierCharge),
    p_currency: courier.currency,
    p_estimated_days: params.rate.estimated_days ?? null,
    p_actor_id: params.actorId,
    p_address_from: params.addressFrom,
    p_address_to: params.addressTo,
    p_parcel: params.parcel,
    p_customs_declaration_id: params.customsDeclarationId ?? null,
    p_customs_required: Boolean(params.customsRequired),
  });

  if (error) throw error;
  const row = (Array.isArray(data) ? data[0] : data) as PricingRpcRow | null;
  if (!row) throw new Error("COURIER_PRICING_PERSISTENCE_FAILED");

  const amountDue = money(row.amount_due);
  const { data: matter, error: matterError } = await admin
    .from("deals")
    .select("id,deal_id,currency")
    .eq("id", params.matterId)
    .single();
  if (matterError || !matter) throw matterError ?? new Error("MATTER_NOT_FOUND");

  const currency = String(matter.currency ?? courier.currency ?? "USD").toUpperCase();
  const paymentReference = String(matter.deal_id ?? matter.id);
  const paymentLink = buildPaymentLink(paymentReference, amountDue, currency);

  const { error: paymentLinkError } = await admin
    .from("deals")
    .update({
      payment_link: paymentLink,
      payment_reference: paymentReference,
      wise_reference: paymentReference,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.matterId);
  if (paymentLinkError) throw paymentLinkError;

  await writeEventLedger({
    matterId: params.matterId,
    actorEmail: params.actorEmail,
    eventType: "SHIPPO_RATE_SELECTED",
    message: "Provider-backed courier rate selected and canonical Matter pricing recalculated before Wise submission.",
    metadata: {
      shippoShipmentId: params.shipmentId,
      shippoRateId: params.rate.object_id,
      carrier: params.rate.provider,
      serviceLevel: params.rate.servicelevel.name,
      estimatedDays: params.rate.estimated_days ?? null,
      providerRateAmount: courier.providerRateAmount,
      tierCourierCredit: courier.tierCourierCredit,
      clientCourierCharge: courier.clientCourierCharge,
      currency: courier.currency,
      finalTotal: money(row.final_total),
      amountDue,
      balanceDue: money(row.invoice_balance),
    },
  });

  return {
    matterId: params.matterId,
    paymentReference,
    paymentLink,
    finalTotal: money(row.final_total),
    amountDue,
    balanceDue: money(row.invoice_balance),
    courier: {
      shipmentId: params.shipmentId,
      rateId: params.rate.object_id,
      carrier: params.rate.provider,
      serviceLevel: params.rate.servicelevel.name,
      estimatedDays: params.rate.estimated_days ?? null,
      ...courier,
    },
  };
}

async function resolveMatterLane(matterId: string): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("deals")
    .select("lane")
    .eq("id", matterId)
    .single();
  if (error || !data) throw error ?? new Error("MATTER_NOT_FOUND");
  return String(data.lane ?? "Signature");
}
