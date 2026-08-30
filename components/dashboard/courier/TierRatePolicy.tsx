import { BadgeDollarSign, Gauge, Rocket, ShieldCheck } from "lucide-react";

const lanes = [
  {
    lane: "Signature",
    icon: BadgeDollarSign,
    policy: "Lowest approved cost",
    detail: "Chooses the least-expensive approved carrier rate. Delivery speed and preferred-carrier order break ties.",
    accent: "text-[var(--ms-gold)]",
  },
  {
    lane: "Priority",
    icon: Gauge,
    policy: "Best speed / cost balance",
    detail: "Chooses the fastest approved service inside the governed value ceiling so faster handling does not create unnecessary courier spend.",
    accent: "text-amber-200/80",
  },
  {
    lane: "Executive",
    icon: Rocket,
    policy: "Fastest approved service",
    detail: "Chooses the fastest approved service first, then preferred-carrier reliability and cost as tie-breakers.",
    accent: "text-emerald-300/80",
  },
] as const;

export function TierRatePolicy() {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-black/20 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.2em] text-[var(--ms-gold)]/62">
            <ShieldCheck className="h-4 w-4" /> Matter-aware Shippo intelligence
          </div>
          <h3 className="mt-2 font-serif text-xl text-white">Execution Lane Rate Optimizer</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/42">
            The Matter&apos;s canonical execution lane controls the recommendation. Shippo supplies live approved-carrier rates; Milano selects by governed value policy. The operator may still review alternatives before purchase.
          </p>
        </div>
        <div className="rounded-full border border-emerald-300/15 bg-emerald-300/[0.04] px-3 py-2 font-mono text-[8px] uppercase tracking-[0.16em] text-emerald-200/70">
          No client carrier checkout
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {lanes.map(({ lane, icon: Icon, policy, detail, accent }) => (
          <div key={lane} className="rounded-xl border border-white/[0.055] bg-white/[0.016] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className={`flex items-center gap-2 ${accent}`}>
                <Icon className="h-4 w-4" />
                <span className="font-serif text-base">{lane}</span>
              </div>
              <span className="font-mono text-[8px] uppercase tracking-[0.13em] text-white/24">Auto recommend</span>
            </div>
            <p className="mt-4 font-medium text-white/72">{policy}</p>
            <p className="mt-2 text-[11px] leading-5 text-white/34">{detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-[rgba(198,166,91,0.12)] bg-[rgba(198,166,91,0.025)] px-4 py-3 text-[11px] leading-5 text-white/38">
        International tie-break preference: DHL Express → FedEx → UPS → USPS. Domestic tie-break preference: UPS → FedEx → USPS. Carrier preference never overrides a materially better lane-specific rate.
      </div>
    </section>
  );
}
