// Canonical `deals` read contract — PRODUCTION-COMPATIBLE.
//
// Production `public.deals` carries overlapping generations of columns. This is
// the ONE place that knows the real columns and normalizes them to stable app
// fields with explicit primary/fallback precedence. Read-only: never writes,
// never changes payment/scheduling/release/custody/audit semantics.
//
// Confirmed production precedence (from live column population + conflicts):
//   operationalStatus : status  → deal_status (null-only fallback); stage is NOT a fallback
//   salesStage        : stage   (kept separate — lead/sales pipeline)
//   destinationCountry: destination_country → country (null-only fallback)
//   companyName       : company_name → company (null-only fallback)
//   documentType      : document_type → document (null-only fallback)
//   payment*          : payment_status, payment_confirmed, amount_paid
//
// The complimentary/revenue columns (payment_disposition, verified_revenue,
// comp_authorized, currency) are NOT yet in production (migration 043 unapplied),
// so they are reported as capability-unavailable rather than silently zeroed.

// Base columns present in every environment (original schema + ad-hoc adds).
export const CANONICAL_DEAL_COLUMNS =
  "id, stage, status, deal_status, destination_country, country, company, company_name, document, document_type, payment_status, payment_confirmed, amount_paid, created_at, assigned_to";

// Complimentary/revenue capability columns (migration 043/044). Selected only
// when present; their availability is detected at query time, never hardcoded.
export const COMP_CAPABILITY_COLUMNS =
  "payment_disposition, verified_revenue, comp_authorized, comp_authorization_id, comp_authorized_at, comp_revoked_at, currency";

interface RawDealRow {
  id?: string | null;
  stage?: string | null;
  status?: string | null;
  deal_status?: string | null;
  destination_country?: string | null;
  country?: string | null;
  company?: string | null;
  company_name?: string | null;
  document?: string | null;
  document_type?: string | null;
  payment_status?: string | null;
  payment_confirmed?: boolean | null;
  amount_paid?: number | null;
  created_at?: string | null;
  assigned_to?: string | null;
  // Complimentary capability columns (present only when 043/044 applied).
  payment_disposition?: string | null;
  verified_revenue?: number | null;
  comp_authorized?: boolean | null;
  currency?: string | null;
}

// Normalized row consumed by the enterprise mappers. `status`/`country`/
// `company_name`/`destination_country`/`document_type` are the RESOLVED values,
// so existing mappers need no change. Missing comp fields are null.
export interface NormalizedDealRow {
  id: string | null;
  deal_id: string | null;
  status: string | null; // resolved operationalStatus
  salesStage: string | null; // separate — never merged into status
  legacyDealStatus: string | null;
  country: string | null; // resolved destination
  destination_country: string | null; // resolved destination (same value)
  company_name: string | null; // resolved organization
  document_type: string | null; // resolved document
  created_at: string | null;
  completed_at: string | null;
  execution_date: string | null;
  payment_status: string | null;
  payment_confirmed: boolean | null;
  amount_paid: number | null;
  /** Assignment presence/actor key (operator id). Never serialized to clients. */
  assignee: string | null;
  payment_disposition: string | null; // capability-unavailable → null
  verified_revenue: number | null; // capability-unavailable → null
  comp_authorized: boolean | null; // capability-unavailable → null
  currency: string | null; // no per-row column → null
}

/** A sanitized record of two populated legacy columns disagreeing. */
export interface DealFieldConflict {
  field: "operationalStatus" | "destination" | "organization" | "document";
  count: number;
}

function pick(primary: string | null | undefined, fallback: string | null | undefined): string | null {
  if (primary != null && String(primary).trim() !== "") return primary;
  if (fallback != null && String(fallback).trim() !== "") return fallback;
  return null;
}

