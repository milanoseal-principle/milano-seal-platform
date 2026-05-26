import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapTrackingStatus } from "@/lib/shippo";
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

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // Webhook signature validation
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
      // Malformed JSON — still return 200 to prevent retries
      return NextResponse.json({ received: true });
    }

    if (payload.event === "track_updated" && payload.data?.tracking_number) {
      const trackingNumber = payload.data.tracking_number;
      const rawStatus = payload.data.tracking_status?.status;
      const mappedStatus = mapTrackingStatus(rawStatus);
      const eta = payload.data.eta ?? null;

      const admin = createAdminClient();

      // Find deal by tracking number
      const { data: deal } = await admin
        .from("deals")
        .select("id, delivery_status")
        .eq("tracking_number", trackingNumber)
        .maybeSingle();

      if (deal) {
        const updates: Record<string, unknown> = {
          delivery_status: mappedStatus,
          updated_at: new Date().toISOString(),
        };

        if (eta) {
          updates.delivery_eta = eta;
        }

        if (mappedStatus === "delivered") {
          updates.delivery_timestamp = new Date().toISOString();
          updates.deal_status = "completed";
        }

        await admin.from("deals").update(updates).eq("id", deal.id);

        // Log delivered event to custody ledger
        if (mappedStatus === "delivered") {
          await appendLedger({
            deal_id: deal.id,
            event: CUSTODY_EVENTS.DOC_DELIVERED,
            actor_type: "courier",
            location: null,
            method: "shipment",
            status: "delivered",
            notes: payload.data.tracking_status?.status_details ?? null,
            metadata: {
              tracking_number: trackingNumber,
              carrier: payload.data.carrier ?? null,
              raw_status: rawStatus,
              status_date: payload.data.tracking_status?.status_date ?? null,
            },
          });
        } else if (mappedStatus === "in_transit" || mappedStatus === "out_for_delivery") {
          await appendLedger({
            deal_id: deal.id,
            event:
              mappedStatus === "out_for_delivery"
                ? CUSTODY_EVENTS.DOC_OUT_FOR_DELIVERY
                : CUSTODY_EVENTS.DOC_IN_TRANSIT,
            actor_type: "courier",
            location: null,
            method: "shipment",
            status: mappedStatus,
            notes: payload.data.tracking_status?.status_details ?? null,
            metadata: {
              tracking_number: trackingNumber,
              carrier: payload.data.carrier ?? null,
              raw_status: rawStatus,
            },
          });
        }
      }
    }

    // Always return 200 — Shippo requires a 2xx response
    return NextResponse.json({ received: true });
  } catch {
    // Never throw — catch all errors and return 200 to prevent Shippo retries
    return NextResponse.json({ received: true });
  }
}
