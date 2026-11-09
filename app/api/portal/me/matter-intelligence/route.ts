import { NextRequest, NextResponse } from "next/server";
import { getAllClientDeals } from "@/lib/portalAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  evaluateSchedulingGate,
  type ComplimentaryGateMatter,
} from "@/lib/scheduling/complimentarySchedulingGate";

export const runtime = "nodejs";

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
  PAYMENT_CONFIRMED: "Payment evidence recorded",
};

function deriveNextAction(params: {
  matterStatus: string | null;
  settlementVerified: boolean;
  schedulingEligible: boolean;
  isPaidAndReleased: boolean;
}): string {
  if (params.isPaidAndReleased) {
    return "Your matter is complete. All settlement-dependent release requirements were satisfied and the documents were released.";
  }

  const status = params.matterStatus ?? "";

  if (status === "new" || status === "intake_received") {
    return "Your matter has been received and is under review.";
  }
  if (status === "under_review" || status === "compliance_review") {
    return "Procedural review is in progress.";
  }
  if (status === "quoted" || status === "awaiting_payment") {
    if (params.schedulingEligible && !params.settlementVerified) {
      return "Payment submission is recorded. Scheduling remains locked until Wise settlement is verified.";
    }
    if (params.settlementVerified) {
      return "Verified Wise settlement is recorded and scheduling authority is available.";
    }
    return "Review your invoice and complete the governed Wise payment step before scheduling can proceed.";
  }
  if (status === "payment_confirmed") {
    if (params.settlementVerified) {
      return "Verified Wise settlement is recorded. Your coordinator can proceed with scheduling when execution requirements are ready.";
    }
    if (params.schedulingEligible) {
      return "Payment authority is recorded for scheduling. Verified Wise settlement remains separate and may still be pending.";
    }
    return "Payment evidence is recorded, but scheduling authority still requires review.";
  }
  if (status === "scheduled") {
    return "Your execution session has been scheduled. Please prepare your documents and review the pre-flight checklist.";
  }
  if (status === "in_execution") return "Execution is in progress. No action is required unless your coordinator contacts you.";
  if (status === "apostille_processing") return "Apostille processing is underway. We will update the Matter when verified downstream evidence is recorded.";
  if (status === "courier_ready") return "Your documents are prepared for the governed release and courier step.";
  if (status === "shipped") return "Your documents have been released to courier. Track delivery on the Tracking page.";
  if (status === "delivered") return "Delivery is recorded. Final Matter closeout is in progress.";
  if (status === "completed" || status === "closed") return "Your matter is complete.";
  return "Your coordinator will be in touch with the next governed step.";
}

function paymentGateMatter(d: Record<string, unknown>, dealId: string): ComplimentaryGateMatter {
  return {
    id: dealId,
    deal_id: dealId,
    payment_status: (d.payment_status as string | null) ?? null,
    payment_confirmed: (d.payment_confirmed as boolean | null) ?? null,
    payment_disposition: (d.payment_disposition as string | null) ?? null,
    payment_settlement_status:
      (d.payment_settlement_status as string | null) ??
      (d.settlement_status as string | null) ??
      null,
    payment_observed_at: (d.payment_observed_at as string | null) ?? null,
    comp_authorized: (d.comp_authorized as boolean | null) ?? null,
    comp_authorization_id: (d.comp_authorization_id as string | null) ?? null,
    comp_authorized_at: (d.comp_authorized_at as string | null) ?? null,
    comp_revoked_at: (d.comp_revoked_at as string | null) ?? null,
    amount_due: typeof d.amount_due === "number" ? d.amount_due : Number(d.amount_due ?? 0),
    amount_paid: typeof d.amount_paid === "number" ? d.amount_paid : Number(d.amount_paid ?? 0),
    verified_revenue:
      typeof d.verified_revenue === "number" ? d.verified_revenue : Number(d.verified_revenue ?? 0),
    currency: (d.currency as string | null) ?? null,
    wise_reference: (d.wise_reference as string | null) ?? null,
    payment_observed_amount:
      d.payment_observed_amount == null ? null : Number(d.payment_observed_amount),
    payment_observed_currency: (d.payment_observed_currency as string | null) ?? null,
    payment_observed_reference: (d.payment_observed_reference as string | null) ?? null,
  };
}

