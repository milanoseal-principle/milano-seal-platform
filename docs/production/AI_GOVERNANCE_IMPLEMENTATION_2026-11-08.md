# AI corporate governance implementation

Source contract: G1–G5 master at `fa1f6863659a26c174a09f224ec9b259aafc9928`
(PR #449) and the P6–P23 master merged in #448. Starting main:
`e29b37cfa37ad8528cb5ff96c0e3e9cc72524548`.

## Deduplication and authority

| Requirement | Existing anchor and finding | Implementation delta |
|---|---|---|
| G1 charters and guarded tools | `lib/control-plane/systemRegistry.ts`; `lib/autopilot/engine.ts` recommends but never executes | `lib/control-plane/governance/registry.ts`, `contracts.ts`, `runtime.ts`: 12 directors, non-voting B13, 12 executives, 16 on-demand worker definitions; server-bounded corporate tools |
| G2 intelligence and memory | Existing Anthropic integration, `audit_events`, Vercel scheduler | `reporting.ts`; immutable source/report versions, packets, forecast outcomes and configured period schedules in new corporate tables |
| G3 orchestration | No existing corporate queue/decision/approval service found | Transactional task claims, per-agent/global concurrency, inherited scopes, dependencies, reserved budgets, unknown outcomes, bounded retry/dead letter and human compensation |
| G4 Board Room | Existing `/dashboard/control-plane`; canonical auth/role service | Nested `/dashboard/control-plane/board-room`, existing module registry/navigation; real private API, RLS, exact-action approvals and independent verifier workflow |
| G5 regressions | Existing Tiffany 15-step, Damiani, discount, map and certification infrastructure | Separate synthetic 50%-eligible-subtotal regression; GET-only rendered Damiani; controlled Board Room render proof; existing tests/validators retained |
| Audit | Existing `public.audit_events` | Corporate `AI_GOV_*` events in the existing audit ledger; append-only guards and authoritative role checks |
| Retention | Existing P7 `retention_classes` | Corporate governance class, unresolved duration and deletion disabled; no destructive cleanup |
| P12 replay | Historical migration `20261107124012` calls undefined `is_operator()` | Idempotent forward helper migration and explicit fresh-database prerequisite plan; no applied migration edited |

Corporate decisions and tasks are separate from client Matters. The new layer never
writes `public.deals`, verifies payments/RON, dispatches couriers, releases documents,
sends external messages, files legal documents or deploys production. Those tools are
not registered, even when a founder approves an internal corporate action.

## Runtime and configuration

All agents start disabled; settings start paused with mode DISABLED. Registry roles
are not active agents or legally appointed directors/officers. Model output is
untrusted JSON, rendered as text and validated against source scope/freshness.

Required configuration names (no values):

- Existing Supabase server bindings: `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- `GOVERNANCE_AI_ENABLED` defaults off. Setting it does not activate DB settings or agents.
- Paid model drafting additionally needs `ANTHROPIC_API_KEY`, `GOVERNANCE_AI_MODEL`,
  `GOVERNANCE_AI_INPUT_MICROUSD_PER_MILLION`, `GOVERNANCE_AI_OUTPUT_MICROUSD_PER_MILLION`.
- Existing `CRON_SECRET` protects the five-minute cron endpoint.

Unconfigured models remain UNCONFIGURED. Explicitly enabled deterministic evidence
reads/internal packets do not need a paid-model credential. No continuous operation
is claimed before an actual hosted scheduler tick and task evidence. Reporting
periods use America/New_York; daily budget accounting uses database UTC days.

Budgets are micro-USD reservations with bounded input/output tokens, not authority
to make banking transactions. Prices must be approved configuration; hosted provider
billing limits remain an external control. Unknown model outcomes retain their
reservation and cannot blindly retry. Provider usage/message metadata is retained
when actually observed. Unknown cost is not reported as zero.

## Human controls and independent verification

Only founder/founder_admin can approve exact task/hash/TTL, change activation, enable
agents, verify reports, withdraw results or clear critical holds. Admin operators and
ops managers may create operations-visible bounded drafts and issue holds. Fresh
server-controlled app metadata and bans apply to RPCs and RLS; user metadata is not
authority. All browser mutations require same-origin JSON and authenticated sessions.

L2 internal publication needs committee consultation, verified independent reports,
no critical hold and an unconsumed exact-action approval. Approvals cannot be reused,
rebound or unconsumed. A hold permits only D05/D07 L0 audit reads needed for recovery;
absolute pause stops everything. Withdrawals retain original outputs/dissent/history.

## Migration provenance and release order

New migrations:

1. `20261108180000_operator_authority_prerequisite.sql` — missing canonical helper,
   current server-role authority, no application data rewrite.
2. `20261108190000_ai_corporate_governance.sql` — corporate records/RLS/RPCs,
   immutable charter snapshots, existing audit integration and retention class.

A plain filename-order clean replay originally failed at historical migration
`20261107124012`: missing `public.is_operator()`. The explicit repository plan at
`supabase/migration-replay-plan.json` applies the idempotent helper first for a **fresh
isolated database**, then all other migrations in filename order. This is a declared
historical dependency repair, not a claim that the unmodified historical order works.
The actual clean replay records every SQL file SHA and result; no public application
tables are fabricated in bootstrap. Managed Supabase auth/storage primitives are the
isolated fixture substrate. Hosted databases receive pending forward migrations only;
never replay/reset their history or data.

Before release, verify hosted provenance for all existing P4B/P5/P7/P8/P11 migrations,
then apply the two reviewed forward migrations before dependent application code.
No hosted migration has been applied by this work.

## Verification classification

`test:ai-governance-database`: real isolated PostgreSQL authorization, replay,
concurrency, approval, hold, privacy, compensation and scheduler transitions.
`test:migration-replay`: actual complete dependency-aware migration replay.
`test:ai-governance-rendered`: actual component at ten widths, keyboard/native form
validation, intercepted synthetic transport and reload; actual Damiani page GET-only.
These do not prove hosted authentication, production persistence or live providers.

The original Gate 37 runbook uses TIFFTEST99; it is preserved. G5's separate
TIFFTEST50 scenario exercises 50% of eligible service subtotal with courier excluded.
DAMIANI50 is calculated only in isolated frozen fixtures and is never redeemed,
activated, reset or changed. The full original 15-step live checklist remains a
separate controlled certification contract. No real Wise, RON, authority or courier
transaction is run by these source regressions.

## Release and rollback

Do not merge, apply hosted migrations, deploy or activate without explicit founder
release authorization. Prepare an isolated preview database and verify its migration
provenance before previewing schema-dependent routes. A Vercel status alone does not
prove a READY deployment or correct database. Verify preview SHA, role isolation,
Board Room, existing business flows and error logs before requesting production release.

After authorization: retain approved backup evidence, apply pending migrations in
order, verify signatures/RLS, merge the reviewed SHA, deploy merged main, verify
Vercel READY + commit metadata + aliases, apex redirect and protected/public smoke.
Keep `GOVERNANCE_AI_ENABLED` off and DB settings paused until separate activation
approval. Start with one enabled role and deterministic shadow reads; inspect actual
ticks, reports, usage and pause behavior before enabling model drafting or L2 actions.

Rollback: pause/disable governance first. Restore the prior approved app deployment;
retain additive schema, approvals, reports and audit history. Do not drop corporate
records or roll back client payment/execution truth. Use reviewed forward repairs for
schema failures. Real provider actions, external report delivery and destructive
recovery remain separately authorized.
