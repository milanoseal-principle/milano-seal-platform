import { ALLIANCE_INTELLIGENCE_GRAPH, TRUST_NETWORK_PARTNER_PROFILES, TRUST_NETWORK_STAGES, buildPartnerPassport, scoreDispatchReadiness } from "@/lib/alliance/intelligence";

export function TrustNetworkCommandCenter() {
  const passports = TRUST_NETWORK_PARTNER_PROFILES.map(buildPartnerPassport);
  const readiness = TRUST_NETWORK_PARTNER_PROFILES.map(scoreDispatchReadiness);
  const dispatchReady = readiness.filter((item) => item.status === "Dispatch Ready").length;

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-[#c9a24a]/25 bg-[#0b1118] p-6 text-white">
        <p className="text-xs uppercase tracking-[0.35em] text-[#c9a24a]">Trust Network · Alliance Intelligence</p>
        <h1 className="mt-3 text-3xl font-semibold md:text-5xl">Trust Network Command Center</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-white/65">A verified execution partner network for Secure International Document Execution & Authentication Infrastructure. This is not a directory, not lead selling, and not a guarantee of assignments, income, exclusive territory, or acceptance.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[{ label: "Partner profiles", value: TRUST_NETWORK_PARTNER_PROFILES.length }, { label: "Dispatch ready", value: dispatchReady }, { label: "Graph nodes", value: ALLIANCE_INTELLIGENCE_GRAPH.nodes.length }, { label: "Graph links", value: ALLIANCE_INTELLIGENCE_GRAPH.edges.length }].map((item) => (
          <div key={item.label} className="rounded-2xl border border-[#c9a24a]/20 bg-[#101820] p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-[#c9a24a]">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="rounded-3xl border border-[#c9a24a]/20 bg-[#0b1118] p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-[#c9a24a]">Operational maturity</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Progression path</h2>
          <div className="mt-5 space-y-3">
            {TRUST_NETWORK_STAGES.map((stage) => <div key={stage} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white/70">{stage}</div>)}
          </div>
        </div>

        <div className="rounded-3xl border border-[#c9a24a]/20 bg-[#0b1118] p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-[#c9a24a]">Partner Passport</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Verification and dispatch readiness</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {passports.map((passport) => {
              const profile = TRUST_NETWORK_PARTNER_PROFILES.find((item) => item.id === passport.partnerId);
              const result = readiness.find((item) => item.partnerId === passport.partnerId);
              return (
                <article key={passport.partnerId} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{profile?.displayName}</h3>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#c9a24a]">{profile?.stage}</p>
                    </div>
                    <span className="rounded-full border border-[#c9a24a]/30 px-3 py-1 text-xs text-[#f1d58b]">{result?.status}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-white/60">
                    <span>Identity: {passport.identity ? "Verified" : "Needed"}</span>
                    <span>Commission: {passport.commission ? "Verified" : "Needed"}</span>
                    <span>RON: {passport.ron ? "Ready" : "Review"}</span>
                    <span>Insurance: {passport.insurance ? "Verified" : "Needed"}</span>
                    <span>International: {passport.internationalReady ? "Ready" : "Review"}</span>
                    <span>Trust: {passport.trustScore}</span>
                  </div>
                  <p className="mt-4 text-sm text-white/70"><span className="text-[#c9a24a]">Next action:</span> {passport.nextAction}</p>
                </article>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-[#c9a24a]/20 bg-[#0b1118] p-6">
        <p className="text-xs uppercase tracking-[0.25em] text-[#c9a24a]">Alliance Intelligence Graph</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Matter-connected intelligence</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            {ALLIANCE_INTELLIGENCE_GRAPH.nodes.map((node) => <div key={node.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white/70">{node.type}: {node.label}</div>)}
          </div>
          <div className="space-y-2">
            {ALLIANCE_INTELLIGENCE_GRAPH.edges.map((edge) => <div key={`${edge.from}-${edge.to}`} className="rounded-xl border border-white/10 bg-black/25 p-3 text-sm text-white/70">{edge.from} → {edge.to}: <span className="text-[#f1d58b]">{edge.label}</span></div>)}
          </div>
        </div>
      </div>
    </section>
  );
}
