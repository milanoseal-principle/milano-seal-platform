"use client";

import { motion } from "framer-motion";
import type { CustomerTrustSnapshot, TrustEvidenceClass } from "@/lib/trust/customer-trust";

const EVIDENCE_STYLE: Record<TrustEvidenceClass, string> = {
  OBSERVED: "border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-300",
  ATTRIBUTED: "border-[#C6A55A]/20 bg-[#C6A55A]/[0.05] text-[#E4CA8C]",
  UNKNOWN: "border-white/10 bg-white/[0.02] text-white/30",
};

export function TrustEngine({ snapshot }: { snapshot: CustomerTrustSnapshot }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-7xl space-y-7 p-4 sm:p-6"
    >
      <header className="rounded-xl border border-[#C6A55A]/15 bg-[#080808] p-5 sm:p-7">
        <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-[#C6A55A]/60">Intelligence · Customer Trust</p>
        <h1 className="mt-2 font-serif text-3xl font-light text-[#F6F1E6]">Customer Trust Engine</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/45">Trust evidence across intake, review, payment, scheduling, execution, apostille/authentication, custody/release, and completion. Unsupported metrics remain UNKNOWN; no synthetic trust score is created.</p>
      </header>

      {snapshot.degraded ? (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.05] p-4 text-sm text-amber-100/70">{snapshot.warning}</div>
      ) : null}

      <section className="grid gap-3 lg:grid-cols-2">
        {snapshot.stages.map((stage, stageIndex) => (
          <motion.article
            key={stage.stage}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(stageIndex * 0.025, 0.18), duration: 0.18 }}
            className="rounded-xl border border-white/[0.07] bg-[#0A0A0A] p-4 sm:p-5"
          >
            <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-[#C6A55A]/50">{stage.stage.replaceAll("_", " / ")}</p>
            <div className="mt-4 space-y-2">
              {stage.metrics.map((metric) => (
                <div key={metric.label} className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-3">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-[11px] text-white/45">{metric.label}</p>
                    <div className="text-right">
                      <p className="text-sm text-white/65">{metric.value === null ? "UNKNOWN" : metric.value}</p>
                      <span className={`mt-1 inline-block rounded border px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-[0.11em] ${EVIDENCE_STYLE[metric.evidenceClass]}`}>{metric.evidenceClass}</span>
                    </div>
                  </div>
                  <p className="mt-2 text-[9px] leading-4 text-white/20">{metric.evidence}</p>
                </div>
              ))}
            </div>
          </motion.article>
        ))}
      </section>

      <footer className="rounded-xl border border-[#C6A55A]/10 bg-[#C6A55A]/[0.02] p-4">
        <p className="text-[11px] leading-5 text-white/35">OBSERVED means canonical event/state evidence. ATTRIBUTED is clearly labeled derived relationship evidence. UNKNOWN means the capability is not sufficiently wired to support a truthful metric.</p>
        <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.14em] text-white/20">Generated {snapshot.generatedAt}</p>
      </footer>
    </motion.div>
  );
}
