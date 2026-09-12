import { NextRequest, NextResponse } from "next/server";
import {
  calculatePrice,
  determineLaneAndPrice,
  type PricingData,
} from "@/lib/pricing";
import {
  executionQuoteReviewReasons,
  executionTruthToLegacy,
  normalizeExecutionTruth,
} from "@/lib/matter/executionTruth";

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

const LANE_RATIONALE: Record<string, string> = {
  Signature: "Standard execution lane from the resolved Matter scope.",
  Priority: "The resolved Matter scope requires Priority coordination.",
  Executive: "Urgent or multi-country handling requires Executive coordination.",
};

function canonicalLane(body: QuoteInput) {
  if (body.urgency === "urgent" || body.multi_country) return "Executive" as const;
  if ((body.signers ?? 1) > 1 || body.translation) return "Priority" as const;
  return "Signature" as const;
}

function pricingTriggers(body: QuoteInput, lane: string, apostille: boolean) {
  const triggers: string[] = [];
  const truth = normalizeExecutionTruth(body);
  triggers.push(`Execution: ${truth.execution_method.replaceAll("_", " ")}`);
  triggers.push(
    `Notarization: ${truth.notarization_requirement.replaceAll("_", " ")}`,
  );
  triggers.push(`Notarial act: ${truth.notarial_act.replaceAll("_", " ")}`);
  triggers.push(
    `Authentication: ${truth.authentication_requirement.replaceAll("_", " ")}`,
  );
  if ((body.signers ?? 1) > 1) triggers.push(`${body.signers} signers`);
  if (body.translation) triggers.push("Translation coordination");
  if (body.multi_country) triggers.push("Multi-country routing");
  if (body.urgency === "urgent") triggers.push("Urgent handling");
  if (apostille) triggers.push("Apostille coordination included for first document");
  triggers.push(`Lane: ${lane}`);
  return triggers;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as QuoteInput;
    const truth = normalizeExecutionTruth(body);
    const reviewReasons = executionQuoteReviewReasons(truth);

    if (reviewReasons.length > 0) {
      return NextResponse.json({
        lane: "Review Required",
        base: 0,
        total: null,
        witness_total: 0,
        breakdown: [],
        review_required: true,
        rationale:
          "Execution facts require operator resolution before a payment amount can be approved.",
        triggers: reviewReasons,
      });
    }

    const legacy = executionTruthToLegacy(truth);
    const lane = canonicalLane(body);
    const documentCount = Math.max(1, Number(body.docs_count ?? 1));
    const canonicalPricing = calculatePrice({
      tier: lane.toLowerCase(),
      document_count: documentCount,
      signer_count: Math.max(1, Number(body.signers ?? 1)),
      notarized_signature_count: legacy.notarization_required
        ? Math.max(1, Number(body.signers ?? 1))
        : 0,
      apostille_count: legacy.apostille_required ? documentCount : 0,
      urgency: body.urgency === "urgent" ? "rush" : "standard",
      shipping: "none",
    });

    const witnessInput: PricingData = {
      state: truth.execution_method === "ron" ? body.origin_state : undefined,
      apostille: legacy.apostille_required,
      docs: body.docs_count,
      signers: body.signers,
      witnesses: body.witnesses,
      witness_type: body.witness_type,
      after_hours: body.after_hours,
      urgency: body.urgency,
      mobile: legacy.mobile,
      miles: truth.execution_method === "mobile" ? body.miles : 0,
      translation: body.translation,
      multi_country: body.multi_country,
    };
    const witnessProjection = determineLaneAndPrice(witnessInput);

    const breakdown = canonicalPricing.breakdown.map((item) => ({
      label: item.label,
      amount: item.amount,
    }));

    return NextResponse.json({
      lane,
      base: canonicalPricing.base,
      total: canonicalPricing.total,
      witness_total: witnessProjection.witness_total,
      breakdown,
      review_required: false,
      rationale: LANE_RATIONALE[lane] ?? "Standard pricing applied.",
      triggers: pricingTriggers(body, lane, legacy.apostille_required),
    });
  } catch (error) {
    console.error("[pricing/quote] error:", error);
    return NextResponse.json(
      { error: "Failed to compute quote" },
      { status: 500 },
    );
  }
}
