"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { buildMatterTruthSections, deriveMatterCompleteness, findMatterDiscrepancies, type MatterTruthInput } from "@/lib/matter/matterTruthGovernance";

type DealRow = Record<string, unknown> & { id?: string; deal_id?: string; client_name?: string; destination_country?: string; document_type?: string; origin_state?: string; payment_status?: string; payment_settlement_status?: string; amount_due?: number; amount_paid?: number; payment_reference?: string; scheduled_at?: string; executed_at?: string; apostille_at?: string; tracking_number?: string; carrier?: string; delivery_status?: string; delivered_at?: string; delivery_at?: string; completed_at?: string; is_paid_and_released?: boolean; execution_method?: string; notarial_act?: string; competent_authority?: string; updated_at?: string };

function toTruthInput(row: DealRow, matterId: string): MatterTruthInput {
  const numeric = (value: unknown) => typeof value === "number" ? value : typeof value === "string" && value.trim() && Number.isFinite(Number(value)) ? Number(value) : null;
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
    amountDue: numeric(row.amount_due),
    amountPaid: numeric(row.amount_paid),
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
    updatedAt: row.updated_at ?? null,
  };
}

export default function MatterTruthPage() {
  const params = useParams<{ matterId: string }>();
  const matterId = params?.matterId ?? "";
  const [row, setRow] = useState<DealRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!matterId) return;
    let active = true;
    void (async () => {
      try {
        const response = await fetch(`/api/deals/${encodeURIComponent(matterId)}`, { cache: "no-store" });
        if (!response.ok) throw new Error(`Matter read failed (${response.status})`);
        const data = await response.json() as DealRow;
        if (active) setRow(data);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load Matter truth.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [matterId]);

  const truth = useMemo(() => row ? toTruthInput(row, matterId) : null, [row, matterId]);
  const sections = useMemo(() => truth ? buildMatterTruthSections(truth) : [], [truth]);
  const completeness = useMemo(() => deriveMatterCompleteness(sections), [sections]);
  const discrepancies = useMemo(() => truth ? findMatterDiscrepancies(truth) : [], [truth]);

  return <main className="space-y-8 pb-16">
    <section className="rounded-3xl border border-[var(--ms-gold)]/20 bg-[#0d0d0d] p-6 md:p-8">
      <div className="text-xs uppercase tracking-[0.22em] text-[var(--ms-gold)]">Matter Control · Canonical Truth</div>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-semibold text-white">Matter Truth</h1><p className="mt-2 text-sm text-white/50">{matterId}</p></div><div className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs font-semibold text-white">{completeness.overallState.replaceAll("_", " ")}</div></div>
      <p className="mt-4 max-w-4xl text-sm leading-7 text-white/60">One operator inspection surface over canonical Matter, execution, authority, Wise, custody, courier, delivery and release evidence. It does not create a second Matter state or transaction authority.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Truth Sections" value={sections.length} /><Metric label="Discrepancies" value={discrepancies.length} /><Metric label="Blocking Domains" value={completeness.blockingDomains.length} /><Metric label="Review / Stale" value={completeness.reviewDomains.length + completeness.staleDomains.length} /></div>
    </section>

    {loading ? <div className="rounded-2xl border border-white/10 bg-[#111] p-6 text-sm text-white/50">Loading canonical Matter evidence…</div> : null}
    {error ? <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-6 text-sm text-red-200">{error}</div> : null}

    {!loading && !error ? <>
      <section><div className="text-xs uppercase tracking-[0.2em] text-[var(--ms-gold)]">Canonical Evidence</div><h2 className="mt-2 text-2xl font-semibold text-white">What is true, incomplete, blocked or stale</h2><div className="mt-4 grid gap-3 xl:grid-cols-2">{sections.map((section, index) => <article key={`${section.id}:${index}`} className="rounded-2xl border border-white/10 bg-[#0e0e0e] p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-lg font-semibold text-white">{section.label}</div><div className="mt-1 text-xs text-white/35">Source: {section.source}</div></div><StateBadge state={section.state} /></div><div className="mt-4 grid gap-2 text-xs text-white/45"><div><span className="text-white/65">Owner:</span> {section.owner}</div><div><span className="text-white/65">Evidence:</span> {section.evidence.join(" · ")}</div>{section.blocker ? <div><span className="text-white/65">Blocker:</span> {section.blocker}</div> : null}{section.nextAction ? <div><span className="text-white/65">Next action:</span> {section.nextAction}</div> : null}</div>{section.href ? <Link href={section.href} className="mt-3 inline-flex text-xs font-medium text-[var(--ms-gold)]">Open owning surface →</Link> : null}</article>)}</div></section>

      <section className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-5 md:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-xs uppercase tracking-[0.18em] text-[var(--ms-gold)]">Reconciliation</div><h2 className="mt-1 text-xl font-semibold text-white">Matter discrepancies</h2></div><Link href="/dashboard/reconciliation" className="text-sm text-[var(--ms-gold)]">Open Reconciliation Center →</Link></div>{discrepancies.length ? <div className="mt-4 grid gap-3">{discrepancies.map((item) => <div key={item.id} className="rounded-xl border border-white/8 bg-black/25 p-4"><div className="flex items-center justify-between gap-3"><div className="font-medium text-white">{item.class.replaceAll("_", " ")}</div><div className={item.severity === "CRITICAL" ? "text-xs font-semibold text-red-300" : "text-xs font-semibold text-amber-300"}>{item.severity}</div></div><p className="mt-2 text-sm text-white/55">{item.description}</p><div className="mt-2 text-xs text-white/40">{item.requiredAction}</div></div>)}</div> : <div className="mt-4 text-sm text-white/35">No modeled contradictions detected from currently loaded canonical fields.</div>}</section>
    </> : null}
  </main>;
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-white/8 bg-black/25 p-4"><div className="text-[10px] uppercase tracking-[0.14em] text-white/35">{label}</div><div className="mt-2 text-2xl font-semibold text-white">{value}</div></div>; }
function StateBadge({ state }: { state: string }) { const tone = state === "VERIFIED" ? "text-emerald-300 border-emerald-300/20" : state === "BLOCKED" ? "text-red-300 border-red-300/20" : state === "STALE" ? "text-orange-300 border-orange-300/20" : "text-amber-300 border-amber-300/20"; return <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold tracking-[0.12em] ${tone}`}>{state}</span>; }
