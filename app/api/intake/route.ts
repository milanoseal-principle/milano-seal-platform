import {bindIntakeUploadCapability} from '@/lib/uploads/authorization';
import { bindIntakePaymentCapability } from '@/lib/payments/paymentCapability';
import { guardIntakeSubmission, isAuthorizedOperator } from "@/lib/intake/intakeSubmissionGuard";
import { defaultRequestLimiterDeps, enforcePublicRequestLimit } from "@/lib/security/publicRequestLimit";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createIntakeSubmissionToken,
  INTAKE_SUBMISSION_COOKIE,
  INTAKE_SUBMISSION_COOKIE_PATH,
  INTAKE_SUBMISSION_TTL_SECONDS,
  inspectIntakeSubmission,
  isIntakeSubmissionToken,
  runDurableIntakeSubmission,
  type DurableIntakeSubmissionStore,
  type IntakeSubmissionDecision,
  type StoredIntakeResponse,
} from "@/lib/intake/durableSubmissionIdempotency";
import {
  buildMatterQuoteSnapshot,
  persistedMatterHasQuote,
} from "@/lib/pricing/matterQuoteSnapshot";
import { POST as handleCanonicalIntakePost } from "./core";
import { buildIntakeQuotePreview, intakeQuotePreviewSchema } from "@/lib/pricing/intakeQuotePreview";
import { indicativeQuoteFromPreview, previewInputFromIntake } from "@/lib/pricing/intakeIndicativeQuote";

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
  failure: NextResponse | null;
}> {
  let body: IntakeRequestBody;
  try {
    body = (await req.clone().json()) as IntakeRequestBody;
  } catch {
    return { request: req, failure: null };
  }

  const sourceChannel = normalizedSourceChannel(req, body);
  const failure = await enforceCourtesySourceRestriction(body, sourceChannel);
  if (failure) return { request: req, failure };

  const headers = new Headers(req.headers);
  headers.delete("content-length");
  const request = new NextRequest(req.url, {
    method: "POST",
    headers,
    body: JSON.stringify({ ...body, source_channel: sourceChannel }),
  });

  return { request, failure: null };
}

async function canonicalPost(req: NextRequest) {
  const normalized = await canonicalizeRequest(req);
  if (normalized.failure) return normalized.failure;

  const response = await handleCanonicalIntakePost(normalized.request, (raw) => {
    const input = intakeQuotePreviewSchema.safeParse(previewInputFromIntake(raw));
    if (!input.success || !input.data.structured.destinationCountry) return null;
    try {
      return indicativeQuoteFromPreview(buildIntakeQuotePreview(input.data), new Date().toISOString());
    } catch {
      return null;
    }
  });
  if (!response.ok) return response;

  let body: IntakeSuccessBody;
  try {
    body = (await response.clone().json()) as IntakeSuccessBody;
  } catch {
    return response;
  }

  if (!body.success) return response;

  const dealId = String(body.deal_id ?? "");

  if (body.quote_state === "review_required") return response;

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

function rpcDecision(data: unknown): IntakeSubmissionDecision {
  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null;
  if (!row || typeof row.decision !== "string") throw new Error("INTAKE_IDEMPOTENCY_RPC_INVALID");
  const decision = row.decision;
  if (["missing", "owner", "processing", "conflict", "expired"].includes(decision)) {
    return { decision } as IntakeSubmissionDecision;
  }
  if (decision === "replay") {
    if (!Number.isInteger(row.response_status) || !row.response_body || typeof row.response_body !== "object") {
      throw new Error("INTAKE_IDEMPOTENCY_RESPONSE_INVALID");
    }
    return {
      decision: "replay",
      response: {
        status: Number(row.response_status),
        body: row.response_body as Record<string, unknown>,
        dealId: typeof row.deal_id === "string" ? row.deal_id : null,
      },
    };
  }
  throw new Error("INTAKE_IDEMPOTENCY_DECISION_INVALID");
}

function createIntakeSubmissionStore(): DurableIntakeSubmissionStore {
  const admin = createAdminClient();
  return {
    async lookup(tokenHash, payloadHash) {
      const { data, error } = await admin.rpc("lookup_intake_submission", {
        p_token_hash: tokenHash,
        p_payload_hash: payloadHash,
      });
      if (error) throw error;
      return rpcDecision(data);
    },
    async claim(tokenHash, payloadHash) {
      const { data, error } = await admin.rpc("claim_intake_submission", {
        p_token_hash: tokenHash,
        p_payload_hash: payloadHash,
      });
      if (error) throw error;
      return rpcDecision(data);
    },
    async complete(tokenHash, payloadHash, response) {
      const { data, error } = await admin.rpc("complete_intake_submission", {
        p_token_hash: tokenHash,
        p_payload_hash: payloadHash,
        p_response_status: response.status,
        p_response_body: response.body,
        p_deal_id: response.dealId,
      });
      if (error || data !== true) throw error ?? new Error("INTAKE_IDEMPOTENCY_COMPLETION_FAILED");
    },
  };
}

function submissionCookie(response: NextResponse, token = createIntakeSubmissionToken()) {
  response.cookies.set(INTAKE_SUBMISSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: INTAKE_SUBMISSION_TTL_SECONDS,
    path: INTAKE_SUBMISSION_COOKIE_PATH,
  });
  return response;
}

