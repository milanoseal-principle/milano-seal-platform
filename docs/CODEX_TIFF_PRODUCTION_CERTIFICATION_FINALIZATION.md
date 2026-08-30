# CODEX — TIFFANY PRODUCTION CERTIFICATION FINALIZATION

## BRANCH

`codex/tiff-production-certification-finalization`

Base production SHA when branch was created:

`c31cb3e41d88429ee19e1dc8eaeb4b31407a5a25`

Do not work from PR #282. It is superseded and closed. Current canonical production code came through merged PR #283.

## ROLE

Act as senior production engineer, Supabase operator, Next.js/Vercel release engineer, QA architect, and Milano Seal systems custodian.

Your job is to finish the production-certification and operator-testing increment without creating a second architecture, without changing canonical Matter truth, and without breaking Tiffany's ability to keep testing the live system.

## LOCKED ARCHITECTURE

Preserve all current canonical modules and contracts:

- one canonical Matter record in `deals`
- current Matter state machine
- Wise-only payment architecture
- verified-settlement gating before scheduling/execution authority
- observed/processing payment truth must never become `payment_confirmed`
- no second payment authority
- no second discount authority
- no duplicate scheduling transition
- no duplicate RON provider architecture
- current BlueNotary RON module remains canonical
- current portal, operator dashboard, authority verification, review-request, SEO/Search Console, courier, apostille and release modules remain canonical
- Alliance remains frozen unless an existing current-main dependency requires a compatibility fix
- no Stripe code, references, fallbacks, abstractions, tests, docs or dormant integrations
- no legal-advice positioning

## PRODUCTION STATE ALREADY COMPLETED

Treat these as completed production truth unless live inspection proves otherwise:

1. PR #283 merged to `main`.
2. Production SHA deployed: `c31cb3e41d88429ee19e1dc8eaeb4b31407a5a25`.
3. Production Vercel deployment reached READY.
4. Preview merge gate passed before merge.
5. 633 tests passed / 0 failed in the validated preview.
6. Supabase production migrations for production certification, SEO editorial reviews, and signature-aware security hardening were applied.
7. Production certification tables now exist.
8. SEO editorial review persistence now exists.
9. Sensitive identity helper grants were additionally reconciled because PostgreSQL PUBLIC EXECUTE inheritance kept anonymous execution active after migration 070.
10. Production database now verifies:
   - anon cannot execute `public.is_admin()`
   - anon cannot execute `public.is_operator()`
   - authenticated can still execute `public.is_admin()`
   - authenticated can still execute `public.is_operator()`
11. Migration `071_revoke_sensitive_identity_helpers_from_public.sql` records that production truth in source control.

## FIRST ACTION — SYNC AND AUDIT

1. Fetch current remote `main`.
2. Confirm this branch is based on the current production main or rebase cleanly if main advanced.
3. Inspect all commits after `c31cb3e41d88429ee19e1dc8eaeb4b31407a5a25` before changing anything.
4. Search for duplicate implementations before adding any new file or module.
5. Audit open PRs and do not reproduce work already present in another active branch.
6. Confirm migration 071 is the only required source-control reconciliation for the live PUBLIC EXECUTE fix.

## REQUIRED AUDIT SCOPE

Audit these production paths and their backing APIs/read models as one connected system:

### Public / client

- `/`
- `/intake`
- `/professional`
- `/professional/damiani`
- `/portal`
- `/portal/payment`
- `/portal/documents`
- `/portal/invoice`
- `/portal/release`
- `/portal/tracking`

### Operator

- `/dashboard`
- `/dashboard/ron`
- `/dashboard/apostille`
- `/dashboard/courier`
- `/dashboard/ledger`
- `/dashboard/review-requests`
- `/dashboard/seo`
- `/dashboard/seo/editorial`
- `/dashboard/authorities/verify`
- `/dashboard/certification`
- `/workspace/release`

### Critical APIs / services

- intake persistence
- quote/discount calculation
- Wise transaction submission and reconciliation
- payment/scheduling guard
- BlueNotary session creation/opening
- document upload/storage
- apostille workflow
- courier/release workflow
- review request creation/transitions
- Search Console health/sync
- SEO editorial transitions
- production certification run/evidence APIs
- notification delivery/reconciliation

