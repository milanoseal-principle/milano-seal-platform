// Canonical `deals` read contract. ONE place that knows the real database column
// names (migrations 001 + 043) and normalizes them to stable application fields.
// Read-only: this module never writes and never changes payment/scheduling/
// release/custody/audit semantics. Enterprise intelligence loaders consume this
// instead of independently selecting ambiguous columns.

// Explicit safe column list — migration-confirmed names only. No wildcard, no
// PII/notes/billing/raw-payload columns.
export const CANONICAL_DEAL_COLUMNS =
  "id, deal_id, deal_status, destination_country, company_name, document_type, created_at, completed_at, payment_status, payment_disposition, amount_paid, verified_revenue, comp_authorized";

/** Raw row shape as returned by the SELECT above (database column names). */
interface RawDealRow {
  id?: string | null;
  deal_id?: string | null;
  deal_status?: string | null;
  destination_country?: string | null;
  company_name?: string | null;
  document_type?: string | null;
  created_at?: string | null;
  completed_at?: string | null;
  payment_status?: string | null;
  payment_disposition?: string | null;
  amount_paid?: number | null;
  verified_revenue?: number | null;
  comp_authorized?: boolean | null;
}

// Stable, normalized row consumed by the enterprise mappers. The database column
// names live ONLY here; downstream code reads these normalized keys. `status`
// and `country` are provided as normalized aliases of deal_status /
// destination_country so existing mappers need no change.
export interface NormalizedDealRow {
  id: string | null;
  deal_id: string | null;
  status: string | null; // <- deal_status
  country: string | null; // <- destination_country
  destination_country: string | null;
  company_name: string | null;
  document_type: string | null;
  created_at: string | null;
  completed_at: string | null;
  // payment_status='paid' is the canonical confirmed-payment signal (migration 001).
  payment_confirmed: boolean | null;
  amount_paid: number | null;
  verified_revenue: number | null;
  payment_disposition: string | null;
  comp_authorized: boolean | null;
  // `deals` has no per-row currency column; left null (never guessed).
  currency: string | null;
}

export function normalizeDealRow(r: RawDealRow): NormalizedDealRow {
  return {
    id: r.id ?? null,
    deal_id: r.deal_id ?? null,
    status: r.deal_status ?? null,
    country: r.destination_country ?? null,
    destination_country: r.destination_country ?? null,
    company_name: r.company_name ?? null,
    document_type: r.document_type ?? null,
    created_at: r.created_at ?? null,
    completed_at: r.completed_at ?? null,
    payment_confirmed: r.payment_status == null ? null : r.payment_status === "paid",
    amount_paid: typeof r.amount_paid === "number" ? r.amount_paid : null,
    verified_revenue: typeof r.verified_revenue === "number" ? r.verified_revenue : null,
    payment_disposition: r.payment_disposition ?? null,
    comp_authorized: typeof r.comp_authorized === "boolean" ? r.comp_authorized : null,
    currency: null,
  };
}

/** Thrown when the canonical `deals` query fails (e.g. schema/column mismatch). */
export class DealsSchemaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DealsSchemaError";
  }
}

interface DealsQuery {
  from: (t: string) => {
    select: (cols: string) => {
      // PromiseLike (not Promise) so the Supabase query builder (a thenable) is accepted.
      gte: (col: string, val: string) => PromiseLike<{ data: unknown; error: unknown }>;
    };
  };
}

/**
 * Read canonical deals created at/after `sinceIso`. Returns normalized rows.
 * Throws DealsSchemaError on any query error — a schema/column failure is NOT
 * "no records" and must never be silently treated as insufficient evidence.
 */
export async function fetchCanonicalDeals(
  client: DealsQuery,
  sinceIso: string,
): Promise<NormalizedDealRow[]> {
  const { data, error } = await client.from("deals").select(CANONICAL_DEAL_COLUMNS).gte("created_at", sinceIso);
  if (error) {
    throw new DealsSchemaError("Canonical deals query failed (schema verification required).");
  }
  if (!Array.isArray(data)) return [];
  return (data as RawDealRow[]).map(normalizeDealRow);
}
