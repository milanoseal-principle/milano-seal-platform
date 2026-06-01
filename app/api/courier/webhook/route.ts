import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { appendLedger, CUSTODY_EVENTS } from "@/lib/custodyLedger";

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

    // Signature validation — required when SHIPPO_WEBHOOK_SECRET is set
    const secret = process.env.SHIPPO_WEBHOOK_SECRET;
    if (secret) {
      const signature = req.headers.get("X-Shippo-Signature-HMAC-SHA256-V2");
      if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 401 });
      }
      const expected = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");
      if (
        !crypto.timingSafeEqual(
          Buffer.from(signature, "hex"),
          Buffer.from(expected, "hex"),
        )
      ) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    let payload: ShippoWebhookEvent;
    try {
      payload = JSON.parse(rawBody) as ShippoWebhookEvent;
    } catch {
      return NextResponse.json({ received: true });
    }

    if (payload.event === "track_updated" && payload.data?.tracking_number) {
      const trackingNumber = payload.data.tracking_number;
      const rawStatus = payload.data.tracking_status?.status;
      const { custodyEvent, deliveryStatus, isTerminal, isException } = mapShippoStatus(rawStatus);
      const eta = payload.data.eta ?? null;

      const admin = createAdminClient();

      const { data: deal } = await admin
        .from("deals")
        .select("id, delivery_status, deal_status")
        .eq("tracking_number", trackingNumber)
        .maybeSingle();

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
          updates.deal_status = "completed";
        }

        await admin.from("deals").update(updates).eq("id", deal.id);

        await appendLedger({
          deal_id: deal.id,
          event: custodyEvent,
          actor_type: "courier",
          location: null,
          method: "shipment",
          status: deliveryStatus,
          notes: isException
            ? (payload.data.tracking_status?.status_details ?? "Courier exception reported.")
            : (payload.data.tracking_status?.status_details ?? null),
          metadata: {
            tracking_number: trackingNumber,
            carrier: payload.data.carrier ?? null,
            raw_status: rawStatus,
            status_date: payload.data.tracking_status?.status_date ?? null,
            is_exception: isException,
          },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ received: true });
  }
}
