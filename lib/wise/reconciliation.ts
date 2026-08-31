import "server-only";

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
  | "UNKNOWN";

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
  businessName?: string;
  fullName?: string;
  [key: string]: unknown;
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
}): boolean {
  const { transaction, matterReference, providerResourceId, amountDue, currency } = params;
  if (String(transaction.type ?? "").toUpperCase() !== "CREDIT") return false;
  if (canonicalCurrency(transaction.amount?.currency) !== currency) return false;
  if (!sameMoney(statementGrossAmount(transaction), amountDue)) return false;

  return (
    exactReferencePresent(transaction, matterReference) ||
    Boolean(providerResourceId && exactReferencePresent(transaction, providerResourceId))
  );
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
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const scaRequired = response.status === 403 && Boolean(response.headers.get("x-2fa-approval"));
    throw new WiseApiError(
      `Wise API ${response.status}: ${body.slice(0, 240) || response.statusText}`,
      response.status,
      scaRequired,
    );
  }

  return (await response.json()) as T;
}

async function resolveWiseConfig(): Promise<{ token: string; profileId: string }> {
  const token = process.env.WISE_API_TOKEN?.trim();
  const configuredProfileId = process.env.WISE_PROFILE_ID?.trim();
  if (!token) {
    throw new WiseApiError("Wise API token is not configured", 503);
  }

  const profiles = await wiseGetJson<WiseProfile[]>(wiseUrl("/profiles"), token);
  const usableProfiles = profiles.filter(
    (profile) => profile.id !== null && profile.id !== undefined && String(profile.currentState ?? "VISIBLE").toUpperCase() !== "DEACTIVATED",
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

export async function listWiseAcquiringActivities(params: {
  since: string;
  until?: string;
}): Promise<WiseActivity[]> {
  const { token, profileId } = await resolveWiseConfig();
  const activities: WiseActivity[] = [];
  let nextCursor: string | null = null;

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
      "id, deal_id, wise_reference, wise_transaction_reference, payment_status, payment_confirmed, payment_settlement_status, payment_observed_at, payment_confirmed_at, amount_due, amount_paid, currency, updated_at",
    )
    .eq("id", matterId)
    .single();

  if (error || !data) throw new Error("Matter payment record not found");
  return data as DealPaymentRow;
}

async function recordProviderObservation(params: {
  deal: DealPaymentRow;
  activity: WiseActivity;
  status: WiseProviderStatus;
  providerResourceId: string | null;
}): Promise<void> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  if (params.status === "CANCELLED") {
    await admin
      .from("deals")
      .update({
        payment_settlement_status: "failed",
        payment_funding_method: "wise_acquiring_payment",
        wise_transaction_reference: params.providerResourceId,
        updated_at: now,
      })
      .eq("id", params.deal.id)
      .eq("payment_confirmed", false);
    return;
  }

  if (params.status === "REQUIRES_ATTENTION") {
    await admin
      .from("deals")
      .update({
        payment_settlement_status: "mismatch_review",
        payment_funding_method: "wise_acquiring_payment",
        wise_transaction_reference: params.providerResourceId,
        payment_observed_at: params.deal.payment_observed_at ?? activityTimestamp(params.activity) ?? now,
        updated_at: now,
      })
      .eq("id", params.deal.id)
      .eq("payment_confirmed", false);
    return;
  }

  await admin
    .from("deals")
    .update({
      payment_settlement_status: "observed_pending",
      payment_funding_method: "wise_acquiring_payment",
      wise_transaction_reference: params.providerResourceId,
      payment_observed_at: params.deal.payment_observed_at ?? activityTimestamp(params.activity) ?? now,
      updated_at: now,
    })
    .eq("id", params.deal.id)
    .eq("payment_confirmed", false);
}

async function confirmFromStatement(params: {
  deal: DealPaymentRow;
  providerResourceId: string | null;
  since: string;
}): Promise<{ confirmed: boolean; scaRequired: boolean; checked: boolean }> {
  const currency = canonicalCurrency(params.deal.currency);
  const amountDue = money(params.deal.amount_due);
  if (amountDue <= 0) return { confirmed: false, scaRequired: false, checked: false };

  try {
    const balance = await getStandardBalance(currency);
    if (!balance?.id) return { confirmed: false, scaRequired: false, checked: true };

    const until = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const statement = await getBalanceStatement({
      balanceId: String(balance.id),
      currency,
      since: params.since,
      until,
    });

    const reference = String(params.deal.wise_reference ?? params.deal.deal_id ?? "").trim();
    const match = (statement.transactions ?? []).find((transaction) =>
      statementTransactionMatches({
        transaction,
        matterReference: reference,
        providerResourceId: params.providerResourceId,
        amountDue,
        currency,
      }),
    );

    if (!match) return { confirmed: false, scaRequired: false, checked: true };

    const admin = createAdminClient();
    const transactionReference =
      match.referenceNumber?.trim() || params.providerResourceId || `wise-statement-${params.deal.id}`;

    const { error } = await admin.rpc("confirm_wise_payment_for_deal", {
      p_deal_id: params.deal.id,
      p_payment_reference: reference,
      p_wise_transaction_reference: transactionReference,
      p_amount: amountDue,
      p_currency: currency,
      p_actor: "wise-active-reconciliation",
    });
    if (error) throw error;

    return { confirmed: true, scaRequired: false, checked: true };
  } catch (error) {
    if (error instanceof WiseApiError && error.scaRequired) {
      return { confirmed: false, scaRequired: true, checked: true };
    }
    throw error;
  }
}

