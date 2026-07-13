import type { MatterStateRecord } from "./types";

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
