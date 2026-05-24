import { NextRequest, NextResponse } from "next/server";
import { determineLaneAndPrice, type PricingData } from "@/lib/pricing";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Partial<PricingData>;

    const input: PricingData = {
      state: body.state,
      apostille: body.apostille,
      docs: typeof body.docs === "number" ? body.docs : undefined,
      mobile: body.mobile,
      miles: typeof body.miles === "number" ? body.miles : undefined,
      signers: typeof body.signers === "number" ? body.signers : undefined,
      translation: body.translation,
      urgency: body.urgency,
      multi_country: body.multi_country,
      witnesses:
        typeof body.witnesses === "number" ? body.witnesses : undefined,
      witness_type: body.witness_type,
      after_hours: body.after_hours,
    };

    const result = determineLaneAndPrice(input);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[pricing/quote] error:", err);
    return NextResponse.json(
      { error: "Failed to compute quote" },
      { status: 500 }
    );
  }
}
