# Quick Action Intelligence

## Component

`components/dashboard/QuickActionIntelligenceMenu.tsx`

Matter-aware quick action menu rendered on the main dashboard. Accepts live counts from the API and renders 8 groups of operator shortcuts with status-driven states.

## API

`GET /api/dashboard/quick-actions`

- Auth: Dashboard-role only (admin / operator / superadmin). Returns 401/403 if session is absent or role is insufficient.
- Queries `deals` for status tallies and delivered-not-released count.
- Queries `va_tasks` for pending/assigned task count and overdue count.
- All queries are graceful — table absence returns `no_data: true` without a 500.

## Groups (8 total)

1. Matter — registry, intake, pipeline, active matter
2. Financial — payment gate, invoices, Wise reconciliation, balances
3. Execution — scheduling, checklist, apostille, release desk
4. Courier Custody — custody rail, address validation, rates, label purchase, delivered-not-released
5. Documents — vault, upload, review, certificate library, release certificate
6. Intelligence — compliance, atlas, compliance matrix, receiving authority, authority graph
7. Alliance / Revenue — alliance desk, referral ledger, partner registry, revenue desk
8. Operations — operations desk, VA task queue, operational ledger, launch control, control room, admin validator

## Status Logic

- `READY` — action is available
- `DISABLED` — `notMounted` (Future Module) or `requiresMatter` with no active matter
- `REVIEW_REQUIRED` — data-driven (e.g. deliveredNotReleasedCount > 0 on Delivered Not Released)
- `BLOCKED`, `WARNING`, `COMPLETE`, `NO_DATA` — available for future data-driven expansion

## Badges

Tones: `gold` / `amber` / `red` / `green` / `slate`

Delivered Not Released shows an amber count badge when count > 0.

## Summary Bar

Renders above groups when any count is non-zero. Four chips: Action Required, Blocked, Review Required, Ready.

## Animation

REVIEW_REQUIRED cards pulse with `qa-amber-pulse` (1800ms, ease-in-out, infinite).
Reduced-motion safe: `@media (prefers-reduced-motion: reduce) { .qa-pulse { animation: none !important; } }`

## Security

No sensitive fields exposed. BLOCKED_FIELDS list validated before any response is returned.
Route: matter-scoped [id] substitution happens client-side only. No raw deal data in the payload.
