import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { fetchCanonicalDeals, DealsSchemaError, type NormalizedDealRow } from "@/lib/deals/canonicalDealReadModel";

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

function clean(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return v || null;
}

function observedRevenue(row: NormalizedDealRow): EconomicMetric {
  if (row.payment_disposition === "complimentary") {
    return { value: 0, currency: clean(row.currency) ?? "USD", evidenceClass: "OBSERVED", evidence: "Canonical complimentary authorization; collected revenue is $0." };
  }
  if (row.payment_confirmed !== true && row.payment_status !== "paid") {
    return { value: null, currency: clean(row.currency), evidenceClass: "UNKNOWN", evidence: "No verified settled payment evidence." };
  }
  const value = row.verified_revenue ?? row.amount_paid;
  if (value === null) return { value: null, currency: clean(row.currency), evidenceClass: "UNKNOWN", evidence: "Payment is confirmed but no canonical collected amount is available." };
  return { value, currency: clean(row.currency), evidenceClass: "OBSERVED", evidence: "Canonical verified payment/collected amount." };
}

function unknownMetric(currency: string | null, evidence: string): EconomicMetric {
  return { value: null, currency, evidenceClass: "UNKNOWN", evidence };
}

export async function loadMatterEconomics(): Promise<MatterEconomicsSnapshot> {
  const generatedAt = new Date().toISOString();
  const supabase = createAdminClient();

  try {
    const canonical = await fetchCanonicalDeals(supabase, "2000-01-01T00:00:00.000Z");
    const matters: MatterEconomicsRow[] = canonical.rows.map((row) => {
      const revenue = observedRevenue(row);
      return {
        matterId: row.deal_id ?? row.id ?? "unknown",
        destinationCountry: clean(row.destination_country),
        originState: null,
        documentType: clean(row.document_type),
        executionMethod: null,
        acquisitionSource: null,
        collectedRevenue: revenue,
        directExecutionCost: unknownMetric(revenue.currency, "No canonical direct-cost ledger is wired; costs are intentionally not estimated."),
        contributionMargin: unknownMetric(revenue.currency, "Contribution margin remains unknown until canonical direct execution cost exists."),
        cycleDays: null,
        exceptionObserved: row.payment_status === "failed" ? true : null,
        refundObserved: row.payment_status === "refunded" ? true : null,
      };
    });

    const paid = matters.filter((m) => m.collectedRevenue.evidenceClass === "OBSERVED" && m.collectedRevenue.value !== null);
    const currencies = [...new Set(paid.map((m) => m.collectedRevenue.currency).filter((v): v is string => Boolean(v)))];
    const canSum = currencies.length <= 1;
    const collected: EconomicMetric = canSum
      ? { value: paid.reduce((sum, matter) => sum + (matter.collectedRevenue.value ?? 0), 0), currency: currencies[0] ?? "USD", evidenceClass: "OBSERVED", evidence: "Sum of canonical observed Matter revenue only." }
      : unknownMetric(null, "Mixed currencies prevent a truthful aggregate without canonical conversion evidence.");
    const cost = unknownMetric(collected.currency, "No canonical direct-cost ledger is wired; no shadow accounting created.");

    return {
      generatedAt,
      degraded: false,
      warning: canonical.compCapability === "unavailable" ? "Complimentary/revenue capability columns are unavailable; base canonical payment evidence is used." : canonical.conflicts.length ? "Legacy canonical column conflicts exist; canonical precedence rules were applied." : null,
      matters,
      totals: {
        collectedRevenue: collected,
        directExecutionCost: cost,
        contributionMargin: unknownMetric(collected.currency, "Contribution margin cannot be calculated until canonical direct execution cost exists."),
        paidMatters: paid.length,
        currencies,
      },
    };
  } catch (error) {
    const evidence = error instanceof DealsSchemaError ? "Canonical deal schema verification is required." : "Canonical Matter economics source unavailable.";
    const unknown = unknownMetric(null, evidence);
    return { generatedAt, degraded: true, warning: evidence, matters: [], totals: { collectedRevenue: unknown, directExecutionCost: unknown, contributionMargin: unknown, paidMatters: 0, currencies: [] } };
  }
}
