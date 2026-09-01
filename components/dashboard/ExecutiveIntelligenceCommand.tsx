import Link from "next/link";
import { loadOperatorIntelligence } from "@/lib/operator-intelligence/read-model";
import { loadProfessional360 } from "@/lib/professional360/read-model";
import { loadMatterEconomics } from "@/lib/economics/matterEconomics";
import { buildCorridorScaleDecisions } from "@/lib/corridor/scale-engine";

function money(value: number | null, currency: string | null) {
  if (value === null) return "UNKNOWN";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency ?? "USD", maximumFractionDigits: 0 }).format(value);
}

export async function ExecutiveIntelligenceCommand() {
  const [operator, professional, economics] = await Promise.all([
    loadOperatorIntelligence(),
    loadProfessional360(),
    loadMatterEconomics(),
  ]);
  const corridors = buildCorridorScaleDecisions(economics.matters);
  const blockers = operator.actions.filter((a) => ["Payment Blocked", "Document Blocked", "Authority Review", "Courier Exception"].includes(a.actionClass)).length;

  return (
    <section className="mx-auto mt-7 max-w-7xl space-y-6">
      <div className="rounded-xl border border-[#C6A55A]/15 bg-[#080808] p-5 sm:p-6">
        <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-[#C6A55A]/55">Governed Executive Intelligence</p>
        <h2 className="mt-2 font-serif text-2xl font-light text-[#F6F1E6]">Truth → State → Decision → Economics → Learning</h2>
        <p className="mt-2 max-w-3xl text-xs leading-5 text-white/35">Read-only intelligence over existing canonical authorities. Unknown evidence stays unknown; no payment, execution, or commercial state is authored here.</p>
      </div>

      <div className="grid gap-3 lg:grid-cols-4">
        <Card href="/today" label="Today" value={operator.actions.length} sub="derived operator actions" />
        <Card href="/dashboard/recovery" label="Execution Blockers" value={blockers} sub="payment / document / authority / courier" />
        <Card href="/dashboard/professional360" label="Professional Accounts" value={professional.totals.accounts} sub={`${professional.totals.atRisk} at risk`} />
        <Card href="/dashboard/economics" label="Collected Revenue" value={money(economics.totals.collectedRevenue.value, economics.totals.collectedRevenue.currency)} sub={`${economics.totals.paidMatters} paid Matters`} />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel href="/dashboard/professional360" eyebrow="Professional Network" title="Professional360" rows={[
          ["Active", professional.totals.active],
          ["Repeat", professional.totals.repeat],
          ["At Risk", professional.totals.atRisk],
          ["Lost", professional.totals.lost],
        ]} />
        <Panel href="/dashboard/economics" eyebrow="Economics" title="Matter Economics" rows={[
          ["Collected", money(economics.totals.collectedRevenue.value, economics.totals.collectedRevenue.currency)],
          ["Direct Cost", "UNKNOWN"],
          ["Contribution", "UNKNOWN"],
          ["Evidence", economics.totals.collectedRevenue.evidenceClass],
        ]} />
        <Panel href="/dashboard/corridors" eyebrow="Corridors" title="Scale Command" rows={[
          ["Scale", corridors.filter((c) => c.status === "SCALE").length],
          ["Watch", corridors.filter((c) => c.status === "WATCH").length],
          ["Constrained", corridors.filter((c) => c.status === "CONSTRAINED").length],
          ["Do Not Scale", corridors.filter((c) => c.status === "DO_NOT_SCALE").length],
        ]} />
      </div>
    </section>
  );
}

function Card({ href, label, value, sub }: { href: string; label: string; value: string | number; sub: string }) {
  return <Link href={href} className="rounded-xl border border-white/[0.07] bg-[#0A0A0A] p-4 transition hover:border-[#C6A55A]/25"><p className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/30">{label}</p><p className="mt-2 text-2xl font-light text-[#E4CA8C]">{value}</p><p className="mt-1 text-[10px] text-white/25">{sub}</p></Link>;
}

function Panel({ href, eyebrow, title, rows }: { href: string; eyebrow: string; title: string; rows: Array<[string, string | number]> }) {
  return <Link href={href} className="rounded-xl border border-white/[0.07] bg-[#0A0A0A] p-5 transition hover:border-[#C6A55A]/25"><p className="font-mono text-[8px] uppercase tracking-[0.17em] text-[#C6A55A]/50">{eyebrow}</p><h3 className="mt-2 font-serif text-lg text-white/70">{title}</h3><div className="mt-4">{rows.map(([label, value]) => <div key={label} className="flex items-center justify-between gap-4 border-b border-white/[0.04] py-2 text-[11px] last:border-0"><span className="text-white/30">{label}</span><span className="text-white/60">{value}</span></div>)}</div></Link>;
}
