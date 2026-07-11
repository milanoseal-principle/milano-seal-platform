"use client";

/**
 * ExecutiveIntelligence — six evidence-backed answer cards reading the existing
 * canonical engines. No new data model. Verified answers are visually distinct
 * from planning-only signals; insufficient-evidence states are honest.
 */

import { allExecutiveAnswers, type AnswerStatus } from "@/lib/commercial-intelligence/executiveEngine";

const STATUS_STYLE: Record<AnswerStatus, string> = {
  verified: "border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-300/80",
  partially_verified: "border-[var(--ms-gold)]/40 bg-[var(--ms-gold)]/[0.08] text-[var(--ms-gold)]",
  planning_only: "border-amber-500/30 bg-amber-500/[0.08] text-amber-300/80",
  insufficient_evidence: "border-white/10 bg-white/[0.03] text-white/45",
};

const STATUS_LABEL: Record<AnswerStatus, string> = {
  verified: "Verified",
  partially_verified: "Partially verified",
  planning_only: "Planning only",
  insufficient_evidence: "Insufficient evidence",
};

export function ExecutiveIntelligence() {
  const answers = allExecutiveAnswers();

  return (
    <section className="rounded-2xl border border-[var(--ms-gold)]/20 bg-[#08080A]/90 p-4 sm:p-5">
      <div className="mb-4">
        <p className="font-mono text-[8px] uppercase tracking-[0.28em] text-[var(--ms-gold)]/70">International Relationship Intelligence</p>
        <h3 className="font-serif text-lg text-white">Six Executive Questions</h3>
        <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.14em] text-white/30">Reads canonical engines · verified revenue separated from planning · zero evidence = zero answer</p>
      </div>

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
        {answers.map((a) => (
          <article key={a.questionId} className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3">
            <div className="mb-2 flex items-start justify-between gap-2">
              <h4 className="text-[13px] leading-snug text-white/80">{a.question}</h4>
              <span className={`flex-shrink-0 rounded-full border px-2 py-0.5 font-mono text-[7px] uppercase tracking-[0.12em] ${STATUS_STYLE[a.answerStatus]}`}>
                {STATUS_LABEL[a.answerStatus]}
              </span>
            </div>
            <p className="text-[12px] leading-relaxed text-white/55">{a.answerSummary}</p>

            {a.topEntities.length > 0 && (
              <ul className="mt-2 space-y-1">
                {a.topEntities.map((e, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.055] bg-white/[0.015] px-2.5 py-1.5">
                    <span className="text-[11px] text-white/70">{e.label}</span>
                    <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-white/35">{e.detail}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-white/30">Confidence · {a.confidence}</span>
              <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-[var(--ms-gold)]/60">Next · {a.nextAction}</span>
            </div>
            {a.missingEvidence.length > 0 && (
              <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.1em] text-white/25">Needs: {a.missingEvidence.join(" · ")}</p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
