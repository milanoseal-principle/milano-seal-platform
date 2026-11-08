# The Milano Seal — P4–P23 Implementation Program (PRD / phase ledger)

## Source directive
User's "EXACT P4–P23 PRODUCTION IMPLEMENTATION DIRECTIVE" + EXECUTION OVERRIDE (continue through P23, no per-phase stops).
Canonical repo milanoseal-principle/milano-seal-platform. Invariants: canonical Matter = public.deals; Wise only (no Stripe);
verified Wise settlement before scheduling; preference ≠ confirmed execution; private pricing; Milano is not a law firm;
extend existing structures only; additive forward migrations; no production migration/deploy/publish/merge/force-push;
no live Wise/RON/apostille/courier; no fake certification. Do NOT add a Python backend for Emergent hosting (production = Vercel).

## CANONICAL P6 CORRECTION (user)
BlueNotary sets/collects the notarial fee externally. Milano quote / invoice / Wise expected amount / revenue = Milano-controlled
charges only. EXTERNAL_PROVIDER_NOTARIAL_FEE = evidence classification only, no amount, not required for RON completion.
Do NOT build a "$25 per act ceiling" through Milano pricing.

## Workspace / git
Branch feat/p4b-ron-statutory-evidence-completion, base main 69c5a085. Emergent auto-commits each turn. NOT yet saved to GitHub.

## DEPLOY ORDER WARNING
All new code reads/writes columns/tables/RPCs from the new migrations (P4b, P5, P7, P8, P16). Apply migrations
BEFORE deploying this code, or RON pages, payment confirmation (P8 policy gate fails closed) and email evidence break.

## Phase ledger
| Phase | Status | Migration | Key files | Tests/validators |
|---|---|---|---|---|
| P4/P4b RON statutory evidence | IMPLEMENTATION COMPLETE | 20261108090000_p4b_ron_statutory_evidence.sql | lib/ron/evidence.ts, evidenceServer.ts, executedCapture.ts; api/dashboard/ron/sessions/[id]/evidence(+/verify); components/ron/RONStatutoryEvidencePanel.tsx; webhook/guards/portal fixes | tests/p4bRonStatutoryEvidence.test.ts, tests/p4RonEvidenceIntegrity.test.ts |
| P5 RON retention/incidents/records | IMPLEMENTATION COMPLETE (incident UI uses existing dashboard incidents API; new RON incident fields are API-level, no dedicated form yet) | 20261108100000_p5_ron_retention_incidents_records.sql | lib/ron/governance.ts; api/dashboard/retention; api/dashboard/ron/records-requests(+[id]); api/dashboard/incidents (extended + audit log); components/ron/RONGovernancePanel.tsx | tests/p5RonRetentionIncidentsRecords.test.ts |
| P6 provider fee separation | IMPLEMENTED IN MAIN — hosted financial-surface certification pending | none | scripts/validate-provider-fee-separation.mjs; canonical pricing no longer charges external provider fee | tests/providerFeeSeparation.test.ts; tests/p6p7p8Governance.test.ts |
| P7 retention matrix | IMPLEMENTATION COMPLETE (durations other than RON = review_required by design) | 20261108110000_p7_retention_matrix.sql | — | tests/p6p7p8Governance.test.ts |
| P8 policy registry/acceptance | IMPLEMENTATION COMPLETE (server gate on Wise payment submission; no client acceptance UI yet; no policy content published — owner must publish texts) | 20261108120000_p8_policy_registry_acceptance.sql | lib/policy/acceptance.ts; api/policy/active; api/portal/me/policy-acceptance; api/dashboard/policies; payment-observation gate | tests/p6p7p8Governance.test.ts |
| P16 notification truth | PARTIAL — evidence model, idempotent claim, signed Resend webhook done; canonical event-coverage audit + portal/operator failure surfacing not done | 20261108130000_p16_notification_truth.sql | lib/notifications/deliveryTruth.ts; transactionalEmailAlerts.ts; api/webhooks/resend | tests/p16NotificationTruth.test.ts |
| Repo quality (lint) | FIXED — eslint now parses TS/TSX with 26 error-level correctness rules; found+fixed conditional-hooks bug in FounderDiscountOverridePanel | — | eslint.config.js; package.json devDeps typescript-eslint, eslint-plugin-react-hooks, @next/eslint-plugin-next | tests/repoQualityLint.test.ts |
| Pre-existing validator | FIXED at root cause | — | scripts/validate-postpayment-ron-matter-progression.mjs retargeted from superseded 079 gate to canonical 089 verified-settlement gate; legacy apostille route asserted disabled | — |
| P11 authorization (RON slice) | PARTIAL — column-level read isolation on ron_sessions/ron_signers/ron_documents (raw_session, encrypted signing URLs, contact data, evidence refs now service-role only); full role matrix/RPC/storage audit not done | 20261108140000_p11_ron_column_isolation.sql | — | tests/p11RonColumnIsolation.test.ts |
| P9–P10, P12–P15, P17–P23 | PARTIAL / NOT FULLY CERTIFIED — consult docs/P4B_P23_REPOSITORY_STATUS.md and current source per phase; earlier NOT STARTED label is stale | | | |

## P6 current correction and certification boundary
The previous owner-decision blocker is historical. Current `main` contains the provider-fee-separation repair and a validator that rejects provider-fee evidence in Milano financial truth, the retired `ron_cost` field, and signature-count-based financial charges. The deprecated `lib/config/pricing.ts` was deleted. Maintain BlueNotary's external notarial fee outside Milano quotes, invoices, Wise expected amounts, and revenue. Local source/test coverage is not proof of hosted financial certification. Do not reinstate the retired pricing blocker.

## Known follow-ups found during build
- ron_sessions client RLS (062) exposed raw_session/signing_url_encrypted to clients — FIXED by P11 column isolation migration.
- courier labels route accepts operator `skip_release_gate` (P14).
- legacy public.terms_acceptances bound to non-canonical public.matters (P12 drift).
- Migrations syntax-checked with libpg_query only; @electric-sql/pglite is in devDeps and could execute them (P12 tooling).

## Next session starts at
Verify P6 regression and reconcile P8 client-policy acceptance/publication → P9 Document Integrity/Custody → P10 → P11 → P12 → P13 → P14 → P15 → finish P16 → P17 → P18 → implement P19–P23 harnesses and controlled certification.

## 2026-11-08 ledger reconciliation
This ledger originally tracked a feature branch and contains historical workspace assertions. It is **not** an authoritative real-time deployment certificate. P6 merged repair exists; P7 implementation exists; P8 registry/server gate exists but publication/client acceptance must be verified; P16 delivery-truth backend exists but event coverage and operator/client error visibility remain open. P9–P15 and P17–P23 require independent phase-by-phase completion and certification. GitHub code, passing CI, hosted migration and verified live provider transactions are separate gates. Do not mark any remaining phase complete based on this documentation change.
