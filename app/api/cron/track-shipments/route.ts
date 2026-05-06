import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { track, mapTrackingStatus, detectCarrier } from "@/lib/shippo";
import { appendLedger, CUSTODY_EVENTS } from "@/lib/custodyLedger";
import { sendWhatsApp, sendAdminAlert } from "@/lib/whatsapp";
import { snapshotDeal } from "@/lib/dealBackup";
import { uploadEvidencePacket } from "@/lib/evidenceStorage";

export const runtime = "nodejs";

const STUCK_THRESHOLD_DAYS = 5;
const MS_PER_DAY = 86_400_000;

export async function POST(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const got = req.headers.get("x-cron-secret");
    if (got !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createAdminClient();
  const { data: deals } = await supabase
    .from("deals")
    .select("*")
    .not("tracking_number", "is", null)
    .neq("delivery_status", "delivered");

  const summary = {
    polled: 0,
    updated: 0,
    delivered: 0,
    escalated: 0,
    errors: [] as { deal_id: string; error: string }[],
  };

  for (const d of deals ?? []) {
    if (!d.tracking_number) continue;
    summary.polled++;

    const carrier =
      (d.carrier as string | null) || detectCarrier(d.tracking_number);

    try {
      const result = await track(carrier, d.tracking_number);
      const newStatus = mapTrackingStatus(result.tracking_status?.status);
      const signed = result.tracking_status?.status_details ?? null;
      const eta = result.eta ?? null;

      const prevStatus = d.delivery_status;
      const isDelivered = newStatus === "delivered";

      const updates: Record<string, unknown> = {
        delivery_status: newStatus,
        delivery_eta: eta,
        updated_at: new Date().toISOString(),
      };

      if (!d.carrier && carrier) {
        updates.carrier = carrier;
      }

      if (isDelivered) {
        updates.delivery_timestamp = new Date().toISOString();
        updates.signed_by = signed;
        updates.status = "completed";
      } else if (newStatus === "out_for_delivery" && signed) {
        updates.signed_by = signed;
      }

      await supabase.from("deals").update(updates).eq("id", d.id);
      summary.updated++;

      if (prevStatus !== newStatus) {
        const eventMap: Record<string, string> = {
          in_transit: CUSTODY_EVENTS.DOC_IN_TRANSIT,
          out_for_delivery: CUSTODY_EVENTS.DOC_OUT_FOR_DELIVERY,
          delivered: CUSTODY_EVENTS.DOC_DELIVERED,
        };
        const event = eventMap[newStatus];
        if (event) {
          await appendLedger({
            deal_id: d.id,
            event,
            actor_type: "courier",
            location: result.tracking_status?.location?.city
              ? `${result.tracking_status.location.city}, ${result.tracking_status.location.state ?? ""}`.trim()
              : "Destination",
            method: "delivery",
            status: newStatus,
            metadata: {
              carrier,
              tracking: d.tracking_number,
              signed_by: signed,
            },
          });
        }
      }

      if (isDelivered && signed) {
        await appendLedger({
          deal_id: d.id,
          event: CUSTODY_EVENTS.DOC_SIGNED,
          actor_type: "recipient",
          location: "Destination",
          method: "signature",
          status: "signed",
          metadata: {
            signed_by: signed,
            tracking: d.tracking_number,
            carrier,
          },
        });

        if (d.phone) {
          await sendWhatsApp(
            d.phone,
            `Milano Seal: your documents have been delivered and signed for by ${signed}.\nTracking: ${d.tracking_number}`,
            { dealId: d.id },
          );
        }

        void snapshotDeal({
          deal_id: d.id,
          trigger: "completion",
          deal: { ...d, ...updates },
        }).catch(() => {});
        void uploadEvidencePacket(d.id).catch(() => {});

        summary.delivered++;
      }

      if (newStatus === "in_transit") {
        const anchor =
          (d.delivery_timestamp as string | null) ||
          (d.updated_at as string | null) ||
          (d.created_at as string | null);
        if (anchor) {
          const days = (Date.now() - new Date(anchor).getTime()) / MS_PER_DAY;
          if (days > STUCK_THRESHOLD_DAYS) {
            void sendAdminAlert(
              `Shipping delay risk · ${d.deal_id ?? d.id} · ${carrier.toUpperCase()} ${d.tracking_number} stuck ${Math.floor(days)} days`,
            ).catch(() => {});
            summary.escalated++;
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[cron/track-shipments] error for deal ${d.id}:`, msg);
      summary.errors.push({ deal_id: d.id, error: msg });
    }
  }

  return NextResponse.json(summary);
}

export async function GET(req: NextRequest) {
  return POST(req);
}
