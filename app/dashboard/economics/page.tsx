export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { loadMatterEconomics, type EconomicMetric } from "@/lib/economics/matterEconomics";
import { DashboardPageHeader } from "@/components/dashboard/system/DashboardPageHeader";

export const metadata = {
  title: "Matter Economics — The Milano Seal™",
  robots: { index: false },
};

function metricValue(metric: EconomicMetric) {
  if (metric.value === null) return "UNKNOWN";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: metric.currency ?? "USD", maximumFractionDigits: 0 }).format(metric.value);
}

function EvidenceMetric({ label, metric }: { label: string; metric: EconomicMetric }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#0A0A0A] p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-[8px] uppercase tracking-[0.17em] text-white/30">{label}</p>
        <span className="font-mono text-[8px] uppercase tracking-[0.13em] text-[#C6A55A]/55">{metric.evidenceClass}</span>
      </div>
      <p className="mt-2 text-2xl font-light text-[#E4CA8C]">{metricValue(metric)}</p>
      <p className="mt-2 text-[10px] leading-4 text-white/25">{metric.evidence}</p>
    </div>
  );
}

export default async function EconomicsPage() {
  await requireDashboardAccess();
  const snapshot = await loadMatterEconomics();
  const completedCycles = snapshot.matters.map((m) => m.cycleDays).filter((v): v is number => v !== null);
  const avgCycle = completedCycles.length ? Math.round((completedCycles.reduce((a, b) => a + b, 0) / completedCycles.length) * 10) / 10 : null;
  const observedExceptions = snapshot.matters.filter((m) => m.exceptionObserved === true).length;
  const observedRefunds = snapshot.matters.filter((m) => m.refundObserved === true).length;

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <DashboardPageHeader
        eyebrow="Economics · Canonical Matter Truth"
        title="Matter Economics Command"
        description="Observed economics are separated from attributed, modeled, and unknown values. No modeled LTV, quote value, or unverified payment is counted as collected revenue."
      />

      {snapshot.degraded ? <div className="rounded-xl border border-red-400/20 bg-red-400/[0.05] p-4 text-sm text-red-100/70">{snapshot.warning}</div> : null}

      <section className="grid gap-3 md:grid-cols-3">
        <EvidenceMetric label="Collected Revenue" metric={snapshot.totals.collectedRevenue} />
        <EvidenceMetric label="Direct Execution Cost" metric={snapshot.totals.directExecutionCost} />
        <EvidenceMetric label="Contribution Margin" metric={snapshot.totals.contributionMargin} />
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Paid Matters", snapshot.totals.paidMatters],
          ["Avg Cycle Days", avgCycle ?? "UNKNOWN"],
          ["Observed Exceptions", observedExceptions],
          ["Observed Refunds", observedRefunds],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-white/[0.07] bg-[#0A0A0A] p-4">
            <p className="font-mono text-[8px] uppercase tracking-[0.17em] text-white/30">{label}</p>
            <p className="mt-2 text-xl font-light text-white/65">{value}</p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0A0A0A]">
        <div className="border-b border-white/[0.05] p-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#C6A55A]/55">Matter Evidence</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[820px] w-full text-left">
            <thead className="border-b border-white/[0.05] font-mono text-[8px] uppercase tracking-[0.13em] text-white/25">
              <tr>
                {['Matter','Corridor','Document','Revenue','Revenue Truth','Direct Cost','Margin','Cycle'].map((h) => <th key={h} className="px-4 py-3 font-normal">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {snapshot.matters.map((matter) => (
                <tr key={matter.matterId} className="border-b border-white/[0.035] text-[11px] text-white/45 last:border-0">
                  <td className="px-4 py-3 font-mono text-white/55">{matter.matterId}</td>
                  <td className="px-4 py-3">{matter.destinationCountry ?? "UNKNOWN"}</td>
                  <td className="px-4 py-3">{matter.documentType ?? "UNKNOWN"}</td>
                  <td className="px-4 py-3">{metricValue(matter.collectedRevenue)}</td>
                  <td className="px-4 py-3 text-[#C6A55A]/60">{matter.collectedRevenue.evidenceClass}</td>
                  <td className="px-4 py-3">{metricValue(matter.directExecutionCost)}</td>
                  <td className="px-4 py-3">{metricValue(matter.contributionMargin)}</td>
                  <td className="px-4 py-3">{matter.cycleDays === null ? "UNKNOWN" : `${matter.cycleDays}d`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="rounded-xl border border-[#C6A55A]/10 bg-[#C6A55A]/[0.02] p-4 text-[11px] leading-5 text-white/35">
        Direct execution cost and contribution margin intentionally remain UNKNOWN until a canonical cost ledger exists. This surface will not create shadow accounting to make the dashboard look complete.
      </div>
    </div>
  );
}
