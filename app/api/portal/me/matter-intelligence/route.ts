import { NextRequest, NextResponse } from "next/server";
import { getAllClientDeals } from "@/lib/portalAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Custody events that map to execution milestones (client-safe labels only)
const MILESTONE_EVENTS = new Set([
  "DOC_RECEIVED",
  "DOC_SIGNED",
  "DOC_NOTARIZED",
  "DOC_APOSTILLE_SUBMITTED",
  "DOC_APOSTILLE_RECEIVED",
  "DOC_LABEL_CREATED",
  "DOC_SHIPPED",
  "DOC_IN_TRANSIT",
  "DOC_OUT_FOR_DELIVERY",
  "DOC_DELIVERED",
  "DOC_RELEASE_CONFIRMED",
  "PAYMENT_CONFIRMED",
]);

const CLIENT_SAFE_EVENT_LABELS: Record<string, string> = {
  DOC_RECEIVED: "Documents received",
  DOC_SIGNED: "Notarization completed",
  DOC_NOTARIZED: "Notarization completed",
  DOC_APOSTILLE_SUBMITTED: "Apostille submitted",
  DOC_APOSTILLE_RECEIVED: "Apostille issued",
  DOC_LABEL_CREATED: "Courier label prepared",
  DOC_SHIPPED: "Released to courier",
  DOC_IN_TRANSIT: "In transit",
  DOC_OUT_FOR_DELIVERY: "Out for delivery",
  DOC_DELIVERED: "Delivered",
  DOC_RELEASE_CONFIRMED: "Delivery confirmed",
  PAYMENT_CONFIRMED: "Payment confirmed",
};

// Next-action copy derived from matter status — never leaks internal fields
function deriveNextAction(
  status: string | null,
  paymentStatus: string | null,
  isPaidAndReleased: boolean,
): string {
  if (isPaidAndReleased) return "Your matter is complete. All documents have been released.";
  const s = status ?? "";
  const p = paymentStatus ?? "";
  const paid = p === "paid" || p === "payment_confirmed" || s === "payment_confirmed";
  if (s === "new" || s === "intake_received") return "Your matter has been received and is under review.";
  if (s === "under_review" || s === "compliance_review") return "Procedural review is in progress.";
  if (s === "quoted" || (s === "awaiting_payment" && !paid)) return "Review your invoice and complete payment to unlock scheduling.";
  if (s === "awaiting_payment" && paid) return "Payment confirmed — scheduling is now unlocked.";
  if (s === "payment_confirmed") return "Payment confirmed — your coordinator will schedule the execution session.";
  if (s === "scheduled") return "Your execution session has been scheduled. Please prepare your documents and review the pre-flight checklist.";
  if (s === "in_execution") return "Execution is in progress. No action required.";
  if (s === "apostille_processing") return "Your document is in apostille processing. We will notify you when it ships.";
  if (s === "courier_ready") return "Your document is packaged and awaiting courier release.";
  if (s === "shipped") return "Your document has been released to courier. Track delivery on the Tracking page.";
  if (s === "delivered") return "Delivery confirmed. Your matter is closing.";
  if (s === "completed" || s === "closed") return "Your matter is complete.";
  return "Your coordinator will be in touch with the next steps.";
}

export async function GET(req: NextRequest) {
  const ctx = await getAllClientDeals();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ctx.deals.length) return NextResponse.json({ intelligence: null });

  const dealId = req.nextUrl.searchParams.get("deal_id");
  const deal = (dealId ? ctx.deals.find((d) => d.id === dealId) : null) ?? ctx.deals[0];
  if (!deal) return NextResponse.json({ error: "Matter not found" }, { status: 404 });

  const admin = createAdminClient();

  // Fetch client-safe custody milestones only
  const { data: ledgerRows } = await admin
    .from("custody_ledger")
    .select("id, event, actor_type, created_at")
    .eq("deal_id", deal.id)
    .order("created_at", { ascending: true });

  // Filter to milestone events only; never expose actor_id, label_url, storage_path
  const milestones = (ledgerRows ?? [])
    .filter((r) => MILESTONE_EVENTS.has(r.event as string))
    .map((r) => ({
      event: r.event as string,
      label: CLIENT_SAFE_EVENT_LABELS[r.event as string] ?? null,
      actor_type: r.actor_type as string,
      occurred_at: r.created_at as string,
    }));

  const paymentStatus = (deal as Record<string, unknown>).payment_status as string | null ?? null;
  const matterStatus = (deal as Record<string, unknown>).matter_status as string | null ?? null;
  const isPaidAndReleased = !!(deal as Record<string, unknown>).is_paid_and_released;
  const paid =
    paymentStatus === "paid" ||
    paymentStatus === "payment_confirmed" ||
    matterStatus === "payment_confirmed";

  // Determine gate states from real data
  const paymentGate = {
    confirmed: paid,
    paidAndReleased: isPaidAndReleased,
    schedulingUnlocked: paid,
    courierUnlocked: ["shipped", "delivered", "completed", "closed"].includes(matterStatus ?? ""),
    apostilleActive: ["apostille_processing", "courier_ready", "shipped", "delivered", "completed"].includes(matterStatus ?? ""),
  };

  return NextResponse.json({
    intelligence: {
      matter_id: deal.id,
      display_id: (deal as Record<string, unknown>).display_id as string | null ?? null,
      matter_status: matterStatus,
      payment_status: paymentStatus,
      paid_and_released: isPaidAndReleased,
      destination_country: (deal as Record<string, unknown>).destination_country as string | null ?? null,
      document_type: (deal as Record<string, unknown>).document_type as string | null ?? null,
      assigned_lane: (deal as Record<string, unknown>).assigned_lane as string | null ?? null,
      delivery_status: (deal as Record<string, unknown>).delivery_status as string | null ?? null,
      delivery_eta: (deal as Record<string, unknown>).delivery_eta as string | null ?? null,
      courier_carrier: (deal as Record<string, unknown>).courier_carrier as string | null ?? null,
      courier_tracking_id: (deal as Record<string, unknown>).courier_tracking_id as string | null ?? null,
      payment_gate: paymentGate,
      next_action: deriveNextAction(matterStatus, paymentStatus, isPaidAndReleased),
      milestones,
      coordinator: {
        name: "Nicholas Milano",
        organization: "The Milano Seal",
        contact_channel: "portal_messages",
      },
    },
  });
}
