import { assessRonPartner } from "@/lib/alliance/ron/ronPartnerVerification";
import type { RonPartnerRecord } from "@/lib/alliance/ron/types";

export function RONPartnerVerificationQueue({ partners }: { partners: RonPartnerRecord[] }) {
  const queue = partners
    .map((partner) => ({ partner, assessment: assessRonPartner(partner) }))
    .filter(({ assessment }) => assessment.readiness !== "READY_STANDARD" && assessment.readiness !== "READY_PRIORITY")
    .sort((a, b) => b.assessment.blockers.length - a.assessment.blockers.length);

  return (
    <section className="rounded-xl border border-white/[0.07] bg-[#090909] p-5">
      <div>
        <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#C6A55A]/50">Verification Queue</p>
        <h2 className="mt-1 font-serif text-xl text-white/80">Applicants requiring operator review</h2>
      </div>
      <div className="mt-5 space-y-3">
        {queue.length === 0 ? (
          <p className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-4 text-sm text-white/35">No pending verification blockers.</p>
        ) : queue.map(({ partner, assessment }) => (
          <article key={partner.id} className="rounded-lg border border-white/[0.06] bg-black/20 p-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <p className="text-sm font-medium text-white/75">{partner.fullName}</p>
                <p className="mt-1 text-[11px] text-white/35">{partner.stateCommissioned} · {partner.email}</p>
              </div>
              <span className="rounded border border-amber-300/15 bg-amber-300/[0.03] px-2 py-1 font-mono text-[8px] uppercase tracking-[0.1em] text-amber-200/60">{assessment.level.replaceAll("_", " ")}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {assessment.blockers.map((blocker) => <span key={blocker} className="rounded bg-red-400/[0.05] px-2 py-1 text-[10px] text-red-200/55">{blocker}</span>)}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