export async function GET(req: NextRequest) {
  const ctx = await getAllClientDeals();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ctx.deals.length) return NextResponse.json({ intelligence: null });

  const dealId = req.nextUrl.searchParams.get("deal_id");
  const deal = (dealId ? ctx.deals.find((item) => item.id === dealId) : null) ?? ctx.deals[0];
  if (!deal) return NextResponse.json({ error: "Matter not found" }, { status: 404 });

  const admin = createAdminClient();
  const { data: ledgerRows } = await admin
    .from("custody_ledger")
    .select("id, event, actor_type, created_at")
    .eq("deal_id", deal.id)
    .order("created_at", { ascending: true });

  const milestones = (ledgerRows ?? [])
    .filter((row) => MILESTONE_EVENTS.has(row.event as string))
    .map((row) => ({
      event: row.event as string,
      label: CLIENT_SAFE_EVENT_LABELS[row.event as string] ?? null,
      actor_type: row.actor_type as string,
      occurred_at: row.created_at as string,
    }));

  const d = deal as unknown as Record<string, unknown>;
  const paymentStatus = (d.payment_status as string | null) ?? null;
  const matterStatus = (d.matter_status as string | null) ?? (d.status as string | null) ?? null;
  const isPaidAndReleased = d.is_paid_and_released === true;
  const scheduling = evaluateSchedulingGate({ matter: paymentGateMatter(d, deal.id) });
  const settlementVerified = scheduling.paymentRequirementMethod === "verified_payment";
  const paymentSubmitted =
    Boolean(d.payment_observed_at);

  const paymentGate = {
    confirmed: settlementVerified,
    settlementVerified,
    submissionObserved: paymentSubmitted,
    paidAndReleased: isPaidAndReleased,
    schedulingUnlocked: scheduling.schedulingEligible,
    schedulingMethod: scheduling.paymentRequirementMethod,
    schedulingReason: scheduling.reason,
    courierUnlocked: ["shipped", "delivered", "completed", "closed"].includes(matterStatus ?? ""),
    apostilleActive: ["apostille_processing", "courier_ready", "shipped", "delivered", "completed"].includes(matterStatus ?? ""),
  };

  const rawCarrier = (d.courier_carrier as string | null) ?? null;
  const rawTracking = (d.courier_tracking_id as string | null) ?? null;
  const deliveryStatus = (d.delivery_status as string | null) ?? null;
  const deliveredAt = (d.delivery_timestamp as string | null) ?? null;
  const updatedAt = (d.updated_at as string | null) ?? null;
  const trackingDisplay = rawTracking ? `···${rawTracking.slice(-6)}` : null;
  const courierStatus = rawCarrier || rawTracking || deliveryStatus
    ? {
        carrier: rawCarrier,
        tracking_number_display: trackingDisplay,
        status: deliveryStatus,
        last_updated: updatedAt,
        delivered_at: deliveredAt,
      }
    : null;

  return NextResponse.json({
    intelligence: {
      matter_id: deal.id,
      display_id: (d.display_id as string | null) ?? null,
      matter_status: matterStatus,
      payment_status: paymentStatus,
      paid_and_released: isPaidAndReleased,
      destination_country: (d.destination_country as string | null) ?? null,
      document_type: (d.document_type as string | null) ?? null,
      assigned_lane: (d.assigned_lane as string | null) ?? null,
      delivery_status: deliveryStatus,
      delivery_eta: (d.delivery_eta as string | null) ?? null,
      courier_carrier: rawCarrier,
      courier_tracking_id: rawTracking,
      courier_status: courierStatus,
      payment_gate: paymentGate,
      next_action: deriveNextAction({
        matterStatus,
        settlementVerified,
        schedulingEligible: scheduling.schedulingEligible,
        isPaidAndReleased,
      }),
      milestones,
      coordinator: {
        name: "Nicholas Milano",
        organization: "The Milano Seal",
        contact_channel: "portal_messages",
      },
    },
  });
}
