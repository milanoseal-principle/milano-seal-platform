import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  calculatePaymentAmount,
  generateWisePaymentSession,
} from "@/lib/wise/payments";
import type { PaymentType } from "@/lib/wise/reference";

export const runtime = "nodejs";
export const maxDuration = 30;

const VALID_PAYMENT_TYPES: PaymentType[] = [
  "retainer",
  "final_balance",
  "rush_upgrade",
  "translation_addon",
  "additional_apostille",
  "supplemental",
];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "Missing deal id in path" },
      { status: 400 },
    );
  }

  let body: { paymentType?: PaymentType } = {};
  try {
    if (req.headers.get("content-length") !== "0") {
      body = await req.json();
    }
  } catch {}
  const paymentType: PaymentType = body.paymentType || "retainer";
  if (!VALID_PAYMENT_TYPES.includes(paymentType)) {
    return NextResponse.json(
      { error: `Invalid paymentType: ${paymentType}` },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  const { data: deal, error: dealError } = await supabase
    .from("deals")
    .select("*")
    .eq(UUID_RE.test(id) ? "id" : "deal_id", id)
    .maybeSingle();

  if (dealError) {
    console.error("[pay] deal lookup failed:", dealError);
    return NextResponse.json(
      { error: "Deal lookup failed", detail: dealError.message },
      { status: 500 },
    );
  }
  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  const { data: existingPayment } = await supabase
    .from("payments")
    .select("*")
    .eq("matter_id", deal.id)
    .eq("payment_type", paymentType)
    .in("payment_status", ["awaiting_payment", "payment_pending"])
    .maybeSingle();

  if (existingPayment) {
    return NextResponse.json({
      paymentUrl: existingPayment.wise_payment_url,
      reference: existingPayment.wise_reference,
      amount: Number(existingPayment.payment_amount),
      currency: existingPayment.payment_currency,
      description: existingPayment.payment_description,
      status: existingPayment.payment_status,
      existing: true,
    });
  }

  const amount = calculatePaymentAmount(deal, paymentType);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      {
        error:
          "Payment amount is not set on this deal — fill `amount` (or the appropriate fee field) before requesting payment.",
      },
      { status: 422 },
    );
  }

  let session;
  try {
    session = await generateWisePaymentSession({
      matterId: deal.id,
      matterReference: deal.deal_id,
      paymentType,
      amount,
      currency: deal.currency || "USD",
      payerName: deal.client_name,
      payerEmail: deal.email,
      founderName: deal.assigned_operator || "Nicholas Milano",
    });
  } catch (e) {
    console.error("[pay] Wise session creation failed:", e);
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? e.message
            : "Wise payment session generation failed",
      },
      { status: 502 },
    );
  }

  const { data: payment, error: insertError } = await supabase
    .from("payments")
    .insert({
      matter_id: deal.id,
      wise_payment_url: session.paymentUrl,
      wise_reference: session.reference,
      wise_session_id: session.sessionId,
      payment_type: paymentType,
      payment_amount: amount,
      payment_currency: deal.currency || "USD",
      payment_description: session.description,
      payment_status: "awaiting_payment",
      payer_name: deal.client_name,
      payer_email: deal.email,
    })
    .select()
    .single();

  if (insertError) {
    console.error("[pay] payments insert failed:", insertError);
    return NextResponse.json(
      { error: "Failed to record payment", detail: insertError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    paymentUrl: payment.wise_payment_url,
    reference: payment.wise_reference,
    amount: Number(payment.payment_amount),
    currency: payment.payment_currency,
    description: payment.payment_description,
    status: payment.payment_status,
    mode: session.mode,
  });
}
