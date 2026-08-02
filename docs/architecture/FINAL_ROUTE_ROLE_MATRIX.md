# Final Route / Role Matrix — The Milano Seal™

Source of truth: `lib/auth/roleRedirect.ts` (`normalizeUserRole`,
`isRouteAllowedForRole`, `getHomeRouteForRole`) enforced by `proxy.ts` and the
per-surface server guards. Role comes ONLY from `app_metadata.role`.

## Role families (normalized)
| Raw roles → family | Home route | May reach |
|---|---|---|
| founder, founder_admin, admin_operator, ops_manager, execution_coordinator, apostille_coordinator, finance_operator, client_support, **compliance_reviewer**, operator → **operator** | `/dashboard` | `/dashboard`, `/va`, `/alliance` (oversight) |
| admin → **admin** | `/dashboard` | `/dashboard`, `/va`, `/alliance` |
| owner → **owner** | `/dashboard` | `/dashboard`, `/va`, `/alliance` |
| va, va_manager, intake/scheduling/document/translation/courier/followup/escalation assistants, alliance_support_assistant → **va** | `/va/dashboard` | `/va` only |
| alliance, alliance_partner, alliance_member → **alliance** | `/alliance/dashboard` | `/alliance` only |
| client → **client** | `/portal` | `/portal` only |
| missing / unknown / **disabled** | `/login?error=access_denied` | **nothing (blocked)** |

## Protected prefixes (proxy.ts)
`/dashboard`, `/portal`, `/alliance`, `/va`, `/internal`, `/ops`, `/workspace`,
`/admin`, `/api/admin`, `/api/dashboard`, `/api/follow-ups`,
`/api/compliance/list`, `/api/portal/me`, `/api/va`.

Public auth paths (bypass guard): `/login`, `/admin/login`, `/operator/login`,
`/auth/callback`, `/auth/*`, `/api/auth/*`. Public funnels under protected
prefixes: `/alliance/apply`, `/va/apply`.

## Redirect contract
- Unauthenticated on protected route → `/login?next=<path>` (API → 401).
- Valid role on disallowed area → own home route.
- Missing / unknown / disabled role → `/login?error=access_denied` (query preserved).

## Portal routes (all noindex, client-guarded, excluded from sitemap)
`/portal`, `/portal/documents`, `/portal/invoice`, `/portal/matter-room`,
`/portal/messages`, `/portal/payment`, `/portal/release`, `/portal/ron`,
`/portal/tracking`, `/portal/[token]`.
Compatibility redirects: `/portal/trackingNow` → `/portal/tracking` (query
preserved); `/portal/v2` → `/portal`.

## Verification
Enforced by `tests/auth-role-routing.test.ts`,
`tests/portal-route-consolidation.test.ts`, and the meta-gate `auth-source-scan`
(no `user_metadata` authorization reads remain).
