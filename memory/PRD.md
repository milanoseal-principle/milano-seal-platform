# The Milano Seal — P4–P23 Implementation Program (PRD / phase ledger)

## 2026-11-08 continuation checkpoint — reviewable code, NOT production-certified

- Canonical main at latest reviewed reconciliation: `ab170d552277ab21d1ef8e9fc0b548a850a2bd50` after merged #441/#442. Always re-fetch before further commits.
- #442 merged the immediate P6/merge-gate repairs. Remaining P4B/QA source hardening is under DRAFT PR #443 on `codex/p4b-witness-qa-and-security-hardening-20261108`; it must not be treated as deployed or production-migrated.
- P4B witness fix: forward SQL `20261108163000_p4b_witness_qa_completion.sql`, a server-only atomic completion RPC with real Matter witness count, matching provider-completed session, recorded witness references, idempotent row lock and append-only Matter evidence. Existing QA UI/API now expose governed completion without manufactured success.
- P11 dependent QA security fix: forward SQL `20261108163500_p11_execution_qa_client_write_lockdown.sql` revokes legacy blanket authenticated write privileges. Apply only after prior migrations and **before** deploying routes that assume server-only QA writes.
- RON corrected executed document retrieval now requires actual provider lifecycle or recorded completion evidence; legacy review-required correction needs a recorded reopen. `SESSION_PROCESSING` alone is insufficient.
- New tests: `tests/p4bWitnessCompletion.test.ts`, `tests/p4bRonRetrievalGuard.test.ts`, `tests/p11QaWriteIsolation.test.ts`, `tests/p6ProviderFeeRegression.test.ts`, plus P6 governance test updates. Source exists, but do NOT label tests passed without execution.
- Hosted checks on #442/#443 returned FAIL with no executable job steps and their log blobs were unavailable from GitHub when inspected. That is not evidence of a product-code pass or a proven billing cause. The complete final typecheck/lint/unit/build/migration/validator gate is still **NOT VERIFIED**.
- No production migrations, deployments, Wise/BlueNotary transactions, government/courier actions, destructive recovery, or production certification performed in this continuation.
- The wider P5–P23 repository-completion program remains open until every required module, end-to-end validator and final-source gate is verified. Do not reuse an old phase-complete label as current certification.


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
| P6 provider fee separation | BLOCKED — OWNER PRICING DECISION | none | scripts/validate-provider-fee-separation.mjs (exits 1 until resolved) | tests/p6p7p8Governance.test.ts (P6 section) |
| P7 retention matrix | IMPLEMENTATION COMPLETE (durations other than RON = review_required by design) | 20261108110000_p7_retention_matrix.sql | — | tests/p6p7p8Governance.test.ts |
| P8 policy registry/acceptance | IMPLEMENTATION COMPLETE (server gate on Wise payment submission; no client acceptance UI yet; no policy content published — owner must publish texts) | 20261108120000_p8_policy_registry_acceptance.sql | lib/policy/acceptance.ts; api/policy/active; api/portal/me/policy-acceptance; api/dashboard/policies; payment-observation gate | tests/p6p7p8Governance.test.ts |
| P16 notification truth | PARTIAL — evidence model, idempotent claim, signed Resend webhook done; canonical event-coverage audit + portal/operator failure surfacing not done | 20261108130000_p16_notification_truth.sql | lib/notifications/deliveryTruth.ts; transactionalEmailAlerts.ts; api/webhooks/resend | tests/p16NotificationTruth.test.ts |
| Repo quality (lint) | FIXED — eslint now parses TS/TSX with 26 error-level correctness rules; found+fixed conditional-hooks bug in FounderDiscountOverridePanel | — | eslint.config.js; package.json devDeps typescript-eslint, eslint-plugin-react-hooks, @next/eslint-plugin-next | tests/repoQualityLint.test.ts |
| Pre-existing validator | FIXED at root cause | — | scripts/validate-postpayment-ron-matter-progression.mjs retargeted from superseded 079 gate to canonical 089 verified-settlement gate; legacy apostille route asserted disabled | — |
| P11 authorization (RON slice) | PARTIAL — column-level read isolation on ron_sessions/ron_signers/ron_documents (raw_session, encrypted signing URLs, contact data, evidence refs now service-role only); full role matrix/RPC/storage audit not done | 20261108140000_p11_ron_column_isolation.sql | — | tests/p11RonColumnIsolation.test.ts |
| P9–P10, P12–P15, P17–P23 | NOT STARTED | | | |

## P6 owner decision needed
lib/pricing.ts adds `notarized_signatures` = $25 × notarized signature count into the Milano total (internal_only line) and
exposes it as internal `ron_cost`. Owner must decide: (a) it is a Milano-controlled service charge → rename/classify (e.g.
"notarized signature handling"), drop the `ron_cost` alias; or (b) it is the BlueNotary fee folded into Milano's quote → remove
from total. Also deprecated lib/config/pricing.ts (STATUTORY_FEES.ronPerSignature 25 "included in rates") used only by unused
components/conversion/PricingLanes.tsx.

## Known follow-ups found during build
- ron_sessions client RLS (062) exposed raw_session/signing_url_encrypted to clients — FIXED by P11 column isolation migration.
- courier labels route accepts operator `skip_release_gate` (P14).
- legacy public.terms_acceptances bound to non-canonical public.matters (P12 drift).
- Migrations syntax-checked with libpg_query only; @electric-sql/pglite is in devDeps and could execute them (P12 tooling).

## Next session starts at
P6 owner decision → P9 Document Integrity/Custody → P10 → P11 → P12 → P13 → P14 → P15 → finish P16 → P17 → P18 → P19–P23 readiness.
