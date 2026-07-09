import { CLIENT_REVENUE_STACKS, GROSS_MARGIN_BANDS, REVENUE_LANES, REVENUE_SCENARIOS } from "@/lib/revenue";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export function FounderRevenueCommand() {
  const publicSafeLanes = REVENUE_LANES.filter((lane) => lane.publicSafe).length;
  const internalLanes = REVENUE_LANES.length - publicSafeLanes;

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {[{ label: "Revenue lanes", value: REVENUE_LANES.length }, { label: "Public-safe lanes", value: publicSafeLanes }, { label: "Internal-only lanes", value: internalLanes }, { label: "Client stacks", value: CLIENT_REVENUE_STACKS.length }].map((item) => (
          <div key={item.label} className="rounded-2xl border border-[#c9a24a]/20 bg-[#101820] p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-[#c9a24a]">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-[#c9a24a]/20 bg-[#0b1118] p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#c9a24a]">Scenario model</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Investor financial model</h2>
            </div>
            <p className="text-sm text-white/55">Planning scenarios only. No fake revenue and no guaranteed volume.</p>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {REVENUE_SCENARIOS.map((scenario) => (
              <div key={scenario.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[#c9a24a]">{scenario.label}</p>
                <p className="mt-3 text-2xl font-semibold text-white">{formatCurrency(scenario.annualRevenue)}</p>
                <p className="mt-2 text-sm text-white/60">{scenario.mattersPerMonth} matters/month · {formatCurrency(scenario.averageGrossMatterValue)} avg gross matter value</p>
                <p className="mt-2 text-xs text-white/40">{scenario.note}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-[#c9a24a]/20 bg-[#0b1118] p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-[#c9a24a]">Gross margin model</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Margin bands</h2>
          <div className="mt-5 space-y-3">
            {GROSS_MARGIN_BANDS.map((band) => (
              <div key={band.lane} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-white">{band.lane}</p>
                  <p className="text-sm text-[#f1d58b]">{band.low}%–{band.high}%</p>
                </div>
                <p className="mt-2 text-xs text-white/45">{band.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-[#c9a24a]/20 bg-[#0b1118] p-6">
        <p className="text-xs uppercase tracking-[0.25em] text-[#c9a24a]">Per-client revenue stack</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Matter monetization paths</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {CLIENT_REVENUE_STACKS.map((stack) => (
            <article key={stack.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="text-lg font-semibold text-white">{stack.clientType}</h3>
              <p className="mt-2 text-sm text-white/60">{stack.primaryNeed}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {stack.lanes.map((lane) => <span key={lane} className="rounded-full border border-[#c9a24a]/20 px-2.5 py-1 text-[11px] text-[#f1d58b]">{lane}</span>)}
              </div>
              <p className="mt-4 text-sm text-white/70"><span className="text-[#c9a24a]">Next action:</span> {stack.nextAction}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
