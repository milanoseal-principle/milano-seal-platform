import "server-only";

import { evaluatePaymentGate } from "@/lib/payments/paymentGate";
import { activityMatchesAttempt, isInvalidWiseStatus } from "@/lib/wise/attemptEvidence";
import { createAdminClient } from "@/lib/supabase/admin";

const WISE_API_BASE = "https://api.wise.com";
const WISE_API_VERSION = process.env.WISE_API_VERSION?.trim() || "2026Q3";
const MAX_ACTIVITY_PAGES = 5;
const ACTIVITY_PAGE_SIZE = 100;

export type WiseProviderStatus =
  | "REQUIRES_ATTENTION"
  | "IN_PROGRESS"
  | "UPCOMING"
  | "COMPLETED"
  | "CANCELLED"
  | "UNKNOWN"
  | "FAILED" | "EXPIRED" | "REVERSED" | "VOIDED" | "REFUNDED" | "REJECTED" | "REVOKED";

export type WiseReconciliationResult = {
  ok: boolean;
  matterId: string;
  reference: string;
  providerEvidence: boolean;
  providerStatus: WiseProviderStatus | null;
  providerResourceId: string | null;
  settlementConfirmed: boolean;
  alreadyConfirmed: boolean;
  statementChecked: boolean;
  statementScaRequired: boolean;
  reason: string;
};

type DealPaymentRow = {
  id: string;
  deal_id: string | null;
  wise_reference: string | null;
  wise_transaction_reference: string | null;
  payment_status: string | null;
  payment_confirmed: boolean | null;
  payment_settlement_status: string | null;
  payment_observed_at: string | null;
  payment_confirmed_at: string | null;
  amount_due: number | string | null;
  amount_paid: number | string | null;
  currency: string | null;
  updated_at: string | null;
  payment_attempt_id: string | null;
  payment_attempt_started_at: string | null;
};

type WiseActivity = {
  id?: string;
  type?: string;
  resource?: unknown;
  title?: string;
  description?: string;
  primaryAmount?: string;
  secondaryAmount?: string;
  status?: string;
  createdOn?: string;
  updatedOn?: string;
  [key: string]: unknown;
};

type WiseStatementTransaction = {
  type?: string;
  date?: string;
  amount?: { value?: number; currency?: string };
  totalFees?: { value?: number; currency?: string };
  details?: unknown;
  referenceNumber?: string;
  [key: string]: unknown;
};

type WiseStatement = {
  transactions?: WiseStatementTransaction[];
  [key: string]: unknown;
};

type WiseBalance = {
  id?: number | string;
  currency?: string;
  type?: string;
  [key: string]: unknown;
};

type WiseProfile = {
  id?: number | string;
  type?: string;
  currentState?: string;
  [key: string]: unknown;
};

type WiseConfig = {
  token: string;
  profileId: string;
};

type StatementConfirmation = {
  confirmed: boolean;
  scaRequired: boolean;
  checked: boolean;
  transactionReference: string | null;
};

class WiseApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly scaRequired = false,
  ) {
    super(message);
    this.name = "WiseApiError";
  }
}

let resolvedConfigPromise: Promise<WiseConfig> | null = null;

function money(value: unknown): number {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? Math.round(amount * 100) / 100 : 0;
}

function sameMoney(left: unknown, right: unknown): boolean {
  return Math.round(money(left) * 100) === Math.round(money(right) * 100);
}

function canonicalCurrency(value: unknown): string {
  const normalized = String(value ?? "USD").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(normalized) ? normalized : "USD";
}

function exactReferencePresent(value: unknown, reference: string): boolean {
  if (!reference) return false;
  const serialized = JSON.stringify(value ?? {}).toUpperCase();
  const needle = reference.trim().toUpperCase();
  if (!needle) return false;
  const index = serialized.indexOf(needle);
  if (index < 0) return false;

  const before = index > 0 ? serialized[index - 1] : "";
  const after = serialized[index + needle.length] ?? "";
  const tokenChar = /[A-Z0-9]/;
  return !tokenChar.test(before) && !tokenChar.test(after);
}