## TIFFANY TESTING CONTRACT

Tiffany must be able to continue live testing without false-success states, accidental duplicate charges, or production-data corruption.

For every client-facing or operator-facing action:

- show real persisted truth only
- fail closed on missing external confirmation
- no fake metrics
- no synthetic payment confirmation
- no automatic PASS certification
- no automatic GO decision
- no automatic execution authorization
- no duplicate Matter creation from retries
- no duplicate payment reconciliation
- no duplicate discount redemption
- no duplicate scheduling transition
- no duplicate BlueNotary session caused by replay
- no destructive reset of Tiffany's existing test Matter history

If a live external provider is unavailable, the UI must state the real failure/unconfigured/pending condition and preserve current Matter state.

## PRODUCTION CERTIFICATION ENGINE — FINISH REQUIREMENTS

Verify and harden the existing certification engine. Do not replace it.

Required behavior:

1. Every registered check starts `PENDING`.
2. PASS/FAIL requires human evidence reference and authoritative source.
3. A code observation cannot self-certify PASS.
4. Matter continuity checks must use one canonical Matter identifier where marked required.
5. Any continuity break must make GO ineligible.
6. Any FAIL must produce NO_GO.
7. Any missing check must produce NOT_ELIGIBLE.
8. GO requires every registered required check to PASS.
9. Evidence rows must remain non-deletable.
10. Certification must be bound to an exact deployed production SHA.
11. The dashboard must display the exact production SHA, run state, evidence state, final eligibility, and observed values without exposing secrets.
12. Final human GO/NO_GO must not mutate canonical Matter state.

If the current implementation lacks an explicit governed final-decision write path, add one only inside the certification subsystem. It must not alter Matter, Wise, RON, apostille, courier or portal state.

## TIFFANY 15-STEP LIVE TEST

Preserve this exact end-to-end acceptance sequence and make the certification UI capable of recording evidence for it:

1. Open production fresh/incognito on mobile.
2. Navigate normally to Secure Records Intake.
3. Submit one realistic international test Matter.
4. Upload approved test documents.
5. Confirm one Matter persisted and capture the Matter ID.
6. Confirm quote/pricing matches the Matter.
7. Apply `TIFFTEST50` and verify exactly 50% of eligible subtotal is discounted.
8. Complete the Wise payment path.
9. Confirm Wise reconciliation updates the same Matter exactly once.
10. Verify scheduling is blocked before verified payment and unlocked only after canonical settlement authority is satisfied.
11. Enter the Matter Control Portal through the client path.
12. Confirm expected emails/notifications actually arrive.
13. Confirm portal documents, invoice/payment state, timeline and Matter status match Supabase.
14. Run governed operator workflow through execution → apostille → courier/release → delivery → close.
15. Repeat critical client actions on mobile and flag clipping, dead links/buttons, unclear next steps, duplicate actions, or false-success states.

## DAMIANI DRY-RUN CONTRACT

Preserve the dedicated Damiani path and fail closed before payment during dry run.

Required checks:

- `/professional/damiani` opens
- Italian default remains correct
- `DAMIANI50` is carried only where governed
- eligible subtotal discount is correct
- courier remains undiscounted
- final amount is correct
- Wise amount/reference are correct
- STOP BEFORE PAYMENT means no payment confirmation
- no discount redemption row before actual qualifying transaction
- no scheduled state
- no execution authority

Do not charge, schedule, or execute a Damiani dry run.

## SUPABASE PRODUCTION REQUIREMENTS

Verify production migrations are present and schema matches code.

Required migration truth:

- review-request events
- Search Console sync runs
- production certification runs/evidence
- SEO editorial reviews
- security hardening
- sensitive identity helper PUBLIC/anon revoke reconciliation

Verify after migration 071:

- `has_function_privilege('anon','public.is_admin()','EXECUTE') = false`
- `has_function_privilege('anon','public.is_operator()','EXECUTE') = false`
- authenticated equivalents remain true

Run Supabase Security Advisor after DDL changes. Fix only issues directly caused by this increment or high-confidence production vulnerabilities that can be corrected without breaking canonical auth/RLS behavior.

