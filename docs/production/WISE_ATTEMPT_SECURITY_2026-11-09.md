# Wise attempt authority correction

Base: `0d70e0c7abbd41c787cf8ee99c5fbfb305137c17`. Branch: `codex/milano-wise-attempt-security`.

The cancelled-resource defect existed in reconciliation, the observation POST, the execution evaluator, the SQL gate and a separate BlueNotary signer-link guard. A reference and funding-method string could survive cancellation, then satisfy execution after a new client observation. No provider amount, currency, attempt or event freshness was required for that execution branch.

The correction reuses `deals`, the governed Wise handoff, the existing Matter evidence ledger, the scheduling/execution evaluators, the settlement RPC and the existing test/migration harness. A single-use handoff UUID identifies the payment attempt. The service-only submission RPC locks the Matter, verifies owner/current policy/snapshot, invalidates prior resource authority, records the observation and appends evidence atomically. New submissions clear provider projections. Existing valid legacy submission scheduling remains available; missing legacy attempt evidence cannot authorize execution.

Provider observations bind the exact attempt, Matter, resource, amount, currency, reference and provider timestamp. Resource claims serialize across Matters. Terminal invalidation is sticky and audited, including failures/refunds from existing writers. Old resources and old handoffs cannot bind to a fresh attempt. Positive out-of-order events cannot restore authority. Unknown/attention states grant no execution authority. Activity completion cannot establish settlement. Statement credit and incoming webhook settlement remain separate from processing evidence, and final release retains existing full-balance/document/custody/authorization checks. Bound settlement confirmation and provider replay are idempotent. No duplicate Matter/payment ledger was created.

The observation route also selected a nonexistent `wise_payment_url` column. It now aliases the existing canonical `payment_link` column. This avoids adding a parallel link field. The client payment response uses the strict settlement evaluator; bare paid flags no longer produce settlement success alerts.

## Migration and release

New forward-only migration: `supabase/migrations/20261109060000_wise_attempt_authority.sql`. Three nullable projection columns, a partial evidence-resource lookup index, service-only attempt/evidence functions, invalidation trigger and replacements of the existing payment gate/settlement RPC. No customer row backfill or historical migration edits. Local PostgreSQL replay tests execute the real SQL.

The Supabase CLI generator was attempted but could not run in this environment (current binary requires a write under its read-only home; the older CLI installation failed). The forward file was prepared manually. Supabase changelog/documentation fetching was denied by the environment network policy. No new Supabase client API or dependency was introduced.

Before release, use the extended read-only `supabase/verification/final_gap_provenance.sql` against the approved target; compare actual migration ledger, function hashes, grants, trigger/index bindings and projection columns. Hosted migration status is NOT VERIFIED. Apply only genuinely pending migrations after founder authorization, before deploying this schema-dependent application. Preview must use an isolated approved database. Do not opt into a paid preview without isolation.

Rollback: pause affected execution/signer-link actions, retain additive columns and immutable evidence, and use a reviewed forward correction or compatible application version. The vulnerable pre-correction execution guard is not an acceptable security rollback. Do not drop history, reset payment fields, replay cancelled resources or perform destructive restore.

## Verification scope

`tests/wise-attempt-authority.test.ts` exercises current/missing/stale/mismatched evidence and invalid terminal states. `scripts/test-wise-attempt-sql.mjs` runs the complete migration chain and actual submission/provider/settlement/transition functions on synthetic local records, including nine terminal states, resubmission, fresh resources, wrong owner/attempt/Matter/amount/currency/time, browser RPC denial, immutable history, and settlement-dependent progression. It is part of the existing merge gate. The existing gap-closure suite retains full-balance, approved-document and final-release positives/negatives.

Results are recorded only after execution in the PR and final handoff. These tests do not establish hosted authentication, production deployment, live Wise settlement or provider certification. No real transfer, RON session, filing, courier purchase, commercial redemption, client message, deployment, migration or agent activation is authorized or performed by this correction.

## Executed local evidence

Exact tested source `a464e50a72f6` (full SHA in the evidence JSON): all 14 `check:local` stages PASS. The canonical merge gate includes 1,277/1,277 unit tests, 194 Wise attempt SQL checks, the existing 79 financial/custody/release checks, migration replay and physical upgrade/restore. Production build, dependency audit, governance/P3/map/public rendered suites all passed. Sanitized command/exit evidence and log hashes: [local validation](evidence/ATTEMPT_AUTHORITY_LOCAL_2026-11-09.json). This subsequent evidence-only commit changes no tested application or migration bytes. Hosted CI, deployment, migrations and real-provider certification remain separate and NOT VERIFIED.

## Previously released signing access

A further consumer still relied on the RON session's cached UNLOCKED scheduling flag. Both the API and server-rendered portal now evaluate the current Matter's execution authority on every signing-link projection. The shared session predicate denies failed, cancelled, expired, unknown and provider-completed sessions. SQL guards signer-link releases and atomically revokes prior released flags when current payment/session authority becomes invalid; revocations append immutable Matter evidence. Scheduling flags remain distinct from execution authority. A URL already copied outside Milano may additionally require provider-side cancellation; no external revocation or live session action was performed.