export function normalizeDealRow(r: RawDealRow): NormalizedDealRow {
  const destination = pick(r.destination_country, r.country);
  const organization = pick(r.company_name, r.company);
  const document = pick(r.document_type, r.document);
  return {
    id: r.id ?? null,
    deal_id: r.id ?? null,
    status: pick(r.status, r.deal_status),
    salesStage: r.stage ?? null,
    legacyDealStatus: r.deal_status ?? null,
    country: destination,
    destination_country: destination,
    company_name: organization,
    document_type: document,
    created_at: r.created_at ?? null,
    completed_at: null, // production has no completed_at
    execution_date: null,
    payment_status: r.payment_status ?? null,
    payment_confirmed: typeof r.payment_confirmed === "boolean" ? r.payment_confirmed : null,
    amount_paid: typeof r.amount_paid === "number" ? r.amount_paid : null,
    assignee: r.assigned_to ?? null,
    // Populated only when the comp columns were successfully selected.
    payment_disposition: r.payment_disposition ?? null,
    verified_revenue: typeof r.verified_revenue === "number" ? r.verified_revenue : null,
    comp_authorized: typeof r.comp_authorized === "boolean" ? r.comp_authorized : null,
    currency: r.currency ?? null,
  };
}

// Detect conflicts between two populated legacy columns (both non-empty and
// different). Never overwrites; only counts for a sanitized limitation.
function bothConflict(a: string | null | undefined, b: string | null | undefined): boolean {
  const av = a == null ? "" : String(a).trim();
  const bv = b == null ? "" : String(b).trim();
  return av !== "" && bv !== "" && av !== bv;
}

export function detectConflicts(rows: readonly RawDealRow[]): DealFieldConflict[] {
  let status = 0, dest = 0, org = 0, doc = 0;
  for (const r of rows) {
    if (bothConflict(r.status, r.deal_status)) status += 1;
    if (bothConflict(r.destination_country, r.country)) dest += 1;
    if (bothConflict(r.company_name, r.company)) org += 1;
    if (bothConflict(r.document_type, r.document)) doc += 1;
  }
  const out: DealFieldConflict[] = [];
  if (status) out.push({ field: "operationalStatus", count: status });
  if (dest) out.push({ field: "destination", count: dest });
  if (org) out.push({ field: "organization", count: org });
  if (doc) out.push({ field: "document", count: doc });
  return out;
}

export class DealsSchemaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DealsSchemaError";
  }
}

interface DealsQuery {
  from: (t: string) => {
    select: (cols: string) => {
      gte: (col: string, val: string) => PromiseLike<{ data: unknown; error: unknown }>;
    };
  };
}

export interface CanonicalDealsResult {
  rows: NormalizedDealRow[];
  conflicts: DealFieldConflict[];
  compCapability: "available" | "unavailable";
}

/**
 * Read canonical deals created at/after `sinceIso`. Returns normalized rows,
 * sanitized conflict counts, and the complimentary-capability state. Throws
 * DealsSchemaError on query error (a schema failure is NOT "no records").
 */
export async function fetchCanonicalDeals(client: DealsQuery, sinceIso: string): Promise<CanonicalDealsResult> {
  // First attempt includes the complimentary-capability columns. If they exist
  // (migration 043/044 applied) the query succeeds and capability is available.
  const withComp = await client
    .from("deals")
    .select(`${CANONICAL_DEAL_COLUMNS}, ${COMP_CAPABILITY_COLUMNS}`)
    .gte("created_at", sinceIso);

  if (!withComp.error) {
    const raw = Array.isArray(withComp.data) ? (withComp.data as RawDealRow[]) : [];
    return { rows: raw.map(normalizeDealRow), conflicts: detectConflicts(raw), compCapability: "available" };
  }

  // Comp columns absent (or another issue): retry with base columns only. If the
  // always-present base set ALSO fails, that is a genuine schema/query failure.
  const base = await client.from("deals").select(CANONICAL_DEAL_COLUMNS).gte("created_at", sinceIso);
  if (base.error) {
    throw new DealsSchemaError("Canonical deals query failed (schema verification required).");
  }
  const raw = Array.isArray(base.data) ? (base.data as RawDealRow[]) : [];
  // Base succeeded but comp columns are missing → capability unavailable (NOT a
  // hard failure, NOT fabricated zeros).
  return { rows: raw.map(normalizeDealRow), conflicts: detectConflicts(raw), compCapability: "unavailable" };
}