Do not guess function signatures. Discover runtime signatures through `pg_proc` before ALTER/REVOKE operations.

## SEARCH CONSOLE / SEO

Preserve current canonical Search Console schema and integrations.

Important production schema truth:

- Search Console observations use `observed_date`
- do not reintroduce `end_date` reads against that table
- no fabricated Search Console metrics
- unconfigured integration must surface unconfigured state
- editorial/indexability remains fail closed
- evidence freshness/review status must never mutate Matter state
- Search Console performance may inform editorial review but cannot independently authorize indexability when evidence governance blocks it

## BLUE NOTARY / RON

Do not create a second BlueNotary adapter, provider table, session engine, or scheduling authority.

Preserve the existing RON production reconciliation architecture.

Verify:

- payment guard remains canonical
- Wise processing is not verified settlement
- signer/document package comes from the same Matter
- missing signer location/notarial act/jurisdiction fails closed
- replay does not create duplicate sessions
- dashboard shows pre-session readiness accurately

## REVIEW REQUESTS

Preserve current canonical implementation.

Verify:

- client ownership before Matter linkage
- abuse protection
- append-only event ledger
- optimistic transition control
- no fabricated operator participation
- request creation does not equal Matter completion

## USER EXPERIENCE FOR TIFFANY

Do not redesign the site in this increment.

Only fix production-blocking UX defects discovered during testing:

- dead buttons
- clipping/overflow
- hidden critical state
- false-success copy
- unclear payment state
- inaccessible action
- broken mobile interaction
- missing evidence fields
- duplicate action path

Maintain the current premium visual system and mobile safe-area behavior.

## REQUIRED CODE QUALITY GATES

Before opening or updating the PR, run the repository's current canonical gate from the branch, not a hand-picked subset.

At minimum verify:

- typecheck
- lint
- full tests
- Next.js production build
- migration-chain validation
- route-registry validation
- Wise-only validation
- Milano OS isolation/unification validation
- Matter/payment production governance validators
- TIFF 15-step certification validator
- Damiani production wiring validator
- review/Search Console hardening validator
- production certification validator
- any new validator introduced by this branch

If current `scripts/run-vercel-merge-gate.mjs` is authoritative, run it unchanged first. Add to it only if this branch introduces a new production-critical invariant.

Do not weaken, skip, delete, comment out, or bypass a failing gate to obtain green status.

## NEW REQUIRED REGRESSION TEST FOR MIGRATION 071

Add a source-level validator/test that fails if migration 071 stops enforcing all four facts:

- revoke `is_admin()` from PUBLIC
- revoke `is_operator()` from PUBLIC
- preserve authenticated execution on `is_admin()`
- preserve authenticated execution on `is_operator()`

The validator must also reject any new grant that restores anonymous execution through PUBLIC.

Wire this validator into the existing merge gate.

## PR RULES

Use one focused PR from this branch.

PR title:

`Finalize Tiffany production certification and live-test hardening`

PR body must include:

- exact base SHA
- exact head SHA
- Supabase migrations applied/verified
- Vercel preview result
- test counts
- build result
- security advisor result
- Tiffany test surfaces verified
- unresolved live external dependencies, if any
- explicit statement that no canonical Matter/Wise/payment/RON architecture was duplicated or replaced

Do not merge until all Vercel status checks are green.

## STOP CONDITIONS

Stop and report instead of guessing if any of these occur:

- production main advances with conflicting canonical changes
- a required provider credential is unavailable
- a migration would destroy or rewrite production Matter history
- a proposed fix requires weakening payment gating
- a proposed fix would charge Tiffany again
- a proposed fix would auto-certify production GO
- a proposed fix would create a second source of truth

## COMPLETION DEFINITION

This increment is complete only when:

1. branch is rebased/current with main
2. migration 071 is source-controlled and validated
3. production DB still matches the verified security state
4. certification/review/SEO/Search Console/RON/payment/client/operator paths are audited for integration drift
5. Tiffany can continue the 15-step live test safely
6. all repository gates pass
7. Next.js production build passes
8. Vercel preview is READY
9. PR is mergeable with no conflicts
10. no false-success, duplicate authority, or payment/state-machine regression remains

Do not claim live transaction completion unless it was actually performed and evidenced.
