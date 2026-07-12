# Trusted Execution Integration — Role Command UIs (Increment 2)

Builds the "finished rooms" over the PR #127 permission core: normalized read
model + four role command centers + the integration health center. Reads
normalized state only — no provider SDK, no raw payloads, no protected-gate
changes.

## Routes
- `/dashboard/founder/integrations` — Founder oversight (health + escalations).
- `/dashboard/operations/integrations` — Operator coordination hub.
- `/dashboard/va/command` — VA support (permission-scoped).
- `/alliance/command` — Alliance assigned-scope execution.
- `/dashboard/system/integrations` — Integration Health Center.

## Read model (`lib/integration-command/integrationReadModel.ts`)
- `getIntegrationHealth(provider)` — evidence-based: env presence → `configured`
  (NOT `healthy`); missing → `action_required`. `healthy` requires a verified
  event (never fabricated). No provider SDK imports.
- `listMatterIntegrationSummaries()` — returns `[]` until real matters are wired
  (honest empty state; no fabricated matters/payments).

## Role scoping
Each page renders the shared `RoleIntegrationCommand` and lists the role's
permitted capabilities from the canonical matrix. VA + Alliance surfaces show the
explicit "cannot confirm payment / unlock scheduling / authorize release / mutate
custody / mark RON complete" boundary.

## Reduced motion / accessibility
Health state is conveyed by text + icon + colour (never colour alone). Responsive
grids; no fixed-width tables.

## Deferred follow-ups
Live normalized adapters (once credentials exist), cross-workspace messaging
threads, cinematic state transitions, per-matter execution boards with real data.

## Safety
No secrets/tokens/raw payloads displayed. No payment/scheduling/release/custody
changes. Dashboards noindex.
