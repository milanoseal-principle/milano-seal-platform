import Link from "next/link";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { groupReconciliation } from "@/lib/intelligence/controlCenter";
import { findMatterDiscrepancies, type MatterTruthInput } from "@/lib/matter/matterTruthGovernance";
import { readAllDealsForProjection } from "@/lib/matter/readAllDealsForProjection";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reconciliation — The Milano Seal™", robots: { index: false } };

const MAX_VISIBLE_PER_GROUP = 100;

type DealRow = Record<string, unknown> & {
  id?: string;
  deal_id?: string;
  client_name?: string;
  full_name?: string;
  destination_country?: string;
  country?: string;
  document_type?: string;
  document?: string;
  service_type?: string;
  origin_state?: string;
  payment_status?: string;
  payment_settlement_status?: string;
  settlement_status?: string;
  amount_due?: number | string;
  total_price?: number | string;
  amount?: number | string;
  amount_paid?: number | string;
  balance_amount_received?: number | string;
  payment_reference?: string;
  wise_reference?: string;
  scheduled_at?: string;
  schedule_at?: string;
  executed_at?: string;
  execution_at?: string;
  apostille_at?: string;
  tracking_number?: string;
  carrier?: string;
  delivery_status?: string;
  delivered_at?: string;
  delivery_at?: string;
  completed_at?: string;
  is_paid_and_released?: boolean;
  release_verified?: boolean;
  execution_method?: string;
  notarial_act?: string;
  competent_authority?: string;
};

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function stringOrNull(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

function toMatter(row: DealRow): MatterTruthInput {
  const matterId = String(row.id ?? row.deal_id ?? "unknown");
  const competentAuthority = stringOrNull(row.competent_authority);

  return {
    matterId,
    clientName: stringOrNull(row.client_name, row.full_name),
    destinationCountry: stringOrNull(row.destination_country, row.country),
    documentType: stringOrNull(row.document_type, row.document, row.service_type),
    originState: stringOrNull(row.origin_state),
    executionMethod: stringOrNull(row.execution_method),
    notarialAct: stringOrNull(row.notarial_act),
    competentAuthority,
    authorityStatus: competentAuthority ? "verified" : "unknown",
    paymentStatus: stringOrNull(row.payment_status),
    paymentSettlementStatus: stringOrNull(row.payment_settlement_status, row.settlement_status),
    amountDue: numberOrNull(row.amount_due ?? row.total_price ?? row.amount),
    amountPaid: numberOrNull(row.amount_paid ?? row.balance_amount_received),
    wiseReference: stringOrNull(row.payment_reference, row.wise_reference),
    scheduledAt: stringOrNull(row.scheduled_at, row.schedule_at),
    executionCompletedAt: stringOrNull(row.executed_at, row.execution_at),
    apostilleStatus: row.apostille_at ? "in_progress" : null,
    carrier: stringOrNull(row.carrier),
    trackingNumber: stringOrNull(row.tracking_number),
    deliveryStatus: stringOrNull(row.delivery_status),
    deliveryTimestamp: stringOrNull(row.delivered_at, row.delivery_at),
    releaseVerified: row.is_paid_and_released === true || row.release_verified === true,
    completedAt: stringOrNull(row.completed_at),
  };
}

export default async function ReconciliationPage() {
  await requireDashboardAccess();

  let rows: DealRow[] = [];
  let error: string | null = null;

  try {
    rows = await readAllDealsForProjection<DealRow>();
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Unable to load Matter reconciliation.";
  }

  const discrepancies = rows.flatMap((row) => findMatterDiscrepancies(toMatter(row)));
  const groups = groupReconciliation(discrepancies);
  const critical = discrepancies.filter((item) => item.severity === "CRITICAL").length;
  const blocking = discrepancies.filter((item) => item.severity === "BLOCKING").length;

  return <main className="space-y-8 pb-16">
    <section className="rounded-3xl border border-[var(--ms-gold)]/20 bg-[#0d0d0d] p-6 md:p-8">
      <div className="text-xs uppercase tracking-[0.22em] text-[var(--ms-gold)]">Intelligence & Control</div>
      <h1 className="mt-3 text-3xl font-semibold text-white">Execution Reconciliation Center</h1>
      <p className="mt-3 max-w-4xl text-sm leading-7 text-white/60">One read-only operator surface for contradictions across payment, execution, authority, translation, custody, courier, delivery, release and completion. Discrepancies never author canonical Matter state.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Matters Read" value={rows.length} /><Metric label="Critical" value={critical} /><Metric label="Blocking" value={blocking} /><Metric label="Total Discrepancies" value={discrepancies.length} /></div>
      <p className="mt-4 text-xs text-white/35">Metrics are computed from the complete canonical Matter set through bounded server-side pagination. Raw Matter rows are not hydrated into the browser.</p>
    </section>

    {error ? <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-6 text-sm text-red-200">{error}</div> : null}

    {!error ? <div className="space-y-6">{groups.map((group) => {
      const visible = group.discrepancies.slice(0, MAX_VISIBLE_PER_GROUP);
      return <section key={group.key} className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-5 md:p-6">
        <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-semibold text-white">{group.label}</h2><span className="text-xs text-white/35">{group.discrepancies.length}</span></div>
        {visible.length ? <div className="mt-4 grid gap-3">{visible.map((item) => <article key={`${group.key}:${item.id}`} className="rounded-xl border border-white/8 bg-black/25 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div className="font-medium text-white">{item.class.replaceAll("_", " ")}</div><div className={`text-xs font-semibold ${item.severity === "CRITICAL" ? "text-red-300" : item.severity === "BLOCKING" ? "text-amber-300" : "text-white/45"}`}>{item.severity}</div></div><p className="mt-2 text-sm leading-6 text-white/60">{item.description}</p><div className="mt-3 grid gap-1 text-xs text-white/40"><div>Matter: {item.matterId}</div><div>Sources: {item.sourceA} ↔ {item.sourceB}</div><div>Blocker: {item.blocker}</div><div>Action: {item.requiredAction}</div><div>Owner: {item.owner}</div></div><Link href={`/dashboard/matters/${encodeURIComponent(item.matterId)}/truth`} className="mt-3 inline-flex text-xs font-medium text-[var(--ms-gold)]">Open Matter Truth →</Link></article>)}</div> : <div className="mt-4 text-sm text-white/35">No current discrepancy in this class.</div>}
        {group.discrepancies.length > visible.length ? <p className="mt-4 text-xs text-white/35">Showing the first {visible.length} of {group.discrepancies.length} discrepancies in this class. Full counts remain complete.</p> : null}
      </section>;
    })}</div> : null}
  </main>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-white/8 bg-black/25 p-4"><div className="text-[10px] uppercase tracking-[0.14em] text-white/35">{label}</div><div className="mt-2 text-2xl font-semibold text-white">{value}</div></div>;
}
