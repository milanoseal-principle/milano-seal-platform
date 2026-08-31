import { RON_STATE_REGISTRY } from "@/lib/alliance/ron/ronStateRegistry";
import type { RonPartnerRecord } from "@/lib/alliance/ron/types";
import { assessRonPartner } from "@/lib/alliance/ron/ronPartnerVerification";

export function RONStateCoverageBoard({ partners }: { partners: RonPartnerRecord[] }) {
  return (
    <section className="rounded-xl border border-white/[0.07] bg-[#090909] p-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#C6A55A]/50">Coverage Board</p>
          <h2 className="mt-1 font-serif text-xl text-white/80">Priority state execution coverage</h2>
        </div>
        <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-white/20">Recruitment priority ≠ legal availability</p>
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead className="font-mono text-[8px] uppercase tracking-[0.12em] text-white/25">
            <tr className="border-b border-white/[0.06]">
              <th className="py-2 pr-3">Priority</th><th className="py-2 pr-3">State</th><th className="py-2 pr-3">Applicants</th><th className="py-2 pr-3">RON-ready</th><th className="py-2 pr-3">Mobile fallback</th><th className="py-2 pr-3">Authority status</th>
            </tr>
          </thead>
          <tbody>
            {RON_STATE_REGISTRY.map((state) => {
              const statePartners = partners.filter((partner) => partner.stateCommissioned.trim().toLowerCase() === state.state.toLowerCase() || partner.stateCommissioned.trim().toLowerCase() === state.code.toLowerCase());
              const ronReady = statePartners.filter((partner) => ["RON_READY", "EXECUTION_PARTNER", "PRIORITY_DISPATCH_PARTNER"].includes(assessRonPartner(partner).level)).length;
              const mobile = statePartners.filter((partner) => partner.mobileAvailable).length;
              return (
                <tr key={state.code} className="border-b border-white/[0.04] text-white/45">
                  <td className="py-3 pr-3 font-mono text-[10px] text-[#C6A55A]/50">{state.priority}</td>
                  <td className="py-3 pr-3"><span className="text-white/70">{state.state}</span> <span className="ml-1 font-mono text-[9px] text-white/20">{state.code}</span></td>
                  <td className="py-3 pr-3">{statePartners.length}</td>
                  <td className="py-3 pr-3">{ronReady}</td>
                  <td className="py-3 pr-3">{mobile}</td>
                  <td className="py-3 pr-3"><span className="rounded border border-amber-300/15 bg-amber-300/[0.03] px-2 py-1 font-mono text-[8px] uppercase tracking-[0.1em] text-amber-200/60">{state.coverageStatus.replaceAll("_", " ")}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
