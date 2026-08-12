# Milano Pre-Execution Intelligence — Non-Bypassable Execution Gates (Foundation)

Milano Seal only. Contains no provider/medical/Liaison-OS concepts (validator
enforces zero contamination in these files).

## Core
- `lib/pre-execution/executionGates.ts` — the ordered, non-bypassable gate ladder:
  payment → identity → document_integrity → compliance_decision → ron_readiness →
  operator_review → seal_validation → post_execution_qc → apostille_readiness.
  `evaluateExecutionReadiness()` blocks any downstream gate while a prior required
  gate has not passed; `mayProceed` is true only when every required gate passes.
  `canBypassGate()` always returns false — no role (founder/operator/alliance/VA)
  may bypass a gate.
- `lib/pre-execution/preExecutionSafety.ts` — AI/compliance boundary: AI may
  classify/extract/recommend/score; it may NOT confirm compliance, approve
  execution, authorize release, or bypass a gate. `requiresOperatorConfirmation()`
  marks review-dependent determinations that an operator must confirm.

## Surface
`/dashboard/matters/[matterId]/execution` — Execution Readiness gate ladder
(honest not-started states until wired to real matter records; state by
text+icon+colour). noindex.

## Reuse / safety
Reads normalized outcomes only; imports no protected/provider systems; does not
modify payment/scheduling/release/custody logic. Payment-before-scheduling and
QA-before-release are preserved by gate ordering.

## Deferred (the rest of the spec)
Document AI review, state-rules engine, foreign-document intelligence, dynamic
playbooks, RON operator control screens, seal-overlay/placement validation,
exception/escalation engine, apostille-readiness detail, founder override layer,
alliance quality center, learning trends, immutable audit trail wiring, execution
copilot, knowledge drawer. These build on this gate spine, incrementally.
