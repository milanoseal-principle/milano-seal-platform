import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { normalizeMatter, validateMatter, riskScore } from "@/lib/validation";
import { calculatePrice } from "@/lib/pricing";
import {
  nonDiscountableTotalFromBreakdown,
  eligibleSubtotalFromTotal,
  effectiveTotalAfterCourtesy,
} from "@/lib/pricing/courtesyEligibility";
import { computeDiscountAmount, type DiscountCode } from "@/lib/discountCodes";
import { generateInvoice } from "@/lib/invoice";
import { validateCompliance } from "@/lib/compliance";
import { parseIntake } from "@/lib/parseIntake";
import { logActivity } from "@/lib/activity";
import { createWisePaymentRequest } from "@/lib/wise";
import { sendIntakeConfirmation } from "@/lib/email";
import { DESTINATIONS } from "@/data/destinations";
import { appendLedger, CUSTODY_EVENTS } from "@/lib/custodyLedger";
import { notifyClient } from "@/lib/notifications/orchestrator";
import { runDealEngine } from "@/lib/core/engine";
import {
  normalizeIntakeRouting,
  checkAffidavitFederalConflict,
} from "@/lib/intake/routing-normalizer";
import { safeText } from "@/lib/security/app-guards";
import { resolveProfessionalReferral } from "@/lib/professional/referral";
import {
  executionTruthToLegacy,
  normalizeExecutionTruth,
  validateExecutionTruth,
} from "@/lib/matter/executionTruth";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://themilanoseal.com";

type IntakeStage =
  | "REQUEST_RECEIVED"
  | "NORMALIZED"
  | "VALIDATED"
  | "ROUTED"
  | "EXECUTION_VALIDATED"
  | "COMPLIANCE_COMPLETE"
  | "PRICED"
  | "INVOICE_CREATED"
  | "WISE_REQUEST_CREATED"
  | "MATTER_PERSISTED"
  | "RESPONSE_SENT";

type IntakeFailureCode =
  | "VALIDATION_FAILED"
  | "EXECUTION_REVIEW_REQUIRED"
  | "COMPLIANCE_REVIEW_REQUIRED"
  | "PRICING_FAILED"
  | "PERSISTENCE_FAILED"
  | "PAYMENT_REQUEST_FAILED"
  | "CONFIGURATION_ERROR"
  | "UNKNOWN_INTAKE_FAILURE";