function activityResourceId(activity: WiseActivity): string | null {
  if (activity.resource && typeof activity.resource === "object") {
    const resource = activity.resource as Record<string, unknown>;
    for (const key of ["id", "resourceId", "transactionId", "paymentId", "referenceNumber"]) {
      const value = resource[key];
      if (value !== null && value !== undefined && String(value).trim()) {
        return String(value).trim();
      }
    }
  }
  return activity.id?.trim() || null;
}

function providerStatus(activity: WiseActivity): WiseProviderStatus {
  const status = String(activity.status ?? "UNKNOWN").trim().toUpperCase();
  if (isInvalidWiseStatus(status)) return status as WiseProviderStatus;
  if (
    status === "REQUIRES_ATTENTION" ||
    status === "IN_PROGRESS" ||
    status === "UPCOMING" ||
    status === "COMPLETED" ||
    status === "CANCELLED"
  ) {
    return status;
  }
  return "UNKNOWN";
}

function activityTimestamp(activity: WiseActivity): string | null {
  return activity.updatedOn?.trim() || activity.createdOn?.trim() || null;
}

function statementGrossAmount(transaction: WiseStatementTransaction): number {
  const amount = Math.abs(money(transaction.amount?.value));
  const fee = Math.abs(money(transaction.totalFees?.value));
  return Math.round((amount + fee) * 100) / 100;
}

function statementTransactionMatches(params: {
  transaction: WiseStatementTransaction;
  matterReference: string;
  providerResourceId: string | null;
  amountDue: number;
  currency: string;
  attemptStartedAt?: string | null;
}): boolean {
  const { transaction, matterReference, providerResourceId, amountDue, currency } = params;
  if (params.attemptStartedAt) {
    const occurred = Date.parse(transaction.date ?? '');
    if (!Number.isFinite(occurred) || occurred < Date.parse(params.attemptStartedAt)) return false;
  }
  if (String(transaction.type ?? "").toUpperCase() !== "CREDIT" || money(transaction.amount?.value) <= 0) return false;
  if (String(transaction.amount?.currency ?? '').trim().toUpperCase() !== currency) return false;
  if (money(transaction.totalFees?.value) !== 0 && String(transaction.totalFees?.currency ?? '').trim().toUpperCase() !== currency) return false;
  if (!sameMoney(statementGrossAmount(transaction), amountDue)) return false;

  return exactReferencePresent(transaction, matterReference) &&
    (!providerResourceId || exactReferencePresent(transaction, providerResourceId));
}

function correlationId(): string {
  return crypto.randomUUID();
}

function wiseUrl(path: string): string {
  return `${WISE_API_BASE}/${WISE_API_VERSION}${path}`;
}

async function wiseGetJson<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-External-Correlation-Id": correlationId(),
      Accept: "application/json",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    await response.body?.cancel();
    const scaRequired = response.status === 403 && Boolean(response.headers.get("x-2fa-approval"));
    throw new WiseApiError(
      `Wise API ${response.status}: request rejected`,
      response.status,
      scaRequired,
    );
  }

  return (await response.json()) as T;
}

async function resolveWiseConfigUncached(): Promise<WiseConfig> {
  const token = process.env.WISE_API_TOKEN?.trim();
  const configuredProfileId = process.env.WISE_PROFILE_ID?.trim();
  if (!token) throw new WiseApiError("Wise API token is not configured", 503);

  const profiles = await wiseGetJson<WiseProfile[]>(wiseUrl("/profiles"), token);
  const usableProfiles = profiles.filter(
    (profile) =>
      profile.id !== null &&
      profile.id !== undefined &&
      String(profile.currentState ?? "VISIBLE").toUpperCase() !== "DEACTIVATED",
  );

  if (configuredProfileId) {
    const configured = usableProfiles.find((profile) => String(profile.id) === configuredProfileId);
    if (configured) return { token, profileId: configuredProfileId };
  }

  const businessProfiles = usableProfiles.filter(
    (profile) => String(profile.type ?? "").toUpperCase() === "BUSINESS",
  );
  if (businessProfiles.length === 1 && businessProfiles[0]?.id !== undefined) {
    return { token, profileId: String(businessProfiles[0].id) };
  }

  if (!configuredProfileId) {
    throw new WiseApiError(
      businessProfiles.length > 1
        ? "WISE_PROFILE_ID is required because this Wise token can access multiple business profiles"
        : "WISE_PROFILE_ID is not configured and no single active Wise business profile could be resolved",
      503,
    );
  }

  throw new WiseApiError(
    businessProfiles.length > 1
      ? "WISE_PROFILE_ID does not belong to this Wise token; multiple active business profiles are available"
      : "WISE_PROFILE_ID does not belong to this Wise token and no single active business profile could be resolved",
    503,
  );
}

