# P0: verified Wise settlement before scheduling

The owner confirmed on 2026-10-25 that submission/observation never authorizes scheduling. This supersedes the earlier observed-submission scheduling contract. Gates 37–45 remain PENDING until real evidence exists.

## Resulting behavior

The shared scheduling gate requires all of: canonical paid status, `payment_confirmed = true`, settlement `cleared`, and finite positive amount due exactly matched in minor currency units. Observation, provider processing, a paid flag alone and complimentary authorization cannot substitute. Remaining operational/execution requirements still apply. RON consumers inherit this gate; authentication, Wise reconciliation, pricing and final release controls remain separate.

The controlling lifecycle includes `payment_confirmed` and `dormant`. Scheduling transitions from `payment_confirmed`, never directly from `awaiting_payment`. Dormant does not gain an automatic scheduling/reactivation path. The scheduling API retains its optimistic state comparison, so concurrent or repeated requests cannot both transition the same confirmed Matter.

Migration `089_verified_settlement_scheduling_gate.sql` replaces the permissive database guard without editing historical migrations. It checks both lifecycle columns, blocks protected progression without verified settlement, and projects awaiting-payment rows to payment-confirmed when the existing canonical confirmation RPC records settlement under its row lock. Repeated confirmation cannot regress a progressed Matter. Refund/failure recording remains possible; subsequent progression fails closed. The migration also projects existing already-verified awaiting-payment rows without changing their payment amounts or authority.

## Deployment prerequisites

Deploy the reviewed migration and application as one coordinated release. Review affected existing awaiting-payment rows privately before applying the migration. Never mark an observed payment settled to unblock migration or scheduling. Existing zero-value complimentary Matters remain locked under the owner's strict no-settlement/no-scheduling contract; do not fabricate a transfer or paid state to advance them.

The repository's Vercel preview policy requires `[validate-preview]` on the exact commit to build. A local green gate does not prove preview or production READY. Require preview READY and exact-commit metadata before merge, then verify production aliases/SHA/READY and actual health. Do not merge or self-certify while those observations are unavailable.

## Validation and remaining acceptance

Behavioral regression coverage checks pending observations, legacy null snapshots, incomplete flags, failed/refunded/missing settlement, amount mismatch, nonfinite amounts, zero-value courtesy, operational blocks and the canonical lifecycle path. The database guard was exercised in an isolated PostgreSQL WASM instance, including migration repeatability, both lifecycle columns, settlement-triggered lifecycle projection, replay non-regression, financial revocation and protected transitions. This does not establish production schema compatibility or real Wise settlement.

The historical validator entry point `validate-immediate-scheduling-after-wise-submission.mjs` remains wired for compatibility, but now enforces the stricter policy and executes the behavioral scheduling/lifecycle tests. No validator or assertion is disabled. Portal/RON copy, notification copy and the controlled TIFF runbook now require settlement before scheduling.

Live Gate 38 settlement, Gate 39 replay, role sessions, recipient receipt, physical hardware and receiving-authority evidence remain required. No source test, migration test or preview may replace them. The controlled Matter remains `MS-2026-4887`; do not create a duplicate or manually alter its financial truth.
