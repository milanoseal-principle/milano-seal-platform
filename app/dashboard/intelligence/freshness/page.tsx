export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { loadIntelligenceFreshness, type FreshnessState } from "@/lib/intelligence/freshness-center";
import { DashboardPageHeader } from "@/components/dashboard/system/DashboardPageHeader";

export const metadata = { title: "Intelligence Freshness — The Milano Seal™", robots: { index: false } };

const STYLE: Record<FreshnessState, string> = {
  CURRENT: "text-emerald-300 border-emerald-400/20 bg-emerald-400/[0.05]",
  WATCH: "text-amber-200 border-amber-400/20 bg-amber-400/[0.05]",
  STALE: "text-red-300 border-red-400/20 bg-red-400/[0.05]",
  CONFLICT: "text-orange-200 border-orange-400/20 bg-orange-400/[0.05]",
  REVIEW_REQUIRED: "text-[#E4CA8C] border-[#C6A55A]/20 bg-[#C6A55A]/[0.05]",
};

function date(value: string | null) {
  if (!value) return "UNKNOWN";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "UNKNOWN" : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d);
}

export default async function FreshnessPage() {
  await requireDashboardAccess();
  const snapshot = await loadIntelligenceFreshness();
  const states: FreshnessState[] = ["CURRENT", "WATCH", "STALE", "CONFLICT", "REVIEW_REQUIRED"];

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <DashboardPageHeader eyebrow="Global Document Intelligence · Provenance" title="Intelligence Freshness Center" description="Authority intelligence is current only when provenance and review evidence support it. Missing, stale, or review-required evidence fails closed." />
      {snapshot.degraded ? <div className="rounded-xl border border-red-400/20 bg-red-400/[0.05] p-4 text-sm text-red-100/70">{snapshot.warning}</div> : null}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {states.map((state) => <div key={state} className="rounded-xl border border-white/[0.07] bg-[#0A0A0A] p-4"><p className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/25">{state.replaceAll("_", " ")}</p><p className="mt-2 text-2xl font-light text-[#E4CA8C]">{snapshot.counts[state]}</p></div>)}
      </section>
      <section className="space-y-3">
        {snapshot.records.map((record) => (
          <article key={record.id} className="rounded-xl border border-white/[0.07] bg-[#0A0A0A] p-4 sm:p-5">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div>
                <span className={`rounded-md border px-2 py-1 font-mono text-[8px] uppercase tracking-[0.14em] ${STYLE[record.freshnessState]}`}>{record.freshnessState.replaceAll("_", " ")}</span>
                <h2 className="mt-3 font-serif text-lg text-white/75">{record.authorityName}</h2>
                <p className="mt-1 text-xs text-white/30">{record.destination ?? "Destination unknown"}</p>
              </div>
              <dl className="grid gap-3 sm:grid-cols-2 lg:w-[620px] lg:grid-cols-4">
                <Field label="Source" value={record.sourceType ?? "UNKNOWN"} />
                <Field label="Reviewed" value={date(record.reviewDate)} />
                <Field label="Confidence" value={record.confidence} />
                <Field label="Routing" value={record.routingStatus} />
              </dl>
            </div>
            {record.source ? <p className="mt-4 break-all font-mono text-[9px] text-white/25">{record.source}</p> : <p className="mt-4 text-[10px] text-amber-200/45">No authoritative source URL recorded.</p>}
          </article>
        ))}
      </section>
      <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/20">Generated {snapshot.generatedAt}</p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-3"><dt className="font-mono text-[8px] uppercase tracking-[0.12em] text-white/20">{label}</dt><dd className="mt-2 break-words text-[10px] text-white/45">{value}</dd></div>;
}