async function resolveWiseConfig(): Promise<WiseConfig> {
  if (!resolvedConfigPromise) {
    resolvedConfigPromise = resolveWiseConfigUncached().catch((error) => {
      resolvedConfigPromise = null;
      throw error;
    });
  }
  return resolvedConfigPromise;
}

function isOptionalActivityCapabilityError(error: unknown): boolean {
  return error instanceof WiseApiError && !error.scaRequired && (error.status === 403 || error.status === 404);
}

export async function listWiseAcquiringActivities(params: {
  since: string;
  until?: string;
}): Promise<WiseActivity[]> {
  const { token, profileId } = await resolveWiseConfig();
  const activities: WiseActivity[] = [];
  let nextCursor: string | null = null;

  try {
    for (let page = 0; page < MAX_ACTIVITY_PAGES; page += 1) {
      const query = new URLSearchParams({
        monetaryResourceType: "ACQUIRING_PAYMENT",
        since: params.since,
        until: params.until ?? new Date().toISOString(),
        size: String(ACTIVITY_PAGE_SIZE),
      });
      if (nextCursor) query.set("nextCursor", nextCursor);

      const payload = await wiseGetJson<{ cursor?: string | null; activities?: WiseActivity[] }>(
        wiseUrl(`/profiles/${encodeURIComponent(profileId)}/activities?${query.toString()}`),
        token,
      );
      activities.push(...(payload.activities ?? []));
      nextCursor = payload.cursor?.trim() || null;
      if (!nextCursor) break;
    }
  } catch (error) {
    if (isOptionalActivityCapabilityError(error)) return [];
    throw error;
  }

  return activities;
}

async function getStandardBalance(currency: string): Promise<WiseBalance | null> {
  const { token, profileId } = await resolveWiseConfig();
  const query = new URLSearchParams({ types: "STANDARD" });
  const balances = await wiseGetJson<WiseBalance[]>(
    wiseUrl(`/profiles/${encodeURIComponent(profileId)}/balances?${query.toString()}`),
    token,
  );
  return (
    balances.find(
      (balance) =>
        String(balance.type ?? "STANDARD").toUpperCase() === "STANDARD" &&
        canonicalCurrency(balance.currency) === currency,
    ) ?? null
  );
}

async function getBalanceStatement(params: {
  balanceId: string;
  currency: string;
  since: string;
  until: string;
}): Promise<WiseStatement> {
  const { token, profileId } = await resolveWiseConfig();
  const query = new URLSearchParams({
    currency: params.currency,
    intervalStart: params.since,
    intervalEnd: params.until,
    type: "COMPACT",
    statementLocale: "en",
  });
  return wiseGetJson<WiseStatement>(
    wiseUrl(
      `/profiles/${encodeURIComponent(profileId)}/balance-statements/${encodeURIComponent(params.balanceId)}/statement.json?${query.toString()}`,
    ),
    token,
  );
}

function searchStart(deal: DealPaymentRow): string {
  const anchor = deal.payment_observed_at ?? deal.updated_at ?? new Date().toISOString();
  const date = new Date(anchor);
  if (Number.isNaN(date.getTime())) return new Date(Date.now() - 7 * 86_400_000).toISOString();
  return new Date(date.getTime() - 48 * 60 * 60 * 1000).toISOString();
}

async function loadDeal(matterId: string): Promise<DealPaymentRow> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("deals")
    .select(
      "id, deal_id, wise_reference, wise_transaction_reference, payment_status, payment_confirmed, payment_settlement_status, payment_observed_at, payment_confirmed_at, amount_due, amount_paid, currency, updated_at, payment_attempt_id, payment_attempt_started_at",
    )
    .eq("id", matterId)
    .single();
  if (error || !data) throw new Error("Matter payment record not found");
  return data as DealPaymentRow;
}

