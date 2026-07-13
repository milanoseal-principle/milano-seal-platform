import type { CanonicalMatterRecord, MatterStateRecord, OrganizationRecord } from "./types";

// Pure mapper: canonical `deals` rows → MatterStateRecord. No DB, no writes,
// no revenue/org/capacity/relationship fields. Unknown values stay null.
// `deals` has no sample column today, so isSample defaults to false; the
// snapshot builder still applies canonical sample governance.
export interface DealRow {
  id?: string | null;
  deal_id?: string | null;
  status?: string | null;
  created_at?: string | null;
  completed_at?: string | null;
  execution_date?: string | null;
  country?: string | null;
  document_type?: string | null;
  is_sample?: boolean | null;
  // Payment / revenue evidence (Source #2)
  payment_confirmed?: boolean | null;
  amount_paid?: number | null;
  payment_disposition?: string | null;
  comp_authorized?: boolean | null;
  currency?: string | null;
  organization_id?: string | null;
  vertical?: string | null;
  // Organization evidence (Source #3) — canonical deals columns.
  company_name?: string | null;
  destination_country?: string | null;
}

export function mapDealsToMatterStateRecords(rows: readonly DealRow[]): MatterStateRecord[] {
  return rows.map((r) => ({
    matterId: String(r.deal_id ?? r.id ?? ""),
    status: r.status ?? null,
    createdAt: r.created_at ?? null,
    // completed_at preferred; fall back to execution_date only for completed Matters.
    completedAt: r.completed_at ?? (r.status === "completed" ? r.execution_date ?? null : null),
    destination: r.country ?? null,
    documentFamily: r.document_type ?? null,
    isSample: r.is_sample === true,
  }));
}

// Payment/revenue mapper: canonical `deals` rows → CanonicalMatterRecord. Only
// the fields the verified-revenue rules need; unknown amounts/currency stay null.
// No raw Wise payload, no payment credentials.
export function mapDealsToCanonicalMatterRecords(rows: readonly DealRow[]): CanonicalMatterRecord[] {
  return rows.map((r) => ({
    matterId: String(r.deal_id ?? r.id ?? ""),
    organizationId: r.organization_id ?? null,
    vertical: r.vertical ?? null,
    deal_status: r.status ?? null,
    payment_confirmed: typeof r.payment_confirmed === "boolean" ? r.payment_confirmed : null,
    amount_paid: typeof r.amount_paid === "number" ? r.amount_paid : null,
    payment_disposition: r.payment_disposition ?? null,
    comp_authorized: typeof r.comp_authorized === "boolean" ? r.comp_authorized : null,
    currency: r.currency ?? null,
    isSample: r.is_sample === true,
  }));
}

// Organization mapper: canonical `deals` rows → OrganizationRecord using the
// migration-confirmed org proxy (company_name) and geography (destination_country).
// No org table exists; organizations are derived from Matter evidence. Unknowns
// stay null; the snapshot builder dedups by organizationKey.
export function mapDealsToOrganizationRecords(rows: readonly DealRow[]): OrganizationRecord[] {
  return rows
    .map((r) => {
      const key = (r.company_name ?? "").trim();
      return {
        organizationKey: key,
        geography: r.destination_country ?? null,
        vertical: null, // no canonical org-level vertical field on deals
        firstSeenAt: r.created_at ?? null,
        isSample: r.is_sample === true,
      };
    })
    .filter((o) => o.organizationKey.length > 0);
}
