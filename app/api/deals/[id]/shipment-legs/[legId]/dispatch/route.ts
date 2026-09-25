import { NextRequest, NextResponse } from "next/server";
import type { ShippoAddress } from "@/lib/shippo/types";
import {
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

// CONFIRM DISPATCH: operator-confirmed physical handoff to the carrier. Writes
// custody evidence to the canonical custody ledger. It never completes,
// releases or closes the Matter.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; legId: string }> }) {
  const auth = await authorizeLogisticsOperator();
  if ("error" in auth) return auth.error;
  const { id, legId } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const evidenceNote = String(body.evidence_note ?? "").trim();
  if (evidenceNote.length < 10) return NextResponse.json({ error: "EVIDENCE_NOTE_REQUIRED" }, { status: 400 });

  const context = await loadLogisticsContext(id);
  if (!context) return NextResponse.json({ error: "MATTER_NOT_FOUND" }, { status: 404 });
  const leg = await getShipmentLeg(context.admin, context.matter.id, legId);
  if (!leg) return NextResponse.json({ error: "SHIPMENT_LEG_NOT_FOUND" }, { status: 404 });

  // Final legs re-check the release / payment gates at the moment of handoff.
  if (leg.leg_type === "final_to_client" || leg.leg_type === "final_international") {
    const gate = evaluateShipmentLegReadiness({
      legType: leg.leg_type,
      matter: context.facts,
      packet: context.packet,
      existingLegs: context.legs.filter((other) => other.id !== leg.id),
      origin: leg.origin_json as unknown as ShippoAddress,
      destination: leg.destination_json as unknown as ShippoAddress,
      operatorRequest: { releaseActionConfirmed: body.release_action_confirmed === true },
    });
    if (!gate.allowed) return NextResponse.json({ error: gate.code, reasons: gate.reasons }, { status: 409 });
  }

  const { data, error } = await context.admin.rpc("record_shipment_leg_dispatch", {
    p_matter_id: context.matter.id,
    p_leg_id: leg.id,
    p_actor_id: auth.user.id,
    p_reason: evidenceNote.slice(0, 1000),
  });
  if (error) return legRpcError(error.message);
  return NextResponse.json({ success: true, leg: operatorShipmentLegProjection(Array.isArray(data) ? data[0] : data) });
}