function storedResponse(response: StoredIntakeResponse) {
  return NextResponse.json(response.body, {
    status: response.status,
    headers: { "Cache-Control": "no-store" },
  });
}

function replayDecisionResponse(decision: IntakeSubmissionDecision): NextResponse | null {
  if (decision.decision === "replay") return storedResponse(decision.response);
  if (decision.decision === "conflict") {
    // Keep the original replay capability. A changed request must never
    // silently initialize a new Matter while the original can still resolve.
    return NextResponse.json({
      success: false,
      error: "This request differs from the one already submitted in this browser. Restore the original details to recover that request, or contact Milano if you need help.",
      code: "INTAKE_IDEMPOTENCY_CONFLICT",
      retryable: false,
    }, { status: 409, headers: { "Cache-Control": "no-store" } });
  }
  if (decision.decision === "expired") {
    return NextResponse.json({
      success: false,
      error: "The saved submission response is no longer available. Contact Milano with the original request details before starting another Matter.",
      code: "INTAKE_REPLAY_EXPIRED",
      retryable: false,
    }, { status: 409, headers: { "Cache-Control": "no-store" } });
  }
  if (decision.decision === "processing") {
    return NextResponse.json({
      success: false,
      error: "This submission is still being processed. Retry this same request shortly.",
      code: "INTAKE_SUBMISSION_IN_PROGRESS",
      retryable: true,
    }, { status: 409, headers: { "Cache-Control": "no-store", "Retry-After": "2" } });
  }
  return null;
}

async function findPublicIntakeReplay(
  request: NextRequest,
  body: IntakeRequestBody,
  getStore: () => DurableIntakeSubmissionStore,
) {
  const token = request.cookies.get(INTAKE_SUBMISSION_COOKIE)?.value;
  if (!isIntakeSubmissionToken(token)) return null;
  const decision = await inspectIntakeSubmission(getStore(), token, body, { waitMs: 2500, pollMs: 100 });
  return replayDecisionResponse(decision);
}

function missingIntakeSubmissionKey() {
  return submissionCookie(NextResponse.json({
    success: false,
    error: "Secure submission was initialized. Please submit this same request again.",
    code: "INTAKE_IDEMPOTENCY_KEY_REQUIRED",
    retryable: true,
  }, { status: 428, headers: { "Cache-Control": "no-store" } }));
}

function outcomeUnknown() {
  return NextResponse.json({
    success: false,
    error: "We could not confirm the saved request. Retry this same submission; do not start another request.",
    code: "INTAKE_IDEMPOTENCY_UNAVAILABLE",
    retryable: true,
  }, { status: 503, headers: { "Cache-Control": "no-store" } });
}

// Abuse controls (origin, size, JSON shape and durable rate limit) run before
// any Matter, invoice, capability or email is created. Public submissions also
// claim a durable idempotency record before the canonical intake writer runs.
export async function POST(request: NextRequest) {
  let store: DurableIntakeSubmissionStore | null = null;
  const getStore = () => (store ??= createIntakeSubmissionStore());
  const guarded = await guardIntakeSubmission(request, {
    isOperator: () => isAuthorizedOperator(),
    limit: async (req) => enforcePublicRequestLimit(req, { client: "intake_submit" }, await defaultRequestLimiterDeps()),
    findReplay: (req, body) => findPublicIntakeReplay(req, body, getStore),
  });

  if (!guarded.ok) {
    if (guarded.replay) {
      return bindIntakePaymentCapability(await bindIntakeUploadCapability(guarded.response));
    }
    return guarded.response;
  }

  if (guarded.operator) {
    return bindIntakePaymentCapability(await bindIntakeUploadCapability(await canonicalPost(guarded.request)));
  }

  const token = guarded.request.cookies.get(INTAKE_SUBMISSION_COOKIE)?.value;
  if (!isIntakeSubmissionToken(token)) return missingIntakeSubmissionKey();

  let payload: IntakeRequestBody;
  try {
    payload = (await guarded.request.clone().json()) as IntakeRequestBody;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request.", code: "INTAKE_INVALID_JSON" }, { status: 400 });
  }

  try {
    const outcome = await runDurableIntakeSubmission(getStore(), token, payload, async () => {
      const response = await canonicalPost(guarded.request);
      const body = (await response.clone().json().catch(() => null)) as IntakeSuccessBody | null;
      if (!body || typeof body !== "object") throw new Error("INTAKE_RESPONSE_INVALID");
      const dealId = typeof body.deal_id === "string" ? body.deal_id : null;
      return { status: response.status, body: body as Record<string, unknown>, dealId };
    }, { waitMs: 2500, pollMs: 100 });

    if (outcome.decision === "replay") {
      return bindIntakePaymentCapability(await bindIntakeUploadCapability(storedResponse(outcome.response)));
    }
    const response = replayDecisionResponse(outcome);
    return response ?? outcomeUnknown();
  } catch (error) {
    console.error("[intake] durable idempotency could not be completed", {
      error: error instanceof Error ? error.message : "unknown",
      timestamp: new Date().toISOString(),
    });
    return outcomeUnknown();
  }
}
