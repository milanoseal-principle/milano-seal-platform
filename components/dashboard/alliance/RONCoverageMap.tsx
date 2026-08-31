import { RON_STATE_REGISTRY } from "@/lib/alliance/ron/ronStateRegistry";
import type { RonPartnerRecord } from "@/lib/alliance/ron/types";
import { assessRonPartner } from "@/lib/alliance/ron/ronPartnerVerification";

export function RONCoverageMap({ partners }: { partners: RonPartnerRecord[] }) {
  return (
    <section className="rounded-xl border border-[#C6A55A]/12 bg-[#080808] p-5">
      <div>
        <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#C6A55A]/50">Coverage Visualization</p>
        <h2 className="mt-1 font-serif text-xl text-white/80">Founding-state readiness matrix</h2>
      </div>
      <div className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-10">
        {RON_STATE_REGISTRY.map((state) => {
          const statePartners = partners.filter((partner) => {
            const value = partner.stateCommissioned.trim().toLowerCase();
            return value === state.state.toLowerCase() || value === state.code.toLowerCase();
          });
          const ready = statePartners.some((partner) => {
            const assessment = assessRonPartner(partner);
            return assessment.readiness === "READY_STANDARD" || assessment.readiness === "READY_PRIORITY";
          });
          return (
            <div key={state.code} className={`rounded-lg border p-3 text-center ${ready ? "border-emerald-300/20 bg-emerald-300/[0.04]" : statePartners.length ? "border-amber-300/15 bg-amber-300/[0.03]" : "border-white/[0.06] bg-white/[0.015]"}`}>
              <p className="font-mono text-[10px] font-semibold text-white/70">{state.code}</p>
              <p className="mt-1 text-[8px] text-white/25">{ready ? "READY*" : statePartners.length ? "REVIEW" : "OPEN"}</p>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-[10px] leading-5 text-white/25">* Partner credential readiness only. Matter dispatch still requires current state-authority review, receiving-authority review, and canonical execution gating.</p>
    </section>
  );
}