async function reconcileLoadedDeal(
  deal: DealPaymentRow,
  activities: WiseActivity[],
): Promise<WiseReconciliationResult> {
  const reference = String(deal.wise_reference ?? deal.deal_id ?? "").trim();
  if (!reference) {
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

  if (deal.payment_confirmed === true || String(deal.payment_status).toLowerCase() === "paid") {
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

  const candidates = activities
    .filter((activity) => exactReferencePresent(activity, reference))
    .sort((a, b) => {
      const aTime = Date.parse(activityTimestamp(a) ?? "") || 0;
      const bTime = Date.parse(activityTimestamp(b) ?? "") || 0;
      return bTime - aTime;
    });

  const activity = candidates[0];
  if (!activity) {
    return {
      ok: true,
      matterId: deal.id,
      reference,
      providerEvidence: false,
      providerStatus: null,
      providerResourceId: null,
      settlementConfirmed: false,
      alreadyConfirmed: false,
      statementChecked: false,
      statementScaRequired: false,
      reason: "No matching Wise acquiring activity found yet",
    };
  }

  const status = providerStatus(activity);
  const providerResourceId = activityResourceId(activity);
  await recordProviderObservation({ deal, activity, status, providerResourceId });

  if (status === "CANCELLED") {
    return {
      ok: true,
      matterId: deal.id,
      reference,
      providerEvidence: true,
      providerStatus: status,
      providerResourceId,
      settlementConfirmed: false,
      alreadyConfirmed: false,
      statementChecked: false,
      statementScaRequired: false,
      reason: "Wise reports the acquiring payment as cancelled",
    };
  }

  if (status === "REQUIRES_ATTENTION") {
    return {
      ok: true,
      matterId: deal.id,
      reference,
      providerEvidence: true,
      providerStatus: status,
      providerResourceId,
      settlementConfirmed: false,
      alreadyConfirmed: false,
      statementChecked: false,
      statementScaRequired: false,
      reason: "Wise reports that the acquiring payment requires attention",
    };
  }

  if (status === "COMPLETED") {
    const settlement = await confirmFromStatement({
      deal,
      providerResourceId,
      since: searchStart(deal),
    });
    return {
      ok: true,
      matterId: deal.id,
      reference,
      providerEvidence: true,
      providerStatus: status,
      providerResourceId,
      settlementConfirmed: settlement.confirmed,
      alreadyConfirmed: false,
      statementChecked: settlement.checked,
      statementScaRequired: settlement.scaRequired,
      reason: settlement.confirmed
        ? "Wise acquiring payment and settled balance credit verified"
        : settlement.scaRequired
          ? "Wise acquiring payment completed; balance statement requires Wise SCA before settlement can be marked cleared"
          : "Wise acquiring payment completed; cleared balance credit is not visible yet",
    };
  }

  return {
    ok: true,
    matterId: deal.id,
    reference,
    providerEvidence: true,
    providerStatus: status,
    providerResourceId,
    settlementConfirmed: false,
    alreadyConfirmed: false,
    statementChecked: false,
    statementScaRequired: false,
    reason: "Wise has accepted the acquiring payment and it is still processing",
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
      "id, deal_id, wise_reference, wise_transaction_reference, payment_status, payment_confirmed, payment_settlement_status, payment_observed_at, payment_confirmed_at, amount_due, amount_paid, currency, updated_at",
    )
    .eq("payment_confirmed", false)
    .in("payment_settlement_status", ["observed_pending", "mismatch_review"])
    .not("payment_observed_at", "is", null)
    .order("payment_observed_at", { ascending: true })
    .limit(100);

  if (error) throw error;
  const deals = (data ?? []) as DealPaymentRow[];
  if (deals.length === 0) return { checked: 0, providerMatched: 0, settlementConfirmed: 0, results: [] };

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
