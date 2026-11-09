import "server-only";

import { hasCurrentWiseProviderEvidence } from "@/lib/wise/attemptEvidence";
import { createAdminClient } from "@/lib/supabase/admin";
import { evaluateSchedulingGate } from "@/lib/scheduling/complimentarySchedulingGate";

const DEFAULT_EXCEPTION_AFTER_MINUTES = 10;

export type WiseExceptionScanResult = {
  checked: number;
  openedOrUpdated: number;
  resolved: number;
};

type PendingMatter = {
  payment_attempt_id: string | null;
  payment_attempt_started_at: string | null;
  wise_provider_evidence: unknown;
  id: string;
  deal_id: string | null;
  wise_reference: string | null;
  wise_transaction_reference: string | null;
  payment_funding_method: string | null;
  payment_confirmed: boolean | null;
  payment_status: string | null;
  payment_settlement_status: string | null;
  payment_observed_at: string | null;
  payment_observed_amount: number | null;
  payment_observed_currency: string | null;
  payment_observed_reference: string | null;
  amount_due: number | null;
  amount_paid: number | null;
  currency: string | null;
  payment_disposition: string | null;
  comp_authorized: boolean | null;
  comp_authorization_id: string | null;
  comp_authorized_at: string | null;
  comp_revoked_at: string | null;
  verified_revenue: number | null;
};

function exceptionThresholdMs(): number {
  const configured = Number(process.env.WISE_RECONCILIATION_EXCEPTION_AFTER_MINUTES ?? DEFAULT_EXCEPTION_AFTER_MINUTES);
  const minutes = Number.isFinite(configured) && configured >= 5 ? configured : DEFAULT_EXCEPTION_AFTER_MINUTES;
  return minutes * 60_000;
}

function normalizedCurrency(value: unknown): string {
  const currency = String(value ?? "USD").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(currency) ? currency : "USD";
}

function observedLongEnough(observedAt: string | null, nowMs: number): boolean {
  if (!observedAt) return false;
  const observedMs = new Date(observedAt).getTime();
  if (!Number.isFinite(observedMs)) return false;
  return nowMs - observedMs >= exceptionThresholdMs();
}

function classifyException(matter: PendingMatter): {
  reason: "provider_correlation_missing" | "settlement_pending_with_provider_evidence" | "payment_mismatch_review";
  severity: "watch" | "action_required";
  nextAction: string;
} {
  if (String(matter.payment_settlement_status ?? "").toLowerCase() === "mismatch_review") {
    return {
      reason: "payment_mismatch_review",
      severity: "action_required",
      nextAction: "Review exact Wise provider evidence. Do not mark paid manually. Use the governed provider-settlement recovery only after reference, amount, currency, resource and settlement evidence all match.",
    };
  }

  const providerEvidence =
hasCurrentWiseProviderEvidence(matter);

  if (providerEvidence) {
    return {
      reason: "settlement_pending_with_provider_evidence",
      severity: "watch",
      nextAction: "Wise provider correlation exists. Continue automatic settlement reconciliation. Scheduling remains governed separately from paid truth.",
    };
  }

  return {
    reason: "provider_correlation_missing",
    severity: "action_required",
    nextAction: "Wise submission is recorded but provider correlation is still missing. Scheduling remains locked until Wise settlement is verified. Obtain exact official Wise provider evidence for governed recovery; never infer paid state from amount or timing alone.",
  };
}

export async function scanWiseReconciliationExceptions(): Promise<WiseExceptionScanResult> {
  const admin = createAdminClient();
  const now = new Date();
  const nowIso = now.toISOString();
  const nowMs = now.getTime();

  const { data, error } = await admin
    .from("deals")
    .select(
      "id,deal_id,payment_attempt_id,payment_attempt_started_at,wise_provider_evidence,wise_reference,wise_transaction_reference,payment_funding_method,payment_confirmed,payment_status,payment_settlement_status,payment_observed_at,payment_observed_amount,payment_observed_currency,payment_observed_reference,amount_due,amount_paid,currency,payment_disposition,comp_authorized,comp_authorization_id,comp_authorized_at,comp_revoked_at,verified_revenue",
    )
    .eq("payment_confirmed", false)
    .not("payment_observed_at", "is", null)
    .in("payment_settlement_status", ["observed_pending", "mismatch_review"])
    .order("payment_observed_at", { ascending: true })
    .limit(200);

  if (error) throw new Error(`Wise exception scan failed: ${error.message}`);

  const pending = (data ?? []) as PendingMatter[];
  const matured = pending.filter((matter) => observedLongEnough(matter.payment_observed_at, nowMs));
  const activeIds = new Set(matured.map((matter) => matter.id));
  let openedOrUpdated = 0;

  for (const matter of matured) {
    if (!matter.payment_observed_at) continue;
    const scheduling = evaluateSchedulingGate({ matter });
    const classification = classifyException(matter);
    const reference = String(matter.wise_reference ?? matter.deal_id ?? matter.id).trim();
    const providerResourceId = String(matter.wise_transaction_reference ?? "").trim() || null;

    const { data: existing } = await admin
      .from("wise_reconciliation_exceptions")
      .select("id,attempt_count")
      .eq("deal_id", matter.id)
      .maybeSingle();

    const attemptCount = Number(existing?.attempt_count ?? 0) + 1;
    const payload = {
      deal_id: matter.id,
      matter_reference: reference,
      status: "open",
      reason: classification.reason,
      severity: classification.severity,
      scheduling_authorized: scheduling.schedulingEligible,
      payment_observed_at: matter.payment_observed_at,
      provider_resource_id: providerResourceId,
      amount_due: Number(matter.amount_due ?? 0),
      currency: normalizedCurrency(matter.currency),
      attempt_count: attemptCount,
      last_detected_at: nowIso,
      next_action: classification.nextAction,
      resolution: null,
      resolved_at: null,
      updated_at: nowIso,
      metadata: {
        scheduling_method: scheduling.paymentRequirementMethod,
        scheduling_reason: scheduling.reason,
        payment_status: matter.payment_status,
        settlement_status: matter.payment_settlement_status,
        paid_truth: false,
        auto_payment_confirmation_attempted: false,
      },
    };

    if (existing?.id) {
      const { error: updateError } = await admin
        .from("wise_reconciliation_exceptions")
        .update(payload)
        .eq("id", existing.id);
      if (updateError) throw new Error(`Wise exception update failed: ${updateError.message}`);
    } else {
      const { error: insertError } = await admin
        .from("wise_reconciliation_exceptions")
        .insert({ ...payload, first_detected_at: nowIso, created_at: nowIso });
      if (insertError) throw new Error(`Wise exception insert failed: ${insertError.message}`);
    }
    openedOrUpdated += 1;
  }

  const { data: openExceptions, error: openError } = await admin
    .from("wise_reconciliation_exceptions")
    .select("id,deal_id")
    .eq("status", "open")
    .limit(500);
  if (openError) throw new Error(`Wise exception resolution scan failed: ${openError.message}`);

  let resolved = 0;
  for (const exception of openExceptions ?? []) {
    if (activeIds.has(exception.deal_id)) continue;
    const { error: resolveError } = await admin
      .from("wise_reconciliation_exceptions")
      .update({
        status: "resolved",
        resolution: "Canonical Matter payment state no longer requires Wise exception handling.",
        resolved_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", exception.id)
      .eq("status", "open");
    if (resolveError) throw new Error(`Wise exception resolve failed: ${resolveError.message}`);
    resolved += 1;
  }

  return {
    checked: pending.length,
    openedOrUpdated,
    resolved,
  };
}
