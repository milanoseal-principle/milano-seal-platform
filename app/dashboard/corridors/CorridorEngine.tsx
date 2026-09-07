"use client";

import { motion } from "framer-motion";
import type { CorridorScaleDecision, CorridorScaleStatus, FactorState } from "@/lib/corridor/scale-engine";

const STATUS_STYLE: Record<CorridorScaleStatus, string> = {
  SCALE: "border-emerald-400/25 bg-emerald-400/[0.06] text-emerald-300",
  WATCH: "border-amber-400/25 bg-amber-400/[0.06] text-amber-200",
  CONSTRAINED: "border-orange-400/25 bg-orange-400/[0.06] text-orange-200",
  DO_NOT_SCALE: "border-red-400/25 bg-red-400/[0.06] text-red-300",
  INSUFFICIENT_EVIDENCE: "border-white/15 bg-white/[0.025] text-white/55",
};

const FACTOR_STYLE: Record<FactorState, string> = {
  HIGH: "text-emerald-300/80",
  MODERATE: "text-amber-200/80",
  LOW: "text-white/45",
  HEALTHY: "text-emerald-300/80",
  LIMITED: "text-orange-200/80",
  CURRENT: "text-emerald-300/80",
  STALE: "text-red-300/80",
  UNKNOWN: "text-white/30",
};

function money(value: number | null, currency: string | null) {
  if (value === null) return "UNKNOWN";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency ?? "USD", maximumFractionDigits: 0 }).format(value);
}

export function CorridorEngine({
  corridors,
  generatedAt,
  degraded,
  warning,
}: {
  corridors: CorridorScaleDecision[];
  generatedAt: string;
  degraded: boolean;
  warning: string | null;
}) {
  const counts = corridors.reduce<Record<CorridorScaleStatus, number>>(
    (acc, corridor) => {
      acc[corridor.status] += 1;
      return acc;
    },
    { SCALE: 0, WATCH: 0, CONSTRAINED: 0, DO_NOT_SCALE: 0, INSUFFICIENT_EVIDENCE: 0 },
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-7xl space-y-7 motion-reduce:transform-none"
    >
      <header className="rounded-xl border border-[#C6A55A]/15 bg-[#080808] p-5 sm:p-7">
        <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-[#C6A55A]/60">Intelligence · Corridor Command</p>
        <h1 className="mt-2 font-serif text-3xl font-light text-[#F6F1E6]">Corridor Economics & Scale</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/45">
          Evidence-governed corridor decisions over canonical Matter and verified payment truth. No certification, margin, capacity, authority freshness, or scale readiness is inferred when evidence is missing.
        </p>
        <p className="mt-4 font-mono text-[8px] uppercase tracking-[0.14em] text-white/20">Generated {generatedAt}</p>
      </header>

      {degraded ? (
        <div className="rounded-xl border border-red-400/20 bg-red-400/[0.05] p-4 text-sm text-red-100/70" role="alert">
          {warning ?? "Canonical corridor source unavailable."}
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5" aria-label="Corridor scale posture summary">
        {([
          ["Scale", counts.SCALE],
          ["Watch", counts.WATCH],
          ["Constrained", counts.CONSTRAINED],
          ["Do Not Scale", counts.DO_NOT_SCALE],
          ["Insufficient Evidence", counts.INSUFFICIENT_EVIDENCE],
        ] as const).map(([label, value]) => (
          <div key={label} className="rounded-xl border border-white/[0.07] bg-[#0A0A0A] p-4">
            <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/30">{label}</p>
            <p className="mt-2 text-2xl font-light text-[#E4CA8C]">{value}</p>
          </div>
        ))}
      </section>

      {corridors.length === 0 ? (
        <section className="rounded-xl border border-white/[0.07] bg-[#0A0A0A] p-8 text-center" role="status">
          <p className="text-sm text-white/40">No canonical corridor Matter evidence is available yet.</p>
        </section>
      ) : (
        <section className="space-y-3">
          {corridors.map((corridor, index) => (
            <motion.article
              key={corridor.key}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.025, 0.2), duration: 0.18 }}
              className="rounded-xl border border-white/[0.07] bg-[#0A0A0A] p-4 sm:p-5 motion-reduce:transform-none"
            >
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-md border px-2 py-1 font-mono text-[8px] uppercase tracking-[0.16em] ${STATUS_STYLE[corridor.status]}`}>
                      {corridor.status.replaceAll("_", " ")}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#C6A55A]/55">{corridor.matterCount} Matter{corridor.matterCount === 1 ? "" : "s"}</span>
                  </div>
                  <h2 className="mt-3 font-serif text-xl text-white/80">{corridor.destinationCountry} · {corridor.documentType}</h2>
                  <p className="mt-2 text-xs text-white/35">Observed revenue: <span className="text-white/55">{money(corridor.observedRevenue, corridor.currency)}</span></p>
                  <div className="mt-3 space-y-1">
                    {corridor.reasons.map((reason) => <p key={reason} className="text-[11px] leading-5 text-white/35">{reason}</p>)}
                  </div>
                </div>

                <div className="grid min-w-0 gap-2 sm:grid-cols-2 lg:w-[520px]">
                  {corridor.factors.map((factor) => (
                    <div key={factor.label} className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-mono text-[8px] uppercase tracking-[0.13em] text-white/30">{factor.label}</p>
                        <p className={`font-mono text-[8px] uppercase tracking-[0.13em] ${FACTOR_STYLE[factor.state]}`}>{factor.state}</p>
                      </div>
                      <p className="mt-2 text-[10px] leading-4 text-white/25">{factor.evidence}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.article>
          ))}
        </section>
      )}

      <footer className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4">
        <p className="text-[11px] leading-5 text-white/30">
          Scale status is a deterministic read model, not a certification. Missing critical evidence resolves to INSUFFICIENT EVIDENCE rather than being converted into a positive or negative scale recommendation. Authority verification, execution capacity, partner capacity, and direct-cost evidence remain independently governed.
        </p>
      </footer>
    </motion.div>
  );
}
