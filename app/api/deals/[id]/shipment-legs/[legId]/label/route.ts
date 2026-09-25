import { NextRequest, NextResponse } from "next/server";
import { purchaseShippoLabel, registerShippoTrackingWebhook, shippoRequest } from "@/lib/shippo/client";
import type { ShippoAddress } from "@/lib/shippo/types";
import {
  evaluateLabelPurchaseReadiness,
  evaluateReturnLabelReadiness,
  evaluateShipmentLegReadiness,
  getShipmentLeg,
  operatorShipmentLegProjection,
} from "@/lib/intelligence/execution-brain/authorityLogistics";
import {
  authorizeLogisticsOperator,
  legRpcError,
  loadLogisticsContext,
} from "@/lib/intelligence/execution-brain/authorityLogisticsServer";

export const dynamic = "force-dynamic";

// Operator-only printable label. The raw label URL is never returned in JSON
// and never reaches a client surface.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; legId: string }> }) {
  const auth = await authorizeLogisticsOperator();
  if ("error" in auth) return auth.error;
  const { id, legId } = await params;
  const context = await loadLogisticsContext(id);
  if (!context) return NextResponse.json({ error: "MATTER_NOT_FOUND" }, { status: 404 });
  const leg = await getShipmentLeg(context.admin, context.matter.id, legId);
  const labelUrl = ((leg?.provider_evidence?.label ?? {}) as Record<string, unknown>).label_url;
  if (!leg || leg.label_status !== "created" || typeof labelUrl !== "string") {
    return NextResponse.json({ error: "LABEL_NOT_AVAILABLE" }, { status: 404 });
  }
  return NextResponse.redirect(labelUrl, { status: 302, headers: { "Cache-Control": "no-store" } });
}

// PURCHASE LABEL / GENERATE RETURN LABEL / VOID LABEL. Each label is its own
// explicit operator action; outbound and return labels are never purchased
// together. The persisted rate snapshot is the only rate that can be bought.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; legId: string }> }) {
  const auth = await authorizeLogisticsOperator();
  if ("error" in auth) return auth.error;
  const { id, legId } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const evidenceNote = String(body.evidence_note ?? "").trim();
  if (evidenceNote.length < 10) return NextResponse.json({ error: "EVIDENCE_NOTE_REQUIRED" }, { status: 400 });
  if (!process.env.SHIPPO_API_KEY) return NextResponse.json({ error: "SHIPPO_NOT_CONFIGURED" }, { status: 503 });

  const context = await loadLogisticsContext(id);
  if (!context) return NextResponse.json({ error: "MATTER_NOT_FOUND" }, { status: 404 });
  const leg = await getShipmentLeg(context.admin, context.matter.id, legId);
  if (!leg) return NextResponse.json({ error: "SHIPMENT_LEG_NOT_FOUND" }, { status: 404 });

  if (body.action === "void") {
    if (leg.label_status !== "created" || leg.shipped_at || !leg.provider_transaction_id) {
      return NextResponse.json({ error: "LABEL_NOT_VOIDABLE" }, { status: 409 });
    }
    const refund = await shippoRequest<{ object_id: string; status: string }>("POST", "/refunds/", {
      transaction: leg.provider_transaction_id,
      async: false,
    });
    const { data, error } = await context.admin.rpc("record_shipment_leg_void", {
      p_matter_id: context.matter.id,
      p_leg_id: leg.id,
      p_evidence: { refund_status: refund.status, refund_ref: refund.object_id },
      p_actor_id: auth.user.id,
      p_reason: evidenceNote.slice(0, 1000),
    });
    if (error) return legRpcError(error.message);
    return NextResponse.json({ success: true, leg: operatorShipmentLegProjection(Array.isArray(data) ? data[0] : data) });
  }

  if (body.action !== "purchase") return NextResponse.json({ error: "INVALID_LABEL_ACTION" }, { status: 400 });

  // Re-run the leg's own gate against current canonical truth.
  const otherLegs = context.legs.filter((other) => other.id !== leg.id);
  const currentGate = evaluateShipmentLegReadiness({
    legType: leg.leg_type,
    matter: context.facts,
    packet: context.packet,
    existingLegs: otherLegs,
    origin: leg.origin_json as unknown as ShippoAddress,
    destination: leg.destination_json as unknown as ShippoAddress,
    operatorRequest: {
      explicitReturnRequest: body.explicit_return_label_request === true,
      releaseActionConfirmed: body.release_action_confirmed === true,
      exceptionReason: leg.exception_reason ?? null,
    },
  });
  const readiness =
    leg.leg_type === "return_from_authority"
      ? evaluateReturnLabelReadiness({
          leg,
          matterId: context.matter.id,
          packet: context.packet,
          explicitRequest: body.explicit_return_label_request === true,
        })
      : evaluateLabelPurchaseReadiness({
          leg,
          matterId: context.matter.id,
          operatorAuthorized: body.operator_authorized === true,
          currentGate,
        });
  if (!readiness.allowed || !currentGate.allowed) {
    return NextResponse.json(
      { error: readiness.code ?? currentGate.code, reasons: [...readiness.reasons, ...currentGate.reasons] },
      { status: 409 },
    );
  }

  const { error: claimError } = await context.admin.rpc("claim_shipment_leg_label", {
    p_matter_id: context.matter.id,
    p_leg_id: leg.id,
  });
  if (claimError) return legRpcError(claimError.message);

  let transaction;
  try {
    transaction = await purchaseShippoLabel(leg.rate_snapshot!.provider_rate_id);
  } catch (error) {
    await context.admin.rpc("record_shipment_leg_label", {
      p_matter_id: context.matter.id,
      p_leg_id: leg.id,
      p_success: false,
      p_transaction_id: null,
      p_tracking_number: null,
      p_evidence: { error: error instanceof Error ? error.message.slice(0, 300) : "purchase failed" },
      p_actor_id: auth.user.id,
    });
    return NextResponse.json({ error: "LABEL_PURCHASE_FAILED" }, { status: 502 });
  }

  const success = transaction.status === "SUCCESS" && Boolean(transaction.object_id);
  const { data, error } = await context.admin.rpc("record_shipment_leg_label", {
    p_matter_id: context.matter.id,
    p_leg_id: leg.id,
    p_success: success,
    p_transaction_id: success ? transaction.object_id : null,
    p_tracking_number: success ? transaction.tracking_number ?? null : null,
    p_evidence: success
      ? {
          status: transaction.status,
          label_url: transaction.label_url,
          tracking_url_provider: transaction.tracking_url_provider ?? null,
          eta: transaction.eta ?? null,
        }
      : { status: transaction.status, messages: (transaction.messages ?? []).map((message) => message.text).slice(0, 5) },
    p_actor_id: auth.user.id,
  });
  if (error) return legRpcError(error.message);
  if (!success) return NextResponse.json({ error: "LABEL_PURCHASE_FAILED" }, { status: 502 });

  if (transaction.tracking_number && leg.carrier) {
    try {
      await registerShippoTrackingWebhook(leg.carrier.toLowerCase(), transaction.tracking_number, context.matter.id);
    } catch {
      // Tracking registration failure never blocks the persisted label.
    }
  }
  return NextResponse.json({ success: true, leg: operatorShipmentLegProjection(Array.isArray(data) ? data[0] : data) });
}
