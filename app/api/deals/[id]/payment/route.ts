import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity";

const VALID_METHODS = ["wise"] as const;
const CLIENT_WRITABLE_STATUSES = ["unpaid", "partial"] as const;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const paymentMethod = String(body.payment_method ?? "wise").toLowerCase();
    const paymentStatus = String(body.payment_status ?? "unpaid").toLowerCase();
    const paymentReference = body.payment_reference ? String(body.payment_reference) : null;
    const paymentAmountReceived = Number(body.payment_amount_received ?? 0);

    if (!(VALID_METHODS as readonly string[]).includes(paymentMethod)) {
      return NextResponse.json({ error: "Wise Business is the only supported payment method." }, { status: 400 });
    }

    // Browser/operator form submissions can record initiation/partial observations,
    // but they cannot authoritatively mark a transfer paid. Confirmed payment is
    // written only by the signature-verified Wise reconciliation path.
    if (!(CLIENT_WRITABLE_STATUSES as readonly string[]).includes(paymentStatus)) {
      return NextResponse.json(
        { error: "Confirmed payment status is server-verified through Wise reconciliation." },
        { status: 409 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: deal, error: dealError } = await supabase
      .from("deals")
      .select("id,deal_id,payment_status,wise_reference")
      .eq("id", id)
      .single();
    if (dealError || !deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    const update = {
      payment_method: "wise",
      payment_status: paymentStatus,
      payment_reference: paymentReference,
      payment_amount_received: Number.isFinite(paymentAmountReceived) ? Math.max(0, paymentAmountReceived) : 0,
      updated_at: new Date().toISOString(),
    };

    const { data: updated, error } = await supabase
      .from("deals")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Payment update failed" }, { status: 500 });
    }

    await logActivity({
      deal_id: (updated?.deal_id as string) ?? id,
      actor: user.email ?? user.id,
      action: "payment_updated",
      detail: `Wise payment status → ${paymentStatus}`,
      meta: {
        method: "wise",
        status: paymentStatus,
        amount: update.payment_amount_received,
        reference: paymentReference,
        authoritative_confirmation: false,
      },
    });

    return NextResponse.json({
      success: true,
      deal: updated,
      scheduling_unlocked: false,
      message: "Wise transfer recorded. Scheduling remains locked until payment is reconciled server-side.",
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
