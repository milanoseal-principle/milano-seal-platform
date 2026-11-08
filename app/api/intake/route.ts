import {bindIntakeUploadCapability} from '@/lib/uploads/authorization';
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
  eligible_subtotal?: number;
  non_discountable_total?: number;
  original_total?: number;
  discount_amount?: number;
  final_total?: number;
  amount_due?: number;
  pricing?: {
    lane?: string;
    base?: number;
    witness_total?: number;
    eligible_subtotal?: number;
    non_discountable_total?: number;
    original_total?: number;
    total?: number;
  };
  invoice?: {
    retainer?: number;
    balance?: number;
  };
}

type IntakeRequestBody = Record<string, unknown>;

function sameOriginDamianiSource(req: NextRequest): boolean {
  const referer = req.headers.get("referer");
  if (!referer) return false;
  try {
    const requestUrl = new URL(req.url);
    const ref = new URL(referer);
    return (
      ref.origin === requestUrl.origin &&
      ref.pathname === "/intake" &&
      ref.searchParams.get("source")?.trim().toLowerCase() === "damiani-reentry"
    );
  } catch {
    return false;
  }
}

function normalizedSourceChannel(req: NextRequest, body: IntakeRequestBody): string {
  // The wizard's generic Website Form label remains valid for ordinary intake.
  // A same-origin dedicated re-entry URL may narrow that attribution. This is
  // routing provenance only; it is never payment, identity, or discount authority.
  if (sameOriginDamianiSource(req)) return "damiani-reentry";
  const raw = String(body.source_channel ?? "Website Form").trim();
  return raw || "Website Form";
}

async function enforceCourtesySourceRestriction(
  body: IntakeRequestBody,
  sourceChannel: string,
): Promise<NextResponse | null> {
  const code =
    typeof body.courtesy_code === "string"
      ? body.courtesy_code.trim().toUpperCase()
      : "";
  if (!code) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("discount_codes")
    .select("metadata")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    console.error("[intake] courtesy source policy lookup failed", {
      code,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      {
        success: false,
        error: "Courtesy code could not be verified.",
        code: "COURTESY_POLICY_LOOKUP_FAILED",
      },
      { status: 500 },
    );
  }

  const metadata = (data?.metadata ?? {}) as Record<string, unknown>;
  const allowedSource = String(metadata.allowed_source_channel ?? "")
    .trim()
    .toLowerCase();
  if (allowedSource && allowedSource !== sourceChannel.trim().toLowerCase()) {
    return NextResponse.json(
      {
        success: false,
        error: "Courtesy code is not eligible for this intake source.",
        code: "COURTESY_SOURCE_RESTRICTED",
      },
      { status: 400 },
    );
  }

  return null;
}

async function canonicalizeRequest(req: NextRequest): Promise<{
  request: NextRequest;
  sourceChannel: string;
  failure: NextResponse | null;
}> {
  let body: IntakeRequestBody;
  try {
    body = (await req.clone().json()) as IntakeRequestBody;
  } catch {
    return { request: req, sourceChannel: "Website Form", failure: null };
  }

  const sourceChannel = normalizedSourceChannel(req, body);
  const failure = await enforceCourtesySourceRestriction(body, sourceChannel);
  if (failure) return { request: req, sourceChannel, failure };

  const headers = new Headers(req.headers);
  headers.delete("content-length");
  const request = new NextRequest(req.url, {
    method: "POST",
    headers,
    body: JSON.stringify({ ...body, source_channel: sourceChannel }),
  });

  return { request, sourceChannel, failure: null };
}

async function canonicalPost(req: NextRequest) {
  const normalized = await canonicalizeRequest(req);
  if (normalized.failure) return normalized.failure;

  const response = await handleCanonicalIntakePost(normalized.request);
  if (!response.ok) return response;

  let body: IntakeSuccessBody;
  try {
    body = (await response.clone().json()) as IntakeSuccessBody;
  } catch {
    return response;
  }

  if (!body.success) return response;

  const dealId = String(body.deal_id ?? "");

  // Review-required capture is intentionally pre-price. It must persist as
  // reviewing, never as awaiting_payment, because there is no approved payment
  // obligation yet. Fail closed if that legacy state cannot be reconciled.
  if (body.quote_state === "review_required") {
    if (!dealId) return response;
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("deals")
      .update({ deal_status: "reviewing" })
      .eq("deal_id", dealId);
    if (error) {
      console.error("[intake] review status reconciliation failed", {
        dealId,
        sourceChannel: normalized.sourceChannel,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        {
          success: false,
          error: "The Matter was captured but its review state could not be verified.",
          code: "INTAKE_REVIEW_STATUS_PERSISTENCE_FAILED",
          correlation_id: body.correlation_id ?? null,
          deal_id: dealId,
        },
        { status: 500 },
      );
    }
    return response;
  }

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

  const supabase = createAdminClient();
  const { data: persistedMatter, error } = await supabase
    .from("deals")
    .select(
      "deal_id,lane,base_price,witness_total,eligible_subtotal,non_discountable_total,original_total,discount_amount,final_total,total_price,invoice_retainer,invoice_balance,amount_due,currency",
    )
    .eq("deal_id", dealId)
    .maybeSingle();

  const finalTotal = Number(
    body.final_total ?? body.estimated_value ?? body.pricing?.total ?? 0,
  );
  const originalTotal = Number(
    body.original_total ?? body.pricing?.original_total ?? finalTotal,
  );

  // The canonical intake core persists discount-boundary totals before this
  // wrapper verifies the quote. Older success payloads did not echo those two
  // fields, which caused a false 500 after a valid Matter had already saved.
  // Use the just-persisted authoritative values only when the response omitted
  // them, then echo the normalized values back to the client after verification.
  const nonDiscountableTotal = Number(
    body.non_discountable_total ??
      body.pricing?.non_discountable_total ??
      persistedMatter?.non_discountable_total ??
      0,
  );
  const eligibleSubtotal = Number(
    body.eligible_subtotal ??
      body.pricing?.eligible_subtotal ??
      persistedMatter?.eligible_subtotal ??
      Math.max(0, originalTotal - nonDiscountableTotal),
  );

  const snapshot = buildMatterQuoteSnapshot({
    lane: String(body.lane ?? body.pricing?.lane ?? ""),
    basePrice: Number(body.pricing?.base ?? 0),
    witnessTotal: Number(body.pricing?.witness_total ?? 0),
    eligibleSubtotal,
    nonDiscountableTotal,
    originalTotal,
    discountAmount: Number(body.discount_amount ?? 0),
    finalTotal,
    invoiceRetainer: Number(body.invoice?.retainer ?? body.amount_due ?? 0),
    invoiceBalance: Number(body.invoice?.balance ?? 0),
    currency: "USD",
  });

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

  const normalizedBody: IntakeSuccessBody = {
    ...body,
    eligible_subtotal: eligibleSubtotal,
    non_discountable_total: nonDiscountableTotal,
    pricing: {
      ...body.pricing,
      eligible_subtotal: eligibleSubtotal,
      non_discountable_total: nonDiscountableTotal,
    },
  };
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  return NextResponse.json(normalizedBody, {
    status: response.status,
    headers,
  });
}

export async function POST(request:NextRequest){return bindIntakeUploadCapability(await canonicalPost(request));}
