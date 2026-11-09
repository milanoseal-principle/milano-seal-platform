import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  calculatePaymentAmount,
  generateWisePaymentSession,
} from "@/lib/wise/payments";
import type { PaymentType } from "@/lib/wise/reference";


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

function minorUnits(value: number): number {
  return Math.round(value * 100);
}

export async function receivePaymentInstruction(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  adminFactory: typeof createAdminClient = createAdminClient,
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

  const supabase = adminFactory();

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

  if (deal.payment_disposition === "complimentary") {
    return NextResponse.json(
      { error: "Complimentary Matters do not create Wise payment instructions." },
      { status: 409 },
    );
  }

  const amount = calculatePaymentAmount(deal, paymentType);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      {
        error:
          "Payment amount is not canonically set for this obligation. Complete pricing review before requesting payment.",
      },
      { status: 422 },
    );
  }

  const currency = String(deal.currency || "USD").toUpperCase();

  const { data: activePayments, error: activeError } = await supabase
    .from("payments")
    .select("*")
    .eq("matter_id", deal.id)
    .eq("payment_type", paymentType)
    .in("payment_status", ["awaiting_payment", "payment_pending"])
    .order("created_at", { ascending: false })
    .limit(10);

  if (activeError) {
    console.error("[pay] active payment lookup failed:", activeError);
    return NextResponse.json(
      { error: "Payment state lookup failed", detail: activeError.message },
      { status: 500 },
    );
  }

  const matchingPayment = (activePayments ?? []).find(
    (payment) =>
      minorUnits(Number(payment.payment_amount)) === minorUnits(amount) &&
      String(payment.payment_currency || "").toUpperCase() === currency,
  );

  if (matchingPayment) {
    // A pending Wise movement is money-in-motion and must never be silently
    // replaced. An awaiting instruction is safe to reuse only when its amount
    // and currency still exactly equal current canonical Matter truth.
    return NextResponse.json({
      paymentUrl: matchingPayment.wise_payment_url,
      reference: matchingPayment.wise_reference,
      amount: Number(matchingPayment.payment_amount),
      currency: matchingPayment.payment_currency,
      description: matchingPayment.payment_description,
      status: matchingPayment.payment_status,
      existing: true,
    });
  }

  const pendingMismatch = (activePayments ?? []).find(
    (payment) => payment.payment_status === "payment_pending",
  );
  if (pendingMismatch) {
    return NextResponse.json(
      {
        error: "PAYMENT_REVIEW_REQUIRED",
        detail:
          "A Wise payment is already pending for a different amount or currency. Pricing cannot issue a replacement instruction until reconciliation review is complete.",
      },
      { status: 409 },
    );
  }

  // Any unmatched awaiting_payment row is only an unconsumed instruction from
  // an older price. It is safe to invalidate before generating current truth.
  const staleAwaitingIds = (activePayments ?? [])
    .filter((payment) => payment.payment_status === "awaiting_payment")
    .map((payment) => payment.id);

  if (staleAwaitingIds.length > 0) {
    const { error: staleDeleteError } = await supabase
      .from("payments")
      .delete()
      .in("id", staleAwaitingIds);

    if (staleDeleteError) {
      console.error("[pay] stale payment invalidation failed:", staleDeleteError);
      return NextResponse.json(
        { error: "Failed to invalidate stale Wise instruction" },
        { status: 500 },
      );
    }
  }

  let session;
  try {
    session = await generateWisePaymentSession({
      matterId: deal.id,
      matterReference: deal.deal_id,
      paymentType,
      amount,
      currency,
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
      payment_currency: currency,
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

  // Keep the Deal mirror aligned with the exact payment-row reference because
  // the signed Wise webhook resolves that reference before atomic confirmation.
  const { error: mirrorError } = await supabase
    .from("deals")
    .update({
      wise_reference: payment.wise_reference,
      payment_link: payment.wise_payment_url,
      amount_due: amount,
      payment_status: "unpaid",
      payment_confirmed: false,
      payment_confirmed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", deal.id);

  if (mirrorError) {
    await supabase.from("payments").delete().eq("id", payment.id);
    console.error("[pay] deal payment mirror failed:", mirrorError);
    return NextResponse.json(
      { error: "Failed to synchronize Wise payment instruction" },
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
