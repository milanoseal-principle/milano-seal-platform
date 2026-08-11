# Role Workspace Permission Matrix + Task Orchestration (Foundation)

One Milano Seal OS, four role views (Founder, Operator, Alliance, VA) over the
same canonical Matter. This foundation is the **permission-aware task
orchestration core** — it routes reviewable work between roles and hard-denies
protected actions. It does NOT touch Wise/Shippo/BlueNotary logic, payment/
scheduling/release/custody gates, or RLS.

## Files
- `lib/integration-command/rolePermissions.ts` — `can(role, capability)` matrix.
- `lib/task-orchestration/{types,taskPermissionEngine}.ts` — support tasks,
  assignment/perform/coordinate checks, dedup.
- `scripts/check-integration-configuration.mjs` — honest env-presence check.

## Hard denials (VA + Alliance can NEVER)
confirm_payment · unlock_scheduling · authorize_release · mutate_custody ·
mark_ron_complete · purchase_courier_label · view_internal_margin ·
view_raw_provider_payload · view_unrelated_matter · view_commercial_intelligence.

VA↔Alliance coordination requires a **shared matter** and an Operator-routed
initiator. Alliance members are coordinated with, not coordinators; they cannot
assign tasks.

## Integration configuration
`npm run check:integration-configuration` reports **Configured / Missing** using
env-var **presence only** — it never prints secret values and never claims an
integration is *live*. In this environment all three report **Missing
configuration** (no keys present). Production activation additionally requires:
webhook endpoints, signature verification, an approved provider-originated test
event, dashboard evidence, and recorded sign-off.

## Deferred follow-ups (not in this foundation)
The normalized Wise/Shippo/BlueNotary read models + four cinematic command-center
UIs + cross-workspace messaging threads + integration health center. Those are
large, largely presentational, and gated on real credentials; build on request.

## Safety
No provider SDK imports, no protected-gate changes, no raw payloads, no secrets.
