import Link from "next/link";
import type { CommandCenterWorkbookProjection } from "@/lib/command-center/workbookIntelligence";

function currency(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export function WorkbookIntelligencePanel({ projection }: { projection: CommandCenterWorkbookProjection }) {
  const damiani = projection.opportunities.find((record) => record.id === "MS-DAMIANI-2026-003");
  const client = projection.clients.find((record) => record.clientName === "Irene Damiani");
  if (!damiani || !client) return null;

  return (
    <section className="rounded-[2rem] border border-amber-300/20 bg-stone-950/80 p-6" aria-labelledby="workbook-intelligence-title">
      <div className="flex flex-col gap-4 border-b border-amber-300/15 pb-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-amber-200/60">Read-only operator intelligence</p>
          <h2 id="workbook-intelligence-title" className="mt-2 text-2xl font-semibold text-amber-100">Workbook Opportunity Projection</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-400">Evidence-only workbook records are normalized for operator review. Supabase Matter state, canonical pricing, and Wise settlement remain authoritative.</p>
        </div>
        <Link href="/dashboard/workbook/COMMAND_CENTER" className="text-xs uppercase tracking-[0.18em] text-amber-200 hover:text-amber-100">Source evidence</Link>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.5fr_0.5fr]">
        <article className="rounded-2xl border border-amber-300/15 bg-black/35 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-xs text-amber-200/60">{damiani.id}</p><h3 className="mt-1 text-xl text-white">{damiani.clientName}</h3></div>
            <span className="rounded-full border border-amber-300/25 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-amber-100">{damiani.status} · {damiani.stage}</span>
          </div>
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
            <div><dt className="text-stone-500">Type</dt><dd className="mt-1 text-stone-200">{damiani.clientType}</dd></div>
            <div><dt className="text-stone-500">Country / Lane</dt><dd className="mt-1 text-stone-200">{damiani.country} · {damiani.lane}</dd></div>
            <div><dt className="text-stone-500">Document Scope</dt><dd className="mt-1 text-stone-200">TBD · operator confirmation required</dd></div>
            <div><dt className="text-stone-500">Payment / Revenue</dt><dd className="mt-1 text-stone-200">None · {currency(damiani.collectedRevenue)}</dd></div>
          </dl>
          <div className="mt-5 rounded-xl border border-amber-300/10 bg-amber-200/[0.03] p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-amber-200/60">Protected courtesy metadata</p>
            <p className="mt-2 text-sm text-amber-100">{damiani.protectedCode} · 50% · not redeemed</p>
            <ol className="mt-3 space-y-1 text-xs leading-5 text-stone-400">{damiani.notes.map((note, index) => <li key={note}>{index + 1}. {note}</li>)}</ol>
          </div>
        </article>

        <aside className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <div className="rounded-2xl border border-amber-300/15 bg-black/35 p-4"><p className="text-[10px] uppercase tracking-[0.18em] text-stone-500">Damiani records</p><p className="mt-2 text-2xl text-amber-100">{client.totalHistoricalAndOpportunityRecords}</p><p className="text-xs text-stone-500">Historical + opportunity</p></div>
          <div className="rounded-2xl border border-amber-300/15 bg-black/35 p-4"><p className="text-[10px] uppercase tracking-[0.18em] text-stone-500">Lifetime collected</p><p className="mt-2 text-2xl text-amber-100">{currency(client.lifetimeCollectedValue)}</p><p className="text-xs text-stone-500">Unchanged by open/lost records</p></div>
          <div className="rounded-2xl border border-amber-300/15 bg-black/35 p-4"><p className="text-[10px] uppercase tracking-[0.18em] text-stone-500">Workbook revenue truth</p><p className="mt-2 text-2xl text-amber-100">{currency(projection.collectedRevenue)}</p><p className="text-xs text-stone-500">Abujhaisha · Snapdocs source</p></div>
        </aside>
      </div>
    </section>
  );
}
