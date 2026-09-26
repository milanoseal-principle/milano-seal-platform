import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isOperatorOrFounder } from "@/lib/security/access-control";
import { calculatePrice, suggestTier } from "@/lib/pricing";

export const runtime = "nodejs";

interface AdminPricingQuoteInput {
  apostille?: boolean;
  docs?: number;
  signers?: number;
  translation?: boolean;
  urgency?: "standard" | "urgent";
  multi_country?: boolean;
  witnesses?: number;
  witness_type?: "ron" | "in_person";
  after_hours?: boolean;
  mobile?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const role = user?.app_metadata?.role as string | undefined;
    if (!user || !isOperatorOrFounder(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as AdminPricingQuoteInput;

    const reviewReasons = [
      body.mobile ? "mobile_execution_requires_operator_scope_review" : null,
      body.translation ? "translation_coordination_requires_operator_scope_review" : null,
    ].filter((value): value is string => Boolean(value));

    if (reviewReasons.length) {
      return NextResponse.json({
        review_required: true,
        review_reasons: reviewReasons,
        lane: null,
        base: null,
        total: null,
        witness_total: null,
        addons: [],
      });
    }

    const documentCount = Math.max(1, Number(body.docs) || 1);
    const signerCount = Math.max(1, Number(body.signers) || 1);
    const apostilleCount = body.apostille ? documentCount : 0;
    const tier = suggestTier({
      document_count: documentCount,
      signer_count: signerCount,
      apostille_count: apostilleCount,
      jurisdiction_count: body.multi_country ? 3 : 1,
      urgency: body.urgency === "urgent" ? "rush" : "standard",
    });
    const quote = calculatePrice({
      tier,
      document_count: documentCount,
      signer_count: signerCount,
      apostille_count: apostilleCount,
      urgency: body.urgency === "urgent" ? "rush" : "standard",
      witness_count: Math.max(0, Number(body.witnesses) || 0),
      witness_type: body.witness_type,
      after_hours: body.after_hours,
    });

    return NextResponse.json({
      review_required: false,
      review_reasons: [],
      lane: quote.tier_label,
      base: quote.base,
      total: quote.total,
      witness_total: quote.internal.witness_total,
      addons: quote.breakdown
        .filter((item) => item.key !== "base" && !item.internal_only)
        .map((item) => ({ item: item.label, amount: item.amount })),
    });
  } catch (err) {
    console.error("[pricing/quote] error:", err);
    return NextResponse.json(
      { error: "Failed to compute quote" },
      { status: 500 },
    );
  }
}
