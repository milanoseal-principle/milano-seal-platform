import { NextRequest, NextResponse } from "next/server";
import { determineLaneAndPrice, type PricingData } from "@/lib/pricing";

export const runtime = "nodejs";

interface QuoteInput {
  origin_state?: string;
  destination_country?: string;
  document_type?: string;
  apostille_required?: boolean;
  docs_count?: number;
  signers?: number;
  witnesses?: number;
  witness_type?: "ron" | "in_person";
  after_hours?: boolean;
  urgency?: "standard" | "urgent";
  mobile?: boolean;
  miles?: number;
  translation?: boolean;
  multi_country?: boolean;
}

const LANE_RATIONALE: Record<string, string> = {
  RON_SIMPLE:
    "Single-document Colorado RON path — base RON Simple lane applies.",
  MOBILE_STANDARD:
    "Florida mobile execution. Base lane plus round-trip mileage.",
  Signature: "Standard international execution path.",
  Priority:
    "Multi-signer or translation triggers Priority lane (faster turnaround).",
  Executive:
    "Urgent or multi-country routing — Executive lane handles it end-to-end.",
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as QuoteInput;

    const input: PricingData = {
      state: body.origin_state,
      apostille: body.apostille_required,
      docs: body.docs_count,
      signers: body.signers,
      witnesses: body.witnesses,
      witness_type: body.witness_type,
      after_hours: body.after_hours,
      urgency: body.urgency,
      mobile: body.mobile,
      miles: body.miles,
      translation: body.translation,
      multi_country: body.multi_country,
    };

    const result = determineLaneAndPrice(input);

    const breakdown: { label: string; amount: number }[] = [
      { label: `${result.lane} base`, amount: result.base },
    ];
    if (result.witness_total > 0) {
      breakdown.push({
        label: `Witnesses · ${body.witnesses ?? 0}`,
        amount: result.witness_total,
      });
    }
    for (const addon of result.addons) {
      breakdown.push({ label: addon.item, amount: addon.amount });
    }

    return NextResponse.json({
      lane: result.lane,
      base: result.base,
      total: result.total,
      witness_total: result.witness_total,
      breakdown,
      rationale: LANE_RATIONALE[result.lane] ?? "Standard pricing applied.",
    });
  } catch (err) {
    console.error("[pricing/quote] error:", err);
    return NextResponse.json(
      { error: "Failed to compute quote" },
      { status: 500 }
    );
  }
}
