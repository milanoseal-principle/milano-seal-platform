export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { loadProfessional360, pickProfessionalDayAction } from "@/lib/professional360/read-model";

export const metadata = { title: "Professional Day — The Milano Seal™", robots: { index: false } };

function ageDays(value: string | null) {
  if (!value) return null;
  const ms = new Date(value).getTime();
  if (!Number.isFinite(ms)) return null;
  return Math.max(0, Math.floor((Date.now() - ms) / 86_400_000));
}

export default async function ProfessionalDayPage() {
  await requireDashboardAccess();
  const snapshot = await loadProfessional360();
  const account = pickProfessionalDayAction(snapshot);

  return (
    <div className="mx-auto max-w-5xl space-y-7 px-4 py-8 sm:px-6 sm:py-10">
      <header className="rounded-xl border border-[#C6A55A]/15 bg-[#080808] p-5 sm:p-7">
        <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-[#C6A55A]/60">Today · Professional Network</p>
        <h1 className="mt-2 font-serif text-3xl font-light text-[#F6F1E6]">Professional Day Command</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/45">One evidence-backed professional relationship move without replacing execution Today. This surface does not create sales tasks, mutate Matters, or infer relationship value from missing evidence.</p>
        <div className="mt-4 flex gap-2">
          <Link href="/today" className="rounded-lg border border-white/10 px-3 py-2 text-[10px] text-white/55 hover:border-[#C6A55A]/30">Execution Today</Link>
          <Link href="/dashboard/professional360" className="rounded-lg border border-[#C6A55A]/20 bg-[#C6A55A]/[0.04] px-3 py-2 text-[10px] text-[#E4CA8C]">Professional360</Link>
        </div>
      </header>

      {snapshot.degraded ? <div className="rounded-xl border border-red-400/20 bg-red-400/[0.05] p-4 text-sm text-red-100/70">{snapshot.warning}</div> : null}

      {!account ? (
        <section className="rounded-xl border border-white/[0.07] bg-[#0A0A0A] p-8 text-center"><p className="text-sm text-white/40">No professional relationship action can be justified from current canonical Matter evidence.</p></section>
      ) : (
        <section className="rounded-xl border border-white/[0.07] bg-[#0A0A0A] p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div>
              <span className="rounded-md border border-[#C6A55A]/20 bg-[#C6A55A]/[0.04] px-2 py-1 font-mono text-[8px] uppercase tracking-[0.14em] text-[#E4CA8C]">{account.relationshipStatus.replaceAll("_", " ")}</span>
              <h2 className="mt-4 font-serif text-2xl text-white/80">{account.organization}</h2>
              <p className="mt-2 text-xs text-white/35">{account.matterTypes.join(" · ") || "Matter type evidence unavailable"}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="font-mono text-[8px] uppercase tracking-[0.13em] text-white/20">Since meaningful touch</p>
              <p className="mt-1 text-xl text-[#E4CA8C]">{ageDays(account.lastMeaningfulTouch) === null ? "UNKNOWN" : `${ageDays(account.lastMeaningfulTouch)}d`}</p>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-[#C6A55A]/12 bg-[#C6A55A]/[0.025] p-4">
            <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#C6A55A]/50">Next Move</p>
            <p className="mt-2 text-sm leading-6 text-white/60">{account.nextMove}</p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Metric label="Active Matters" value={account.activeMatters} />
            <Metric label="Completed Matters" value={account.completedMatters} />
            <Metric label="Countries" value={account.countries.join(", ") || "UNKNOWN"} />
          </div>

          <div className="mt-5 border-t border-white/[0.05] pt-4">
            <p className="font-mono text-[8px] uppercase tracking-[0.15em] text-white/25">Why</p>
            <div className="mt-2 space-y-1">{account.evidence.map((item) => <p key={item} className="text-[11px] leading-5 text-white/35">{item}</p>)}</div>
          </div>
        </section>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-3"><p className="font-mono text-[8px] uppercase tracking-[0.13em] text-white/20">{label}</p><p className="mt-2 text-[11px] text-white/50">{value}</p></div>;
}
