# THE MILANO SEAL™ — P6–P23 COMPLETE PRODUCTION EXECUTION MASTER
## Single authoritative execution instruction — 2026-11-08

**Company:** Milano Seal International LLC dba The Milano Seal™  
**Production website:** https://www.themilanoseal.com  
**Canonical repository:** https://github.com/milanoseal-principle/milano-seal-platform  
**Historical base:** `3f9b58a2058a3fa81792d28be7be525c68b2f323`  
**Latest verified starting main:** `cf288a4fa4579e321ec9863cacb9e2e0c91eaa7e` (merged PR #447).  
**Target:** complete source implementation and gated certification for remaining P6–P23 deltas, without breaking existing Milano operational controls.  
**Status:** execution directive injected; phase completion is NOT asserted.

# EXECUTE THIS, DO NOT SIMPLY RESTATE IT

You are the accountable principal backend engineer, CTO, security architect, QA engineer, deployment engineer and release lead for The Milano Seal. Work inside the actual repository. First sync to the latest `main` and establish a branch from that exact SHA; do not reset newer work to the historical base. Read the ENTIRE preserved P6–P23 directive below. Inspect current source, tests, migrations, branches/PRs and CI before changing anything. Reconcile completed portions with current code; make only implementation deltas. Continue through every phase in order rather than stopping for a new prompt or writing an abstract plan.

This preface supersedes any conflicting **historical** instruction in the preserved phase directive below. In particular, its old P6 instruction to add a Milano-charged `RON_NOTARIAL_ACT_FEE`, charge $25 per act or cap the provider fee through Milano pricing is **NOT CURRENT** and must NOT be implemented. The canonical P6 correction is BlueNotary sets/collects its own notarial-act fees externally; these do not enter Milano quote, invoice, Wise expected amount, accounting revenue or discounts. The external provider-fee category is optional nonfinancial evidence only, contains no customer-charged amount and does not block RON completion. The old owner-decision blocker was retired. Do not recreate `ron_cost`, `notarized_signatures` charge or `lib/config/pricing.ts`. Maintain and run `scripts/validate-provider-fee-separation.mjs` plus existing regression tests.

# VERIFIED REPOSITORY BASELINE — DO NOT REBUILD

P4/P4b evidence ledger and P5 statutory evidence, incidents, retention and record-request primitives exist. Current P5 incident replay fixes use canonical incident fields and retain audit authority. P6 provider-fee correction, tests and validator exist. P7 retention matrix exists with non-RON retention durations deliberately `review_required` until approved. P8 immutable policy version registry, server-side Wise submission acceptance gate, exact-version client UI (`components/portal/PolicyAcceptanceGate.tsx`), policy content fetch and hashing, and operator APIs exist; actual published policy texts and hosted acceptance are NOT established by these facts. P11 RON column isolation exists but complete system authorization review remains. P16 notification evidence model, idempotent send claim and signed Resend webhook exist, but event coverage and failed-delivery visibility remain partial. P9–P15 and P17–P23 are not fully certified; some slices may already be implemented. Read `memory/PRD.md`, `docs/P4B_P23_REPOSITORY_STATUS.md`, current migrations, production directive and file-level code. The ledger is historical when in conflict with current actual code; report disagreements and fix only stale claims.

# IMMUTABLE MILANO ARCHITECTURE

- Canonical client Matter is `public.deals`; there is no second Matter or revenue truth.
- Existing state machine, event taxonomy, private quote, invoicing and Matter/portal/operator contracts control. Do not invent second states, actions, tables or providers where the canon already exists.
- Wise Business only. No Stripe, Stripe fallback, dormant Stripe compatibility, or fake Wise confirmation. Verified Wise settlement + canonical execution authorization gate precedes scheduling and governed release.
- Client execution preference is NOT confirmed execution method. Review-required intake must persist; it must not automatically authorize paid execution.
- One source of payment truth; amount, currency, account and provider transaction identity reconcile to the SAME Matter once, and retries are idempotent.
- BlueNotary direct fee collection stays external to Milano controlled financial truth.
- RON provider session completion is not Milano statutory/evidence verification. Evidence requirements must be context-specific, and source/executed bytes must be content-hashed and immutable.
- Apostille and receiving-institution requirements may not be hallucinated; original issuing state/authority, destination, document type and applicable Hague/legalization route govern. Escalate uncertainty instead of giving legal advice.
- No unverified release, courier dispatch, delivery, RON, Wise reconciliation, notification or foreign acceptance claim.
- Preserve the current Global Document Intelligence country selection, Atlas Corridor, destination state, accessible directory, client portal, operator interfaces and premium visual language.
- Isolate privileged identity data, statutory RON records, counsel correspondence, financial truth and security incident evidence by server authorization and RLS; do not trust client-supplied role, amount, acceptance, policy hash or confirmation.
- No fake seeded live customer Matter, no fabricated government responses, fake delivery evidence or fake acceptance.
- Additive, forward-only database changes with tested migration provenance; avoid destructive refactors or production schema improvisation.
- No AI legal advice or false law-firm representation; route counsel/legal interpretation to qualified humans.

# REQUIRED CODE DEVELOPMENT METHOD

1. Fetch and record main SHA, deployed Vercel SHA, hosted migration provenance, PR status and available CI results as separate evidence.
2. Build a file-specific implementation ledger for P6–P23 containing existing anchors, current tests, missing controls, required migrations, endpoints/UI/webhooks, external gate dependencies, and acceptance tests.
3. Fix root causes in canonical modules. Never just edit PRD, create a dummy validator, suppress tests, or mark a phase green through documentation.
4. For each P6–P23 phase execute: inspect → implement minimal delta → compile → unit/integration/security negatives → migration replay → affected rendered/mobile QA → release evidence → update phase ledger.
5. Continue automatically to the next remaining phase in the same assignment. A blocker on a real provider/live government interaction does NOT excuse failure to implement its dry-run certification harness.
6. Preserve historical event logs. All webhook handlers are signature-verified, replay-safe, idempotent, and tenant/Matter-bound.
7. Ensure all error paths have stable safe codes, clear client/operator next actions, correlation IDs and private audit evidence without logging secrets.
8. Concurrency: use atomic RPCs/transactions or equivalent locked updates for payment, custody, notification and transition truth. Test duplicate, delayed, reordered and conflicting events.
9. Read access is scoped, bounded and paginated. Do not rely on PostgREST 1000-row defaults or assume all pages are returned. Filter server-side before any aggregation.
10. CI must run the repo’s actual scripts, not just grep/static existence checks. Run typecheck, lint, full test suite, build, all required repository validators, migration clean replay and affected E2E/mobile checks. Distinguish blocked GitHub Actions billing/runner startup from code failures. If external CI cannot run, capture verified local execution where available and leave hosted CI NOT CERTIFIED.
11. Use reviewable bounded commits and a PR. Do not merge, force-push, push directly to main, apply hosted migrations, dispatch live providers, initiate real payments/government filings, or change production traffic without explicit release approval. Do NOT claim inability to implement source code due to missing live provider credentials.
12. At the end produce a traceable P6–P23 completion matrix with per-phase file paths, tests, database evidence, browser evidence, PR SHA, remaining provider/live gate and EXACT verdict. Never call the entire sequence complete unless each gate actually passed.

# PHASE-SPECIFIC DELTA / ACCEPTANCE REQUIREMENTS

## P6 — Fee separation
Keep merged correction; run canonical provider-fee validator, guard quote/invoice/Wise expected value/payment receipt and finance reporting against provider-fee injection. Test discount scope, independent signature count and financial replay. Do not revive $25 Milano notarial fee logic. Hosted financial-surface certification remains separate.

## P7 — Retention policy
Use existing matrix, holdings, RON 10-year rule where applicable and review-required unresolved classes. Verify every inventoried record class, cross-class retention authority, hold precedence, safe deletion request/candidate workflow, dual authorization where existing policy requires, immutable deletion evidence, recovery, and no destructive auto-cleanup. Never invent unapproved legal retention durations.

## P8 — Policy publication and exact-version acceptance
Preserve existing atomic policy-version transitions, private content object hashes and `PolicyAcceptanceGate`. Verify published bytes match SHA-256 at retrieval, are active/effective, and acceptance is tied to user + canonical Matter + exact version + relevant surface. Reject mismatch, supersession, foreign Matter, unauthenticated actor and stale content. Required published policy texts need actual owner/legal approval; provide the administrative publishing checklist and safe fail-closed operational state if not approved. Never silently activate invented policy language.

## P9 — Document custody/integrity
Verify source upload and executed-document byte hashes, unique canonical versions, append-only custody edges and actors, content-addressed immutability, idempotent capture, supersession instead of overwrite, per-Matter auth, mismatch incident freeze, custody to apostille/courier/release. Test byte-tampering, replay, cross-Matter links and rollback.

## P10 — Artifact financial/output truth
Canonical quote, invoice, receipt, pro forma, paid & released receipt, PDFs/exports and email snapshots need one immutable version-linked source of amounts and statuses. Govern supersession and discount history. Distinguish issued from paid and verified; do not claim paid & released before both gates. Prevent client tampering, double generation or post-issuance silent edits.

## P11 — Authorization/RLS
Inventory all API routes, RPCs, tables, storage policies, identity/record evidence and operator/partner/client roles. Prove least privilege per action and tenant/Matter, include negative cross-tenant/client tests, revoke unsafe grants, correct security-definer search paths, lock service role to server-only, remove trusted client-input authority. Include documented emergency operator actions and audit them. Existing RON-column migration is only one slice.

## P12 — Migration/provenance
Clean replay the entire ordered migration chain, not just syntax checks; compare local and hosted migration IDs/schema if authorized; examine old `public.matters` dependencies, legacy `terms_acceptances`, RON incident actor/closure columns, policy RPC, grants/indexes/function ownership and forward compatibility. No baseline wipe. Migration-before-code rollout plan and tested rollback/repair procedures.

## P13 — Performance/indexing
Audit unbounded list/aggregate reads, filter order, pagination, PostgREST max row limits, keyset/cursor correctness, SQL index evidence and authorized datasets. Correct fixed 1000-offset bug patterns, bounded full reads and existence/count checks. Test >1000 synthetic rows, smaller hosted cap, duplicate keys, concurrent inserts, stale cursor and timeout budgets. Document explain-plan evidence where accessible.

## P14 — Operator lifecycle
Complete actual dashboard workflows for review, correction, authorization, RON, custody, apostille, courier, release, incident, refund/cancellation, governance holds and final close. Remove or govern `skip_release_gate` on courier labels. Every mutation must be server-authorized, state-machine validated, idempotent and audited. Show correct blocker owners and recovery controls.

## P15 — Blocker/retry/recovery UX
Build actionable customer/operator outcomes for each canonical failure class: customer action, submit/wait Milano review, waiting Milano, retryable provider issue, payment pending/mismatch, policy acceptance required, custody verification, authority and courier exception. Safe retry, duplicate suppression, optimistic update reconciliation and no misleading success on HTTP failure. Rendered mobile and accessible QA.

## P16 — Notification truth
Expand existing delivery-truth primitives to all required Matter and financial/operational events: intake, review, quote, policy, payment, scheduling, RON, custody, apostille, courier, delivery, closure, security incident and records requests as appropriate. Signed provider callback, queue idempotency, correct recipient/tenant, retry/dead letter, suppression, delivery state, bounced/rejected and failed-notification surfaces in operator/client UI. Never equate queued with delivered.

## P17 — Acquisition and revenue provenance
Preserve source consent/attribution across lead→Matter→quote→settled Wise→recognized actual revenue. Govern referral sources, attorney/alliance relationships, repeat/reorder origins and campaigns. No fake sales conversion, no estimated pipeline counted as cash, avoid exposure of sensitive party relationships. Verify private exports and analytics against canonical facts.

## P18 — Mobile, accessibility, performance
Verify existing premium UI and map remain stable across touch/keyboard/screen-reader/reduced-motion and representative mobile widths; all public, portal and operator paths. Add automated axe/accessibility checks where supported, actual rendered captures, no clipping, dead CTAs, stale destination, hydration warnings or performance regressions. Report LCP/CLS/INP only if actually measured.

## P19 — Hosted E2E harness
Implement a non-production, secure, repeatable hosted end-to-end test path with synthetic, expressly approved Matter data, isolation and cleanup safeguards. Cover intake→qualification→review→quote→policy→Wise test observation→verified-authorization simulation→schedule→RON dry run→apostille/custody→courier dry run→portal→notices→close. Do not spoof production payment or government provider truth. Gather step-level evidence and exact deployment SHA.

## P20 — Wise live certification
Implement actual governed certification *harness*, reconciliation assertions and operator checklist; only execute real transfer with explicit owner approval and authentic provider credentials. Require exact sender/receiver/currency/gross/fees/net reference mapping, settlement vs pending, replay, partial/overpayment, cross-Matter, duplicate webhook and scheduling fail-closed. No real transfer on inference.

## P21 — RON live certification
Implement harness for authentic provider session and evidence verification without silently scheduling a real session. Require explicit owner-approved signers/credentials, provider callback verification, identity/recording/seal/journal/certificate evidence where required, source/executed byte hashes, RON privacy and hold/recovery tests. Mark real provider proof pending until run.

## P22 — Apostille/authentication live certification
Implement country/issuing-state/document-class route test harness and evidence packet checklists, officials/authority citation date, state/consular handoff and intake-rejection scenario tests. No governmental submission without explicit approval. Validate custody, shipment and return authority evidence with real tracking when actually dispatched; synthetic data marked simulated.

## P23 — Recovery, monitoring and final certificate
Implement production observability, critical alert ownership, backups/restore validation in isolated environment, security freeze, RON/provider outage, Wise mismatch, notification failure, courier exception, migration rollback/forward-repair, deployment rollback, incident runbooks and evidentiary audit chain. Exercise non-destructive disaster-recovery tests. Do not perform destructive hosted restore without approval. Produce final phase-by-phase certification verdict with exact checks, deployed SHA, environment and unresolved external gates.

# REQUIRED DEPLOYMENT/WIRING MATRIX

For EACH phase document the exact real code paths:
- Database tables/RPCs/triggers/indexes/migrations (if required);
- server APIs, authorization middleware and event producers/consumers;
- client portal and operator dashboard interface;
- Wise/BlueNotary/Resend/courier/official authority integration boundaries as applicable;
- idempotency key, concurrency behavior, audit record, retention;
- validation and failure modes;
- tests including negative and replay cases;
- production config names (never secrets);
- rollout/backward compatibility and safe recovery;
- evidence URLs or logs and explicit status.

Before shipping any phase verify the entire business flow still holds:
intake → canonical Matter persisted → governed review → private quote → invoice → policy acceptance → Wise-only verified settlement → scheduling authorization → applicable RON execution → evidence QC → authentication/apostille → custody → courier/release → verified delivery → close.
No alternate payment route. No public fake fixed price. No legal advice. No duplicate Matter.

# CROSS-PHASE ACCEPTANCE / NEGATIVE MATRIX

Prove (or explicitly mark blocked for reason and evidence):
A. Duplicate intake/payment/provider webhooks cannot duplicate Matter or funds.
B. Unauthorized client cannot read or mutate another client’s Matter or sensitive RON/custody/policy records.
C. Operator bypass parameters cannot override payment, release or compliance gates.
D. Pricing calculated once and replicated into versioned artifacts without drift.
E. Policy acceptance cannot be forged/stale or inferred from browser checkbox alone.
F. Unknown official acceptance/jurisdiction state fails to review, not automatic approval.
G. External BlueNotary fee cannot flow into Milano financial truth.
H. Queued messages do not report delivered; failed sends remain actionable.
I. Legacy migration replay passes current canonical schema and isolated SQL fixture.
J. 1000+ rows and smaller PostgREST caps return full authorized data without truncation.
K. All real-provider certification flows clearly differentiate dry-run from actual provider confirmation.
L. Restore and rollback only claim PASS after an actual safe rehearsal with evidence.
M. Mobile public, client and operator QA is rendered, not inferred from typecheck.
N. Founder can see every missing gate; no silent downgrade or waived phase.

# WORKING RULES / NO EXCUSES

- Do not produce another abstract master plan and stop. Actual source modifications, tests and a reviewable PR are the deliverables.
- Do not ask for credentials merely to implement mockable provider adapters or dry-run harnesses. Record actual live credential/authorization gates for later certification.
- If CI is infrastructure-blocked, still run available local gates and report limitations; do not fake green CI.
- Do not interpret missing customer Matter as reason not to write source code.
- Do not claim an API, runtime, provider or UI was tested unless actual evidence exists.
- Do not silently skip a phase; preserve every failing/blocked condition in the ledger.
- Do not merge or deploy production without authorization even if tests pass; prepare exact rollout handoff.
- Never expose secrets or personal customer documents in the PR, fixture or logs.
- Every source change must be complete, not a fragment or placeholder.

# FINAL DELIVERY FORMAT

1. Starting main SHA and current branch/PR.
2. Per-phase P6–P23: IMPLEMENTED / PARTIAL / BLOCKED / CERTIFIED with committed paths, regression test results, migration proof and external evidence.
3. Exact remaining failures grouped into CODE / CI-INFRA / HOSTED-SCHEMA / PROVIDER-LIVE / GOVERNMENT-LIVE / HUMAN-APPROVAL; no vague “done”.
4. Verified P6 fee correction and Wise-only source-of-truth reconciliation.
5. Full commands actually executed, real exit statuses, failed validator names, and outputs/artifact links.
6. Exact production release sequence: migration-before-code, preview acceptance, merge approval, deployed SHA verification, protected endpoint validation, rollback.
7. Explicit final verdict: `P6–P23 SOURCE IMPLEMENTATION COMPLETE` only if all source/CI gates pass; `P6–P23 PRODUCTION CERTIFIED` only if hosted and required provider/live gates are actually proven. Otherwise give `NOT CERTIFIED` and precise evidence-backed blockers.

# PRESERVED ORIGINAL PHASE REQUIREMENTS (CUMULATIVE EXCEPT OVERRIDDEN CONFLICTS)

The original phase requirements follow verbatim from the repository's P3–P23 directive. Where historical text conflicts with the higher-priority corrected canonical constraints above, the correction above wins. Do not omit any nonconflicting requirement.

---

P6 — RON FEE SEPARATION & FINANCIAL TRUTH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Begin from production-complete P5.

OBJECTIVE

Ensure RON notarial-act fees are explicitly separated from Milano service/provider/logistics charges in pricing, quote, invoice, payment, operator, and accounting truth.

Do not replace the canonical pricing engine.

Do not create public tier pricing.

CANONICAL RULE

For Florida RON where applicable, enforce the current statutory notarial-act fee ceiling of $25 per online notarization/notarial act.

Any separate Milano:

- execution coordination
- document review
- service
- provider
- logistics
- courier
- priority
- authentication
- platform/operational

charges must remain separately identifiable and must not be falsely characterized as the statutory notarial fee.

PRICING MODEL

Extend existing line-item taxonomy if needed.

At minimum distinguish:

RON_NOTARIAL_ACT_FEE

from non-notarial Milano service charges.

The total may contain multiple governed components.

Do not bury excess service charges inside the notarial-act fee.

PRIVATE QUOTE

Private quote must show correct line-item classification.

INVOICE

Invoice/output truth must use the same canonical pricing facts.

Do not calculate a second total independently.

PAYMENT

Wise payment amount remains based on the canonical authorized quote/invoice total.

No payment-provider change.

REFUNDS/ADJUSTMENTS

Any governed adjustment must preserve original line-item classification and audit history.

TESTS

Prove:

- RON notarial fee cannot exceed configured statutory ceiling where applicable
- separate service charges remain separate
- total equals canonical line items
- quote/invoice/payment use same canonical amount
- no client-side price authority
- no public tier-price leak
- discount applies only to eligible governed components
- discount cannot cause malformed/negative financial truth
- Wise settlement truth remains exact
- scheduling gate unchanged
- historical invoice retains original classification
- P0–P5 green

RELEASE

One bounded P6 PR.

Exact-SHA production verification.

FINAL VERDICT:

P6 PRODUCTION COMPLETE
P6 DEPLOYED — CONTROLLED LIVE VERIFICATION REMAINS
P6 BLOCKED


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
P7 — FORMAL RECORD RETENTION MATRIX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Begin from production-complete P6.

OBJECTIVE

Create one canonical retention-policy engine/matrix covering Milano operational records.

Do not hard-code unrelated retention durations throughout the application.

First inventory all record classes.

At minimum classify:

- canonical Matter records
- intake submissions
- lead/pricing requests
- uploaded documents
- executed documents
- RON journal
- RON recordings
- identity/credential evidence references
- payment records
- Wise reconciliation evidence
- invoices/receipts
- custody ledger
- execution evidence
- apostille/authentication evidence
- courier evidence
- communications/notification evidence
- policy acceptance evidence
- audit/security logs
- incident records
- records-request records
- operator notes
- professional/counsel inquiries

MATRIX

Each record class must have governed metadata for:

- class ID
- description
- retention basis
- retention duration/rule
- retention start event
- deletion eligibility
- hold eligibility
- sensitivity
- deletion method
- evidence required before deletion
- owner/system of record

Do not invent statutory durations without existing authoritative project support.

Where duration has not been legally/policy approved, mark the rule as governed configuration/review-required rather than inventing a number.

RON 10-year requirement from P5 remains enforced.

HOLDS

Implement reusable hold semantics.

A hold must override ordinary deletion eligibility.

DELETION

No silent destructive cleanup.

Deletion jobs must:

- authorize
- evaluate retention
- evaluate hold
- record candidate
- perform approved deletion
- record result/failure

Do not delete canonical audit proof needed to prove the deletion itself.

TESTS

Prove matrix coverage, hold override, unauthorized deletion denial, RON retention preservation, idempotent deletion, audit evidence, and no cross-Matter leakage.

RELEASE

One bounded P7 PR.

FINAL VERDICT:

P7 PRODUCTION COMPLETE
P7 DEPLOYED — CONTROLLED LIVE VERIFICATION REMAINS
P7 BLOCKED


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
P8 — VERSIONED TERMS, CANCELLATION & REFUND ACCEPTANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Begin from production-complete P7.

OBJECTIVE

Make acceptance of applicable commercial policies durable, versioned, attributable, and tied to the correct Matter/transaction.

POLICY REGISTRY

Create or extend one canonical policy/version registry.

Support applicable:

- Terms of Service
- Privacy Policy acknowledgement where required
- cancellation policy
- refund policy
- execution/service disclosures
- RON-specific disclosures where required
- professional/counsel terms where applicable

Do not create duplicate acceptance tables if equivalent canonical evidence exists.

ACCEPTANCE EVIDENCE

Persist:

- policy ID
- version
- effective date
- acceptance timestamp
- actor/customer reference
- Matter/lead/transaction reference
- acceptance surface
- required/optional status
- policy-content hash or immutable version reference
- relevant request metadata already approved by the privacy architecture

Do not silently overwrite acceptance when policy changes.

NEW VERSION

A new material policy version must be distinguishable from prior acceptance.

Do not falsely claim a customer accepted a version they never saw.

PAYMENT

Where acceptance is required before authorization/payment, enforce it server-side.

Do not rely solely on a checked client checkbox.

REFUNDS/CANCELLATION

Operational actions must reference the version of policy governing that transaction.

Do not automatically decide disputed legal rights.

The system records and applies approved operational rules; exceptions escalate to authorized review.

TESTS

Prove:

- exact policy version persisted
- acceptance immutable
- new version does not rewrite old acceptance
- required acceptance enforced server-side
- no false acceptance from UI state
- refund/cancellation references correct transaction/policy
- cross-Matter access denied
- P0–P7 green

RELEASE

One bounded P8 PR.

FINAL VERDICT:

P8 PRODUCTION COMPLETE
P8 DEPLOYED — CONTROLLED LIVE VERIFICATION REMAINS
P8 BLOCKED


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
P9 — DOCUMENT INTEGRITY & CHAIN-OF-CUSTODY HARDENING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Begin from production-complete P8.

OBJECTIVE

Ensure every operationally significant document version can be proven through immutable integrity and custody evidence.

Do not replace the existing custody ledger.

Extend/harden it.

DOCUMENT VERSION EVIDENCE

For every governed document version capture:

- canonical Matter ID
- document ID
- version ID
- uploader/producer
- source
- upload/creation timestamp
- cryptographic hash
- MIME/type validation evidence
- storage object reference
- size
- execution state
- superseded-by relationship
- custody state
- release state

EXECUTED DOCUMENT

The executed artifact must be a distinct immutable version.

Never overwrite the pre-execution upload with the executed document.

RON

Link P4 RON evidence to exact executed document hash.

APOSTILLE/AUTHENTICATION

Later authenticated/apostilled artifacts must become distinct versions with lineage to the prior document.

COURIER/RELEASE

Release must identify exact document/version being released.

CUSTODY EVENTS

Reuse canonical event naming.

At minimum preserve evidence for:

received
validated
prepared
execution_started
executed
qc_verified
authentication_submitted
authentication_received
release_authorized
courier_handoff
delivered
closed

Use existing canonical equivalents rather than introducing duplicate events.

HASH CHAIN

If custody ledger already chains hashes, preserve it.

Do not fork/rewrite historical custody.

Concurrent append behavior must be deterministic/idempotent.

SECURITY

No public object URLs.

Use private storage/signed access under existing authorization.

TESTS

Prove:

- modified bytes produce different hash
- executed artifact cannot overwrite source
- lineage preserved
- exact version attached to RON evidence
- exact version attached to release
- unauthorized document access denied
- duplicate event retry idempotent
- custody history cannot silently mutate
- concurrent append does not fork canonical chain
- P0–P8 green

RELEASE

One bounded P9 PR.

FINAL VERDICT:

P9 PRODUCTION COMPLETE
P9 DEPLOYED — CONTROLLED LIVE VERIFICATION REMAINS
P9 BLOCKED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
P10 — INVOICE, RECEIPT & OUTPUT TRUTH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Begin from production-complete P9.

OBJECTIVE

Certify that every client-facing financial/output artifact derives from canonical Matter, quote, payment, execution, and release truth.

Do not create independent document totals or manually maintained transaction truth.

CANONICAL ARTIFACT STATES

Preserve existing canonical equivalents for:

- Pro Forma
- Active Invoice
- Paid & Released
- Receipt / Confirmation

Artifact state must follow actual transaction state.

PRO FORMA

May represent an authorized private quote before payment.

Must not claim payment.

ACTIVE INVOICE

Must reflect canonical authorized amount and payment state.

PAID & RELEASED

May only be generated when canonical payment/release conditions are actually satisfied.

RECEIPT / CONFIRMATION

Must derive from verified payment evidence.

FIELDS

Use canonical Matter/customer identifiers, invoice identifier, service/execution classification, line items, discounts, courier where applicable, payment state, payment reference, dates, and release state.

Do not duplicate financial calculations in PDF/template code.

RON line-item separation from P6 must carry through.

ARTIFACT INTEGRITY

Persist:

- artifact ID
- type
- version
- Matter
- canonical financial snapshot/reference
- generated timestamp
- hash
- generator/version
- supersession state

A regenerated historical artifact must not silently replace prior evidence.

TESTS

Prove:

- unpaid Matter cannot generate paid artifact
- released artifact requires canonical release truth
- totals match pricing/payment truth
- RON fee classification preserved
- discount truth preserved
- courier truth preserved
- historical artifact remains immutable
- cross-Matter artifact access denied
- no client-controlled payment truth
- P0–P9 green

RELEASE

One bounded P10 PR.

FINAL VERDICT:

P10 PRODUCTION COMPLETE
P10 DEPLOYED — CONTROLLED LIVE VERIFICATION REMAINS
P10 BLOCKED


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
P11 — AUTHORIZATION, RLS & SECURITY CLOSEOUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Begin from production-complete P10.

OBJECTIVE

Close remaining authorization/RLS/security findings without changing product behavior.

This is a security phase, not a redesign.

AUDIT

Inspect every production table/RPC/storage surface and classify access for:

- anon
- authenticated client
- professional/counsel
- alliance where applicable
- VA where applicable
- operator
- admin
- founder
- service role

Verify canonical routing:

Client → `/portal`
Alliance → `/alliance/dashboard`
VA → `/va/dashboard`
Operator/Admin/Founder → `/dashboard`

Do not expose operator data to client roles.

RLS

For each production table:

- determine intended access
- ensure RLS status matches intent
- ensure policies/grants are explicit
- remove accidental broad access
- preserve legitimate service-role workflows

Do not add meaningless policies merely to silence an advisor.

RPC

Audit SECURITY DEFINER functions, including existing admin/operator helpers.

Restrict direct RPC execution where not required.

Ensure authorization happens inside privileged functions where appropriate.

STORAGE

Audit:

- bucket privacy
- object path authorization
- signed URL issuance
- cross-Matter access
- operator access

SECRETS

No service-role or provider secrets in client bundles/logs.

PASSWORD/AUTH SETTINGS

Document platform-level controls that cannot be safely changed through code rather than falsely claiming them fixed.

TESTS

Create role matrix regression tests proving permitted/denied actions across critical tables/APIs/storage.

Verify:

- client cannot read another Matter
- client cannot mutate payment truth
- client cannot mutate execution evidence
- client cannot mutate RON evidence
- professional boundary enforced
- operator role required for operator surfaces
- service-role routes remain server-only
- anon public capture only accesses approved handlers
- no RLS regression
- P0–P10 green

RELEASE

One bounded P11 PR/migration set.

Run hosted database advisors after deployment and classify remaining findings accurately.

FINAL VERDICT:

P11 PRODUCTION COMPLETE
P11 DEPLOYED — CONTROLLED LIVE VERIFICATION REMAINS
P11 BLOCKED


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
P12 — DATABASE PROVENANCE & MIGRATION CERTIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Begin from production-complete P11.

OBJECTIVE

Prove that the hosted Supabase database schema, migration history, constraints, indexes, functions, grants, and application assumptions agree.

Do not redesign schema merely for aesthetics.

PROVENANCE AUDIT

Compare:

- repository migrations
- hosted migration history
- hosted tables/columns/types
- constraints
- indexes
- functions/RPCs
- triggers
- grants
- RLS
- storage assumptions
- application query expectations

Identify:

- repository-only migration
- hosted-only mutation
- duplicate migration
- schema drift
- stale code assumption
- missing constraint
- type mismatch
- function-definition mismatch

MIGRATION RULE

Never edit an already-applied migration to change history.

Repair drift through additive forward migration.

MIGRATION CHAIN

A clean database created from repository migrations must converge on the expected canonical schema.

HOSTED DATABASE

Existing production data must survive.

No destructive reset.

APPLICATION CONTRACT

For every critical Matter/payment/execution table, verify code references actual hosted column names/types.

Include custody ledger actual Matter key rather than assumptions.

CERTIFICATION OUTPUT

Produce a machine-readable schema/provenance validator if not already present.

TESTS

Prove:

- migration chain deterministic
- no missing production migration
- critical constraints exist
- critical indexes exist
- RPC signatures match application
- RLS/grants match P11
- no legacy Stripe schema required by active code
- canonical Matter key consistent
- P0–P11 green

RELEASE

One bounded P12 PR.

Apply only required forward migrations.

Verify hosted migration IDs after deployment.

FINAL VERDICT:

P12 PRODUCTION COMPLETE
P12 DEPLOYED — CONTROLLED LIVE VERIFICATION REMAINS
P12 BLOCKED


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
P13 — DATABASE PERFORMANCE & INDEX HARDENING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Begin from production-complete P12.

OBJECTIVE

Resolve proven production database performance defects without changing business semantics.

Use hosted query/schema evidence.

Known audit baseline previously identified:

- unindexed foreign keys
- duplicate/redundant index groups

Re-audit current production before changing anything.

UNINDEXED FOREIGN KEYS

For each unindexed FK:

- confirm table size/use
- confirm query/join pattern
- add index when justified
- avoid unnecessary write amplification

DUPLICATE INDEXES

For each duplicate/redundant group:

- identify constraints relying on it
- identify query use
- preserve unique semantics
- remove only genuinely redundant indexes

HIGH-VALUE PATHS

Prioritize:

- canonical Matter lookups
- assignee/operator queues
- pricing/lead linkage
- payment gate audit
- Wise intent/reference/status
- Wise webhook delivery/event/resource
- custody/document linkage
- notification evidence
- courier/Shippo
- RON evidence
- retention/incident records

QUERY SAFETY

Audit list/full-read helpers for PostgREST row-limit assumptions.

Pagination must advance using actual returned rows/count semantics and must not silently truncate canonical reads.

Do not load unbounded production datasets into UI/API memory.

TESTS

Prove:

- pagination does not skip/duplicate
- row caps do not corrupt full-read behavior
- critical queries use deterministic ordering
- index migrations preserve constraints
- no duplicate index removal breaks uniqueness
- application tests unchanged
- P0–P12 green

RELEASE

One bounded P13 PR.

Run hosted performance advisors after migration.

Report remaining findings by severity.

FINAL VERDICT:

P13 PRODUCTION COMPLETE
P13 DEPLOYED — CONTROLLED LIVE VERIFICATION REMAINS
P13 BLOCKED


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
P14 — OPERATOR WORKFLOW COMPLETION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Begin from production-complete P13.

OBJECTIVE

Make the operator workflow fully executable from persisted Matter truth without spreadsheets, hidden manual state, or false completion.

Preserve existing dashboard.

Do not build a second operator OS.

CANONICAL WORKFLOW

Operator must be able to govern:

intake received
→ review
→ blockers
→ execution route confirmed
→ quote authorized
→ payment waiting/verified
→ scheduling
→ execution preparation
→ execution
→ post-execution QC
→ apostille/authentication if applicable
→ courier/release
→ delivery
→ close

Every transition must:

- authorize actor
- validate prior state
- validate required evidence
- persist event
- update canonical Matter state
- remain idempotent
- produce audit evidence

QUEUE

Existing operator queues should expose actionable Matters by canonical state.

No fabricated “overdue” or “AI” claims.

BLOCKERS

Show exact blocker owner:

CLIENT
MILANO
PROVIDER/EXTERNAL

and exact actionable resolution.

EXECUTION PLAYBOOK

Operator sees the confirmed execution path and required evidence.

Do not let UI invent requirements outside canonical review.

PAYMENT

Operator cannot manually fake verified payment.

RELEASE

Operator cannot release when canonical release gate fails.

CLOSE

Close requires applicable completion evidence.

TESTS

Run state-transition matrix tests covering valid and invalid transitions.

Verify authorization, idempotency, evidence requirements, payment gate, release gate, custody, notifications, portal synchronization.

RELEASE

One bounded P14 PR.

Rendered desktop/mobile operator acceptance required.

FINAL VERDICT:

P14 PRODUCTION COMPLETE
P14 DEPLOYED — CONTROLLED LIVE VERIFICATION REMAINS
P14 BLOCKED


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
P15 — BLOCKER, RETRY & RECOVERY UX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Begin from production-complete P14.

OBJECTIVE

Eliminate false-success and dead-end failure states across customer, professional, operator, payment, upload, execution, and notification workflows.

ERROR CONTRACT

Every recoverable error must identify:

- what failed
- whether persisted state exists
- who must act
- safe next action
- retry eligibility
- retry/idempotency key where required

Never expose secrets/internal stack traces.

CUSTOMER

A customer must never be told to fix an operator-controlled requirement.

UPLOAD

Persisted lead/Matter survives upload failure.

Retry must not duplicate records.

PAYMENT

Failed/unverified payment remains failed/unverified.

Do not unlock scheduling.

NOTIFICATIONS

Notification failure does not undo successful Matter/lead/payment persistence.

OPERATOR

Failed transition must leave canonical state unchanged unless an explicit partial state is modeled.

PROVIDER

Provider timeout/unknown result must be represented as unknown/pending, not success.

NETWORK

Client retry after network interruption must not duplicate:

- lead
- Matter
- payment intent
- custody event
- execution record
- notification job

ACCESSIBILITY

Error summaries/focus/status announcements must work.

MOBILE

No recovery action hidden behind viewport/sticky elements.

TESTS

Inject controlled failures across critical workflows.

Prove idempotent recovery and truthful states.

RELEASE

One bounded P15 PR.

FINAL VERDICT:

P15 PRODUCTION COMPLETE
P15 DEPLOYED — CONTROLLED LIVE VERIFICATION REMAINS
P15 BLOCKED


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
P16 — NOTIFICATION TRUTH & DELIVERY EVIDENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Begin from production-complete P15.

OBJECTIVE

Make every operational email/notification claim evidence-based and traceable to canonical events.

Do not replace the current notification provider unless it is actually nonfunctional.

NOTIFICATION MODEL

Persist:

- notification ID
- canonical event
- Matter/lead reference
- recipient
- template/version
- provider
- provider message ID
- queued timestamp
- attempted timestamp
- provider accepted timestamp
- delivered timestamp only when supported by provider evidence
- failed/bounced state
- retry count
- last error classification
- correlation/idempotency key

STATUS TRUTH

Distinguish:

QUEUED
ATTEMPTED
PROVIDER_ACCEPTED
DELIVERED
FAILED
BOUNCED
SUPPRESSED

Do not call provider acceptance “delivered.”

EVENTS

Audit notifications for:

- lead/pricing received
- Matter received
- review update
- private quote
- payment verification
- scheduling
- execution milestones
- apostille/authentication
- courier/release
- delivery
- completion
- professional/counsel inquiry
- operator alerts

Only send when canonical event warrants it.

PRIVACY

Do not put sensitive uploaded document contents in email.

Keep links authenticated/signed as appropriate.

RETRY

Retry must not duplicate notifications when provider already accepted the same idempotent message.

TESTS

Prove event→notification mapping, duplicate suppression, provider-status truth, failure recovery, privacy, authorization, and P0–P15 regression.

RELEASE

One bounded P16 PR.

Run controlled provider evidence verification where safe.

FINAL VERDICT:

P16 PRODUCTION COMPLETE
P16 DEPLOYED — CONTROLLED LIVE VERIFICATION REMAINS
P16 BLOCKED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
P17 — ACQUISITION ATTRIBUTION & REVENUE PROVENANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Begin from production-complete P16.

OBJECTIVE

Preserve trustworthy acquisition attribution from first qualified visit through lead, Matter, private quote, verified Wise revenue, completion, and repeat Matter.

Do not create a second CRM.

ATTRIBUTION

Reuse/extend canonical fields for:

- source
- medium
- campaign
- content
- referral
- audience
- originating route
- service intent
- destination context
- professional/counsel source
- first-touch
- last meaningful touch

PRESERVATION

Original stronger attribution must not be overwritten by weaker later navigation.

Lead → Matter transition must carry attribution.

Matter → quote/payment/completion must remain linkable without duplicating revenue truth.

REVENUE

Revenue attribution derives only from verified canonical financial truth.

Do not count:

- CTA clicks
- leads
- quotes
- payment intents
- pending Wise transfers

as revenue.

Repeat Matter must be attributable to the correct customer/relationship without rewriting the original Matter's source.

PRIVACY

Do not store document contents or unnecessary sensitive PII in analytics.

ANALYTICS

Analytics remain observational.

Supabase/canonical operational records remain operational truth.

TESTS

Prove attribution survival, no overwrite, lead→Matter linkage, verified-revenue-only reporting, repeat Matter linkage, and privacy.

RELEASE

One bounded P17 PR.

FINAL VERDICT:

P17 PRODUCTION COMPLETE
P17 DEPLOYED — CONTROLLED LIVE VERIFICATION REMAINS
P17 BLOCKED


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
P18 — MOBILE, ACCESSIBILITY & PERFORMANCE CERTIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Begin from production-complete P17.

OBJECTIVE

Certify the complete revenue and execution experience across mobile, desktop, keyboard, reduced motion, and production performance without redesigning the brand.

ROUTES

At minimum certify:

- homepage
- pricing / Execution Options
- Get Pricing
- Speak With Nicholas
- intake
- RON
- domestic/mobile notary
- apostille
- international execution
- representative country intelligence
- `/counsel`
- `/professional`
- login/auth
- `/portal`
- payment
- operator dashboard
- critical operator workflow

WIDTHS

320
360
375
390
412
430
768
1024
1280
1440

MOBILE

Validate:

- no horizontal overflow
- no clipped text/actions
- tap targets
- sticky/fixed element safety
- forms usable with keyboard
- validation visible
- upload usable
- payment actions usable
- portal timeline usable
- operator workflow usable at supported widths

ACCESSIBILITY

Validate:

- semantic headings
- landmarks
- link/button semantics
- labels
- field descriptions
- errors
- focus
- dialogs
- keyboard
- skip/navigation behavior
- status announcements
- contrast
- reduced motion

Do not remove premium motion globally.

Respect `prefers-reduced-motion`.

PERFORMANCE

Measure representative production pages.

Fix proven:

- unnecessary client JS
- duplicate data fetch
- oversized assets
- blocking fonts/scripts
- hydration defects
- layout shift
- avoidable image cost
- unbounded queries

Do not sacrifice required security/correctness for benchmark scores.

REGRESSION

Existing $500K commercial visual system remains intact.

No generic SaaS redesign.

TESTS

Run authoritative browser suite and performance checks.

Do not claim PASS for unexecuted browser tests.

RELEASE

One bounded P18 PR.

FINAL VERDICT:

P18 PRODUCTION COMPLETE
P18 DEPLOYED — CONTROLLED LIVE VERIFICATION REMAINS
P18 BLOCKED


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
P19 — HOSTED END-TO-END TRANSACTION CERTIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Begin only after P18 is production-complete.

This is primarily certification.

Do not add features unless a real hosted defect is discovered.

OBJECTIVE

Prove one real controlled Matter can traverse the complete hosted architecture without state drift.

CERTIFICATION FLOW

Use approved controlled test data.

1. Open production fresh.
2. Enter through the normal public acquisition path.
3. Submit one realistic Matter.
4. Upload approved test documents.
5. Confirm exactly one canonical Matter is established through the governed transition.
6. Capture Matter ID.
7. Confirm service/destination/context persisted correctly.
8. Confirm Matter Review System route.
9. Confirm private quote is tied to same Matter.
10. Confirm payment gate is awaiting payment.
11. Confirm scheduling blocked.
12. Complete controlled Wise path only when authorized for certification.
13. Confirm reconciliation updates same Matter exactly once.
14. Confirm payment verification.
15. Confirm scheduling unlocks only after verification.
16. Schedule.
17. Confirm portal state.
18. Confirm notifications against provider evidence.
19. Run operator workflow.
20. Confirm document/custody evidence.
21. Confirm execution state.
22. Confirm applicable authentication/courier/release state.
23. Confirm completion.
24. Confirm financial/output artifacts.
25. Confirm closed Matter.
26. Confirm repeat-Matter architecture does not corrupt Matter #1.

DATABASE

Compare UI state against Supabase canonical truth at major milestones.

No false success.

NO SHORTCUTS

Do not manually patch database state merely to make certification pass.

Any defect requires:

- root cause
- bounded corrective PR
- full affected regression
- redeploy
- restart certification from the earliest affected invariant

OUTPUT

Produce certification evidence with IDs/timestamps but no secrets.

FINAL VERDICT:

P19 PRODUCTION COMPLETE

or

P19 BLOCKED

Do not call this complete without a real hosted transaction.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
P20 — WISE LIVE TRANSACTION CERTIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Begin after P19 hosted architecture is otherwise ready.

OBJECTIVE

Certify Wise as the sole production payment truth through a controlled live transaction.

DO NOT introduce another payment provider.

VERIFY

- quote amount
- invoice amount
- Wise payment instruction/reference
- payment intent
- webhook/reconciliation evidence
- exact amount
- currency
- settlement state
- duplicate delivery handling
- idempotency
- canonical Matter linkage
- payment gate audit
- scheduling gate
- receipt/output

REQUIRED INVARIANT

Scheduling remains blocked until:

- payment confirmed
- canonical payment status paid
- settlement cleared
- amount positive
- amount finite
- exact-cent financial truth satisfied

Use existing canonical implementation.

TEST DUPLICATES

A repeated Wise event/reconciliation attempt must not double:

- payment
- revenue
- ledger entry
- Matter transition
- notification

FAILURE

Underpayment, mismatch, pending, malformed, duplicate, or unverified settlement must fail closed.

REFUND/ADJUSTMENT

Verify governed representation if existing production functionality supports it.

Do not invent refund authority.

OUTPUT

Record:

- Matter
- expected amount
- verified amount
- Wise reference
- reconciliation result
- payment transition
- scheduling transition
- notification evidence
- runtime errors

Redact secrets.

FINAL VERDICT:

P20 WISE LIVE CERTIFIED

or

P20 BLOCKED


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
P21 — RON LIVE CERTIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Begin after P20.

OBJECTIVE

Certify the production RON lane through a controlled real execution where legally and operationally appropriate.

Do not simulate statutory evidence and call it live certification.

PRE-FLIGHT

Confirm:

- canonical Matter
- customer RON preference
- governed RON eligibility/review
- confirmed execution method
- private quote
- P6 fee separation
- verified Wise payment
- scheduling authorization

SESSION

Verify production provider integration and capture actual supported evidence for:

- provider/session reference
- signer identity process
- credential analysis
- KBA where required
- awareness/willingness
- oath/affirmation where applicable
- notarial act
- certificate completion
- electronic signature/seal
- recording
- journal
- execution timestamp
- exact executed document hash

POST-EXECUTION

Verify:

- P4 evidence ledger
- P5 retention metadata
- P9 document integrity/custody
- post-execution QC
- portal status
- operator status
- notification evidence
- invoice/receipt truth

Do not expose identity evidence publicly.

FAILURE

Missing mandatory evidence means certification fails.

Do not manually mark execution complete.

FINAL VERDICT:

P21 RON LIVE CERTIFIED

or

P21 BLOCKED


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
P22 — APOSTILLE / AUTHENTICATION LIVE CERTIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Begin after P21.

OBJECTIVE

Certify one controlled production Matter requiring apostille/authentication through the complete applicable lifecycle.

Use a Matter/document appropriate for controlled certification.

Do not generalize the resulting route into a universal country rule.

PRE-FLIGHT

Verify:

- canonical Matter
- document origin
- destination
- document type
- execution requirements
- notarization state if applicable
- document eligibility review
- confirmed authentication route
- private quote
- Wise verified
- scheduling/execution completed where applicable
- exact pre-authentication document hash

SUBMISSION

Record actual evidence for:

- submitting authority
- submission method
- submission timestamp
- document/version
- tracking/reference
- operator
- custody event

RECEIPT

Record:

- returned artifact
- authority evidence/reference
- received timestamp
- exact authenticated/apostilled artifact hash
- lineage to submitted version
- QC
- custody

COURIER / RELEASE

Where applicable verify:

- release gate
- recipient/destination
- courier label/tracking
- handoff
- tracking events
- delivery evidence

Do not claim delivery before carrier evidence.

PORTAL

Client-facing timeline must match canonical Matter truth.

COUNTRY INTELLIGENCE

No certification result may be used to hard-code a blanket apostille/witness/translation requirement for all Matters to that country.

FINAL VERDICT:

P22 APOSTILLE/AUTHENTICATION LIVE CERTIFIED

or

P22 BLOCKED


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
P23 — RECOVERY, MONITORING & FINAL PRODUCTION CERTIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Begin only after P19–P22 have completed or every non-applicable live-certification item has a documented governed reason for non-applicability.

OBJECTIVE

Perform final production certification of The Milano Seal as an operational revenue and execution system.

Do not add speculative features.

RECOVERY

Verify documented recovery for:

- failed deployment
- failed migration
- payment webhook/reconciliation interruption
- notification provider failure
- storage/upload failure
- RON provider interruption
- courier provider interruption
- authentication workflow exception
- operator error
- duplicate event
- partial transaction
- database restore scenario

No destructive recovery test against production data.

Use safe staging/controlled mechanisms where required.

MONITORING

Verify production visibility for:

- runtime errors
- API failures
- database failures
- payment reconciliation failures
- notification failures
- upload/storage failures
- execution exceptions
- RON evidence failures
- release-gate failures
- courier exceptions

Alerts must point to actionable evidence.

Do not create fabricated health signals.

BACKUP / RESTORE

Verify actual configured database backup/recovery capability and document evidence.

Do not claim restore certification unless an appropriate safe restore test was actually performed.

SECURITY

Re-run:

- authorization/RLS
- secrets exposure
- storage privacy
- protected APIs
- role routing
- payment authority
- execution authority
- document access
- operator access

BUSINESS FLOW

Final certification must prove:

Visitor
→ Service Intent
→ Lead
→ Canonical Matter
→ Review
→ Private Quote
→ Wise
→ Verified Payment
→ Scheduling
→ Execution
→ QC
→ Authentication where applicable
→ Courier/Release where applicable
→ Delivery
→ Close
→ Repeat Matter capability

CANONICAL ARCHITECTURE

Confirm no production drift from:

- one Matter schema
- one state machine
- one pricing truth
- one Wise payment truth
- one scheduling gate
- one execution truth
- one custody chain
- one release truth
- one operator workflow
- one client portal
- governed professional/counsel boundary

FINAL FULL GATE

Run:

- typecheck
- lint
- complete tests
- production build
- migration validator
- governance validators
- route validator
- Wise-only validator
- Matter/state-machine validator
- payment/scheduling validator
- RLS/security validator
- document/custody validator
- notification validator
- RON validator
- apostille/authentication validator
- commercial conversion validator
- public pricing/private discount validator
- rendered browser acceptance
- production smoke
- runtime-error scan

Verify current `main` exact SHA equals production Vercel `githubCommitSha`.

Verify:

- deployment READY
- www alias
- apex redirect
- runtime health
- no pending required migration
- no known P0/P1/P2/P3–P23 regression

FINAL REPORT

Return:

1. final main SHA
2. production deployment ID
3. exact SHA result
4. production domains
5. complete automated test count
6. build result
7. migration result
8. security/RLS result
9. acquisition result
10. Matter persistence result
11. pricing result
12. Wise result
13. scheduling gate result
14. domestic execution result
15. RON result
16. document-integrity result
17. custody result
18. apostille/authentication result
19. courier/release result
20. notification result
21. portal result
22. operator workflow result
23. retention result
24. policy acceptance result
25. invoice/output result
26. mobile/accessibility result
27. monitoring/recovery result
28. hosted transaction result
29. remaining known non-blocking findings
30. final verdict

FINAL VERDICT MUST BE EXACTLY ONE OF:

PRODUCTION CERTIFIED

PRODUCTION DEPLOYED — CONTROLLED LIVE CERTIFICATION REMAINS

PRODUCTION BLOCKED

“PRODUCTION CERTIFIED” is prohibited unless all required live transaction evidence actually exists.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GLOBAL EXECUTION RULE FOR P3–P23
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For every phase above:

1. Fetch current `main`.
2. Confirm all previous completed phases remain present.
3. Inspect before coding.
4. Deduplicate against existing implementation.
5. Implement only the phase's missing production delta.
6. Do not rebuild functionality already present.
7. Keep the canonical Matter schema.
8. Keep the canonical state machine.
9. Keep Wise as the only payment architecture.
10. Keep verified payment before scheduling.
11. Keep customer preference separate from confirmed execution truth.
12. Keep Milano positioned as document execution/coordination, not a law firm.
13. Do not provide legal advice through product copy or workflow authority.
14. Keep private pricing private.
15. Keep discount codes private.
16. Keep uploaded documents private.
17. Keep service-role credentials server-side.
18. Preserve RLS and role isolation.
19. Preserve P0–P2 commercial conversion architecture.
20. Use one bounded branch/PR per phase.
21. Run the phase's required tests plus authoritative repository gates.
22. Fix failures caused by the phase.
23. Never weaken tests/validators to obtain green status.
24. Merge only after required CI is green.
25. Deploy from merged `main`.
26. Verify exact merged SHA in production.
27. Verify Vercel READY.
28. Verify production aliases.
29. Run affected production smoke.
30. Check runtime errors.
31. Do not start the next phase until the current phase's verdict permits it.
32. Never claim a live certification from source inspection or simulated data.
33. Record controlled-live-certification requirements honestly when real-world provider/government/customer interaction is required.
34. Never reintroduce Stripe.
35. Never mix Liaison OS architecture into Milano Seal.

These blocks now cover the **entire remaining P3–P23 sequence** with each phase bounded to its actual production responsibility. The progression is deliberately cumulative so a later phase certifies the same Matter, payment, execution, custody, and release truth instead of creating parallel systems.