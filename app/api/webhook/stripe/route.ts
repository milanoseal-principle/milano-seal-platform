import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") || "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook error: ${err.message}` },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const dealId = session.metadata?.deal_id || session.client_reference_id;

    if (!dealId)
      return NextResponse.json({ received: true, skipped: "no deal_id" });

    const supabase = createAdminClient();

    const { error } = await supabase
      .from("deals")
      .update({
        payment_status: "paid",
        invoice_status: "paid",
        payment_method: "stripe",
        payment_reference: session.id,
        payment_amount_received: (session.amount_total || 0) / 100,
        status: "scheduled",
        paid_at: new Date().toISOString(),
      })
      .eq("deal_id", dealId)
      .eq("payment_status", "unpaid"); // idempotent guard

    if (error) {
      console.error("Stripe webhook DB error:", error);
      return NextResponse.json({ error: "DB update failed" }, { status: 500 });
    }

    // Auto-trigger schedule step
    try {
      const origin =
        process.env.NEXT_PUBLIC_SITE_URL || "https://themilanoseal.com";
      await fetch(`${origin}/api/runStep`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deal_id: dealId, step: "schedule" }),
      });
    } catch (e) {
      console.error("Auto runStep failed (non-fatal):", e);
    }

    return NextResponse.json({
      received: true,
      deal_id: dealId,
      action: "scheduled",
    });
  }

  return NextResponse.json({ received: true, skipped: "unhandled event" });
}
