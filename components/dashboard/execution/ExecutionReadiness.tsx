"use client";

/**
 * ExecutionReadiness — renders the non-bypassable gate ladder for a Matter.
 * State by text + icon + colour (never colour alone). No gate can be bypassed
 * from the UI. Guidance is projection-only and never mutates canonical truth.
 */

import {
  evaluateExecutionReadiness,
  type ExecutionGateId,
  type GateInput,
  type GateStatus,
} from "@/lib/pre-execution/executionGates";
import { PRE_EXECUTION_SAFETY_NOTICE } from "@/lib/pre-execution/preExecutionSafety";

const DOT: Record<GateStatus, string> = {
  passed: "bg-emerald-400",
  in_progress: "bg-[var(--ms-gold)]",
  blocked: "bg-[#E0876E]",
  not_started: "bg-white/25",
  not_required: "bg-white/15",
};

const STATUS_LABEL: Record<GateStatus, string> = {
  passed: "Complete",
  in_progress: "In progress",
  blocked: "Blocked",
  not_started: "Review required",
  not_required: "Not applicable",
};

const GATE_GUIDANCE: Record<ExecutionGateId, { why: string; what: string; who: string; next: string }> = {
  payment: {
    why: "Execution scheduling requires canonical payment or complimentary scheduling authority.",
    what: "Confirm the canonical scheduling gate reflects exact verified Wise settlement.",
    who: "Milano operator / canonical payment system",
    next: "Open payment and scheduling authority review.",
  },
  identity: {
    why: "Signer or party identity evidence is incomplete for the required execution path.",
    what: "Complete the governed identity requirement for this Matter without inferring missing identity evidence.",
    who: "Signer and Milano operator",
    next: "Resolve identity evidence before document execution.",
  },
  document_integrity: {
    why: "The document package has not yet passed the required integrity review.",
    what: "Confirm the authoritative document version and any required execution-ready fields.",
    who: "Milano operator",
    next: "Review the document package and evidence provenance.",
  },
  compliance_decision: {
    why: "A governed compliance or routing decision remains unresolved.",
    what: "Resolve the explicit review-required condition; do not infer legal or receiving-authority sufficiency.",
    who: "Authorized Milano operator / appropriate professional where required",
    next: "Open the Matter review evidence and record the governed decision.",
  },
  ron_readiness: {
    why: "Remote Online Notarization readiness is incomplete or not yet confirmed.",
    what: "Resolve signer location, execution method, notarial act, document package and other required RON evidence.",
    who: "Milano RON operator",
    next: "Open RON Readiness and resolve the first explicit blocker.",
  },
  operator_review: {
    why: "Human execution review has not yet been completed.",
    what: "Confirm the Matter evidence and downstream execution path before progression.",
    who: "Authorized Milano operator",
    next: "Complete operator review and preserve the decision evidence.",
  },
  seal_validation: {
    why: "Required execution/seal evidence has not yet been validated.",
    what: "Validate the actual execution evidence; do not create a completion claim from UI state alone.",
    who: "Milano operator",
    next: "Review executed-document evidence and validation state.",
  },
  post_execution_qc: {
    why: "Post-execution quality control remains incomplete.",
    what: "Verify the completed execution package against Matter-specific requirements before downstream release.",
    who: "Milano operator",
    next: "Run post-execution QC and record any exception.",
  },
  apostille_readiness: {
    why: "Apostille/authentication readiness is incomplete or requires authority review.",
    what: "Confirm the competent authority and required evidence without guaranteeing destination acceptance.",
    who: "Milano operator / competent authority as applicable",
    next: "Open apostille readiness and resolve the governed authority requirement.",
  },
};

export function ExecutionReadiness({ input }: { input?: GateInput }) {
  const readiness = evaluateExecutionReadiness(input);
  const blocker = readiness.firstBlockingGate ? GATE_GUIDANCE[readiness.firstBlockingGate] : null;

  return (
    <section className="rounded-2xl border border-[var(--ms-gold)]/20 bg-[#08080A]/90 p-4 sm:p-5" aria-labelledby="execution-readiness-heading">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-[8px] uppercase tracking-[0.28em] text-[var(--ms-gold)]/70">Pre-Execution Intelligence</p>
          <h3 id="execution-readiness-heading" className="font-serif text-lg text-white">Execution Readiness</h3>
        </div>
        <span className={`self-start rounded-full border px-3 py-1 font-mono text-[9px] uppercase tracking-[0.14em] sm:self-auto ${readiness.mayProceed ? "border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-300/80" : "border-[#E0876E]/40 bg-[#C0563E]/[0.1] text-[#E0876E]"}`}>
          {readiness.mayProceed ? "Ready" : "Review required"}
        </span>
      </div>

      <ol className="space-y-1.5">
        {readiness.gates.map((gate, index) => (
          <li key={gate.gate} className="grid grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-3 rounded-lg border border-white/[0.055] bg-white/[0.015] px-3 py-2 sm:grid-cols-[auto_auto_minmax(0,1fr)_auto]">
            <span className="w-5 flex-shrink-0 font-mono text-[9px] text-[var(--ms-gold)]/60">{String(index + 1).padStart(2, "0")}</span>
            <span className={`h-2 w-2 flex-shrink-0 rounded-full ${DOT[gate.status]}`} aria-hidden="true" />
            <span className="min-w-0 text-[12px] text-white/75">{gate.label}</span>
            <span className="col-start-3 font-mono text-[8px] uppercase tracking-[0.12em] text-white/45 sm:col-start-4">{STATUS_LABEL[gate.status]}</span>
          </li>
        ))}
      </ol>

      {!readiness.mayProceed && blocker ? (
        <div className="mt-4 rounded-xl border border-[#E0876E]/15 bg-[#C0563E]/[0.035] p-4" role="status" aria-live="polite">
          <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#E0876E]/75">First governed blocker</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {[
              ["Why", blocker.why],
              ["What must happen", blocker.what],
              ["Who can resolve it", blocker.who],
              ["Next action", blocker.next],
            ].map(([label, copy]) => (
              <div key={label} className="rounded-lg border border-white/[0.05] bg-black/20 p-3">
                <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/28">{label}</p>
                <p className="mt-1.5 text-[11px] leading-5 text-white/50">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <p className="mt-4 font-mono text-[8px] leading-relaxed text-white/25">{PRE_EXECUTION_SAFETY_NOTICE}</p>
    </section>
  );
}
