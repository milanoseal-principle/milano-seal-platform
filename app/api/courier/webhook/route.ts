import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CUSTODY_EVENTS } from "@/lib/custodyLedger";
import { verifyShippoHmac } from "@/lib/shippo/webhookAuth";
import { updateShipmentLegFromProvider } from "@/lib/intelligence/execution-brain/authorityLogistics";

export const dynamic = "force-dynamic";

interface ShippoWebhookEvent {
  event?: string;
  data?: {
    tracking_number?: string;
    tracking_status?: {
      status?: string;
      status_details?: string;
      status_date?: string;
    };
    eta?: string;
    carrier?: string;
    transaction?: string;
    metadata?: string;
    tracking_status_substatus?: { code?: string };
  };
}

// Maps Shippo canonical status codes → internal custody events + deal delivery_status
function mapShippoStatus(raw: string | undefined): {
  custodyEvent: string;
  deliveryStatus: string;
  isTerminal: boolean;
  isException: boolean;
} {
  const s = (raw ?? "").toUpperCase();
  switch (s) {
    case "PRE_TRANSIT":
      return { custodyEvent: CUSTODY_EVENTS.DOC_LABEL_CREATED, deliveryStatus: "label_created", isTerminal: false, isException: false };
    case "TRANSIT":
      return { custodyEvent: CUSTODY_EVENTS.DOC_IN_TRANSIT, deliveryStatus: "in_transit", isTerminal: false, isException: false };
    case "OUT_FOR_DELIVERY":
      return { custodyEvent: CUSTODY_EVENTS.DOC_OUT_FOR_DELIVERY, deliveryStatus: "out_for_delivery", isTerminal: false, isException: false };
    case "DELIVERED":
      return { custodyEvent: CUSTODY_EVENTS.DOC_DELIVERED, deliveryStatus: "delivered", isTerminal: true, isException: false };
    case "RETURNED":
      return { custodyEvent: CUSTODY_EVENTS.COURIER_RETURNED, deliveryStatus: "returned", isTerminal: true, isException: true };
    case "FAILURE":
      return { custodyEvent: CUSTODY_EVENTS.COURIER_EXCEPTION, deliveryStatus: "exception", isTerminal: false, isException: true };
    default:
      return { custodyEvent: CUSTODY_EVENTS.COURIER_UPDATE_RECEIVED, deliveryStatus: "unknown", isTerminal: false, isException: false };
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    const auth = verifyShippoHmac(
      rawBody,
      req.headers.get("X-Shippo-Signature-HMAC-SHA256-V2"),
    );
    if (!auth.ok) {
      if (auth.status === 500) {
        console.error(
          "[courier-webhook] Shippo webhook secret is not configured",
        );
      }
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    let payload: ShippoWebhookEvent;
    try {
      payload = JSON.parse(rawBody) as ShippoWebhookEvent;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 },
      );
    }

    if (payload.event === "track_updated" && payload.data?.tracking_number) {
      const trackingNumber = payload.data.tracking_number;
      const rawStatus = payload.data.tracking_status?.status;
      const { custodyEvent, deliveryStatus, isTerminal, isException } = mapShippoStatus(rawStatus);
      const eta = payload.data.eta ?? null;

      const admin = createAdminClient();

      const { data: deal, error: dealError } = await admin
        .from("deals")
        .select("id, delivery_status, deal_status")
        .eq("tracking_number", trackingNumber)
        .maybeSingle();

      if (dealError) throw new Error("Courier Matter lookup failed");

      if (deal) {
        const updates: Record<string, unknown> = {
          delivery_status: deliveryStatus,
          updated_at: new Date().toISOString(),
        };

        if (eta && !isTerminal) {
          updates.delivery_eta = eta;
        }

        if (deliveryStatus === "delivered") {
          updates.delivery_timestamp = new Date().toISOString();
        }

        const { error: transitionError } = await admin.rpc(
          "record_courier_delivery_transition",
          {
            p_matter_id: deal.id,
            p_updates: updates,
            p_event: custodyEvent,
            p_status: deliveryStatus,
            p_notes: isException
              ? (payload.data.tracking_status?.status_details ??
                "Courier exception reported.")
              : (payload.data.tracking_status?.status_details ?? null),
            p_metadata: {
              tracking_number: trackingNumber,
              carrier: payload.data.carrier ?? null,
              raw_status: rawStatus,
              status_date: payload.data.tracking_status?.status_date ?? null,
              is_exception: isException,
            },
          },
        );
        if (transitionError) {
          throw new Error("Courier transition persistence failed");
        }
      }

      // Matter-linked shipment legs (authority / return / final legs). Same
      // HMAC-verified event; idempotent, Matter-safe and leg-specific. Leg
      // custody never completes or releases the Matter.
      await updateShipmentLegFromProvider(admin, {
        trackingNumber,
        transactionId: payload.data.transaction ?? null,
        metadataMatterId: payload.data.metadata ?? null,
        status: rawStatus ?? "UNKNOWN",
        substatus: payload.data.tracking_status_substatus?.code ?? null,
        statusDetails: payload.data.tracking_status?.status_details ?? null,
        statusDate: payload.data.tracking_status?.status_date ?? null,
        carrier: payload.data.carrier ?? null,
        raw: {
          tracking_number: trackingNumber,
          carrier: payload.data.carrier ?? null,
          status: rawStatus ?? null,
          status_date: payload.data.tracking_status?.status_date ?? null,
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(
      "[courier-webhook] Processing failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
