export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { loadAllianceQualityCapacity } from "@/lib/alliance/quality-capacity";
import { DashboardPageHeader } from "@/components/dashboard/system/DashboardPageHeader";

export const metadata = { title: "Alliance Quality & Capacity — The Milano Seal™", robots: { index: false } };

export default async function AllianceQualityPage() {
  await requireDashboardAccess();
  const snapshot = await loadAllianceQualityCapacity();

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <DashboardPageHeader eyebrow="Alliance · Governed Capacity" title="Alliance Quality & Capacity" description="Operational partner status and verified corridor coverage are separated from unsupported quality/capacity metrics. Unknown evidence stays unknown." />
      {snapshot.degraded || snapshot.warning ? <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.05] p-4 text-sm text-amber-100/70">{snapshot.warning ?? "Alliance projection unavailable."}</div> : null}
      <section className="space-y-3">
        {snapshot.records.map((record) => (
          <article key={record.id} className="rounded-xl border border-white/[0.07] bg-[#0A0A0A] p-4 sm:p-5">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
              <div>
                <span className="rounded-md border border-[#C6A55A]/20 bg-[#C6A55A]/[0.04] px-2 py-1 font-mono text-[8px] uppercase tracking-[0.14em] text-[#E4CA8C]">{record.operatingState.replaceAll("_", " ")}</span>
                <h2 className="mt-3 font-serif text-lg text-white/75">{record.name}</h2>
                <p className="mt-1 text-xs text-white/30">{record.firm ?? "Firm not recorded"}</p>
                <p className="mt-3 text-[10px] text-white/30">Verified corridor coverage: {record.coverage.length ? record.coverage.join(", ") : "UNKNOWN"}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:w-[620px] lg:grid-cols-5">
                <Metric label="Credential" value={record.credentialStatus} />
                <Metric label="Availability" value={record.availability} />
                <Metric label="Acceptance" value={record.acceptance} />
                <Metric label="Completion" value={record.completion} />
                <Metric label="Capacity" value={record.capacity} />
                <Metric label="Cost" value={record.cost} />
                <Metric label="Quality" value={record.quality} />
                <Metric label="Rework" value={record.rework} />
                <Metric label="Complaint" value={record.complaint} />
                <Metric label="Verified" value={record.lastVerified ? new Date(record.lastVerified).toLocaleDateString("en-US") : "UNKNOWN"} />
              </div>
            </div>
          </article>
        ))}
        {!snapshot.records.length ? <div className="rounded-xl border border-white/[0.07] bg-[#0A0A0A] p-8 text-center text-sm text-white/35">No canonical Alliance partner evidence available.</div> : null}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-3"><p className="font-mono text-[8px] uppercase tracking-[0.12em] text-white/20">{label}</p><p className="mt-2 text-[10px] text-white/45">{value}</p></div>;
}
