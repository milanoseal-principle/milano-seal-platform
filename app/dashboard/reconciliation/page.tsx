"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { findMatterDiscrepancies, type MatterTruthInput } from "@/lib/matter/matterTruthGovernance";
import { groupReconciliation } from "@/lib/intelligence/controlCenter";

type DealRow = Record<string, unknown> & { id?: string; deal_id?: string; client_name?: string; destination_country?: string; document_type?: string; origin_state?: string; payment_status?: string; payment_settlement_status?: string; amount_due?: number; amount_paid?: number; payment_reference?: string; scheduled_at?: string; executed_at?: string; apostille_at?: string; tracking_number?: string; carrier?: string; delivery_status?: string; delivered_at?: string; delivery_at?: string; completed_at?: string; is_paid_and_released?: boolean; execution_method?: string; notarial_act?: string; competent_authority?: string };

function toMatter(row: DealRow): MatterTruthInput {
  const matterId = String(row.id ?? row.deal_id ?? "unknown");
  return {
    matterId,
    clientName: row.client_name ?? null,
    destinationCountry: row.destination_country ?? null,
    documentType: row.document_type ?? null,
    originState: row.origin_state ?? null,
    executionMethod: row.execution_method ?? null,
    notarialAct: row.notarial_act ?? null,
    competentAuthority: row.competent_authority ?? null,
    authorityStatus: row.competent_authority ? "verified" : "unknown",
    paymentStatus: row.payment_status ?? null,
    paymentSettlementStatus: row.payment_settlement_status ?? null,
    amountDue: typeof row.amount_due === "number" ? row.amount_due : null,
    amountPaid: typeof row.amount_paid === "number" ? row.amount_paid : null,
    wiseReference: row.payment_reference ?? null,
    scheduledAt: row.scheduled_at ?? null,
    executionCompletedAt: row.executed_at ?? null,
    apostilleStatus: row.apostille_at ? "in_progress" : null,
    carrier: row.carrier ?? null,
    trackingNumber: row.tracking_number ?? null,
    deliveryStatus: row.delivery_status ?? null,
    deliveryTimestamp: row.delivered_at ?? row.delivery_at ?? null,
    releaseVerified: row.is_paid_and_released === true,
    completedAt: row.completed_at ?? null,
  };
}

export default function ReconciliationPage() {
  const [rows, setRows] = useState<DealRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch("/api/deals?limit=500", { cache: "no-store" });
        if (!response.ok) throw new Error(`Matter read failed (${response.status})`);
        const data = await response.json() as DealRow[];
        if (active) setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load Matter reconciliation.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const discrepancies = useMemo(() => rows.flatMap((row) => findMatterDiscrepancies(toMatter(row))), [rows]);
  const groups = useMemo(() => groupReconciliation(discrepancies), [discrepancies]);
  const critical = discrepancies.filter((item) => item.severity === "CRITICAL").length;
  const blocking = discrepancies.filter((item) => item.severity === "BLOCKING").length;

  return <main className="space-y-8 pb-16">
    <section className="rounded-3xl border border-[var(--ms-gold)]/20 bg-[#0d0d0d] p-6 md:p-8">
      <div className="text-xs uppercase tracking-[0.22em] text-[var(--ms-gold)]">Intelligence & Control</div>
      <h1 className="mt-3 text-3xl font-semibold text-white">Execution Reconciliation Center</h1>
      <p className="mt-3 max-w-4xl text-sm leading-7 text-white/60">One read-only operator surface for contradictions across payment, execution, authority, translation, custody, courier, delivery, release and completion. Discrepancies never author canonical Matter state.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Matters Read" value={rows.length} /><Metric label="Critical" value={critical} /><Metric label="Blocking" value={blocking} /><Metric label="Total Discrepancies" value={discrepancies.length} /></div>
    </section>

    {loading ? <div className="rounded-2xl border border-white/10 bg-[#111] p-6 text-sm text-white/50">Loading canonical Matter evidence…</div> : null}
    {error ? <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-6 text-sm text-red-200">{error}</div> : null}

    {!loading && !error ? <div className="space-y-6">{groups.map((group) => <section key={group.key} className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-5 md:p-6"><div className="flex items-center justify-between gap-3"><h2 className="text-xl font-semibold text-white">{group.label}</h2><span className="text-xs text-white/35">{group.discrepancies.length}</span></div>{group.discrepancies.length ? <div className="mt-4 grid gap-3">{group.discrepancies.map((item) => <article key={`${group.key}:${item.id}`} className="rounded-xl border border-white/8 bg-black/25 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div className="font-medium text-white">{item.class.replaceAll("_", " ")}</div><div className={`text-xs font-semibold ${item.severity === "CRITICAL" ? "text-red-300" : item.severity === "BLOCKING" ? "text-amber-300" : "text-white/45"}`}>{item.severity}</div></div><p className="mt-2 text-sm leading-6 text-white/60">{item.description}</p><div className="mt-3 grid gap-1 text-xs text-white/40"><div>Matter: {item.matterId}</div><div>Sources: {item.sourceA} ↔ {item.sourceB}</div><div>Blocker: {item.blocker}</div><div>Action: {item.requiredAction}</div><div>Owner: {item.owner}</div></div><Link href={`/dashboard/matters/${encodeURIComponent(item.matterId)}/truth`} className="mt-3 inline-flex text-xs font-medium text-[var(--ms-gold)]">Open Matter Truth →</Link></article>)}</div> : <div className="mt-4 text-sm text-white/35">No current discrepancy in this class.</div>}</section>)}</div> : null}
  </main>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-white/8 bg-black/25 p-4"><div className="text-[10px] uppercase tracking-[0.14em] text-white/35">{label}</div><div className="mt-2 text-2xl font-semibold text-white">{value}</div></div>;
}
