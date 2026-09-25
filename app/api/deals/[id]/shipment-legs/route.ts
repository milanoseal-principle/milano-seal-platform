import { NextRequest, NextResponse } from "next/server";
import { buildRecipientAddressFromMatter, buildReturnAddress } from "@/lib/shippo/address";
import type { ShippoAddress } from "@/lib/shippo/types";
import {
  SHIPMENT_LEG_TYPES,
  createShipmentLeg,
  evaluateShipmentLegReadiness,
  operatorShipmentLegProjection,
  type ShipmentLegType,
} from "@/lib/intelligence/execution-brain/authorityLogistics";
import {
  authorizeLogisticsOperator,
  legRpcError,
  loadLogisticsContext,
} from "@/lib/intelligence/execution-brain/authorityLogisticsServer";

export const dynamic = "force-dynamic";

const ADDRESS_FIELDS = ["name", "company", "street1", "street2", "city", "state", "zip", "country", "phone", "email"] as const;

/** Operator-entered address (never AI-invented); only whitelisted string fields. */
function parseAddress(value: unknown): ShippoAddress | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const address: Record<string, string> = {};
  for (const field of ADDRESS_FIELDS) {
    if (typeof raw[field] === "string" && raw[field].trim()) address[field] = raw[field].trim().slice(0, 200);
  }
  if (address.country) address.country = address.country.toUpperCase();
  return address as unknown as ShippoAddress;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeLogisticsOperator();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const context = await loadLogisticsContext(id);
  if (!context) return NextResponse.json({ error: "MATTER_NOT_FOUND" }, { status: 404 });
  return NextResponse.json({
    matter_id: context.matter.id,
    packet_status: context.packet?.packetStatus ?? null,
    return_label_required: context.packet?.returnShippingRequired === true,
    legs: context.legs.map(operatorShipmentLegProjection),
  });
}

// Create a shipment leg. Origins/destinations default to canonical records
// (Milano return address, the Matter recipient, the outbound authority
// address); an authority address is operator-entered and never invented.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeLogisticsOperator();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const legType = String(body.leg_type ?? "") as ShipmentLegType;
  if (!(SHIPMENT_LEG_TYPES as readonly string[]).includes(legType)) {
    return NextResponse.json({ error: "INVALID_LEG_TYPE" }, { status: 400 });
  }
  const evidenceNote = String(body.evidence_note ?? "").trim();
  if (evidenceNote.length < 10) return NextResponse.json({ error: "EVIDENCE_NOTE_REQUIRED" }, { status: 400 });

  const context = await loadLogisticsContext(id);
  if (!context) return NextResponse.json({ error: "MATTER_NOT_FOUND" }, { status: 404 });

  const milano = buildReturnAddress();
  const outbound = context.legs.find((leg) => leg.leg_type === "outbound_to_authority" && leg.custody_status !== "exception");
  let origin: ShippoAddress | null;
  let destination: ShippoAddress | null;
  if (legType === "outbound_to_authority") {
    origin = milano;
    destination = parseAddress(body.destination);
  } else if (legType === "return_from_authority") {
    origin = parseAddress(body.origin) ?? ((outbound?.destination_json as unknown as ShippoAddress) ?? null);
    destination = milano;
  } else if (legType === "exception_return") {
    origin = parseAddress(body.origin) ?? milano;
    destination = parseAddress(body.destination);
  } else {
    origin = milano;
    destination = parseAddress(body.destination) ?? buildRecipientAddressFromMatter(context.matter);
  }

  const readiness = evaluateShipmentLegReadiness({
    legType,
    matter: context.facts,
    packet: context.packet,
    existingLegs: context.legs,
    origin,
    destination,
    operatorRequest: {
      explicitReturnRequest: body.explicit_return_request === true,
      releaseActionConfirmed: body.release_action_confirmed === true,
      exceptionReason: typeof body.exception_reason === "string" ? body.exception_reason : null,
    },
  });
  if (!readiness.allowed) {
    return NextResponse.json({ error: readiness.code, reasons: readiness.reasons }, { status: 409 });
  }

  try {
    const leg = await createShipmentLeg(context.admin, {
      matterId: context.matter.id,
      legType,
      origin: origin as ShippoAddress,
      destination: destination as ShippoAddress,
      exceptionReason: typeof body.exception_reason === "string" ? body.exception_reason : null,
      actorId: auth.user.id,
      reason: evidenceNote.slice(0, 1000),
      evidence: {
        packet_status: context.packet?.packetStatus ?? null,
        address_source: legType === "outbound_to_authority" || body.origin || body.destination ? "operator_entered" : "canonical_record",
      },
    });
    return NextResponse.json({ success: true, leg: operatorShipmentLegProjection(leg) }, { status: 201 });
  } catch (error) {
    return legRpcError(error instanceof Error ? error.message : undefined);
  }
}
