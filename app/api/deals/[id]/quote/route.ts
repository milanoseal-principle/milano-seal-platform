import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isFounderAdmin, isOperatorOrFounder } from "@/lib/security/access-control";
import { projectCanonicalQuote } from "@/lib/pricing/canonicalQuoteOrchestrator";
import { applyDiscountToMatter } from "@/src/features/discounts/discountService";

export const runtime = "nodejs";

const PRICING_VERSION = "canonical-private-v2";

async function operatorIdentity() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = user?.app_metadata?.role as string | undefined;
  if (!user || !isOperatorOrFounder(role)) return null;
  return {
    id: user.id,
    email: user.email ?? user.id,
    role: role ?? "",
    founder: isFounderAdmin(role),
  };
}

function paymentLocked(matter: Record<string, unknown>): boolean {
  const status = String(matter.payment_status ?? "unpaid").toLowerCase();
  const amountPaid = Number(matter.amount_paid ?? 0);
  const observedAt = matter.payment_observed_at;
  return (
    amountPaid > 0 ||
    observedAt !== null && observedAt !== undefined ||
    ["pending", "observed_pending", "processing", "paid", "refunded"].includes(status)
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const operator = await operatorIdentity();
    if (!operator) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const discountCode = String(body.discount_code ?? body.discountCode ?? "").trim();
    const manualAdjustment = Number(body.manual_adjustment ?? body.manualAdjustment ?? 0) || 0;

    if (manualAdjustment !== 0 && !operator.founder) {
      return NextResponse.json(
        {
          error: "Founder approval is required for manual pricing adjustments.",
          code: "FOUNDER_PRICING_OVERRIDE_REQUIRED",
        },
        { status: 403 },
      );
    }

    const admin = createAdminClient();
    const { data: matter, error: matterError } = await admin
      .from("deals")
      .select(
        "id,deal_id,client_name,email,payment_status,amount_paid,payment_observed_at,deal_status,discount_code",
      )
      .eq("id", id)
      .single();

    if (matterError || !matter) {
      return NextResponse.json({ error: "Matter not found." }, { status: 404 });
    }

    if (paymentLocked(matter as Record<string, unknown>)) {
      return NextResponse.json(
        {
          error: "Pricing is locked after payment activity begins.",
          code: "QUOTE_LOCKED_AFTER_PAYMENT_ACTIVITY",
        },
        { status: 409 },
      );
    }

    const projection = projectCanonicalQuote({
      ...body,
      discount_amount: 0,
      manual_adjustment: manualAdjustment,
    });

    if (projection.reviewRequired) {
      const { error: reviewError } = await admin
        .from("deals")
        .update({
          matter_pricing_type: projection.matterBase,
          quote_execution_method: projection.executionMethod,
          pricing_version: PRICING_VERSION,
          quote_breakdown: projection.quote.lineItems,
          quote_review_required: true,
          quote_review_reasons: projection.reviewReasons,
          deal_status: "reviewing",
        })
        .eq("id", id);
      if (reviewError) throw reviewError;

      await admin.from("matter_evidence_ledger").insert({
        matter_id: id,
        event_type: "quote_review_required",
        domain: "pricing",
        actor_type: "operator",
        actor_id: operator.id,
        source: "operator_quote_builder",
        new_value: {
          matter_pricing_type: projection.matterBase,
          execution_method: projection.executionMethod,
          review_reasons: projection.reviewReasons,
        },
        reason: "Governed exception blocked automatic final pricing.",
        metadata: { pricing_version: PRICING_VERSION },
      });

      return NextResponse.json(
        {
          ok: false,
          review_required: true,
          review_reasons: projection.reviewReasons,
          matter_base: projection.matterBase,
          execution_method: projection.executionMethod,
        },
        { status: 409 },
      );
    }

    const quote = projection.quote;
    const baseLine = quote.lineItems.find((item) => item.category === "base");
    const laneLabel =
      projection.matterBase === "authentication"
        ? "Authentication"
        : projection.matterBase === "international_passport_execution"
          ? "International Passport Execution"
          : projection.matterBase.charAt(0).toUpperCase() + projection.matterBase.slice(1);

    const quoteUpdate = {
      lane: laneLabel,
      execution_tier: laneLabel,
      base_price: baseLine?.amount ?? 0,
      witness_total: quote.lineItems
        .filter((item) => item.category === "witness")
        .reduce((sum, item) => sum + item.amount, 0),
      eligible_subtotal: projection.eligibleSubtotal,
      non_discountable_total: projection.nonDiscountableTotal,
      original_total: quote.subtotal,
      discount_amount: 0,
      final_total: quote.total,
      total_price: quote.total,
      invoice_subtotal: quote.subtotal,
      invoice_retainer: quote.depositAmount,
      invoice_balance: quote.balanceDue,
      amount_due: quote.depositAmount,
      currency: "USD",
      payment_status: "unpaid",
      deal_status: "awaiting_payment",
      matter_pricing_type: projection.matterBase,
      quote_execution_method: projection.executionMethod,
      pricing_version: PRICING_VERSION,
      quote_breakdown: quote.lineItems,
      quote_review_required: false,
      quote_review_reasons: [],
      quote_approved_at: new Date().toISOString(),
      quote_approved_by: operator.email,
    };

    const { data: quotedMatter, error: quoteError } = await admin
      .from("deals")
      .update(quoteUpdate)
      .eq("id", id)
      .select("*")
      .single();
    if (quoteError) throw quoteError;

    await admin.from("matter_evidence_ledger").insert({
      matter_id: id,
      event_type: "canonical_quote_approved",
      domain: "pricing",
      actor_type: "operator",
      actor_id: operator.id,
      source: "operator_quote_builder",
      new_value: {
        matter_pricing_type: projection.matterBase,
        execution_method: projection.executionMethod,
        subtotal: quote.subtotal,
        deposit_amount: quote.depositAmount,
        balance_due: quote.balanceDue,
        line_items: quote.lineItems,
      },
      reason: "Reviewed canonical private quote approved for payment gating.",
      metadata: { pricing_version: PRICING_VERSION },
    });

    let finalMatter = quotedMatter;
    if (discountCode) {
      finalMatter = await applyDiscountToMatter(id, discountCode, operator.email);
    }

    return NextResponse.json({
      ok: true,
      pricing_version: PRICING_VERSION,
      matter: finalMatter,
      quote: {
        matter_base: projection.matterBase,
        execution_method: projection.executionMethod,
        subtotal: quote.subtotal,
        eligible_subtotal: projection.eligibleSubtotal,
        non_discountable_total: projection.nonDiscountableTotal,
        deposit_amount: Number(finalMatter?.invoice_retainer ?? quote.depositAmount),
        balance_due: Number(finalMatter?.invoice_balance ?? quote.balanceDue),
        total: Number(finalMatter?.final_total ?? quote.total),
        line_items: quote.lineItems,
      },
    });
  } catch (error) {
    console.error("[deals/quote] canonical quote commit failed", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Quote commit failed.",
      },
      { status: 400 },
    );
  }
}
