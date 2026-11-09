/**
 * Service-intent attribution: Matters grouped by the client-requested service
 * captured at intake. Verified revenue uses ONLY the canonical exact-settlement
 * predicate; quotes, pending/processing payments, samples and forecasts never
 * count. Matters with no captured intent are reported as "not_captured", never
 * guessed. Pure; the loader supplies rows.
 */
import { hasExactVerifiedSettlement, type ComplimentaryGateMatter } from "@/lib/scheduling/complimentarySchedulingGate";
import { requestedServiceFromNotes } from "@/lib/intake/requestedVsConfirmed";
import { SMART_INTAKE_INTENTS, type SmartIntakeIntent } from "@/lib/intake/serviceIntent";

export type AttributionBucket = SmartIntakeIntent | "not_captured";

export interface ServiceIntentRow extends ComplimentaryGateMatter {
  notes?: string | null;
  quote_approved_at?: string | null;
  is_sample?: boolean | null;
}

export interface ServiceIntentSummary {
  intent: AttributionBucket;
  matters: number;
  quoted: number;
  verifiedSettled: number;
  verifiedRevenueByCurrency: Record<string, number>;
}

export function summarizeByServiceIntent(rows: readonly ServiceIntentRow[]): ServiceIntentSummary[] {
  const buckets = new Map<AttributionBucket, ServiceIntentSummary>();
  for (const intent of [...SMART_INTAKE_INTENTS, "not_captured"] as AttributionBucket[]) {
    buckets.set(intent, { intent, matters: 0, quoted: 0, verifiedSettled: 0, verifiedRevenueByCurrency: {} });
  }
  for (const row of rows) {
    if (row.is_sample === true) continue;
    const bucket = buckets.get(requestedServiceFromNotes(row.notes) ?? "not_captured")!;
    bucket.matters += 1;
    if (row.quote_approved_at) bucket.quoted += 1;
    if (hasExactVerifiedSettlement(row)) {
      bucket.verifiedSettled += 1;
      const currency = String(row.currency ?? "USD").trim().toUpperCase() || "USD";
      // Never convert currencies; amounts are kept per currency.
      bucket.verifiedRevenueByCurrency[currency] = Math.round(((bucket.verifiedRevenueByCurrency[currency] ?? 0) + Number(row.amount_paid)) * 100) / 100;
    }
  }
  return [...buckets.values()];
}
