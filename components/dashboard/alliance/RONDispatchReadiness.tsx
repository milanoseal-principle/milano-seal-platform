import { assessRonPartner } from "@/lib/alliance/ron/ronPartnerVerification";
import type { RonPartnerRecord } from "@/lib/alliance/ron/types";

export function RONDispatchReadiness({ partners }: { partners: RonPartnerRecord[] }) {
  const ready = partners
    .map((partner) => ({ partner, assessment: assessRonPartner(partner) }))
    .filter(({ assessment }) => assessment.readiness === "READY_STANDARD" || assessment.readiness === "READY_PRIORITY");

  return (
    <section className="rounded-xl border border-white/[0.07] bg-[#090909] p-5">
      <div>
        <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#C6A55A]/50">Dispatch Readiness</p>
        <h2 className="mt-1 font-serif text-xl text-white/80">Credential-ready partners</h2>
        <p className="mt-2 max-w-2xl text-xs leading-5 text-white/35">
          Partner readiness does not authorize a Matter. Signer-state authority, receiving-authority posture, payment gate, and Matter-specific execution requirements remain separate controls.
        </p>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {ready.length === 0 ? (
          <p className="rounded-lg border border-amber-300/15 bg-amber-300/[0.03] p-4 text-sm text-amber-100/55 md:col-span-2">No partner currently satisfies the credential-readiness rules.</p>
        ) : ready.map(({ partner, assessment }) => (
          <article key={partner.id} className="rounded-lg border border-emerald-300/10 bg-emerald-300/[0.025] p-4">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-sm font-medium text-white/75">{partner.fullName}</p><p className="mt-1 text-[11px] text-white/35">{partner.stateCommissioned} · {partner.serviceArea ?? "Service area not recorded"}</p></div>
              <span className="rounded border border-emerald-300/15 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.1em] text-emerald-200/60">{assessment.readiness.replaceAll("_", " ")}</span>
            </div>
            {assessment.strengths.length ? <p className="mt-3 text-[11px] leading-5 text-white/35">{assessment.strengths.join(" · ")}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
