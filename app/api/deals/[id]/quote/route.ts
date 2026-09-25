import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isFounderAdmin, isOperatorOrFounder } from "@/lib/security/access-control";
import { composeGovernedQuote } from "@/lib/pricing/governedQuotePreview";
import { canonicalDestinationSlug } from "@/lib/alliance/professionalToolbelt";
import { isQuoteMutationLocked } from "@/lib/pricing/quoteMutationLock";
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

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

// Route facts come from the operator submission, falling back to the canonical
// Matter record. A submission that silently re-points destination or document
// identity away from the Matter record fails closed into review.
function resolveRouteFacts(
  body: Record<string, unknown>,
  matter: Record<string, unknown>,
) {
  const pick = (key: string) => text(body[key]) || text(matter[key]);
  const conflicts: string[] = [];
  const bodyDestination = text(body.destination_country);
  const matterDestination = text(matter.destination_country);
  if (
    bodyDestination &&
    matterDestination &&
    canonicalDestinationSlug(bodyDestination) !== canonicalDestinationSlug(matterDestination)
  ) {
    conflicts.push("ROUTE_DESTINATION_DIFFERS_FROM_MATTER");
  }
  const bodyDocument = text(body.document_type).toLowerCase();
  const matterDocument = text(matter.document_type).toLowerCase();
  if (bodyDocument && matterDocument && bodyDocument !== matterDocument) {
    conflicts.push("ROUTE_DOCUMENT_DIFFERS_FROM_MATTER");
  }
  return {
    facts: {
      destination_country: pick("destination_country"),
      document_type: pick("document_type"),
      origin_state: pick("origin_state"),
    },
    conflicts,
  };
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
        "id,deal_id,client_name,email,payment_status,amount_paid,payment_observed_at,deal_status,discount_code,destination_country,document_type,origin_state",
      )
      .eq("id", id)
      .single();

    if (matterError || !matter) {
      return NextResponse.json({ error: "Matter not found." }, { status: 404 });
    }

    if (isQuoteMutationLocked(matter as Record<string, unknown>)) {
      return NextResponse.json(
        {
          error: "Pricing is locked after payment activity begins.",
          code: "QUOTE_LOCKED_AFTER_PAYMENT_ACTIVITY",
        },
        { status: 409 },
      );
    }

    // Re-run the full governed composition server-side. Browser preview state
    // (including any submitted route_intelligence or review flags) is ignored.
    const routeFacts = resolveRouteFacts(body, matter as Record<string, unknown>);
    const composition = composeGovernedQuote({
      ...body,
      ...routeFacts.facts,
      manual_adjustment: manualAdjustment,
    });
    const { route, projection } = composition;
    const routeReviewCodes = [...route.reviewCodes, ...routeFacts.conflicts];
    const reviewReasons = [
      ...new Set([
        ...composition.executionReviewReasons,
        ...composition.pricingReviewReasons,
        ...routeReviewCodes,
      ]),
    ];
    const routeEvidence = {
      destination: route.destination,
      destination_slug: route.destinationSlug,
      route_type: route.routeType,
      route_label: route.routeLabel,
      document_category: route.documentCategory,
      document_category_source: route.documentCategorySource,
      issuing_authority: route.issuingAuthority,
      issuing_lane: route.issuingLane,
      federal_agency: route.federalAgency,
      receiving_authority: route.receivingAuthority,
      receiving_authority_type: route.receivingAuthorityType,
      authority_status: route.authorityStatus,
      review_reasons: [...route.reviewReasons, ...routeFacts.conflicts],
      advisories: route.advisories,
    };

    if (!projection || reviewReasons.length > 0) {
      const routeReview = routeReviewCodes.length > 0;
      const { error: reviewError } = await admin
        .from("deals")
        .update({
          ...(projection
            ? {
                matter_pricing_type: projection.matterBase,
                quote_execution_method: projection.executionMethod,
                quote_breakdown: projection.quote.lineItems,
              }
            : {}),
          pricing_version: PRICING_VERSION,
          quote_review_required: true,
          quote_review_reasons: reviewReasons,
          quote_approved_at: null,
          quote_approved_by: null,
          deal_status: "reviewing",
        })
        .eq("id", id);
      if (reviewError) throw reviewError;

      const { error: reviewEvidenceError } = await admin
        .from("matter_evidence_ledger")
        .insert({
          matter_id: id,
          event_type: routeReview ? "quote_route_review_required" : "quote_review_required",
          domain: "pricing",
          actor_type: "operator",
          actor_id: operator.id,
          source: "operator_quote_builder",
          new_value: {
            matter_pricing_type: projection?.matterBase ?? null,
            execution_method: projection?.executionMethod ?? composition.truth.execution_method,
            route_type: route.routeType,
            document_category: route.documentCategory,
            authority_status: route.authorityStatus,
            review_reasons: reviewReasons,
            route_intelligence: routeEvidence,
          },
          reason: routeReview
            ? "Destination/document route facts require governed review before a payment amount can be approved."
            : "Governed exception blocked automatic final pricing.",
          metadata: { pricing_version: PRICING_VERSION },
        });
      if (reviewEvidenceError) throw reviewEvidenceError;

      return NextResponse.json(
        {
          ok: false,
          review_required: true,
          review_reasons: reviewReasons,
          matter_base: projection?.matterBase ?? null,
          execution_method: projection?.executionMethod ?? composition.truth.execution_method,
          route_intelligence: composition.preview.route_intelligence,
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

    const { error: quoteEvidenceError } = await admin
      .from("matter_evidence_ledger")
      .insert({
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
          route_type: route.routeType,
          document_category: route.documentCategory,
          authority_status: route.authorityStatus,
          route_intelligence: routeEvidence,
        },
        reason: "Reviewed canonical private quote approved for payment gating.",
        metadata: { pricing_version: PRICING_VERSION },
      });
    if (quoteEvidenceError) throw quoteEvidenceError;

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
