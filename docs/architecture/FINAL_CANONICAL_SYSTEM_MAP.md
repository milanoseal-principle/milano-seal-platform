# Final Canonical System Map — The Milano Seal™

Baseline: `main` @ `0756ffd` (release-critical gates green). This map records the
**single canonical implementation** for each system. Nothing here is rebuilt;
this documents what already exists and is deployed.

| System | Canonical implementation | Route(s) | Table / store | Roles |
|---|---|---|---|---|
| Authentication / role source | `lib/auth/server-role.ts` (`resolveServerRole`, `readAppRole`, `isAccountDisabled`) | — | Supabase Auth `app_metadata` | all |
| Route authorization | `proxy.ts` + `lib/auth/roleRedirect.ts` | all protected prefixes | — | all |
| Role guards | `lib/dashboardAuth.ts`, `lib/vaAuth.ts`, `lib/allianceAuth.ts`, `app/portal/layout.tsx` | `/dashboard`, `/va`, `/alliance`, `/portal` | — | per surface |
| Matter (canonical record) | `deals` table + `app/api/deals/*` | `/dashboard/deals/[id]`, `/dashboard/matters` | `deals` | operator+ |
| Scheduling gate | `lib/scheduling/complimentarySchedulingGate.ts` + `app/api/deals/[id]/schedule/route.ts` | `/api/deals/[id]/schedule` | `deals` | operator+ |
| Complimentary authorization | `lib/payments/complimentary-*.ts`, `app/api/matters/[matterId]/complimentary/*` | `/api/matters/[matterId]/complimentary/*` | `complimentary_authorizations` (migration 043) | `matter.comp.*` |
| Payment confirmation (Wise) | `app/api/deals/[id]/payment/route.ts` + Wise webhook | `/api/deals/[id]/payment` | `deals` | operator+ |
| Release / custody | `app/api/deals/[id]/release/route.ts`, custody ledger | `/dashboard/releases` | `deals`, audit | operator+ |
| Audit / events | `lib/audit.ts`, `lib/activity.ts` | — | `audit_logs`, activity | server |
| Dashboard shell + module registry | `lib/dashboard-modules.ts` (96 modules, 12 groups) | `/dashboard/*` (145 routes) | — | operator/founder families |
| Client Portal | `app/portal/*` + `app/portal/layout.tsx` guard | `/portal/*` (12 routes) | `deals` (client-owned) | client (+founder preview) |
| Alliance / VA commands | `app/alliance/*`, `app/va/*` | `/alliance/*`, `/va/*` | tasks | alliance / va |
| Integration Health | dashboard integrations surfaces + `check:integration-configuration` | `/dashboard/*/integrations` | integration evidence | operator/founder |
| Topical Authority / SEO gate | `validate:topical-authority-engine`, `app/sitemap.ts` | public routes | — | public |
| Sitemap / indexation | `app/sitemap.ts` (portal excluded, noindex) | `/sitemap.xml` | — | public |
| Production meta-gate | `scripts/validate-final-production-regression.mjs` | — | — | CI/local |

**Groups in the module registry:** Admin, Core, Pipeline, Execution, Operations,
Matter Intelligence, Outreach, Growth, Intelligence, VA Operations, Alliance, System.

## Deployment lineage (do not rebuild)
- #133 canonical scheduling wiring · #134/#135 provisioning + registry fix ·
  #136 auth hardening (app_metadata-only) · #137 portal consolidation ·
  #138 final production meta-gate + sign-off.

All of the above are merged and green on `main`.
