import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildMatterQuoteSnapshot,
  persistedMatterHasQuote,
} from "@/lib/pricing/matterQuoteSnapshot";
import { POST as handleCanonicalIntakePost } from "./core";

interface IntakeSuccessBody {
  success?: boolean;
  correlation_id?: string;
  deal_id?: string;
  quote_state?: string;
  lane?: string;
  estimated_value?: number;
  original_total?: number;
  discount_amount?: number;
  final_total?: number;
  amount_due?: number;
  pricing?: {
    lane?: string;
    base?: number;
    witness_total?: number;
    original_total?: number;
    total?: number;
  };
  invoice?: {
    retainer?: number;
    balance?: number;
  };
}

export async function POST(req: NextRequest) {
  const response = await handleCanonicalIntakePost(req);
  if (!response.ok) return response;

  let body: IntakeSuccessBody;
  try {
    body = (await response.clone().json()) as IntakeSuccessBody;
  } catch {
    return response;
  }

  // Review-required Matter capture intentionally has no approved quote yet.
  if (!body.success || body.quote_state === "review_required") return response;

  const dealId = String(body.deal_id ?? "");
  if (!dealId) {
    return NextResponse.json(
      {
        success: false,
        error: "The Matter was captured without a verifiable quote reference.",
        code: "INTAKE_QUOTE_PERSISTENCE_FAILED",
        correlation_id: body.correlation_id ?? null,
      },
      { status: 500 },
    );
  }

  const finalTotal = Number(
    body.final_total ?? body.estimated_value ?? body.pricing?.total ?? 0,
  );
  const snapshot = buildMatterQuoteSnapshot({
    lane: String(body.lane ?? body.pricing?.lane ?? ""),
    basePrice: Number(body.pricing?.base ?? 0),
    witnessTotal: Number(body.pricing?.witness_total ?? 0),
    originalTotal: Number(
      body.original_total ?? body.pricing?.original_total ?? finalTotal,
    ),
    discountAmount: Number(body.discount_amount ?? 0),
    finalTotal,
    invoiceRetainer: Number(body.invoice?.retainer ?? body.amount_due ?? 0),
    invoiceBalance: Number(body.invoice?.balance ?? 0),
    currency: "USD",
  });

  const supabase = createAdminClient();
  const { data: persistedMatter, error } = await supabase
    .from("deals")
    .select(
      "deal_id,lane,base_price,witness_total,original_total,discount_amount,final_total,total_price,invoice_retainer,invoice_balance,amount_due,currency",
    )
    .eq("deal_id", dealId)
    .maybeSingle();

  if (error || !persistedMatterHasQuote(persistedMatter, snapshot)) {
    console.error("[intake] persisted Matter quote mismatch", {
      correlationId: body.correlation_id ?? null,
      dealId,
      error: error?.message ?? null,
      expected: snapshot,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: false,
        error:
          "The Matter was captured, but its approved quote could not be verified. Contact support before requesting payment.",
        code: "INTAKE_QUOTE_PERSISTENCE_FAILED",
        correlation_id: body.correlation_id ?? null,
        deal_id: dealId,
      },
      { status: 500 },
    );
  }

  return response;
}
