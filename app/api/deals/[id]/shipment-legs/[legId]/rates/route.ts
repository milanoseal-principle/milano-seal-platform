import { NextRequest, NextResponse } from "next/server";
import { createShippoCustomsDeclaration, createShippoCustomsItem, createShippoShipment, getShippoShipment } from "@/lib/shippo/client";
import { buildDocumentCustomsPayload, requiresCustoms } from "@/lib/shippo/customs";
import { buildDocumentParcel, selectPackageTemplate } from "@/lib/shippo/parcel";
import type { ShippoAddress } from "@/lib/shippo/types";
import {
  getShipmentLeg,
  operatorRateOptions,
  operatorShipmentLegProjection,
  selectGovernedRate,
} from "@/lib/intelligence/execution-brain/authorityLogistics";
import {
  authorizeLogisticsOperator,
  legRpcError,
  loadLogisticsContext,
} from "@/lib/intelligence/execution-brain/authorityLogisticsServer";

export const dynamic = "force-dynamic";

// SELECT RATE. action "quote" requests Shippo rates for this leg through the
// existing client and returns the governed ranking (approved carriers only).
// action "select" persists the exact governed rate snapshot. No label is
// purchased here, and absolute-cheapest selection across unapproved carriers
// is impossible: only ranked approved rates can be selected.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; legId: string }> }) {
  const auth = await authorizeLogisticsOperator();
  if ("error" in auth) return auth.error;
  const { id, legId } = await params;
  if (!process.env.SHIPPO_API_KEY) return NextResponse.json({ error: "SHIPPO_NOT_CONFIGURED" }, { status: 503 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const context = await loadLogisticsContext(id);
  if (!context) return NextResponse.json({ error: "MATTER_NOT_FOUND" }, { status: 404 });
  const leg = await getShipmentLeg(context.admin, context.matter.id, legId);
  if (!leg) return NextResponse.json({ error: "SHIPMENT_LEG_NOT_FOUND" }, { status: 404 });
  if (!["not_created", "rate_selected", "voided", "error"].includes(leg.label_status)) {
    return NextResponse.json({ error: "LABEL_ALREADY_PURCHASED" }, { status: 409 });
  }
  const destination = leg.destination_json as unknown as ShippoAddress;
  const destinationCountry = destination.country ?? null;

  if (body.action === "quote") {
    const template = selectPackageTemplate({ lane: context.matter.tier ?? undefined, documentCount: context.matter.document_count ?? 1 });
    let customsDeclarationId: string | undefined;
    if (destinationCountry && requiresCustoms(destinationCountry)) {
      const { item, declaration } = await buildDocumentCustomsPayload(context.matter);
      const itemRes = await createShippoCustomsItem(item);
      const declRes = await createShippoCustomsDeclaration({ ...declaration, items: [itemRes.object_id] });
      customsDeclarationId = declRes.object_id;
    }
    const shipment = await createShippoShipment({
      address_from: leg.origin_json as unknown as ShippoAddress,
      address_to: destination,
      parcels: [buildDocumentParcel({ templateId: template.id })],
      ...(customsDeclarationId ? { customs_declaration: customsDeclarationId } : {}),
      async: false,
    });
    const { ranked, error } = selectGovernedRate({
      rates: shipment.rates,
      lane: context.matter.tier,
      destinationCountry,
      selectedBy: auth.user.id,
    });
    if (error) return NextResponse.json({ error }, { status: 422 });
    return NextResponse.json({ success: true, provider_shipment_ref: shipment.object_id, rates: operatorRateOptions(ranked) });
  }

  if (body.action === "select") {
    const shipmentRef = typeof body.provider_shipment_ref === "string" ? body.provider_shipment_ref : "";
    const rateId = typeof body.selected_rate_id === "string" ? body.selected_rate_id : "";
    if (!shipmentRef || !rateId) return NextResponse.json({ error: "RATE_SELECTION_REQUIRED" }, { status: 400 });
    const shipment = await getShippoShipment(shipmentRef);
    const { snapshot, error } = selectGovernedRate({
      rates: shipment.rates,
      lane: context.matter.tier,
      destinationCountry,
      selectedRateId: rateId,
      selectedBy: auth.user.id,
    });
    if (error || !snapshot) return NextResponse.json({ error: error ?? "SELECTED_RATE_NOT_APPROVED" }, { status: 422 });
    const { data, error: rpcError } = await context.admin.rpc("record_shipment_leg_rate", {
      p_matter_id: context.matter.id,
      p_leg_id: leg.id,
      p_provider_shipment_id: shipmentRef,
      p_rate_snapshot: snapshot,
      p_actor_id: auth.user.id,
    });
    if (rpcError) return legRpcError(rpcError.message);
    const row = Array.isArray(data) ? data[0] : data;
    return NextResponse.json({ success: true, leg: operatorShipmentLegProjection(row) });
  }

  return NextResponse.json({ error: "INVALID_RATE_ACTION" }, { status: 400 });
}