function createIntakeCorrelationId(): string {
  const day = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `MSERR-${day}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function safeFailure(
  code: IntakeFailureCode,
  correlationId: string,
  status = 500,
  reason?: string,
) {
  return NextResponse.json(
    {
      success: false,
      error: "Unable to create Matter",
      code,
      correlation_id: correlationId,
      retryable: code === "PAYMENT_REQUEST_FAILED",
      ...(reason ? { reason } : {}),
    },
    { status },
  );
}

function logIntakeFailure(params: {
  correlationId: string;
  stage: IntakeStage;
  code: IntakeFailureCode;
  error: unknown;
  dealId?: string;
  source?: string;
}) {
  const error = params.error as {
    message?: string;
    code?: string;
    details?: string;
    hint?: string;
  };
  console.error("[intake] critical failure", {
    correlationId: params.correlationId,
    stage: params.stage,
    category: params.code,
    dealId: params.dealId ?? null,
    source: params.source ?? null,
    providerCode: error?.code ?? null,
    message: error?.message ?? String(params.error),
    details: error?.details ?? null,
    hint: error?.hint ?? null,
    timestamp: new Date().toISOString(),
  });
}

function genDealId(): string {
  return `MS-${new Date().getFullYear()}-${Math.floor(
    1000 + Math.random() * 9000,
  )}`;
}

function autoSelectLane({
  country,
  urgency,
  signerCount,
  apostilleRequired,
}: {
  country: string;
  urgency?: string;
  signerCount?: number;
  apostilleRequired?: boolean;
}): "Executive" | "Priority" | "Signature" {
  void country;
  if (urgency === "urgent") return "Executive";
  if (apostilleRequired) return "Priority";
  if ((signerCount || 1) > 1) return "Priority";
  return "Signature";
}

function calculateScore({
  country,
  useCase,
  urgency,
}: {
  country: string;
  useCase?: string;
  urgency?: string;
}): number {
  let score = 0;
  const dest = DESTINATIONS.find(
    (d) =>
      d.slug === country.toLowerCase().replace(/\s+/g, "-") ||
      d.name.toLowerCase() === country.toLowerCase(),
  );
  if (dest) {
    if (dest.demand >= 80) score += 30;
    else if (dest.demand >= 50) score += 20;
    else score += 10;
  } else score += 10;

  if (useCase === "dual-citizenship") score += 25;
  if (useCase === "citizenship") score += 20;
  if (useCase === "real-estate") score += 20;
  if (useCase === "property-transfer") score += 20;
  if (useCase === "corporate-expansion") score += 20;
  if (useCase === "foreign-business-registration") score += 15;
  if (useCase === "immigration") score += 15;
  if (useCase === "legal-filings") score += 10;
  if (urgency === "urgent") score += 25;

  return Math.min(score, 100);
}

function routeDeal(score: number): "HIGH" | "MEDIUM" | "LOW" {
  if (score >= 70) return "HIGH";
  if (score >= 40) return "MEDIUM";
  return "LOW";
}

function legacyExecutionTruthInput(raw: Record<string, unknown>) {
  const notarizationRequirement =
    raw.notarization_required === true
      ? "required"
      : raw.notarization_required === false
        ? "not_required"
        : "review_required";
  const executionMethod =
    raw.ron_required === true
      ? "ron"
      : raw.mobile === true
        ? "mobile"
        : raw.already_notarized === true
          ? "already_notarized"
          : "review_required";
  const authenticationRequirement =
    raw.apostille === true || raw.apostille_required === true
      ? "apostille"
      : raw.apostille === false || raw.apostille_required === false
        ? "not_required"
        : "review_required";

  return {
    notarization_requirement: notarizationRequirement,
    execution_method: executionMethod,
    notarial_act: "review_required",
    authentication_requirement: authenticationRequirement,
    signer_location: raw.signer_location,
    execution_location: raw.execution_location,
    assigned_notary: raw.assigned_notary,
    notary_jurisdiction: raw.notary_jurisdiction,
    certificate_type: raw.certificate_type,
    ron_kba_status: raw.ron_kba_status,
    ron_credential_analysis_status: raw.ron_credential_analysis_status,
  };
}

function normalizeServiceScope(value: unknown): string {
  return String(value ?? "all_eligible_services").trim().toLowerCase();
}

function serviceScopeMatches(scope: string, params: {
  documentType: string;
  apostilleRequired: boolean;
  notarizationRequired: boolean;
}): boolean {
  if (!scope || scope === "all_eligible_services" || scope === "professional_services") return true;
  if (scope === "apostille_coordination") return params.apostilleRequired;
  if (scope === "notarization") return params.notarizationRequired;
  if (scope === "document_execution") return Boolean(params.documentType);
  return false;
}

async function notifyHighValue(
  dealId: string,
  country: string,
  value: number,
  tier: string,
) {
  if (tier !== "HIGH") return;
  try {
    const supabase = createAdminClient();
    await supabase.from("notifications").insert({
      message: `HIGH VALUE MATTER — ${country} · $${value} · ${dealId}`,
      type: "HIGH_VALUE_DEAL",
      deal_id: dealId,
      read: false,
    });
  } catch (error) {
    console.error("[intake] high-value notification failed", {
      dealId,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
  }
}

export async function POST(req: NextRequest) {
  const correlationId = createIntakeCorrelationId();
  let stage: IntakeStage = "REQUEST_RECEIVED";
  let currentDealId: string | undefined;
  let currentSource: string | undefined;

  try {
    let raw = (await req.json()) as Record<string, unknown>;

    const useCase = String(raw.use_case || raw.useCase || "");
    const prefillDoc = String(raw.document_type || raw.document || "");
    const prefillCountry = String(raw.country || raw.destination_country || "");

    if (raw.message && !raw.document_type) {
      const parsed = parseIntake(String(raw.message));
      raw = {
        ...raw,
        name: raw.name || parsed.client_name || "",
        client_name: raw.client_name || parsed.client_name || "",
        country: raw.country || parsed.country || "",
        document_type: prefillDoc || parsed.document_type,
        signers: raw.signers || parsed.signer_count,
        urgency: raw.urgency || parsed.urgency,
        apostille: raw.apostille ?? parsed.apostille_needed,
      };
    }

    if (raw.name) raw.name = safeText(String(raw.name));
    if (raw.client_name) raw.client_name = safeText(String(raw.client_name));
    if (raw.notes) raw.notes = safeText(String(raw.notes));
    if (raw.message) raw.message = safeText(String(raw.message));

    const data = normalizeMatter(raw);
    if (typeof data.email === "string") {
      data.email = data.email.trim().toLowerCase();
    }
    stage = "NORMALIZED";

    let normalizedRouting = normalizeIntakeRouting({ ...raw, ...data });
    normalizedRouting = checkAffidavitFederalConflict(
      normalizedRouting,
      (data.document_type as string) || "",
    );
    const originAuthorityLabel = normalizedRouting.origin_authority_label;
    const routingWarnings = normalizedRouting.warnings;
    stage = "ROUTED";

    try {
      validateMatter(data);
      stage = "VALIDATED";
    } catch (error) {
      logIntakeFailure({
        correlationId,
        stage,
        code: "VALIDATION_FAILED",
        error,
      });
      const reason =
        error instanceof Error ? error.message : "Matter validation failed";
      return safeFailure("VALIDATION_FAILED", correlationId, 400, reason);
    }

    const hasCanonicalExecution =
      (raw.execution_truth != null && typeof raw.execution_truth === "object") ||
      typeof raw.execution_method === "string" ||
      typeof raw.notarization_requirement === "string" ||
      typeof raw.authentication_requirement === "string" ||
      typeof raw.notarial_act === "string";
    const executionTruth = normalizeExecutionTruth(
      hasCanonicalExecution ? raw : legacyExecutionTruthInput(raw),
    );
    const executionValidation = validateExecutionTruth(executionTruth);
    const sourceHint = String(raw.source_channel ?? "web").toLowerCase();
    const legacyExecution = executionTruthToLegacy(executionTruth);

    // Operator-entered and professional-referred Matters never auto-issue a
    // Wise request while execution facts are unresolved: they enter operator
    // review and receive a Matter-specific quote afterwards.
    const executionReviewRequired =
      (sourceHint === "admin" || sourceHint === "professional") &&
      (!executionValidation.valid || executionValidation.reviewRequired);

    // Professional attribution is accepted only for a server-signed referral
    // reference bound to an existing, non-inactive profile. Anything else
    // fails closed to an unattributed Matter; it never blocks intake.
    let professionalReferral: Awaited<ReturnType<typeof resolveProfessionalReferral>> = null;
    try {
      professionalReferral = await resolveProfessionalReferral(raw, async (profileId) => {
        const { data: profile } = await createAdminClient()
          .from("professional_profiles")
          .select("id,status")
          .eq("id", profileId)
          .maybeSingle();
        return (profile as { id: string; status: string } | null) ?? null;
      });
    } catch {
      professionalReferral = null;
    }
    const referralFields = professionalReferral ?? {};

    if (executionReviewRequired) {
      const reviewReasons = Array.from(
        new Set(
          [...executionValidation.errors, "EXECUTION_REVIEW_REQUIRED"].filter(
            Boolean,
          ),
        ),
      );

      const supabase = createAdminClient();
      const country = data.country || prefillCountry || "United States";
      const docType = data.document_type || prefillDoc || "";
      const client_name = data.name || String(raw.client_name || "");
      const companyName = String(raw.company_name || raw.company || "") || null;
      const source = String(
        (data as Record<string, unknown>).source_channel ||
          raw.source_channel ||
          "web",
      );
      const apostilleRequired = legacyExecution.apostille_required;
      const conversion_score = calculateScore({
        country,
        useCase,
        urgency: data.urgency as string,
      });
      const priority_tier = routeDeal(conversion_score);
      const deal_id = genDealId();
      const access_token = randomUUID();
      currentDealId = deal_id;
      currentSource = source;

      const reviewMetadata = {
        source,
        companyName,
        execution_truth: executionTruth,
        execution_review: { required: true, reasons: reviewReasons },
        quote_state: "review_required",
        amount_due: null,
        currency: "USD",
        originAuthorityLabel: originAuthorityLabel ?? null,
        normalizedRouting: normalizedRouting ?? null,
        routingWarnings: routingWarnings ?? [],
      };

      const reviewPayload = {
        deal_id,
        access_token,
        client_name,
        client_type: String(raw.client_type ?? "individual"),
        company_name: companyName,
        email: data.email || "",
        phone: data.phone || "",
        document_type: docType,
        use_case: useCase || null,
        destination_country: country,
        origin_state: String(raw.origin_state || data.state || "") || null,
        apostille_required: apostilleRequired,
        execution_truth: executionTruth,
        docs_count: Number(data.docs ?? 1),
        urgency: (data.urgency as string) ?? "standard",
        mobile: legacyExecution.mobile,
        miles:
          executionTruth.execution_method === "mobile"
            ? Number(data.miles ?? raw.miles ?? 0)
            : 0,
        signers: Number(data.signers ?? 1),
        witnesses: Number(data.witnesses ?? 0),
        witness_type: data.witness_type ?? null,
        after_hours: Boolean(data.after_hours ?? false),
        translation: Boolean(data.translation ?? false),
        multi_country: Boolean(data.multi_country ?? false),
        payment_status: "unpaid",
        payment_confirmed: false,
        amount_paid: 0,
        currency: "USD",
        status: "intake_received",
        deal_status: "awaiting_payment",
        conversion_score,
        priority_tier,
        notes: [
          (data.notes as string) || "",
          `[execution_review_required] ${reviewReasons.join(", ")}`,
          `[intake_metadata:${JSON.stringify(reviewMetadata)}]`,
        ]
          .filter(Boolean)
          .join("\n"),
        internal_notes: JSON.stringify(reviewMetadata),
        ...referralFields,
      };

      const { data: reviewDeal, error: reviewError } = await supabase
        .from("deals")
        .insert([reviewPayload])
        .select()
        .single();

      if (reviewError) {
        logIntakeFailure({
          correlationId,
          stage,
          code: "PERSISTENCE_FAILED",
          error: reviewError,
          dealId: deal_id,
          source,
        });
        return safeFailure("PERSISTENCE_FAILED", correlationId, 500);
      }
      stage = "MATTER_PERSISTED";

      const reviewRowId = (reviewDeal as { id?: string })?.id;
      if (reviewRowId) {
        void notifyClient(reviewRowId, "intake_received").catch(() => {});
      }
      void logActivity({
        deal_id,
        actor: source === "admin" ? "admin" : `${source}-intake`,
        action: "created",
        detail: `Intake captured — execution review required · ${country} · ${reviewReasons.join(", ")}`,
        meta: {
          source,
          execution_truth: executionTruth,
          execution_review_required: true,
          reasons: reviewReasons,
          conversion_score,
          priority_tier,
        },
      }).catch(() => {});

      stage = "RESPONSE_SENT";
      return NextResponse.json(
        {
          success: true,
          correlation_id: correlationId,
          deal_id: (reviewDeal as { deal_id?: string })?.deal_id || deal_id,
          quote_state: "review_required",
          execution_truth: executionTruth,
          execution_review: { required: true, reasons: reviewReasons },
          status: "intake_received",
          payment_status: "unpaid",
          payment_confirmed: false,
          scheduled: false,
          message:
            "Matter saved. An approved payment amount will become available after the remaining execution facts are resolved.",
          remaining: reviewReasons,
        },
        { status: 200 },
      );
    }

    stage = "EXECUTION_VALIDATED";
    const country = data.country || prefillCountry || "United States";
    const apostilleRequired = hasCanonicalExecution
      ? legacyExecution.apostille_required
      : Boolean(raw.apostille ?? raw.apostille_required ?? data.apostille ?? false);

    let compliance = null;
    try {
      if (
        executionTruth.execution_method === "ron" ||
        executionTruth.execution_method === "mobile"
      ) {
        compliance = validateCompliance({
          country,
          signerLocation: executionTruth.signer_location ?? undefined,
          documentType: data.document_type || prefillDoc || "general",
          executionType: executionTruth.execution_method,
          destinationCountry: country,
        });
      }
      stage = "COMPLIANCE_COMPLETE";
    } catch (error) {
      logIntakeFailure({
        correlationId,
        stage,
        code: "COMPLIANCE_REVIEW_REQUIRED",
        error,
      });
      compliance = null;
    }

    const autoLane = autoSelectLane({
      country,
      urgency: data.urgency as string,
      signerCount: Number(data.signers) || 1,
      apostilleRequired,
    });

    const pricingInput = {
      ...data,
      state:
        executionTruth.execution_method === "ron"
          ? (data.state as string | undefined)
          : undefined,
      apostille: apostilleRequired,
      mobile: legacyExecution.mobile,
      miles:
        executionTruth.execution_method === "mobile"
          ? Number(data.miles ?? raw.miles ?? 0)
          : 0,
      urgency: data.urgency as "standard" | "urgent" | undefined,
      witness_type: data.witness_type as "ron" | "in_person" | undefined,
    };
    const requestedTier = String(raw.tier ?? "").toLowerCase();
    const requestedLane: "Signature" | "Priority" | "Executive" =
      requestedTier === "executive"
        ? "Executive"
        : requestedTier === "signature"
          ? "Signature"
          : requestedTier === "priority"
            ? "Priority"
            : autoLane;
    const laneOrder = ["Signature", "Priority", "Executive"] as const;
    const pricedLane =
      laneOrder.indexOf(requestedLane) >= laneOrder.indexOf(autoLane)
        ? requestedLane
        : autoLane;
    const timeline = String(raw.timeline_preference ?? "");
    const delivery = String(raw.delivery_method ?? "");
    const notarizationRequired = hasCanonicalExecution
      ? legacyExecution.notarization_required
      : raw.notarization_required === true || raw.ron_required === true;
    const canonicalPricing = calculatePrice({
      tier: pricedLane.toLowerCase(),
      document_count: Math.max(1, Number(data.docs ?? raw.docs ?? 1)),
      signer_count: Math.max(1, Number(data.signers ?? raw.signers ?? 1)),
      notarized_signature_count: notarizationRequired
        ? Math.max(1, Number(data.signers ?? raw.signers ?? 1))
        : 0,
      apostille_count: apostilleRequired
        ? Math.max(1, Number(raw.apostille_count ?? 1))
        : 0,
      urgency:
        timeline === "urgent"
          ? "rush"
          : timeline === "expedited"
            ? "expedited"
            : data.urgency ?? "standard",
      shipping:
        delivery === "international_courier"
          ? "international"
          : delivery === "domestic_courier"
            ? "standard_domestic"
            : "none",
      witness_count: Math.max(0, Number(data.witnesses ?? raw.witnesses ?? 0)),
      witness_type: data.witness_type ?? raw.witness_type,
      after_hours: data.after_hours ?? raw.after_hours,
    });
    const pricing = {
      lane: pricedLane,
      base: canonicalPricing.base,
      total: canonicalPricing.total,
      addons: canonicalPricing.breakdown
        .filter((item) => !item.internal_only && item.key !== "base")
        .map((item) => ({ item: item.label, amount: item.amount })),
      witness_total: canonicalPricing.internal.witness_total,
    };
    stage = "PRICED";

    const nonDiscountableTotal = nonDiscountableTotalFromBreakdown(
      canonicalPricing.breakdown,
    );
    const eligibleSubtotal = eligibleSubtotalFromTotal(
      Number(pricing.total),
      nonDiscountableTotal,
    );

    const clientQuotedTotal = Number(raw.client_quoted_total);
    if (
      Number.isFinite(clientQuotedTotal) &&
      Math.abs(clientQuotedTotal - pricing.total) > 0.009
    ) {
      return NextResponse.json(
        {
          error:
            "Pricing changed after server validation. Please review the updated matter scope before payment.",
          code: "PRICING_REVIEW_REQUIRED",
          quoted_total: clientQuotedTotal,
          authoritative_total: pricing.total,
        },
        { status: 409 },
      );
    }

    const supabase = createAdminClient();
    const requestedCourtesy =
      typeof raw.courtesy_code === "string"
        ? raw.courtesy_code.trim().toUpperCase()
        : "";
    let courtesyAdjustment: null | {
      id: string;
      code: string;
      discount_type: "percentage" | "fixed_amount";
      discount_value: number;
      amount: number;
    } = null;

    if (requestedCourtesy) {
      const { data: discount, error: discountError } = await supabase
        .from("discount_codes")
        .select(
          "id,code,discount_type,discount_value,status,usage_limit,usage_count,starts_at,expires_at,applies_to,client_id,matter_id,metadata",
        )
        .eq("code", requestedCourtesy)
        .maybeSingle();
      if (discountError) throw discountError;
      if (!discount)
        return NextResponse.json(
          { error: "Courtesy code not found." },
          { status: 400 },
        );
      const now = Date.now();
      if (discount.status !== "active")
        return NextResponse.json(
          { error: "Courtesy code is not active." },
          { status: 400 },
        );
      if (discount.starts_at && new Date(discount.starts_at).getTime() > now)
        return NextResponse.json(
          { error: "Courtesy code is not active yet." },
          { status: 400 },
        );
      if (discount.expires_at && new Date(discount.expires_at).getTime() < now)
        return NextResponse.json(
          { error: "Courtesy code has expired." },
          { status: 400 },
        );
      if (
        discount.usage_limit != null &&
        Number(discount.usage_count ?? 0) >= Number(discount.usage_limit)
      )
        return NextResponse.json(
          { error: "Courtesy code has already been used." },
          { status: 400 },
        );
      if (discount.applies_to !== "eligible_subtotal")
        return NextResponse.json(
          { error: "Courtesy code requires operator review." },
          { status: 400 },
        );

      const restrictedClientId = String(discount.client_id ?? "").trim();
      const intakeClientId = String(raw.client_id ?? "").trim();
      if (restrictedClientId && restrictedClientId !== intakeClientId) {
        return NextResponse.json(
          { error: "Courtesy code is not eligible for this client." },
          { status: 400 },
        );
      }

      const restrictedMatterId = String(discount.matter_id ?? "").trim();
      const intakeMatterId = String(raw.matter_id ?? raw.deal_id ?? "").trim();
      if (restrictedMatterId && restrictedMatterId !== intakeMatterId) {
        return NextResponse.json(
          { error: "Courtesy code is restricted to a specific Matter." },
          { status: 400 },
        );
      }

      const metadata = (discount.metadata ?? {}) as Record<string, unknown>;
      const restrictedAllianceMemberId = String(metadata.alliance_member_id ?? "").trim();
      const intakeAllianceMemberId = String(
        raw.alliance_member_id ?? raw.partner_id ?? "",
      ).trim();
      if (
        restrictedAllianceMemberId &&
        restrictedAllianceMemberId !== intakeAllianceMemberId
      ) {
        return NextResponse.json(
          { error: "Courtesy code is not assigned to this Alliance account." },
          { status: 400 },
        );
      }

      const serviceScope = normalizeServiceScope(metadata.eligible_service_scope);
      if (
        !serviceScopeMatches(serviceScope, {
          documentType: String(data.document_type || prefillDoc || ""),
          apostilleRequired,
          notarizationRequired,
        })
      ) {
        return NextResponse.json(
          { error: "Courtesy code is not eligible for this service scope." },
          { status: 400 },
        );
      }

      const discountValue = Number(discount.discount_value);
      const amount = computeDiscountAmount(
        {
          discount_type: discount.discount_type,
          discount_value: discountValue,
        } as DiscountCode,
        eligibleSubtotal,
      );
      courtesyAdjustment = {
        id: discount.id,
        code: String(discount.code),
        discount_type: discount.discount_type as "percentage" | "fixed_amount",
        discount_value: discountValue,
        amount,
      };
    }

    const effectiveTotal = effectiveTotalAfterCourtesy(
      Number(pricing.total),
      courtesyAdjustment?.amount ?? 0,
    );

    const finalLane = pricing.lane;
    const invoice = generateInvoice(effectiveTotal);
    stage = "INVOICE_CREATED";
    const decline_risk = riskScore(data);
    const deal_id = genDealId();
    currentDealId = deal_id;
    const access_token = randomUUID();
    const client_name = data.name || String(raw.client_name || "");
    const source = String(
      (data as Record<string, unknown>).source_channel || raw.source_channel || "web",
    );
    currentSource = source;

    const conversion_score = calculateScore({
      country,
      useCase,
      urgency: data.urgency as string,
    });
    const priority_tier = routeDeal(conversion_score);

    const payment_reference = deal_id;
    const payment_description = `The Milano Seal™ — Retainer (50%) — ${client_name}`;

    let wiseResult: Awaited<ReturnType<typeof createWisePaymentRequest>>;
    try {
      wiseResult = await createWisePaymentRequest({
        dealId: payment_reference,
        amount: invoice.retainer,
        currency: "USD",
        description: payment_description,
        clientName: client_name,
        clientEmail: data.email || null,
        redirectUrl: `${SITE}/portal`,
      });
      stage = "WISE_REQUEST_CREATED";
    } catch (error) {
      logIntakeFailure({
        correlationId,
        stage,
        code: "PAYMENT_REQUEST_FAILED",
        error,
        dealId: deal_id,
        source,
      });
      return safeFailure("PAYMENT_REQUEST_FAILED", correlationId, 503);
    }
    const payment_link = wiseResult.url;

    const payment_metadata = {
      provider: "wise",
      amount_due: invoice.retainer,
      currency: "USD",
      payment_reference,
      description: payment_description,
      is_prefilled: wiseResult.mode === "production",
      manual_fallback_required: wiseResult.mode !== "production",
    };

    const wise_invoice = {
      payment_method: "WISE",
      amount: invoice.retainer,
      reference: payment_reference,
      note: payment_description,
      wise_link: wiseResult.url,
      wise_request_id: wiseResult.id,
      wise_mode: wiseResult.mode,
      status: "AWAITING_PAYMENT",
    };

    const docType = data.document_type || prefillDoc || "";
    const companyName = String(raw.company_name || raw.company || "") || null;

    const intakeMetadata = {
      source,
      companyName,
      execution_truth: executionTruth,
      originAuthorityLabel: originAuthorityLabel ?? null,
      normalizedRouting: normalizedRouting ?? null,
      routingWarnings: routingWarnings ?? [],
      payment_metadata: payment_metadata ?? null,
      wise_invoice: wise_invoice ?? null,
      wise_reference: deal_id,
      wise_payment_url: `https://wise.com/pay/business/themilanoseal?reference=${encodeURIComponent(deal_id)}&amount=${invoice.retainer}&currency=USD`,
      amount_due: invoice.retainer,
      currency: "USD",
      courtesy: courtesyAdjustment
        ? {
            code: courtesyAdjustment.code,
            discount_type: courtesyAdjustment.discount_type,
            discount_value: courtesyAdjustment.discount_value,
            discount_amount: courtesyAdjustment.amount,
            redemption_status: "not_redeemed",
          }
        : null,
      compliance: compliance ?? null,
      decline_risk: decline_risk ?? null,
      followup_schedule: ["24h", "72h", "7d"],
      matterCategory: raw.matterCategory ?? raw.matter_category ?? null,
      receivingAuthority:
        raw.receivingAuthority ?? raw.receiving_authority ?? null,
      deadlineOrClosingDate:
        raw.deadlineOrClosingDate ?? raw.deadline_or_closing_date ?? null,
      courierRequired: raw.courierRequired ?? raw.courier_required ?? null,
      timelinePreference:
        raw.timelinePreference ?? raw.timeline_preference ?? null,
      deliveryMethod: raw.deliveryMethod ?? raw.delivery_method ?? null,
    };

    const safeNotes = [
      (data.notes as string) || "",
      `[routing] origin_authority_type=${normalizedRouting?.origin_authority_type ?? "unknown"}`,
      `[routing] origin_authority_label=${originAuthorityLabel ?? "unknown"}`,
      `[routing] apostille_path=${normalizedRouting?.apostille_path ?? "unknown"}`,
      (routingWarnings?.length ?? 0) > 0
        ? `[routing_warnings] ${routingWarnings.join(" | ")}`
        : "",
      `[intake_metadata:${JSON.stringify(intakeMetadata)}]`,
    ]
      .filter(Boolean)
      .join("\n");

    const safeInternalNotes = JSON.stringify(intakeMetadata);

    const intakePayload = {
      deal_id,
      access_token,
      client_name,
      client_type: String(raw.client_type ?? "individual"),
      company_name: companyName,
      email: data.email || "",
      phone: data.phone || "",
      document_type: docType,
      use_case: useCase || null,
      destination_country: country,
      origin_state: String(raw.origin_state || data.state || "") || null,
      apostille_required: apostilleRequired,
      execution_truth: executionTruth,
      docs_count: Number(data.docs ?? 1),
      lane: finalLane,
      urgency: (data.urgency as string) ?? "standard",
      mobile: legacyExecution.mobile,
      miles:
        executionTruth.execution_method === "mobile"
          ? Number(data.miles ?? raw.miles ?? 0)
          : 0,
      signers: Number(data.signers ?? 1),
      witnesses: Number(data.witnesses ?? 0),
      witness_type: data.witness_type ?? null,
      after_hours: Boolean(data.after_hours ?? false),
      translation: Boolean(data.translation ?? false),
      multi_country: Boolean(data.multi_country ?? false),
      base_price: pricing.base,
      witness_total: pricing.witness_total,
      total_price: effectiveTotal,
      original_total: pricing.total,
      eligible_subtotal: eligibleSubtotal,
      non_discountable_total: nonDiscountableTotal,
      final_total: effectiveTotal,
      discount_code: courtesyAdjustment?.code ?? null,
      discount_value: courtesyAdjustment?.discount_value ?? null,
      discount_amount: courtesyAdjustment?.amount ?? 0,
      invoice_retainer: invoice.retainer,
      invoice_balance: invoice.balance,
      payment_status: "unpaid",
      payment_confirmed: false,
      payment_method: "wise",
      payment_reference,
      wise_reference: payment_reference,
      amount_due: invoice.retainer,
      amount_paid: 0,
      currency: "USD",
      payment_link,
      status: "intake_received",
      deal_status: "awaiting_payment",
      conversion_score,
      priority_tier,
      notes: safeNotes,
      internal_notes: safeInternalNotes,
      ...referralFields,
    };

    let deal: { id?: string; deal_id?: string; [key: string]: unknown } | null = null;

    const { data: persistedDeal, error: persistenceError } = await supabase
      .from("deals")
      .insert([intakePayload])
      .select()
      .single();

    if (persistenceError) {
      logIntakeFailure({
        correlationId,
        stage,
        code: "PERSISTENCE_FAILED",
        error: persistenceError,
        dealId: deal_id,
        source,
      });
      return safeFailure("PERSISTENCE_FAILED", correlationId, 500);
    }

    deal = persistedDeal as Record<string, unknown>;
    stage = "MATTER_PERSISTED";

    void notifyHighValue(deal_id, country, effectiveTotal, priority_tier);

    if (deal?.id) {
      const dealRowId = deal.id as string;
      void (async () => {
        try {
          await appendLedger({
            deal_id: dealRowId,
            event: CUSTODY_EVENTS.DOC_CREATED,
            actor_type: "system",
            location: "Milano Seal Intake",
            method: "intake",
            status: "created",
            metadata: {
              deal_code: deal_id,
              source,
              lane: finalLane,
              country,
              execution_truth: executionTruth,
              original_total: pricing.total,
              discount_amount: courtesyAdjustment?.amount ?? 0,
              final_total: effectiveTotal,
            },
          });
        } catch (error) {
          console.error(
            "[intake] custody ledger failed:",
            error instanceof Error ? error.message : error,
          );
        }
      })();

      void notifyClient(dealRowId, "intake_received").catch((error) => {
        console.error("[intake] client notification failed", {
          correlationId,
          dealId: deal_id,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        });
      });

      void (async () => {
        try {
          await runDealEngine({
            id: dealRowId,
            deal_id,
            email: data.email,
            phone: data.phone as string | undefined,
            client_name,
            document_type: data.document_type as string | undefined,
            destination_country: country,
            country,
            status: "intake_received",
            payment_status: "unpaid",
            payment_link,
            raw_text: String(raw.message ?? "") || null,
            mobile: legacyExecution.mobile,
            signers: Number(data.signers ?? 1),
            witnesses: Number(data.witnesses ?? 0),
          });
        } catch (error) {
          console.error(
            "[intake] runDealEngine failed:",
            error instanceof Error ? error.message : error,
          );
        }
      })();
    }

    if (data.email) {
      void sendIntakeConfirmation({
        to: data.email as string,
        name: client_name,
        dealId: deal_id,
        lane: finalLane,
        total: effectiveTotal,
        retainer: invoice.retainer,
        paymentLink: payment_link,
        portalUrl: `${SITE}/portal/${access_token}`,
      }).catch((error) => {
        console.error("[intake] confirmation email failed", {
          correlationId,
          dealId: deal_id,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        });
      });
    }

    void (async () => {
      let actor = source === "admin" ? "admin" : `${source}-intake`;
      try {
        const ssr = await createClient();
        const {
          data: { user },
        } = await ssr.auth.getUser();
        if (user?.email) actor = user.email;
      } catch (error) {
        console.warn("[intake] actor resolution unavailable", {
          correlationId,
          dealId: deal_id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
      await logActivity({
        deal_id,
        actor,
        action: "created",
        detail: `Intake captured · ${finalLane} lane · $${effectiveTotal} · ${country} · ${originAuthorityLabel}`,
        meta: {
          source,
          lane: finalLane,
          execution_truth: executionTruth,
          original_total: pricing.total,
          discount_amount: courtesyAdjustment?.amount ?? 0,
          final_total: effectiveTotal,
          conversion_score,
          priority_tier,
        },
      });
    })();

    const pricingBreakdown: { label: string; amount: number }[] = [
      { label: `${finalLane} base`, amount: pricing.base },
    ];
    if (pricing.witness_total > 0) {
      pricingBreakdown.push({
        label: `Witnesses · ${data.witnesses ?? 0}`,
        amount: pricing.witness_total,
      });
    }
    for (const addon of pricing.addons) {
      pricingBreakdown.push({ label: addon.item, amount: addon.amount });
    }
    if (courtesyAdjustment?.amount) {
      pricingBreakdown.push({
        label: "Professional courtesy",
        amount: -courtesyAdjustment.amount,
      });
    }

    const rationaleByLane: Record<string, string> = {
      RON_SIMPLE: "Explicit RON execution selected — RON Simple lane applies.",
      MOBILE_STANDARD: "Explicit Florida mobile execution + round-trip mileage.",
      Signature: "Standard execution path from resolved Matter facts.",
      Priority: "Resolved Matter scope triggers Priority coordination.",
      Executive:
        "Urgent or multi-country routing — Executive lane handles it end-to-end.",
    };

    stage = "RESPONSE_SENT";
    return NextResponse.json({
      success: true,
      correlation_id: correlationId,
      deal_id: deal?.deal_id || deal_id,
      lane: finalLane,
      execution_truth: executionTruth,
      estimated_value: effectiveTotal,
      original_total: pricing.total,
      discount_amount: courtesyAdjustment?.amount ?? 0,
      discount_value: courtesyAdjustment?.discount_value ?? null,
      final_total: effectiveTotal,
      amount_due: invoice.retainer,
      courtesy_applied: Boolean(courtesyAdjustment),
      courtesy_label: courtesyAdjustment ? "Professional courtesy" : null,
      conversion_score,
      priority_tier,
      payment_method: "WISE",
      wise_invoice,
      payment_link,
      pricing: {
        lane: finalLane,
        base: pricing.base,
        witness_total: pricing.witness_total,
        original_total: pricing.total,
        discount_amount: courtesyAdjustment?.amount ?? 0,
        total: effectiveTotal,
        breakdown: pricingBreakdown,
        rationale:
          rationaleByLane[finalLane] ?? "Standard pricing applied.",
      },
      execution_stage: "Intake Received",
      portal_url: `${
        process.env.NEXT_PUBLIC_SITE_URL || "https://themilanoseal.com"
      }/portal/${access_token}`,
      compliance_result: compliance,
      decline_risk,
      invoice,
    });
  } catch (error) {
    const code: IntakeFailureCode =
      stage === "PRICED" || stage === "INVOICE_CREATED"
        ? "PRICING_FAILED"
        : stage === "WISE_REQUEST_CREATED"
          ? "PAYMENT_REQUEST_FAILED"
          : "UNKNOWN_INTAKE_FAILURE";
    logIntakeFailure({
      correlationId,
      stage,
      code,
      error,
      dealId: currentDealId,
      source: currentSource,
    });
    return safeFailure(code, correlationId, 500);
  }
}
