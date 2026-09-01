import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type EconomicEvidenceClass = "OBSERVED" | "ATTRIBUTED" | "MODELED" | "UNKNOWN";

export interface EconomicMetric {
  value: number | null;
  currency: string | null;
  evidenceClass: EconomicEvidenceClass;
  evidence: string;
}

export interface MatterEconomicsRow {
  matterId: string;
  destinationCountry: string | null;
  originState: string | null;
  documentType: string | null;
  executionMethod: string | null;
  acquisitionSource: string | null;
  collectedRevenue: EconomicMetric;
  directExecutionCost: EconomicMetric;
  contributionMargin: EconomicMetric;
  cycleDays: number | null;
  exceptionObserved: boolean | null;
  refundObserved: boolean | null;
}

export interface MatterEconomicsSnapshot {
  generatedAt: string;
  degraded: boolean;
  warning: string | null;
  matters: MatterEconomicsRow[];
  totals: {
    collectedRevenue: EconomicMetric;
    directExecutionCost: EconomicMetric;
    contributionMargin: EconomicMetric;
    paidMatters: number;
    currencies: string[];
  };
}

type DealRow = {
  id?: string | null;
  deal_id?: string | null;
  destination_country?: string | null;
  origin_state?: string | null;
  document_type?: string | null;
  execution_method?: string | null;
  referred_by?: string | null;
  payment_status?: string | null;
  payment_confirmed?: boolean | null;
  payment_disposition?: string | null;
  amount_paid?: number | string | null;
  verified_revenue?: number | string | null;
  currency?: string | null;
  created_at?: string | null;
  completed_at?: string | null;
  lost_stage?: string | null;
  payment_failure_reason?: string | null;
};

const COLUMNS = [
  "id",
  "deal_id",
  "destination_country",
  "origin_state",
  "document_type",
  "execution_method",
  "referred_by",
  "payment_status",
  "payment_confirmed",
  "payment_disposition",
  "amount_paid",
  "verified_revenue",
  "currency",
  "created_at",
  "completed_at",
  "lost_stage",
  "payment_failure_reason",
].join(", ");

function clean(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return v || null;
}

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function observedRevenue(row: DealRow): EconomicMetric {
  if (row.payment_disposition === "complimentary") {
    return { value: 0, currency: clean(row.currency) ?? "USD", evidenceClass: "OBSERVED", evidence: "Canonical complimentary authorization; collected revenue is $0." };
  }
  if (row.payment_confirmed !== true && row.payment_status !== "paid") {
    return { value: null, currency: clean(row.currency), evidenceClass: "UNKNOWN", evidence: "No verified settled payment evidence." };
  }
  const value = numberOrNull(row.verified_revenue) ?? numberOrNull(row.amount_paid);
  if (value === null) return { value: null, currency: clean(row.currency), evidenceClass: "UNKNOWN", evidence: "Payment is confirmed but no canonical collected amount is available." };
  return { value, currency: clean(row.currency), evidenceClass: "OBSERVED", evidence: "Canonical verified payment/collected amount." };
}

function daysBetween(from: string | null | undefined, to: string | null | undefined): number | null {
  if (!from || !to) return null;
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return null;
  return Math.round(((b - a) / 86_400_000) * 10) / 10;
}

export async function loadMatterEconomics(): Promise<MatterEconomicsSnapshot> {
  const generatedAt = new Date().toISOString();
  const supabase = createAdminClient();
  const result = await supabase.from("deals").select(COLUMNS).order("created_at", { ascending: false }).limit(2000);
  if (result.error) {
    const unknown: EconomicMetric = { value: null, currency: null, evidenceClass: "UNKNOWN", evidence: "Canonical Matter economics source unavailable." };
    return { generatedAt, degraded: true, warning: "Canonical Matter economics source unavailable.", matters: [], totals: { collectedRevenue: unknown, directExecutionCost: unknown, contributionMargin: unknown, paidMatters: 0, currencies: [] } };
  }

  const matters: MatterEconomicsRow[] = ((result.data ?? []) as DealRow[]).map((row) => {
    const revenue = observedRevenue(row);
    const directCost: EconomicMetric = {
      value: null,
      currency: revenue.currency,
      evidenceClass: "UNKNOWN",
      evidence: "No canonical direct-cost ledger is wired; costs are intentionally not estimated.",
    };
    return {
      matterId: clean(row.deal_id) ?? clean(row.id) ?? "unknown",
      destinationCountry: clean(row.destination_country),
      originState: clean(row.origin_state),
      documentType: clean(row.document_type),
      executionMethod: clean(row.execution_method),
      acquisitionSource: clean(row.referred_by),
      collectedRevenue: revenue,
      directExecutionCost: directCost,
      contributionMargin: { value: null, currency: revenue.currency, evidenceClass: "UNKNOWN", evidence: "Contribution margin remains unknown until canonical direct execution cost exists." },
      cycleDays: daysBetween(row.created_at, row.completed_at),
      exceptionObserved: row.payment_failure_reason ? true : null,
      refundObserved: row.payment_status === "refunded" ? true : null,
    };
  });

  const paid = matters.filter((m) => m.collectedRevenue.evidenceClass === "OBSERVED");
  const currencies = [...new Set(paid.map((m) => m.collectedRevenue.currency).filter((v): v is string => Boolean(v)))];
  const canSum = currencies.length <= 1 && paid.every((m) => m.collectedRevenue.value !== null);
  const collected: EconomicMetric = canSum
    ? { value: paid.reduce((s, m) => s + (m.collectedRevenue.value ?? 0), 0), currency: currencies[0] ?? "USD", evidenceClass: "OBSERVED", evidence: "Sum of canonical observed Matter revenue only." }
    : { value: null, currency: null, evidenceClass: "UNKNOWN", evidence: "Mixed or unknown currencies prevent a truthful aggregate without conversion evidence." };
  const unknownCost: EconomicMetric = { value: null, currency: collected.currency, evidenceClass: "UNKNOWN", evidence: "No canonical direct-cost ledger is wired; no shadow accounting created." };

  return {
    generatedAt,
    degraded: false,
    warning: null,
    matters,
    totals: {
      collectedRevenue: collected,
      directExecutionCost: unknownCost,
      contributionMargin: { ...unknownCost, evidence: "Contribution margin cannot be calculated until canonical direct execution cost exists." },
      paidMatters: paid.length,
      currencies,
    },
  };
}
