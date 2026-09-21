import { NextRequest, NextResponse } from "next/server";
import {
  executionQuoteReviewReasons,
  normalizeExecutionTruth,
} from "@/lib/matter/executionTruth";
import { projectCanonicalQuote } from "@/lib/pricing/canonicalQuoteOrchestrator";
import { projectQuoteRouteIntelligence } from "@/lib/pricing/destinationDocumentQuoteIntelligence";

export const runtime = "nodejs";

interface QuoteInput extends Record<string, unknown> {
  origin_state?: string;
  destination_country?: string;
  document_type?: string;
  docs_count?: number;
  signers?: number;
  witnesses?: number;
  witness_type?: "ron" | "in_person";
  after_hours?: boolean;
  urgency?: "standard" | "urgent";
  miles?: number;
  translation?: boolean;
  multi_country?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as QuoteInput;
    const truth = normalizeExecutionTruth(body);
    const executionReviewReasons = executionQuoteReviewReasons(truth);
    const routeIntelligence = projectQuoteRouteIntelligence(body);

    if (executionReviewReasons.length > 0) {
      return NextResponse.json({
        matter_base: null,
        execution_method: truth.execution_method,
        lane: "Review Required",
        base: 0,
        total: null,
        deposit_amount: null,
        balance_due: null,
        eligible_subtotal: null,
        non_discountable_total: null,
        breakdown: [],
        review_required: true,
        review_reasons: executionReviewReasons,
        rationale:
          "Execution facts require operator resolution before a payment amount can be approved.",
        route_intelligence: routeIntelligence,
      });
    }

    const projection = projectCanonicalQuote({
      ...body,
      execution_method: truth.execution_method,
      notarization_requirement: truth.notarization_requirement,
      authentication_requirement: truth.authentication_requirement,
      ...routeIntelligence.pricingFacts,
    });

    const quote = projection.quote;
    const baseLine = quote.lineItems.find((item) => item.category === "base");

    return NextResponse.json({
      matter_base: projection.matterBase,
      execution_method: projection.executionMethod,
      lane: baseLine?.label ?? projection.matterBase,
      base: baseLine?.amount ?? 0,
      subtotal: quote.subtotal,
      discount_amount: quote.discountAmount,
      total: quote.total,
      deposit_amount: quote.depositAmount,
      balance_due: quote.balanceDue,
      eligible_subtotal: projection.eligibleSubtotal,
      non_discountable_total: projection.nonDiscountableTotal,
      breakdown: quote.lineItems.map((item) => ({
        code: item.code,
        label: item.label,
        amount: item.amount,
        category: item.category,
      })),
      payment_mode: quote.paymentMode,
      review_required: projection.reviewRequired,
      review_reasons: projection.reviewReasons,
      rationale: projection.reviewRequired
        ? "The Matter contains a governed exception that requires operator review before payment is requested."
        : "Canonical private pricing composed from the reviewed Matter scope.",
      pricing_guards: quote.pricingGuards,
      route_intelligence: routeIntelligence,
    });
  } catch (error) {
    console.error("[pricing/quote] error:", error);
    return NextResponse.json(
      { error: "Failed to compute quote" },
      { status: 500 },
    );
  }
}
