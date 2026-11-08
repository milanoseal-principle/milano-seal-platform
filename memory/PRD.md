# The Milano Seal — P4–P23 Implementation Program (PRD / memory)

## Source directive
User's "EXACT P4–P23 PRODUCTION IMPLEMENTATION DIRECTIVE" (canonical repo milanoseal-principle/milano-seal-platform).
Invariants: canonical Matter = public.deals; Wise only (no Stripe); verified Wise settlement before scheduling;
customer execution preference ≠ confirmed execution; private pricing (TIFFTEST50/DAMIANI50 never public);
Milano is not a law firm; extend existing structures only; additive forward migrations; no production
migration/deploy/publish/merge/force-push; no live Wise/RON/apostille/courier; no fake certification.

## Stack
Next.js (app router) + Supabase (Postgres/RLS/storage) + BlueNotary RON + Wise. Tests: node:test via tsx (`npm test`), validators in scripts/*.mjs.

## Status
- PR #437 (P4 slice 1) squash-merged into main at 69c5a085.
- 2026-11-08 — P4b (branch feat/p4b-ron-statutory-evidence-completion, base 69c5a085): COMPLETE in workspace, awaiting user Save to GitHub (Create Branch & Push).
  - Migration 20261108090000_p4b_ron_statutory_evidence.sql (lifecycle REQUESTED…CANCELLED, statutory evidence columns,
    SQL fail-closed ron_session_missing_evidence, frozen evidence, immutable executed artifacts, append-only ron_audit_events,
    document_versions RLS + immutability + RON lineage, deals trigger: RON Matter cannot leave in_execution without COMPLETED).
  - lib/ron/evidence.ts, lib/ron/evidenceServer.ts, lib/ron/executedCapture.ts (shared webhook/operator capture).
  - Operator API: /api/dashboard/ron/sessions/[id]/evidence (GET/POST), /evidence/verify (verify|complete|reopen|fail).
  - UI: components/ron/RONStatutoryEvidencePanel.tsx on /dashboard/ron/[session_id]; portal shows completion only on Milano COMPLETED.
  - Tests: tests/p4bRonStatutoryEvidence.test.ts (+ #437 test retargeted to shared module).

## CANONICAL P6 CORRECTION (user, 2026-11-08) — overrides the master directive's $25 fee language
BlueNotary sets/collects the notarial-act fee directly. Milano must NOT add any $25/notarial fee to its pricing,
private quote, invoice, Wise expected amount, revenue or discounts, and must NOT enforce a provider fee ceiling
through Milano's payment engine. P6 = PROVIDER FEE SEPARATION: Milano quote / invoice / Wise expected amount =
Milano-controlled charges only; BlueNotary fee = external provider charge/evidence only, never Milano revenue.
Provider-fee metadata may be stored as provider evidence/reference only. Audit and correct any existing inclusion
without a second pricing engine. P6 tests: provider fee excluded from Wise amount and revenue; provider fee
metadata cannot alter the canonical quote; Milano service charges independently classified; invoice/Wise reconcile
Milano-controlled charges only; provider fee evidence recordable without becoming a Milano line item.
Do NOT build the "Florida $25-per-act ceiling through quote/invoice/Wise" — rejected.
P4b fee-label correction DONE in P4b before push (2026-11-08): the unshipped P4b migration was corrected in place.
`notarial_fee_classification`/'RON_NOTARIAL_ACT_FEE' was removed and replaced by
`provider_fee_evidence_classification` (only 'EXTERNAL_PROVIDER_NOTARIAL_FEE') + optional `provider_fee_evidence_reference`.
No amount, not mandatory for RON completion, not in any pricing/Wise/payment/scheduling code. P6 no longer needs to
repair P4b naming; P6 must still run the full repository provider-fee-separation audit.

## Next (after user confirms P4 save)
P5 RON retention/incidents/records requests → P6 provider fee separation (see correction above) →
P7 … P23 per directive. Known items for later phases: courier skip_release_gate operator bypass (P14), client RLS
column exposure on ron_sessions (P11), validate-postpayment-ron-matter-progression fails on main (pre-existing), eslint config lints nothing (P12/P18).
