"use client";

/**
 * ExecutionReadiness — renders the non-bypassable gate ladder for a matter.
 * Honest empty/not-started states until wired to real matter gate data. State by
 * text + icon + colour (never colour alone). No gate can be bypassed from the UI.
 */

import { evaluateExecutionReadiness, type GateInput, type GateStatus } from "@/lib/pre-execution/executionGates";
import { PRE_EXECUTION_SAFETY_NOTICE } from "@/lib/pre-execution/preExecutionSafety";

const DOT: Record<GateStatus, string> = {
  passed: "bg-emerald-400",
  in_progress: "bg-[var(--ms-gold)]",
  blocked: "bg-[#E0876E]",
  not_started: "bg-white/25",
  not_required: "bg-white/15",
};

const STATUS_LABEL: Record<GateStatus, string> = {
  passed: "Passed",
  in_progress: "In progress",
  blocked: "Blocked",
  not_started: "Not started",
  not_required: "Not required",
};

export function ExecutionReadiness({ input }: { input?: GateInput }) {
  const readiness = evaluateExecutionReadiness(input);

  return (
    <section className="rounded-2xl border border-[var(--ms-gold)]/20 bg-[#08080A]/90 p-4 sm:p-5">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-[8px] uppercase tracking-[0.28em] text-[var(--ms-gold)]/70">Pre-Execution Intelligence</p>
          <h3 className="font-serif text-lg text-white">Execution Readiness</h3>
        </div>
        <span className={`rounded-full border px-3 py-1 font-mono text-[9px] uppercase tracking-[0.14em] ${readiness.mayProceed ? "border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-300/80" : "border-[#E0876E]/40 bg-[#C0563E]/[0.1] text-[#E0876E]"}`}>
          {readiness.mayProceed ? "All gates passed" : `Blocked at ${readiness.firstBlockingGate}`}
        </span>
      </div>

      <ol className="space-y-1.5">
        {readiness.gates.map((g, i) => (
          <li key={g.gate} className="flex items-center gap-3 rounded-lg border border-white/[0.055] bg-white/[0.015] px-3 py-2">
            <span className="font-mono text-[9px] text-[var(--ms-gold)]/60 w-5 flex-shrink-0">{String(i + 1).padStart(2, "0")}</span>
            <span className={`h-2 w-2 flex-shrink-0 rounded-full ${DOT[g.status]}`} aria-hidden="true" />
            <span className="flex-1 text-[12px] text-white/75">{g.label}</span>
            <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-white/45">{STATUS_LABEL[g.status]}</span>
          </li>
        ))}
      </ol>

      <p className="mt-4 font-mono text-[8px] leading-relaxed text-white/25">{PRE_EXECUTION_SAFETY_NOTICE}</p>
    </section>
  );
}