type ReconciliationIO = {
  admin?: ReturnType<typeof createAdminClient>;
  getStandardBalance?: typeof getStandardBalance;
  getBalanceStatement?: typeof getBalanceStatement;
};

async function recordProviderObservation(params: {
  deal: DealPaymentRow;
  activity: WiseActivity;
  status: WiseProviderStatus;
  providerResourceId: string | null;
}, io: ReconciliationIO = {}): Promise<void> {
  // Legacy observations gain no execution authority from a bare resource ID.
  if (!params.deal.payment_attempt_id) {
    if (isInvalidWiseStatus(params.status)) {
      const { error } = await (io.admin ?? createAdminClient()).from("deals").update({
        payment_settlement_status: "failed", payment_status: "failed",
      }).eq("id", params.deal.id).is("payment_attempt_id", null);
      if (error) throw new Error(`Wise legacy invalidation failed (${error.code ?? "unknown"})`);
    }
    return;
  }
  const { error } = await (io.admin ?? createAdminClient()).rpc("record_wise_attempt_evidence", {
    p_deal_id: params.deal.id,
    p_attempt_id: params.deal.payment_attempt_id,
    p_resource_id: params.providerResourceId,
    p_status: params.status,
    p_occurred_at: activityTimestamp(params.activity),
    p_amount: money(params.deal.amount_due),
    p_currency: canonicalCurrency(params.deal.currency),
    p_reference: String(params.deal.wise_reference ?? params.deal.deal_id ?? "").trim(),
    p_source: "wise-activity",
    p_event_id: params.activity.id ?? null,
  });
  if (error) throw new Error(`Wise attempt observation rejected (${error.code ?? "unknown"})`);
}

async function confirmFromStatement(params: {
  deal: DealPaymentRow;
  providerResourceId: string | null;
  since: string;
}, io: ReconciliationIO = {}): Promise<StatementConfirmation> {
  const currency = canonicalCurrency(params.deal.currency);
  const amountDue = money(params.deal.amount_due);
  if (amountDue <= 0) {
    return { confirmed: false, scaRequired: false, checked: false, transactionReference: null };
  }

  try {
    const balance = await (io.getStandardBalance ?? getStandardBalance)(currency);
    if (!balance?.id) {
      return { confirmed: false, scaRequired: false, checked: true, transactionReference: null };
    }

    const statement = await (io.getBalanceStatement ?? getBalanceStatement)({
      balanceId: String(balance.id),
      currency,
      since: params.since,
      until: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });
    const reference = String(params.deal.wise_reference ?? params.deal.deal_id ?? "").trim();
    const match = (statement.transactions ?? []).find((transaction) =>
      statementTransactionMatches({
        transaction,
        matterReference: reference,
        providerResourceId: params.providerResourceId,
        amountDue,
        currency,
        attemptStartedAt: params.deal.payment_attempt_started_at,
      }),
    );
    if (!match) {
      return { confirmed: false, scaRequired: false, checked: true, transactionReference: null };
    }

    const transactionReference =
      match.referenceNumber?.trim() || params.providerResourceId;
    const admin = io.admin ?? createAdminClient();
    if (!transactionReference) return { confirmed: false, scaRequired: false, checked: true, transactionReference: null };
    if (params.deal.payment_attempt_id) {
      const evidence = await admin.rpc("record_wise_attempt_evidence", {
        p_deal_id: params.deal.id, p_attempt_id: params.deal.payment_attempt_id,
        p_resource_id: transactionReference, p_status: "SETTLED",
        p_occurred_at: match.date, p_amount: amountDue, p_currency: currency,
        p_reference: reference, p_source: "wise-statement",
      });
      if (evidence.error) throw new Error(`Wise settlement attempt rejected (${evidence.error.code ?? "unknown"})`);
      if (!evidence.data?.accepted) return { confirmed: false, scaRequired: false, checked: true, transactionReference: null };
    }
    const { error } = await admin.rpc("confirm_wise_payment_for_deal", {
      p_deal_id: params.deal.id,
      p_payment_reference: reference,
      p_wise_transaction_reference: transactionReference,
      p_amount: amountDue,
      p_currency: currency,
      p_actor: "wise-statement-reconciliation",
    });
    if (error) throw error;

    return { confirmed: true, scaRequired: false, checked: true, transactionReference };
  } catch (error) {
    if (error instanceof WiseApiError && error.scaRequired) {
      return { confirmed: false, scaRequired: true, checked: true, transactionReference: null };
    }
    if (error instanceof WiseApiError && (error.status === 403 || error.status === 404)) {
      return { confirmed: false, scaRequired: false, checked: false, transactionReference: null };
    }
    throw error;
  }
}

