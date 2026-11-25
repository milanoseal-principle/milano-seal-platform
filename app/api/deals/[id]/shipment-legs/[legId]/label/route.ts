import { NextRequest, NextResponse } from "next/server";
import {
  classifyShippoPurchaseError,
  getShippoTransaction,
  purchaseShippoLabel,
  registerShippoTrackingWebhook,
  shippoRequest,
} from "@/lib/shippo/client";
import type { ShippoTransaction } from "@/lib/shippo/types";
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
  type LogisticsContext,
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

  if (body.action === "reconcile") {
    // RECONCILE AMBIGUOUS PURCHASE. Only a leg stuck in purchase_pending (the
    // provider outcome is unknown) can be reconciled. The operator either
    // supplies the provider transaction id — which is fetched read-only and
    // must match the leg's persisted rate — or attests, with evidence, that
    // the provider shows no transaction for this rate. Nothing is purchased.
    if (leg.label_status !== "purchase_pending" || !leg.rate_snapshot) {
      return NextResponse.json({ error: "LABEL_PURCHASE_NOT_PENDING" }, { status: 409 });
    }
    const transactionRef = typeof body.provider_transaction_id === "string" ? body.provider_transaction_id.trim() : "";
    if (transactionRef) {
      let found: ShippoTransaction;
      try {
        found = await getShippoTransaction(transactionRef);
      } catch {
        return NextResponse.json({ error: "PROVIDER_TRANSACTION_LOOKUP_FAILED" }, { status: 502 });
      }
      if (!found.rate || found.rate !== leg.rate_snapshot.provider_rate_id) {
        return NextResponse.json({ error: "PROVIDER_TRANSACTION_RATE_MISMATCH" }, { status: 409 });
      }
      const outcome = await recordPurchaseOutcome(context, leg.id, auth.user.id, found);
      return outcome;
    }
    if (body.confirmed_not_purchased !== true) {
      return NextResponse.json({ error: "RECONCILIATION_EVIDENCE_REQUIRED" }, { status: 400 });
    }
    const { data, error } = await context.admin.rpc("record_shipment_leg_label", {
      p_matter_id: context.matter.id,
      p_leg_id: leg.id,
      p_success: false,
      p_transaction_id: null,
      p_tracking_number: null,
      p_evidence: { reconciliation: "operator_confirmed_no_provider_transaction", note: evidenceNote.slice(0, 1000) },
      p_actor_id: auth.user.id,
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

  let transaction: ShippoTransaction;
  try {
    transaction = await purchaseShippoLabel(leg.rate_snapshot!.provider_rate_id, `matter:${context.matter.id};leg:${leg.id}`);
  } catch (error) {
    if (classifyShippoPurchaseError(error) === "OUTCOME_UNKNOWN") {
      // Timeout / network / provider 5xx: the provider may have created the
      // transaction. The leg stays purchase_pending, which blocks any further
      // claim, until an operator reconciles it. Never blindly retried.
      return NextResponse.json(
        {
          error: "PURCHASE_OUTCOME_UNKNOWN",
          reasons: ["The provider did not confirm the outcome. Reconcile against the provider transaction before any further action."],
        },
        { status: 409 },
      );
    }
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

  return recordPurchaseOutcome(context, leg.id, auth.user.id, transaction, leg.carrier);
}

/**
 * Persists a provider transaction outcome for a purchase_pending leg.
 * SUCCESS → label created. ERROR → definitive failure (leg returns to
 * rate_selected). Any other status (QUEUED / WAITING) is still pending at the
 * provider, so the leg stays locked and must be reconciled later.
 */
async function recordPurchaseOutcome(
  context: LogisticsContext,
  legId: string,
  actorId: string,
  transaction: ShippoTransaction,
  carrier?: string | null,
) {
  const status = String(transaction.status ?? "").toUpperCase();
  const success = status === "SUCCESS" && Boolean(transaction.object_id);
  if (!success && status !== "ERROR") {
    return NextResponse.json(
      {
        error: "PURCHASE_OUTCOME_UNKNOWN",
        provider_transaction_ref: transaction.object_id ?? null,
        reasons: [`Provider transaction status is ${status || "unknown"}. Reconcile with this transaction reference once it settles.`],
      },
      { status: 409 },
    );
  }
  const { data, error } = await context.admin.rpc("record_shipment_leg_label", {
    p_matter_id: context.matter.id,
    p_leg_id: legId,
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
    p_actor_id: actorId,
  });
  if (error) {
    if (success) {
      // Provider purchased but persistence failed: the leg remains
      // purchase_pending (no second purchase is possible) and the provider
      // reference is returned so the operator can reconcile it.
      return NextResponse.json(
        { error: "LABEL_PERSIST_FAILED_RECONCILE_REQUIRED", provider_transaction_ref: transaction.object_id },
        { status: 500 },
      );
    }
    return legRpcError(error.message);
  }
  if (!success) return NextResponse.json({ error: "LABEL_PURCHASE_FAILED" }, { status: 502 });

  const row = Array.isArray(data) ? data[0] : data;
  const trackingCarrier = carrier ?? (row as { carrier?: string | null } | null)?.carrier ?? null;
  if (transaction.tracking_number && trackingCarrier) {
    try {
      await registerShippoTrackingWebhook(trackingCarrier.toLowerCase(), transaction.tracking_number, context.matter.id);
    } catch {
      // Tracking registration failure never blocks the persisted label; the
      // leg exception detector surfaces missing tracking to the operator.
    }
  }
  return NextResponse.json({ success: true, leg: operatorShipmentLegProjection(row) });
}