function noReferenceResult(deal: DealPaymentRow): WiseReconciliationResult {
  return {
    ok: false,
    matterId: deal.id,
    reference: "",
    providerEvidence: false,
    providerStatus: null,
    providerResourceId: null,
    settlementConfirmed: false,
    alreadyConfirmed: false,
    statementChecked: false,
    statementScaRequired: false,
    reason: "Matter has no Wise reference",
  };
}

export async function reconcileLoadedDeal(
  deal: DealPaymentRow,
  activities: WiseActivity[],
  io: ReconciliationIO = {},
): Promise<WiseReconciliationResult> {
  const reference = String(deal.wise_reference ?? deal.deal_id ?? "").trim();
  if (!reference) return noReferenceResult(deal);


  if (isInvalidWiseStatus(deal.payment_settlement_status) || isInvalidWiseStatus(deal.payment_status)) {
    return { ...noReferenceResult(deal), reference, reason: "Invalidated Wise attempt requires a fresh governed submission" };
  }

  const activity = activities
    .filter((candidate) => exactReferencePresent(candidate, reference) && (activityMatchesAttempt(candidate, deal) ||
      (!deal.payment_attempt_id && isInvalidWiseStatus(providerStatus(candidate)) &&
        activityResourceId(candidate) === deal.wise_transaction_reference)))
    .sort((a, b) => {
      const aTime = Date.parse(activityTimestamp(a) ?? "") || 0;
      const bTime = Date.parse(activityTimestamp(b) ?? "") || 0;
      return bTime - aTime;
    })[0];

  const status = activity ? providerStatus(activity) : null;
  const activityResource = activity ? activityResourceId(activity) : null;

  if (!isInvalidWiseStatus(status) && status !== "REQUIRES_ATTENTION" && evaluatePaymentGate({ ...deal, amount_due: money(deal.amount_due), amount_paid: money(deal.amount_paid) }) === "PAYMENT_CONFIRMED") {
    return {
      ok: true,
      matterId: deal.id,
      reference,
      providerEvidence: Boolean(deal.wise_transaction_reference),
      providerStatus: "COMPLETED",
      providerResourceId: deal.wise_transaction_reference,
      settlementConfirmed: true,
      alreadyConfirmed: true,
      statementChecked: false,
      statementScaRequired: false,
      reason: "Wise payment is already verified",
    };
  }

  if (activity && status) {
    await recordProviderObservation({ deal, activity, status, providerResourceId: activityResource }, io);
    if (isInvalidWiseStatus(status) || status === "REQUIRES_ATTENTION" || status === "UNKNOWN") {
      return {
        ok: true,
        matterId: deal.id,
        reference,
        providerEvidence: !isInvalidWiseStatus(status) && status !== "UNKNOWN" && status !== "REQUIRES_ATTENTION",
        providerStatus: status,
        providerResourceId: activityResource,
        settlementConfirmed: false,
        alreadyConfirmed: false,
        statementChecked: false,
        statementScaRequired: false,
        reason:
          isInvalidWiseStatus(status)
            ? "Wise reports the acquiring payment as cancelled"
            : "Wise reports that the acquiring payment requires attention",
      };
    }
  }

  const settlement = await confirmFromStatement({
    deal,
    providerResourceId: activityResource ?? deal.wise_transaction_reference,
    since: searchStart(deal),
  }, io);

  if (settlement.confirmed) {
    return {
      ok: true,
      matterId: deal.id,
      reference,
      providerEvidence: true,
      providerStatus: status,
      providerResourceId: settlement.transactionReference ?? activityResource,
      settlementConfirmed: true,
      alreadyConfirmed: false,
      statementChecked: true,
      statementScaRequired: false,
      reason: activity
        ? "Wise activity enrichment and settled balance-statement credit verified"
        : "Settled Wise balance-statement credit verified from exact Matter reference, currency, and gross amount",
    };
  }

  if (settlement.scaRequired) {
    return {
      ok: true,
      matterId: deal.id,
      reference,
      providerEvidence: Boolean(activity),
      providerStatus: status,
      providerResourceId: activityResource,
      settlementConfirmed: false,
      alreadyConfirmed: false,
      statementChecked: true,
      statementScaRequired: true,
      reason: "Wise balance statement requires SCA before settlement can be marked cleared",
    };
  }

  if (activity) {
    return {
      ok: true,
      matterId: deal.id,
      reference,
      providerEvidence: true,
      providerStatus: status,
      providerResourceId: activityResource,
      settlementConfirmed: false,
      alreadyConfirmed: false,
      statementChecked: settlement.checked,
      statementScaRequired: false,
      reason:
        status === "COMPLETED"
          ? "Wise acquiring payment completed; matching settled balance credit is not visible yet"
          : "Wise has accepted the acquiring payment and it is still processing",
    };
  }

  return {
    ok: true,
    matterId: deal.id,
    reference,
    providerEvidence: false,
    providerStatus: null,
    providerResourceId: null,
    settlementConfirmed: false,
    alreadyConfirmed: false,
    statementChecked: settlement.checked,
    statementScaRequired: false,
    reason: settlement.checked
      ? "No exact matching settled Wise balance-statement credit found yet"
      : "Wise personal-token settlement evidence is not API-accessible; payment remains unconfirmed",
  };
}

export async function reconcileWiseMatter(matterId: string): Promise<WiseReconciliationResult> {
  const deal = await loadDeal(matterId);
  const activities = await listWiseAcquiringActivities({ since: searchStart(deal) });
  return reconcileLoadedDeal(deal, activities);
}

export async function reconcileObservedWisePayments(): Promise<{
  checked: number;
  providerMatched: number;
  settlementConfirmed: number;
  results: WiseReconciliationResult[];
}> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("deals")
    .select(
      "id, deal_id, wise_reference, wise_transaction_reference, payment_status, payment_confirmed, payment_settlement_status, payment_observed_at, payment_confirmed_at, amount_due, amount_paid, currency, updated_at, payment_attempt_id, payment_attempt_started_at",
    )
    .eq("payment_confirmed", false)
    .in("payment_settlement_status", ["observed_pending", "mismatch_review"])
    .not("payment_observed_at", "is", null)
    .order("payment_observed_at", { ascending: true })
    .limit(100);

  if (error) throw error;
  const deals = (data ?? []) as DealPaymentRow[];
  if (deals.length === 0) {
    return { checked: 0, providerMatched: 0, settlementConfirmed: 0, results: [] };
  }

  const oldest = deals.reduce((earliest, deal) => {
    const candidate = Date.parse(searchStart(deal));
    return Number.isFinite(candidate) && candidate < earliest ? candidate : earliest;
  }, Date.now());
  const activities = await listWiseAcquiringActivities({ since: new Date(oldest).toISOString() });

  const results: WiseReconciliationResult[] = [];
  for (const deal of deals) {
    try {
      results.push(await reconcileLoadedDeal(deal, activities));
    } catch (error) {
      results.push({
        ok: false,
        matterId: deal.id,
        reference: String(deal.wise_reference ?? deal.deal_id ?? ""),
        providerEvidence: false,
        providerStatus: null,
        providerResourceId: null,
        settlementConfirmed: false,
        alreadyConfirmed: false,
        statementChecked: false,
        statementScaRequired: error instanceof WiseApiError && error.scaRequired,
        reason: error instanceof Error ? error.message : "Wise reconciliation failed",
      });
    }
  }

  return {
    checked: results.length,
    providerMatched: results.filter((result) => result.providerEvidence).length,
    settlementConfirmed: results.filter((result) => result.settlementConfirmed).length,
    results,
  };
}
