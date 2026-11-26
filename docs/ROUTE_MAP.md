# The Milano Seal™ — Generated Canonical Route Map

> **AUTO-GENERATED — DO NOT HAND EDIT**
>
> Generate: `node scripts/generate-route-map.mjs`  
> Validate: `node scripts/generate-route-map.mjs --check`

## Purpose

This registry is generated from current `app/**/page.*` and `app/**/route.*` source files.
It protects the production-critical Milano Seal client, operator, payment, intake, Matter Truth, reconciliation, release and Wise surfaces from documentation drift.

## Production-Critical Routes

| Route | Kind | Source File |
|---|---|---|
| `/` | PAGE | `app/page.tsx` |
| `/intake` | PAGE | `app/intake/page.tsx` |
| `/professional/damiani` | PAGE | `app/professional/damiani/page.tsx` |
| `/today` | PAGE | `app/today/page.tsx` |
| `/dashboard` | PAGE | `app/dashboard/page.tsx` |
| `/dashboard/control-plane` | PAGE | `app/dashboard/control-plane/page.tsx` |
| `/dashboard/control-plane/board-room` | PAGE | `app/dashboard/control-plane/board-room/page.tsx` |
| `/api/dashboard/control-plane/governance` | API | `app/api/dashboard/control-plane/governance/route.ts` |
| `/api/dashboard/control-plane/governance/run` | API | `app/api/dashboard/control-plane/governance/run/route.ts` |
| `/api/dashboard/control-plane/governance/metrics` | API | `app/api/dashboard/control-plane/governance/metrics/route.ts` |
| `/api/cron/governance` | API | `app/api/cron/governance/route.ts` |
| `/dashboard/reconciliation` | PAGE | `app/dashboard/reconciliation/page.tsx` |
| `/dashboard/matters/[matterId]/truth` | PAGE | `app/dashboard/matters/[matterId]/truth/page.tsx` |
| `/dashboard/pipeline` | PAGE | `app/dashboard/pipeline/page.tsx` |
| `/dashboard/needs-review` | PAGE | `app/dashboard/needs-review/page.tsx` |
| `/dashboard/follow-ups` | PAGE | `app/dashboard/follow-ups/page.tsx` |
| `/dashboard/apostille` | PAGE | `app/dashboard/apostille/page.tsx` |
| `/dashboard/courier` | PAGE | `app/dashboard/courier/page.tsx` |
| `/dashboard/ledger` | PAGE | `app/dashboard/ledger/page.tsx` |
| `/dashboard/authorities/verify` | PAGE | `app/dashboard/authorities/verify/page.tsx` |
| `/workspace/release` | PAGE | `app/workspace/release/page.tsx` |
| `/portal` | PAGE | `app/portal/page.tsx` |
| `/portal/payment` | PAGE | `app/portal/payment/page.tsx` |
| `/portal/documents` | PAGE | `app/portal/documents/page.tsx` |
| `/portal/invoice` | PAGE | `app/portal/invoice/page.tsx` |
| `/portal/release` | PAGE | `app/portal/release/page.tsx` |
| `/portal/tracking` | PAGE | `app/portal/tracking/page.tsx` |
| `/api/health` | API | `app/api/health/route.ts` |
| `/api/intake` | API | `app/api/intake/route.ts` |
| `/api/webhooks/wise` | API | `app/api/webhooks/wise/route.ts` |
| `/api/dashboard/operator-intelligence` | API | `app/api/dashboard/operator-intelligence/route.ts` |

## Application Route Inventory

734 source files (411 pages and 323 handlers).
The source path identifies each record. Handler methods list explicit exports, including named re-exports. Next.js may supply implicit methods.
Evidence levels come from the route registry (`lib/routes/routeRegistry.ts`, full records in `lib/routes/routeInventory.generated.json`): L0 discovered; L1 registered with an access classification, which is not certification; L2–L6 only from approved, source-bound evidence in `lib/routes/routeCertificationEvidence.json`.

| Route | Kind | Explicit handler methods | Source file | Evidence level |
|---|---|---|---|---|
| `/va/apply` | PAGE | Page | `app/(public)/va/apply/page.tsx` | L1 |
| `/about` | PAGE | Page | `app/about/page.tsx` | L1 |
| `/access` | PAGE | Page | `app/access/page.tsx` | L1 |
| `/admin/login` | PAGE | Page | `app/admin/login/page.tsx` | L1 |
| `/affidavit-name-discrepancy` | PAGE | Page | `app/affidavit-name-discrepancy/page.tsx` | L1 |
| `/affidavit-non-existence-record` | PAGE | Page | `app/affidavit-non-existence-record/page.tsx` | L1 |
| `/affidavit-one-and-the-same` | PAGE | Page | `app/affidavit-one-and-the-same/page.tsx` | L1 |
| `/affidavit-translation-accuracy` | PAGE | Page | `app/affidavit-translation-accuracy/page.tsx` | L1 |
| `/alliance/apply` | PAGE | Page | `app/alliance/apply/page.tsx` | L1 |
| `/alliance/benefits` | PAGE | Page | `app/alliance/benefits/page.tsx` | L1 |
| `/alliance/certification` | PAGE | Page | `app/alliance/certification/page.tsx` | L1 |
| `/alliance/command` | PAGE | Page | `app/alliance/command/page.tsx` | L1 |
| `/alliance/commissions` | PAGE | Page | `app/alliance/commissions/page.tsx` | L1 |
| `/alliance/compliance` | PAGE | Page | `app/alliance/compliance/page.tsx` | L1 |
| `/alliance/credentials` | PAGE | Page | `app/alliance/credentials/page.tsx` | L1 |
| `/alliance/dashboard` | PAGE | Page | `app/alliance/dashboard/page.tsx` | L1 |
| `/alliance/documents` | PAGE | Page | `app/alliance/documents/page.tsx` | L1 |
| `/alliance/jobs/[id]` | PAGE | Page | `app/alliance/jobs/[id]/page.tsx` | L1 |
| `/alliance/jobs` | PAGE | Page | `app/alliance/jobs/page.tsx` | L1 |
| `/alliance/login` | PAGE | Page | `app/alliance/login/page.tsx` | L1 |
| `/alliance/matters` | PAGE | Page | `app/alliance/matters/page.tsx` | L1 |
| `/alliance/messages` | PAGE | Page | `app/alliance/messages/page.tsx` | L1 |
| `/alliance/onboarding` | PAGE | Page | `app/alliance/onboarding/page.tsx` | L1 |
| `/alliance` | PAGE | Page | `app/alliance/page.tsx` | L1 |
| `/alliance/payouts` | PAGE | Page | `app/alliance/payouts/page.tsx` | L1 |
| `/alliance/profile` | PAGE | Page | `app/alliance/profile/page.tsx` | L1 |
| `/alliance/referrals/new` | PAGE | Page | `app/alliance/referrals/new/page.tsx` | L1 |
| `/alliance/referrals` | PAGE | Page | `app/alliance/referrals/page.tsx` | L1 |
| `/alliance/resources` | PAGE | Page | `app/alliance/resources/page.tsx` | L1 |
| `/alliance/security` | PAGE | Page | `app/alliance/security/page.tsx` | L1 |
| `/alliance/support` | PAGE | Page | `app/alliance/support/page.tsx` | L1 |
| `/alliance/toolbelt` | PAGE | Page | `app/alliance/toolbelt/page.tsx` | L1 |
| `/alliance/training` | PAGE | Page | `app/alliance/training/page.tsx` | L1 |
| `/api/acquisition/intelligence` | API | GET | `app/api/acquisition/intelligence/route.ts` | L1 |
| `/api/admin/activity` | API | GET | `app/api/admin/activity/route.ts` | L1 |
| `/api/admin/certification/[runId]/evidence` | API | POST | `app/api/admin/certification/[runId]/evidence/route.ts` | L1 |
| `/api/admin/certification/[runId]` | API | GET, POST | `app/api/admin/certification/[runId]/route.ts` | L1 |
| `/api/admin/certification` | API | GET, POST | `app/api/admin/certification/route.ts` | L1 |
| `/api/admin/close` | API | POST | `app/api/admin/close/route.ts` | L1 |
| `/api/admin/commissions` | API | GET, POST | `app/api/admin/commissions/route.ts` | L1 |
| `/api/admin/counsel` | API | GET, POST | `app/api/admin/counsel/route.ts` | L1 |
| `/api/admin/db-health` | API | GET | `app/api/admin/db-health/route.ts` | L1 |
| `/api/admin/discounts/comp-clear` | API | POST | `app/api/admin/discounts/comp-clear/route.ts` | L1 |
| `/api/admin/discounts/requests/[id]/approve` | API | POST | `app/api/admin/discounts/requests/[id]/approve/route.ts` | L1 |
| `/api/admin/discounts/requests` | API | GET | `app/api/admin/discounts/requests/route.ts` | L1 |
| `/api/admin/followups` | API | GET | `app/api/admin/followups/route.ts` | L1 |
| `/api/admin/founder-pricing-override` | API | POST | `app/api/admin/founder-pricing-override/route.ts` | L1 |
| `/api/admin/leaderboard` | API | GET | `app/api/admin/leaderboard/route.ts` | L1 |
| `/api/admin/matters/[id]/confirm-payment` | API | POST | `app/api/admin/matters/[id]/confirm-payment/route.ts` | L1 |
| `/api/admin/matters/[id]/status` | API | POST | `app/api/admin/matters/[id]/status/route.ts` | L1 |
| `/api/admin/move` | API | POST | `app/api/admin/move/route.ts` | L1 |
| `/api/admin/operators/[id]/approve` | API | POST | `app/api/admin/operators/[id]/approve/route.ts` | L1 |
| `/api/admin/operators/[id]/eligibility` | API | POST | `app/api/admin/operators/[id]/eligibility/route.ts` | L1 |
| `/api/admin/operators/[id]` | API | GET, PATCH | `app/api/admin/operators/[id]/route.ts` | L1 |
| `/api/admin/operators/accounts/[id]/binding` | API | POST | `app/api/admin/operators/accounts/[id]/binding/route.ts` | L1 |
| `/api/admin/operators/accounts/[id]/referral-code` | API | POST | `app/api/admin/operators/accounts/[id]/referral-code/route.ts` | L1 |
| `/api/admin/operators/accounts` | API | GET | `app/api/admin/operators/accounts/route.ts` | L1 |
| `/api/admin/operators` | API | GET, POST | `app/api/admin/operators/route.ts` | L1 |
| `/api/admin/override` | API | POST | `app/api/admin/override/route.ts` | L1 |
| `/api/admin/pipeline` | API | GET | `app/api/admin/pipeline/route.ts` | L1 |
| `/api/admin/pricing/quote` | API | POST | `app/api/admin/pricing/quote/route.ts` | L1 |
| `/api/admin/professionals/[id]/activate` | API | POST | `app/api/admin/professionals/[id]/activate/route.ts` | L1 |
| `/api/admin/professionals` | API | GET | `app/api/admin/professionals/route.ts` | L1 |
| `/api/admin/schema-inspect` | API | GET | `app/api/admin/schema-inspect/route.ts` | L1 |
| `/api/admin/scoring` | API | GET, POST | `app/api/admin/scoring/route.ts` | L1 |
| `/api/admin/seo/activation/actions/[id]` | API | PATCH | `app/api/admin/seo/activation/actions/[id]/route.ts` | L1 |
| `/api/admin/seo/activation/sync` | API | POST | `app/api/admin/seo/activation/sync/route.ts` | L1 |
| `/api/admin/seo/authority/placements/[id]` | API | PATCH | `app/api/admin/seo/authority/placements/[id]/route.ts` | L1 |
| `/api/admin/seo/authority/placements` | API | GET, POST | `app/api/admin/seo/authority/placements/route.ts` | L1 |
| `/api/admin/seo/authority/relationships/[id]` | API | PATCH | `app/api/admin/seo/authority/relationships/[id]/route.ts` | L1 |
| `/api/admin/seo/authority/relationships` | API | GET, POST | `app/api/admin/seo/authority/relationships/route.ts` | L1 |
| `/api/admin/seo/editorial/[country]/[document]` | API | PATCH | `app/api/admin/seo/editorial/[country]/[document]/route.ts` | L1 |
| `/api/admin/seo/editorial` | API | GET | `app/api/admin/seo/editorial/route.ts` | L1 |
| `/api/admin/seo/search-console/health` | API | GET | `app/api/admin/seo/search-console/health/route.ts` | L1 |
| `/api/admin/seo/search-console/sync` | API | POST | `app/api/admin/seo/search-console/sync/route.ts` | L1 |
| `/api/admin/sla-alerts` | API | GET | `app/api/admin/sla-alerts/route.ts` | L1 |
| `/api/admin/sla` | API | GET | `app/api/admin/sla/route.ts` | L1 |
| `/api/admin/tests/production-matter-ledger` | API | POST | `app/api/admin/tests/production-matter-ledger/route.ts` | L1 |
| `/api/admin/wise/diagnose` | API | GET | `app/api/admin/wise/diagnose/route.ts` | L1 |
| `/api/admin/wise/health` | API | GET | `app/api/admin/wise/health/route.ts` | L1 |
| `/api/admin/wise/payments` | API | GET | `app/api/admin/wise/payments/route.ts` | L1 |
| `/api/admin/wise/reconciliation-exceptions` | API | GET, POST | `app/api/admin/wise/reconciliation-exceptions/route.ts` | L1 |
| `/api/ai/generate` | API | POST | `app/api/ai/generate/route.ts` | L1 |
| `/api/ai/parse` | API | POST | `app/api/ai/parse/route.ts` | L1 |
| `/api/alliance/assistant` | API | POST | `app/api/alliance/assistant/route.ts` | L1 |
| `/api/alliance/benefits` | API | GET | `app/api/alliance/benefits/route.ts` | L1 |
| `/api/alliance/certification` | API | GET, POST | `app/api/alliance/certification/route.ts` | L1 |
| `/api/alliance/commissions` | API | GET | `app/api/alliance/commissions/route.ts` | L1 |
| `/api/alliance/dashboard` | API | GET | `app/api/alliance/dashboard/route.ts` | L1 |
| `/api/alliance/discounts/request` | API | POST | `app/api/alliance/discounts/request/route.ts` | L1 |
| `/api/alliance/documents` | API | GET | `app/api/alliance/documents/route.ts` | L1 |
| `/api/alliance/intake-links` | API | GET, POST | `app/api/alliance/intake-links/route.ts` | L1 |
| `/api/alliance/jobs/[id]/action` | API | POST | `app/api/alliance/jobs/[id]/action/route.ts` | L1 |
| `/api/alliance/jobs` | API | GET | `app/api/alliance/jobs/route.ts` | L1 |
| `/api/alliance/messages` | API | GET, POST | `app/api/alliance/messages/route.ts` | L1 |
| `/api/alliance/operator/availability` | API | GET, POST | `app/api/alliance/operator/availability/route.ts` | L1 |
| `/api/alliance/operator/profile` | API | GET | `app/api/alliance/operator/profile/route.ts` | L1 |
| `/api/alliance/operator/toolbelt` | API | PATCH | `app/api/alliance/operator/toolbelt/route.ts` | L1 |
| `/api/alliance/partner` | API | GET, POST | `app/api/alliance/partner/route.ts` | L1 |
| `/api/alliance/referrals/review` | API | POST | `app/api/alliance/referrals/review/route.ts` | L1 |
| `/api/alliance/referrals` | API | GET, POST | `app/api/alliance/referrals/route.ts` | L1 |
| `/api/alliance/submit` | API | POST | `app/api/alliance/submit/route.ts` | L1 |
| `/api/assistant` | API | POST | `app/api/assistant/route.ts` | L2 |
| `/api/auth/login` | API | POST | `app/api/auth/login/route.ts` | L1 |
| `/api/auth/password/reset-request` | API | POST | `app/api/auth/password/reset-request/route.ts` | L1 |
| `/api/auth/signout` | API | POST | `app/api/auth/signout/route.ts` | L1 |
| `/api/auth/signup` | API | POST | `app/api/auth/signup/route.ts` | L1 |
| `/api/compliance/[jurisdiction]` | API | GET | `app/api/compliance/[jurisdiction]/route.ts` | L1 |
| `/api/compliance/country/[country]` | API | GET | `app/api/compliance/country/[country]/route.ts` | L1 |
| `/api/compliance/intelligence` | API | GET | `app/api/compliance/intelligence/route.ts` | L1 |
| `/api/compliance/list/[code]` | API | GET | `app/api/compliance/list/[code]/route.ts` | L1 |
| `/api/compliance/list` | API | GET | `app/api/compliance/list/route.ts` | L1 |
| `/api/complimentary/report` | API | GET | `app/api/complimentary/report/route.ts` | L1 |
| `/api/concierge` | API | POST | `app/api/concierge/route.ts` | L1 |
| `/api/counsel` | API | POST | `app/api/counsel/route.ts` | L1 |
| `/api/courier/active` | API | GET | `app/api/courier/active/route.ts` | L1 |
| `/api/courier/labels` | API | POST | `app/api/courier/labels/route.ts` | L1 |
| `/api/courier/rates` | API | POST | `app/api/courier/rates/route.ts` | L1 |
| `/api/courier/tracking/[matterId]` | API | GET | `app/api/courier/tracking/[matterId]/route.ts` | L1 |
| `/api/courier/webhook` | API | POST | `app/api/courier/webhook/route.ts` | L1 |
| `/api/cron/authority-freshness` | API | GET, POST | `app/api/cron/authority-freshness/route.ts` | L1 |
| `/api/cron/authority-monitor` | API | GET, POST | `app/api/cron/authority-monitor/route.ts` | L1 |
| `/api/cron/governance` | API | GET | `app/api/cron/governance/route.ts` | L1 |
| `/api/cron/notification-reconcile` | API | GET, POST | `app/api/cron/notification-reconcile/route.ts` | L1 |
| `/api/cron/seo-search-console` | API | GET | `app/api/cron/seo-search-console/route.ts` | L1 |
| `/api/cron/sla-watch` | API | GET, POST | `app/api/cron/sla-watch/route.ts` | L1 |
| `/api/cron/track-shipments` | API | GET, POST | `app/api/cron/track-shipments/route.ts` | L1 |
| `/api/cron/wise-payment-reconcile` | API | GET | `app/api/cron/wise-payment-reconcile/route.ts` | L1 |
| `/api/dashboard/access-audit` | API | GET | `app/api/dashboard/access-audit/route.ts` | L1 |
| `/api/dashboard/active-timeline` | API | GET | `app/api/dashboard/active-timeline/route.ts` | L1 |
| `/api/dashboard/atlas-governance` | API | GET, PATCH | `app/api/dashboard/atlas-governance/route.ts` | L1 |
| `/api/dashboard/authority-reviews/[id]` | API | PATCH | `app/api/dashboard/authority-reviews/[id]/route.ts` | L1 |
| `/api/dashboard/authority-reviews` | API | GET | `app/api/dashboard/authority-reviews/route.ts` | L1 |
| `/api/dashboard/autopilot` | API | GET | `app/api/dashboard/autopilot/route.ts` | L1 |
| `/api/dashboard/certificates/generate` | API | POST | `app/api/dashboard/certificates/generate/route.ts` | L1 |
| `/api/dashboard/control-plane/governance/metrics` | API | POST | `app/api/dashboard/control-plane/governance/metrics/route.ts` | L1 |
| `/api/dashboard/control-plane/governance` | API | GET, POST | `app/api/dashboard/control-plane/governance/route.ts` | L1 |
| `/api/dashboard/control-plane/governance/run` | API | POST | `app/api/dashboard/control-plane/governance/run/route.ts` | L1 |
| `/api/dashboard/country-ops` | API | GET | `app/api/dashboard/country-ops/route.ts` | L1 |
| `/api/dashboard/custody/[matterId]` | API | GET, POST | `app/api/dashboard/custody/[matterId]/route.ts` | L1 |
| `/api/dashboard/destination-intelligence` | API | GET | `app/api/dashboard/destination-intelligence/route.ts` | L1 |
| `/api/dashboard/discounts/report` | API | GET | `app/api/dashboard/discounts/report/route.ts` | L1 |
| `/api/dashboard/discounts` | API | GET, POST, PATCH | `app/api/dashboard/discounts/route.ts` | L1 |
| `/api/dashboard/exceptions` | API | GET | `app/api/dashboard/exceptions/route.ts` | L1 |
| `/api/dashboard/execution-control` | API | GET | `app/api/dashboard/execution-control/route.ts` | L1 |
| `/api/dashboard/execution-intelligence` | API | GET | `app/api/dashboard/execution-intelligence/route.ts` | L1 |
| `/api/dashboard/execution-qa/[matterId]/block` | API | POST | `app/api/dashboard/execution-qa/[matterId]/block/route.ts` | L1 |
| `/api/dashboard/execution-qa/[matterId]/pass` | API | POST | `app/api/dashboard/execution-qa/[matterId]/pass/route.ts` | L1 |
| `/api/dashboard/execution-qa/[matterId]` | API | GET | `app/api/dashboard/execution-qa/[matterId]/route.ts` | L1 |
| `/api/dashboard/execution-qa/[matterId]/witness-complete` | API | POST | `app/api/dashboard/execution-qa/[matterId]/witness-complete/route.ts` | L1 |
| `/api/dashboard/execution-qa` | API | GET, POST | `app/api/dashboard/execution-qa/route.ts` | L1 |
| `/api/dashboard/execution-readiness` | API | GET | `app/api/dashboard/execution-readiness/route.ts` | L1 |
| `/api/dashboard/executive` | API | GET | `app/api/dashboard/executive/route.ts` | L1 |
| `/api/dashboard/failure-check/[matterId]` | API | GET | `app/api/dashboard/failure-check/[matterId]/route.ts` | L1 |
| `/api/dashboard/global-execution-motion` | API | GET | `app/api/dashboard/global-execution-motion/route.ts` | L1 |
| `/api/dashboard/incidents` | API | GET, POST, PATCH | `app/api/dashboard/incidents/route.ts` | L1 |
| `/api/dashboard/intelligence` | API | GET | `app/api/dashboard/intelligence/route.ts` | L1 |
| `/api/dashboard/leads/[id]/matter` | API | POST | `app/api/dashboard/leads/[id]/matter/route.ts` | L1 |
| `/api/dashboard/matter-detail/[id]` | API | GET | `app/api/dashboard/matter-detail/[id]/route.ts` | L1 |
| `/api/dashboard/matters/[id]/authority-packet` | API | GET, POST | `app/api/dashboard/matters/[id]/authority-packet/route.ts` | L1 |
| `/api/dashboard/matters/[id]/execution-intelligence` | API | GET | `app/api/dashboard/matters/[id]/execution-intelligence/route.ts` | L1 |
| `/api/dashboard/matters/[id]/execution-review` | API | POST | `app/api/dashboard/matters/[id]/execution-review/route.ts` | L1 |
| `/api/dashboard/matters/[id]/execution-truth` | API | PATCH | `app/api/dashboard/matters/[id]/execution-truth/route.ts` | L1 |
| `/api/dashboard/matters/[id]/institutional` | API | GET, POST | `app/api/dashboard/matters/[id]/institutional/route.ts` | L1 |
| `/api/dashboard/matters/[id]/mark-lost` | API | POST | `app/api/dashboard/matters/[id]/mark-lost/route.ts` | L1 |
| `/api/dashboard/matters/[id]/paper-out` | API | GET, POST | `app/api/dashboard/matters/[id]/paper-out/route.ts` | L1 |
| `/api/dashboard/matters/[id]/ron-posture` | API | PATCH | `app/api/dashboard/matters/[id]/ron-posture/route.ts` | L1 |
| `/api/dashboard/matters` | API | GET | `app/api/dashboard/matters/route.ts` | L1 |
| `/api/dashboard/operational-log` | API | GET | `app/api/dashboard/operational-log/route.ts` | L1 |
| `/api/dashboard/operator-intelligence` | API | GET | `app/api/dashboard/operator-intelligence/route.ts` | L1 |
| `/api/dashboard/orb/chat` | API | POST | `app/api/dashboard/orb/chat/route.ts` | L1 |
| `/api/dashboard/payments` | API | GET | `app/api/dashboard/payments/route.ts` | L1 |
| `/api/dashboard/pipeline` | API | GET | `app/api/dashboard/pipeline/route.ts` | L1 |
| `/api/dashboard/policies` | API | GET, POST | `app/api/dashboard/policies/route.ts` | L1 |
| `/api/dashboard/quick-actions` | API | GET | `app/api/dashboard/quick-actions/route.ts` | L1 |
| `/api/dashboard/readiness/[matterId]` | API | GET | `app/api/dashboard/readiness/[matterId]/route.ts` | L1 |
| `/api/dashboard/receiving-authorities/[id]/requirements` | API | GET, POST | `app/api/dashboard/receiving-authorities/[id]/requirements/route.ts` | L1 |
| `/api/dashboard/receiving-authorities/[id]` | API | GET, PATCH, DELETE | `app/api/dashboard/receiving-authorities/[id]/route.ts` | L1 |
| `/api/dashboard/receiving-authorities` | API | GET, POST | `app/api/dashboard/receiving-authorities/route.ts` | L1 |
| `/api/dashboard/recent-activity` | API | GET | `app/api/dashboard/recent-activity/route.ts` | L1 |
| `/api/dashboard/referral-ledger` | API | GET, POST | `app/api/dashboard/referral-ledger/route.ts` | L1 |
| `/api/dashboard/rejections` | API | GET | `app/api/dashboard/rejections/route.ts` | L1 |
| `/api/dashboard/release-certificates` | API | GET, POST | `app/api/dashboard/release-certificates/route.ts` | L1 |
| `/api/dashboard/releases` | API | GET | `app/api/dashboard/releases/route.ts` | L1 |
| `/api/dashboard/retention` | API | GET, POST | `app/api/dashboard/retention/route.ts` | L1 |
| `/api/dashboard/revenue` | API | GET | `app/api/dashboard/revenue/route.ts` | L1 |
| `/api/dashboard/ron/records-requests/[id]` | API | POST | `app/api/dashboard/ron/records-requests/[id]/route.ts` | L1 |
| `/api/dashboard/ron/records-requests` | API | GET, POST | `app/api/dashboard/ron/records-requests/route.ts` | L1 |
| `/api/dashboard/ron/security-incidents` | API | GET, POST | `app/api/dashboard/ron/security-incidents/route.ts` | L1 |
| `/api/dashboard/ron/sessions/[id]/advance-to-apostille` | API | POST | `app/api/dashboard/ron/sessions/[id]/advance-to-apostille/route.ts` | L1 |
| `/api/dashboard/ron/sessions/[id]/apostille-qa` | API | POST | `app/api/dashboard/ron/sessions/[id]/apostille-qa/route.ts` | L1 |
| `/api/dashboard/ron/sessions/[id]/documents` | API | POST | `app/api/dashboard/ron/sessions/[id]/documents/route.ts` | L1 |
| `/api/dashboard/ron/sessions/[id]/evidence` | API | GET, POST | `app/api/dashboard/ron/sessions/[id]/evidence/route.ts` | L1 |
| `/api/dashboard/ron/sessions/[id]/evidence/verify` | API | POST | `app/api/dashboard/ron/sessions/[id]/evidence/verify/route.ts` | L1 |
| `/api/dashboard/ron/sessions/[id]/expire` | API | PUT | `app/api/dashboard/ron/sessions/[id]/expire/route.ts` | L1 |
| `/api/dashboard/ron/sessions/[id]/reschedule` | API | PUT | `app/api/dashboard/ron/sessions/[id]/reschedule/route.ts` | L1 |
| `/api/dashboard/ron/sessions/[id]` | API | GET | `app/api/dashboard/ron/sessions/[id]/route.ts` | L1 |
| `/api/dashboard/ron/sessions/[id]/signed-documents` | API | POST | `app/api/dashboard/ron/sessions/[id]/signed-documents/route.ts` | L1 |
| `/api/dashboard/ron/sessions/[id]/statutory-evidence/reopen` | API | POST | `app/api/dashboard/ron/sessions/[id]/statutory-evidence/reopen/route.ts` | L1 |
| `/api/dashboard/ron/sessions/[id]/statutory-evidence` | API | POST | `app/api/dashboard/ron/sessions/[id]/statutory-evidence/route.ts` | L1 |
| `/api/dashboard/ron/sessions` | API | GET, POST | `app/api/dashboard/ron/sessions/route.ts` | L1 |
| `/api/dashboard/session-playbook/[matterId]` | API | GET | `app/api/dashboard/session-playbook/[matterId]/route.ts` | L1 |
| `/api/dashboard/shippo/delivered-not-released` | API | GET | `app/api/dashboard/shippo/delivered-not-released/route.ts` | L1 |
| `/api/dashboard/shippo/health` | API | GET | `app/api/dashboard/shippo/health/route.ts` | L1 |
| `/api/dashboard/shippo/labels` | API | POST | `app/api/dashboard/shippo/labels/route.ts` | L1 |
| `/api/dashboard/shippo/rates` | API | POST, PATCH | `app/api/dashboard/shippo/rates/route.ts` | L1 |
| `/api/dashboard/shippo/shipments` | API | GET | `app/api/dashboard/shippo/shipments/route.ts` | L1 |
| `/api/dashboard/shippo/tracking` | API | POST | `app/api/dashboard/shippo/tracking/route.ts` | L1 |
| `/api/dashboard/sops/[id]` | API | GET, PUT | `app/api/dashboard/sops/[id]/route.ts` | L1 |
| `/api/dashboard/sops/[id]/versions` | API | GET | `app/api/dashboard/sops/[id]/versions/route.ts` | L1 |
| `/api/dashboard/sops` | API | GET, POST | `app/api/dashboard/sops/route.ts` | L1 |
| `/api/dashboard/stagnation` | API | GET | `app/api/dashboard/stagnation/route.ts` | L1 |
| `/api/dashboard/state-authorities/[id]/processing-observations` | API | GET, POST | `app/api/dashboard/state-authorities/[id]/processing-observations/route.ts` | L1 |
| `/api/dashboard/state-authorities/[id]` | API | PATCH | `app/api/dashboard/state-authorities/[id]/route.ts` | L1 |
| `/api/dashboard/state-authorities/assets/[id]` | API | PATCH | `app/api/dashboard/state-authorities/assets/[id]/route.ts` | L1 |
| `/api/dashboard/state-authorities` | API | GET | `app/api/dashboard/state-authorities/route.ts` | L1 |
| `/api/dashboard/summary` | API | GET | `app/api/dashboard/summary/route.ts` | L1 |
| `/api/dashboard/top-stats` | API | GET | `app/api/dashboard/top-stats/route.ts` | L1 |
| `/api/dashboard/trust-alerts` | API | GET | `app/api/dashboard/trust-alerts/route.ts` | L1 |
| `/api/dashboard/va-tasks` | API | GET | `app/api/dashboard/va-tasks/route.ts` | L1 |
| `/api/dashboard/va/tasks/assign` | API | POST | `app/api/dashboard/va/tasks/assign/route.ts` | L1 |
| `/api/dashboard/va/tasks` | API | GET | `app/api/dashboard/va/tasks/route.ts` | L1 |
| `/api/dashboard/witness-network` | API | GET, POST | `app/api/dashboard/witness-network/route.ts` | L1 |
| `/api/deals/[id]/activity` | API | GET | `app/api/deals/[id]/activity/route.ts` | L1 |
| `/api/deals/[id]/apostille` | API | POST | `app/api/deals/[id]/apostille/route.ts` | L1 |
| `/api/deals/[id]/apply-discount` | API | POST, DELETE | `app/api/deals/[id]/apply-discount/route.ts` | L1 |
| `/api/deals/[id]/custody` | API | GET | `app/api/deals/[id]/custody/route.ts` | L1 |
| `/api/deals/[id]/execute` | API | POST | `app/api/deals/[id]/execute/route.ts` | L1 |
| `/api/deals/[id]/messages` | API | GET, POST | `app/api/deals/[id]/messages/route.ts` | L1 |
| `/api/deals/[id]/pay` | API | POST | `app/api/deals/[id]/pay/route.ts` | L1 |
| `/api/deals/[id]/payment/confirm-final` | API | POST | `app/api/deals/[id]/payment/confirm-final/route.ts` | L1 |
| `/api/deals/[id]/payment/manual-confirm` | API | POST | `app/api/deals/[id]/payment/manual-confirm/route.ts` | L1 |
| `/api/deals/[id]/payment/request-final` | API | POST | `app/api/deals/[id]/payment/request-final/route.ts` | L1 |
| `/api/deals/[id]/payment` | API | POST | `app/api/deals/[id]/payment/route.ts` | L1 |
| `/api/deals/[id]/quote` | API | GET, POST | `app/api/deals/[id]/quote/route.ts` | L1 |
| `/api/deals/[id]/release` | API | POST | `app/api/deals/[id]/release/route.ts` | L1 |
| `/api/deals/[id]` | API | GET, PATCH | `app/api/deals/[id]/route.ts` | L1 |
| `/api/deals/[id]/schedule` | API | POST | `app/api/deals/[id]/schedule/route.ts` | L1 |
| `/api/deals/[id]/shipment-legs/[legId]/dispatch` | API | POST | `app/api/deals/[id]/shipment-legs/[legId]/dispatch/route.ts` | L1 |
| `/api/deals/[id]/shipment-legs/[legId]/label` | API | GET, POST | `app/api/deals/[id]/shipment-legs/[legId]/label/route.ts` | L1 |
| `/api/deals/[id]/shipment-legs/[legId]/rates` | API | POST | `app/api/deals/[id]/shipment-legs/[legId]/rates/route.ts` | L1 |
| `/api/deals/[id]/shipment-legs` | API | GET, POST | `app/api/deals/[id]/shipment-legs/route.ts` | L1 |
| `/api/deals` | API | GET | `app/api/deals/route.ts` | L1 |
| `/api/debug/session` | API | GET | `app/api/debug/session/route.ts` | L1 |
| `/api/debug/supabase-env` | API | GET | `app/api/debug/supabase-env/route.ts` | L1 |
| `/api/debug/supabase` | API | GET | `app/api/debug/supabase/route.ts` | L1 |
| `/api/dispatch/assign` | API | GET, POST | `app/api/dispatch/assign/route.ts` | L1 |
| `/api/dispatch/escalate` | API | GET, POST | `app/api/dispatch/escalate/route.ts` | L1 |
| `/api/dispatch/jobs/[id]` | API | GET, POST | `app/api/dispatch/jobs/[id]/route.ts` | L1 |
| `/api/dispatch/jobs` | API | GET, POST | `app/api/dispatch/jobs/route.ts` | L1 |
| `/api/dispatch/reassign` | API | GET, POST | `app/api/dispatch/reassign/route.ts` | L1 |
| `/api/dispatch/request` | API | GET, POST | `app/api/dispatch/request/route.ts` | L1 |
| `/api/evidence/[id]` | API | GET | `app/api/evidence/[id]/route.ts` | L1 |
| `/api/export/[id]` | API | GET | `app/api/export/[id]/route.ts` | L1 |
| `/api/follow-ups/[id]` | API | PATCH | `app/api/follow-ups/[id]/route.ts` | L1 |
| `/api/follow-ups` | API | GET | `app/api/follow-ups/route.ts` | L1 |
| `/api/health/assistant` | API | GET | `app/api/health/assistant/route.ts` | L1 |
| `/api/health/database` | API | GET | `app/api/health/database/route.ts` | L1 |
| `/api/health/dispatch` | API | GET | `app/api/health/dispatch/route.ts` | L1 |
| `/api/health/payment` | API | GET | `app/api/health/payment/route.ts` | L1 |
| `/api/health` | API | GET | `app/api/health/route.ts` | L1 |
| `/api/health/storage` | API | GET | `app/api/health/storage/route.ts` | L1 |
| `/api/health/webhooks` | API | GET | `app/api/health/webhooks/route.ts` | L1 |
| `/api/intake/analytics` | API | POST | `app/api/intake/analytics/route.ts` | L1 |
| `/api/intake/extract` | API | POST | `app/api/intake/extract/route.ts` | L2 |
| `/api/intake/quote-preview` | API | POST | `app/api/intake/quote-preview/route.ts` | L1 |
| `/api/intake` | API | POST | `app/api/intake/route.ts` | L1 |
| `/api/intake/upload` | API | POST | `app/api/intake/upload/route.ts` | L1 |
| `/api/intel` | API | GET, POST | `app/api/intel/route.ts` | L1 |
| `/api/intelligence/generate` | API | POST | `app/api/intelligence/generate/route.ts` | L1 |
| `/api/internal/e2e/log-event` | API | POST | `app/api/internal/e2e/log-event/route.ts` | L1 |
| `/api/internal/e2e/seed` | API | POST | `app/api/internal/e2e/seed/route.ts` | L1 |
| `/api/internal/e2e/status` | API | GET | `app/api/internal/e2e/status/route.ts` | L1 |
| `/api/matter-intelligence` | API | GET | `app/api/matter-intelligence/route.ts` | L1 |
| `/api/matters/[matterId]/complimentary/authorize` | API | POST | `app/api/matters/[matterId]/complimentary/authorize/route.ts` | L1 |
| `/api/matters/[matterId]/complimentary/request` | API | POST | `app/api/matters/[matterId]/complimentary/request/route.ts` | L1 |
| `/api/matters/[matterId]/complimentary/revoke` | API | POST | `app/api/matters/[matterId]/complimentary/revoke/route.ts` | L1 |
| `/api/matters/[matterId]/complimentary` | API | GET | `app/api/matters/[matterId]/complimentary/route.ts` | L1 |
| `/api/notary/apply` | API | POST | `app/api/notary/apply/route.ts` | L1 |
| `/api/notary/credentials` | API | GET, PATCH | `app/api/notary/credentials/route.ts` | L1 |
| `/api/policy/active/[id]` | API | GET | `app/api/policy/active/[id]/route.ts` | L1 |
| `/api/policy/active` | API | GET | `app/api/policy/active/route.ts` | L1 |
| `/api/portal/assistant` | API | POST | `app/api/portal/assistant/route.ts` | L1 |
| `/api/portal/check-email` | API | GET, POST | `app/api/portal/check-email/route.ts` | L1 |
| `/api/portal/confirm` | API | POST | `app/api/portal/confirm/route.ts` | L1 |
| `/api/portal/files/[id]/download` | API | GET | `app/api/portal/files/[id]/download/route.ts` | L1 |
| `/api/portal/files` | API | GET | `app/api/portal/files/route.ts` | L1 |
| `/api/portal/me/certificate` | API | GET | `app/api/portal/me/certificate/route.ts` | L1 |
| `/api/portal/me/clarifications` | API | GET, POST | `app/api/portal/me/clarifications/route.ts` | L1 |
| `/api/portal/me/courier` | API | GET | `app/api/portal/me/courier/route.ts` | L1 |
| `/api/portal/me/discount` | API | POST | `app/api/portal/me/discount/route.ts` | L1 |
| `/api/portal/me/documents` | API | GET | `app/api/portal/me/documents/route.ts` | L1 |
| `/api/portal/me/invoice` | API | GET, POST | `app/api/portal/me/invoice/route.ts` | L1 |
| `/api/portal/me/matter-intelligence-v2` | API | GET | `app/api/portal/me/matter-intelligence-v2/route.ts` | L1 |
| `/api/portal/me/matter-intelligence` | API | GET | `app/api/portal/me/matter-intelligence/route.ts` | L1 |
| `/api/portal/me/messages` | API | GET, POST | `app/api/portal/me/messages/route.ts` | L1 |
| `/api/portal/me/notifications` | API | GET | `app/api/portal/me/notifications/route.ts` | L1 |
| `/api/portal/me/payment-observation` | API | GET, POST, PUT, PATCH | `app/api/portal/me/payment-observation/route.ts` | L1 |
| `/api/portal/me/policy-acceptance` | API | GET, POST | `app/api/portal/me/policy-acceptance/route.ts` | L1 |
| `/api/portal/me/readiness` | API | GET | `app/api/portal/me/readiness/route.ts` | L1 |
| `/api/portal/me/ron` | API | GET | `app/api/portal/me/ron/route.ts` | L1 |
| `/api/portal/me` | API | GET | `app/api/portal/me/route.ts` | L1 |
| `/api/portal/me/timeline` | API | GET | `app/api/portal/me/timeline/route.ts` | L1 |
| `/api/portal/me/tracking` | API | GET | `app/api/portal/me/tracking/route.ts` | L1 |
| `/api/portal/me/upload` | API | POST | `app/api/portal/me/upload/route.ts` | L1 |
| `/api/portal/verify` | API | POST | `app/api/portal/verify/route.ts` | L1 |
| `/api/pricing/quote` | API | POST | `app/api/pricing/quote/route.ts` | L1 |
| `/api/pricing/request` | API | POST | `app/api/pricing/request/route.ts` | L1 |
| `/api/pricing/request/upload` | API | POST | `app/api/pricing/request/upload/route.ts` | L1 |
| `/api/professional/account` | API | GET, PATCH | `app/api/professional/account/route.ts` | L1 |
| `/api/professional/handoff` | API | POST | `app/api/professional/handoff/route.ts` | L1 |
| `/api/professional/matters` | API | GET, POST | `app/api/professional/matters/route.ts` | L1 |
| `/api/professional/profile` | API | POST | `app/api/professional/profile/route.ts` | L1 |
| `/api/public/payment-status` | API | GET | `app/api/public/payment-status/route.ts` | L1 |
| `/api/revenue/intelligence` | API | GET | `app/api/revenue/intelligence/route.ts` | L1 |
| `/api/review-requests/[id]/link-matter` | API | POST | `app/api/review-requests/[id]/link-matter/route.ts` | L1 |
| `/api/review-requests/[id]` | API | PATCH | `app/api/review-requests/[id]/route.ts` | L1 |
| `/api/review-requests` | API | GET, POST | `app/api/review-requests/route.ts` | L1 |
| `/api/reviews/request` | API | POST | `app/api/reviews/request/route.ts` | L1 |
| `/api` | API | POST | `app/api/route.ts` | L1 |
| `/api/runStep` | API | POST | `app/api/runStep/route.ts` | L1 |
| `/api/sales/capture` | API | POST | `app/api/sales/capture/route.ts` | L2 |
| `/api/shipping/create-label/[id]` | API | POST | `app/api/shipping/create-label/[id]/route.ts` | L1 |
| `/api/tools/courier` | API | POST | `app/api/tools/courier/route.ts` | L1 |
| `/api/tools/embassy` | API | POST | `app/api/tools/embassy/route.ts` | L1 |
| `/api/tools/hague` | API | POST | `app/api/tools/hague/route.ts` | L1 |
| `/api/tools/legalization` | API | POST | `app/api/tools/legalization/route.ts` | L1 |
| `/api/tools/ron` | API | POST | `app/api/tools/ron/route.ts` | L1 |
| `/api/tools/signer` | API | POST | `app/api/tools/signer/route.ts` | L1 |
| `/api/tools/translation` | API | POST | `app/api/tools/translation/route.ts` | L1 |
| `/api/upload` | API | POST | `app/api/upload/route.ts` | L1 |
| `/api/va/assistant` | API | POST | `app/api/va/assistant/route.ts` | L1 |
| `/api/va/checklists` | API | GET | `app/api/va/checklists/route.ts` | L1 |
| `/api/va/courier/tasks` | API | GET | `app/api/va/courier/tasks/route.ts` | L1 |
| `/api/va/events` | API | GET | `app/api/va/events/route.ts` | L1 |
| `/api/va/matters/[id]` | API | GET | `app/api/va/matters/[id]/route.ts` | L1 |
| `/api/va/matters` | API | GET | `app/api/va/matters/route.ts` | L1 |
| `/api/va/me` | API | GET | `app/api/va/me/route.ts` | L1 |
| `/api/va/messages/drafts/[id]` | API | GET, PATCH | `app/api/va/messages/drafts/[id]/route.ts` | L1 |
| `/api/va/messages/drafts` | API | GET, POST | `app/api/va/messages/drafts/route.ts` | L1 |
| `/api/va/ron/tasks` | API | GET | `app/api/va/ron/tasks/route.ts` | L1 |
| `/api/va/sops` | API | GET | `app/api/va/sops/route.ts` | L1 |
| `/api/va/tasks/[id]/complete` | API | POST | `app/api/va/tasks/[id]/complete/route.ts` | L1 |
| `/api/va/tasks/[id]/escalate` | API | POST | `app/api/va/tasks/[id]/escalate/route.ts` | L1 |
| `/api/va/tasks/[id]` | API | GET | `app/api/va/tasks/[id]/route.ts` | L1 |
| `/api/va/tasks` | API | GET | `app/api/va/tasks/route.ts` | L1 |
| `/api/va/uploads` | API | GET | `app/api/va/uploads/route.ts` | L1 |
| `/api/verify/[verificationId]` | API | GET, POST | `app/api/verify/[verificationId]/route.ts` | L1 |
| `/api/webhooks/alliance/credential` | API | GET, POST | `app/api/webhooks/alliance/credential/route.ts` | L1 |
| `/api/webhooks/alliance/job` | API | GET, POST | `app/api/webhooks/alliance/job/route.ts` | L1 |
| `/api/webhooks/alliance/toolbelt` | API | GET, POST | `app/api/webhooks/alliance/toolbelt/route.ts` | L1 |
| `/api/webhooks/bluenotary` | API | GET, POST | `app/api/webhooks/bluenotary/route.ts` | L1 |
| `/api/webhooks/resend` | API | POST | `app/api/webhooks/resend/route.ts` | L1 |
| `/api/webhooks/wise` | API | GET, POST | `app/api/webhooks/wise/route.ts` | L1 |
| `/apostille-intel/[country]/[document]` | PAGE | Page | `app/apostille-intel/[country]/[document]/page.tsx` | L1 |
| `/apostille-intel` | PAGE | Page | `app/apostille-intel/page.tsx` | L1 |
| `/apostille/[country]/[document]/[use-case]` | PAGE | Page | `app/apostille/[country]/[document]/[use-case]/page.tsx` | L1 |
| `/apostille/[country]/[document]` | PAGE | Page | `app/apostille/[country]/[document]/page.tsx` | L1 |
| `/apostille/[country]/authority/[authority]/[document]` | PAGE | Page | `app/apostille/[country]/authority/[authority]/[document]/page.tsx` | L1 |
| `/apostille/[country]` | PAGE | Page | `app/apostille/[country]/page.tsx` | L1 |
| `/apostille/us/[state]` | PAGE | Page | `app/apostille/us/[state]/page.tsx` | L1 |
| `/apostille/us` | PAGE | Page | `app/apostille/us/page.tsx` | L1 |
| `/auth/callback` | API | GET | `app/auth/callback/route.ts` | L1 |
| `/auth/recovery` | API | GET | `app/auth/recovery/route.ts` | L1 |
| `/blog` | PAGE | Page | `app/blog/page.tsx` | L1 |
| `/book` | PAGE | Page | `app/book/page.tsx` | L1 |
| `/bradenton/apostille-services` | PAGE | Page | `app/bradenton/apostille-services/page.tsx` | L1 |
| `/brandon/apostille-services` | PAGE | Page | `app/brandon/apostille-services/page.tsx` | L1 |
| `/case-studies/colorado-italy-consulate-miami` | PAGE | Page | `app/case-studies/colorado-italy-consulate-miami/page.tsx` | L1 |
| `/clearwater/apostille-services` | PAGE | Page | `app/clearwater/apostille-services/page.tsx` | L1 |
| `/contact` | PAGE | Page | `app/contact/page.tsx` | L1 |
| `/counsel/corridors` | PAGE | Page | `app/counsel/corridors/page.tsx` | L1 |
| `/counsel` | PAGE | Page | `app/counsel/page.tsx` | L1 |
| `/counsel/use-cases/[useCase]` | PAGE | Page | `app/counsel/use-cases/[useCase]/page.tsx` | L1 |
| `/counsel/use-cases` | PAGE | Page | `app/counsel/use-cases/page.tsx` | L1 |
| `/countries/[country]` | PAGE | Page | `app/countries/[country]/page.tsx` | L1 |
| `/countries` | PAGE | Page | `app/countries/page.tsx` | L1 |
| `/dashboard/[module]` | PAGE | Page | `app/dashboard/[module]/page.tsx` | L1 |
| `/dashboard/acquisition` | PAGE | Page | `app/dashboard/acquisition/page.tsx` | L1 |
| `/dashboard/admin` | PAGE | Page | `app/dashboard/admin/page.tsx` | L1 |
| `/dashboard/admin/payments` | PAGE | Page | `app/dashboard/admin/payments/page.tsx` | L1 |
| `/dashboard/admin/reconciliation` | PAGE | Page | `app/dashboard/admin/reconciliation/page.tsx` | L1 |
| `/dashboard/admin/validate` | PAGE | Page | `app/dashboard/admin/validate/page.jsx` | L1 |
| `/dashboard/ads` | PAGE | Page | `app/dashboard/ads/page.tsx` | L1 |
| `/dashboard/alliance/accounts` | PAGE | Page | `app/dashboard/alliance/accounts/page.tsx` | L1 |
| `/dashboard/alliance/dispatch` | PAGE | Page | `app/dashboard/alliance/dispatch/page.tsx` | L1 |
| `/dashboard/alliance/intelligence-platform` | PAGE | Page | `app/dashboard/alliance/intelligence-platform/page.tsx` | L1 |
| `/dashboard/alliance` | PAGE | Page | `app/dashboard/alliance/page.tsx` | L1 |
| `/dashboard/alliance/platform` | PAGE | Page | `app/dashboard/alliance/platform/page.tsx` | L1 |
| `/dashboard/alliance/quality` | PAGE | Page | `app/dashboard/alliance/quality/page.tsx` | L1 |
| `/dashboard/alliance/referrals` | PAGE | Page | `app/dashboard/alliance/referrals/page.tsx` | L1 |
| `/dashboard/alliance/ron-coverage` | PAGE | Page | `app/dashboard/alliance/ron-coverage/page.tsx` | L1 |
| `/dashboard/alliance/trust-graph` | PAGE | Page | `app/dashboard/alliance/trust-graph/page.tsx` | L1 |
| `/dashboard/alliance/vault` | PAGE | Page | `app/dashboard/alliance/vault/page.tsx` | L1 |
| `/dashboard/analytics` | PAGE | Page | `app/dashboard/analytics/page.tsx` | L1 |
| `/dashboard/apostille-rules` | PAGE | Page | `app/dashboard/apostille-rules/page.tsx` | L1 |
| `/dashboard/apostille` | PAGE | Page | `app/dashboard/apostille/page.tsx` | L1 |
| `/dashboard/assets` | PAGE | Page | `app/dashboard/assets/page.tsx` | L1 |
| `/dashboard/atlas` | PAGE | Page | `app/dashboard/atlas/page.tsx` | L1 |
| `/dashboard/authorities/[id]/requirements` | PAGE | Page | `app/dashboard/authorities/[id]/requirements/page.tsx` | L1 |
| `/dashboard/authorities` | PAGE | Page | `app/dashboard/authorities/page.tsx` | L1 |
| `/dashboard/authorities/verify` | PAGE | Page | `app/dashboard/authorities/verify/page.tsx` | L1 |
| `/dashboard/authority-acquisition` | PAGE | Page | `app/dashboard/authority-acquisition/page.tsx` | L1 |
| `/dashboard/authority-research` | PAGE | Page | `app/dashboard/authority-research/page.tsx` | L1 |
| `/dashboard/automation` | PAGE | Page | `app/dashboard/automation/page.tsx` | L1 |
| `/dashboard/booking-intake` | PAGE | Page | `app/dashboard/booking-intake/page.tsx` | L1 |
| `/dashboard/build-center` | PAGE | Page | `app/dashboard/build-center/page.tsx` | L1 |
| `/dashboard/certification` | PAGE | Page | `app/dashboard/certification/page.tsx` | L1 |
| `/dashboard/command-center` | PAGE | Page | `app/dashboard/command-center/page.tsx` | L1 |
| `/dashboard/command` | PAGE | Page | `app/dashboard/command/page.tsx` | L1 |
| `/dashboard/commercial/intelligence` | PAGE | Page | `app/dashboard/commercial/intelligence/page.tsx` | L1 |
| `/dashboard/commercial` | PAGE | Page | `app/dashboard/commercial/page.tsx` | L1 |
| `/dashboard/completion` | PAGE | Page | `app/dashboard/completion/page.tsx` | L1 |
| `/dashboard/compliance-atlas` | PAGE | Page | `app/dashboard/compliance-atlas/page.tsx` | L1 |
| `/dashboard/compliance` | PAGE | Page | `app/dashboard/compliance/page.tsx` | L1 |
| `/dashboard/content` | PAGE | Page | `app/dashboard/content/page.tsx` | L1 |
| `/dashboard/control-plane/board-room` | PAGE | Page | `app/dashboard/control-plane/board-room/page.tsx` | L1 |
| `/dashboard/control-plane` | PAGE | Page | `app/dashboard/control-plane/page.tsx` | L1 |
| `/dashboard/conversion` | PAGE | Page | `app/dashboard/conversion/page.tsx` | L1 |
| `/dashboard/copilot` | PAGE | Page | `app/dashboard/copilot/page.tsx` | L1 |
| `/dashboard/corridors/certification` | PAGE | Page | `app/dashboard/corridors/certification/page.tsx` | L1 |
| `/dashboard/corridors` | PAGE | Page | `app/dashboard/corridors/page.tsx` | L1 |
| `/dashboard/countries` | PAGE | Page | `app/dashboard/countries/page.tsx` | L1 |
| `/dashboard/courier` | PAGE | Page | `app/dashboard/courier/page.tsx` | L1 |
| `/dashboard/credentials` | PAGE | Page | `app/dashboard/credentials/page.tsx` | L1 |
| `/dashboard/deals/[id]` | PAGE | Page | `app/dashboard/deals/[id]/page.tsx` | L1 |
| `/dashboard/deals` | PAGE | Page | `app/dashboard/deals/page.tsx` | L1 |
| `/dashboard/deliveries` | PAGE | Page | `app/dashboard/deliveries/page.tsx` | L1 |
| `/dashboard/demand` | PAGE | Page | `app/dashboard/demand/page.tsx` | L1 |
| `/dashboard/deployment` | PAGE | Page | `app/dashboard/deployment/page.tsx` | L1 |
| `/dashboard/discounts` | PAGE | Page | `app/dashboard/discounts/page.tsx` | L1 |
| `/dashboard/dispatch` | PAGE | Page | `app/dashboard/dispatch/page.tsx` | L1 |
| `/dashboard/dna` | PAGE | Page | `app/dashboard/dna/page.tsx` | L1 |
| `/dashboard/docs/human-touch-trust-engine` | PAGE | Page | `app/dashboard/docs/human-touch-trust-engine/page.tsx` | L1 |
| `/dashboard/documents` | PAGE | Page | `app/dashboard/documents/page.tsx` | L1 |
| `/dashboard/economics` | PAGE | Page | `app/dashboard/economics/page.tsx` | L1 |
| `/dashboard/emails` | PAGE | Page | `app/dashboard/emails/page.tsx` | L1 |
| `/dashboard/exceptions` | PAGE | Page | `app/dashboard/exceptions/page.tsx` | L1 |
| `/dashboard/execution-control` | PAGE | Page | `app/dashboard/execution-control/page.tsx` | L1 |
| `/dashboard/execution-jobs` | PAGE | Page | `app/dashboard/execution-jobs/page.tsx` | L1 |
| `/dashboard/execution-qa` | PAGE | Page | `app/dashboard/execution-qa/page.tsx` | L1 |
| `/dashboard/executive` | PAGE | Page | `app/dashboard/executive/page.tsx` | L1 |
| `/dashboard/expansion` | PAGE | Page | `app/dashboard/expansion/page.tsx` | L1 |
| `/dashboard/field-visits` | PAGE | Page | `app/dashboard/field-visits/page.tsx` | L1 |
| `/dashboard/financials` | PAGE | Page | `app/dashboard/financials/page.tsx` | L1 |
| `/dashboard/fingerprint-apostille-network` | PAGE | Page | `app/dashboard/fingerprint-apostille-network/page.tsx` | L1 |
| `/dashboard/fingerprinting` | PAGE | Page | `app/dashboard/fingerprinting/page.tsx` | L1 |
| `/dashboard/follow-ups` | PAGE | Page | `app/dashboard/follow-ups/page.tsx` | L1 |
| `/dashboard/forecast` | PAGE | Page | `app/dashboard/forecast/page.tsx` | L1 |
| `/dashboard/founder-pricing` | PAGE | Page | `app/dashboard/founder-pricing/page.tsx` | L1 |
| `/dashboard/founder/integrations` | PAGE | Page | `app/dashboard/founder/integrations/page.tsx` | L1 |
| `/dashboard/founder` | PAGE | Page | `app/dashboard/founder/page.tsx` | L1 |
| `/dashboard/go-live` | PAGE | Page | `app/dashboard/go-live/page.tsx` | L1 |
| `/dashboard/government-intelligence` | PAGE | Page | `app/dashboard/government-intelligence/page.tsx` | L1 |
| `/dashboard/government` | PAGE | Page | `app/dashboard/government/page.tsx` | L1 |
| `/dashboard/high-value-assets` | PAGE | Page | `app/dashboard/high-value-assets/page.tsx` | L1 |
| `/dashboard/ideas` | PAGE | Page | `app/dashboard/ideas/page.tsx` | L1 |
| `/dashboard/incidents` | PAGE | Page | `app/dashboard/incidents/page.tsx` | L1 |
| `/dashboard/intake` | PAGE | Page | `app/dashboard/intake/page.tsx` | L1 |
| `/dashboard/intelligence-platform` | PAGE | Page | `app/dashboard/intelligence-platform/page.tsx` | L1 |
| `/dashboard/intelligence/acceptance` | PAGE | Page | `app/dashboard/intelligence/acceptance/page.tsx` | L1 |
| `/dashboard/intelligence/acquisition` | PAGE | Page | `app/dashboard/intelligence/acquisition/page.tsx` | L1 |
| `/dashboard/intelligence/autopilot` | PAGE | Page | `app/dashboard/intelligence/autopilot/page.tsx` | L1 |
| `/dashboard/intelligence/compliance` | PAGE | Page | `app/dashboard/intelligence/compliance/page.tsx` | L1 |
| `/dashboard/intelligence/country` | PAGE | Page | `app/dashboard/intelligence/country/page.tsx` | L1 |
| `/dashboard/intelligence/freshness` | PAGE | Page | `app/dashboard/intelligence/freshness/page.tsx` | L1 |
| `/dashboard/intelligence/operators` | PAGE | Page | `app/dashboard/intelligence/operators/page.tsx` | L1 |
| `/dashboard/intelligence/platform-status` | PAGE | Page | `app/dashboard/intelligence/platform-status/page.tsx` | L1 |
| `/dashboard/intelligence/rejections` | PAGE | Page | `app/dashboard/intelligence/rejections/page.tsx` | L1 |
| `/dashboard/intelligence/revenue` | PAGE | Page | `app/dashboard/intelligence/revenue/page.tsx` | L1 |
| `/dashboard/intelligence/sales-lab` | PAGE | Page | `app/dashboard/intelligence/sales-lab/page.tsx` | L1 |
| `/dashboard/invoices` | PAGE | Page | `app/dashboard/invoices/page.tsx` | L1 |
| `/dashboard/italy-records` | PAGE | Page | `app/dashboard/italy-records/page.tsx` | L1 |
| `/dashboard/jurisdictions` | PAGE | Page | `app/dashboard/jurisdictions/page.tsx` | L1 |
| `/dashboard/lanes` | PAGE | Page | `app/dashboard/lanes/page.tsx` | L1 |
| `/dashboard/leads` | PAGE | Page | `app/dashboard/leads/page.tsx` | L1 |
| `/dashboard/ledger` | PAGE | Page | `app/dashboard/ledger/page.tsx` | L1 |
| `/dashboard/legal` | PAGE | Page | `app/dashboard/legal/page.tsx` | L1 |
| `/dashboard/maritime` | PAGE | Page | `app/dashboard/maritime/page.tsx` | L1 |
| `/dashboard/marketing/counsel` | PAGE | Page | `app/dashboard/marketing/counsel/page.tsx` | L1 |
| `/dashboard/matter-intelligence/packet-review` | PAGE | Page | `app/dashboard/matter-intelligence/packet-review/page.tsx` | L1 |
| `/dashboard/matter-intelligence` | PAGE | Page | `app/dashboard/matter-intelligence/page.tsx` | L1 |
| `/dashboard/matter-intelligence/reconciliation` | PAGE | Page | `app/dashboard/matter-intelligence/reconciliation/page.tsx` | L1 |
| `/dashboard/matter-intelligence/routing-rules` | PAGE | Page | `app/dashboard/matter-intelligence/routing-rules/page.tsx` | L1 |
| `/dashboard/matter-ops` | PAGE | Page | `app/dashboard/matter-ops/page.tsx` | L1 |
| `/dashboard/matters/[matterId]/execution` | PAGE | Page | `app/dashboard/matters/[matterId]/execution/page.tsx` | L1 |
| `/dashboard/matters/[matterId]/institutional` | PAGE | Page | `app/dashboard/matters/[matterId]/institutional/page.tsx` | L1 |
| `/dashboard/matters/[matterId]` | PAGE | Page | `app/dashboard/matters/[matterId]/page.tsx` | L1 |
| `/dashboard/matters/[matterId]/truth` | PAGE | Page | `app/dashboard/matters/[matterId]/truth/page.tsx` | L1 |
| `/dashboard/memory` | PAGE | Page | `app/dashboard/memory/page.tsx` | L1 |
| `/dashboard/monitoring` | PAGE | Page | `app/dashboard/monitoring/page.tsx` | L1 |
| `/dashboard/motion-preview` | PAGE | Page | `app/dashboard/motion-preview/page.tsx` | L1 |
| `/dashboard/needs-review` | PAGE | Page | `app/dashboard/needs-review/page.tsx` | L1 |
| `/dashboard/notary-network` | PAGE | Page | `app/dashboard/notary-network/page.tsx` | L1 |
| `/dashboard/notifications` | PAGE | Page | `app/dashboard/notifications/page.tsx` | L1 |
| `/dashboard/observations` | PAGE | Page | `app/dashboard/observations/page.tsx` | L1 |
| `/dashboard/operations/integrations` | PAGE | Page | `app/dashboard/operations/integrations/page.tsx` | L1 |
| `/dashboard/operations` | PAGE | Page | `app/dashboard/operations/page.tsx` | L1 |
| `/dashboard/operator-spine` | PAGE | Page | `app/dashboard/operator-spine/page.tsx` | L1 |
| `/dashboard/operator-terminal` | PAGE | Page | `app/dashboard/operator-terminal/page.tsx` | L1 |
| `/dashboard/opportunities` | PAGE | Page | `app/dashboard/opportunities/page.tsx` | L1 |
| `/dashboard/outreach` | PAGE | Page | `app/dashboard/outreach/page.tsx` | L1 |
| `/dashboard/packaging-delivery` | PAGE | Page | `app/dashboard/packaging-delivery/page.tsx` | L1 |
| `/dashboard/packet-builder` | PAGE | Page | `app/dashboard/packet-builder/page.tsx` | L1 |
| `/dashboard` | PAGE | Page | `app/dashboard/page.tsx` | L1 |
| `/dashboard/payments/discounts` | PAGE | Page | `app/dashboard/payments/discounts/page.tsx` | L1 |
| `/dashboard/payments/discounts/report` | PAGE | Page | `app/dashboard/payments/discounts/report/page.tsx` | L1 |
| `/dashboard/payments` | PAGE | Page | `app/dashboard/payments/page.tsx` | L1 |
| `/dashboard/payments/reconciliation` | PAGE | Page | `app/dashboard/payments/reconciliation/page.tsx` | L1 |
| `/dashboard/pipeline` | PAGE | Page | `app/dashboard/pipeline/page.tsx` | L1 |
| `/dashboard/pricing` | PAGE | Page | `app/dashboard/pricing/page.tsx` | L1 |
| `/dashboard/pro-forma/[id]` | PAGE | Page | `app/dashboard/pro-forma/[id]/page.tsx` | L1 |
| `/dashboard/professional360` | PAGE | Page | `app/dashboard/professional360/page.tsx` | L1 |
| `/dashboard/prospects` | PAGE | Page | `app/dashboard/prospects/page.tsx` | L1 |
| `/dashboard/reconciliation` | PAGE | Page | `app/dashboard/reconciliation/page.tsx` | L1 |
| `/dashboard/recovery` | PAGE | Page | `app/dashboard/recovery/page.tsx` | L1 |
| `/dashboard/referral` | PAGE | Page | `app/dashboard/referral/page.tsx` | L1 |
| `/dashboard/referrals` | PAGE | Page | `app/dashboard/referrals/page.tsx` | L1 |
| `/dashboard/rejections` | PAGE | Page | `app/dashboard/rejections/page.tsx` | L1 |
| `/dashboard/relationships` | PAGE | Page | `app/dashboard/relationships/page.tsx` | L1 |
| `/dashboard/releases/certificates` | PAGE | Page | `app/dashboard/releases/certificates/page.tsx` | L1 |
| `/dashboard/releases` | PAGE | Page | `app/dashboard/releases/page.tsx` | L1 |
| `/dashboard/revenue` | PAGE | Page | `app/dashboard/revenue/page.tsx` | L1 |
| `/dashboard/review-requests` | PAGE | Page | `app/dashboard/review-requests/page.tsx` | L1 |
| `/dashboard/reviews` | PAGE | Page | `app/dashboard/reviews/page.tsx` | L1 |
| `/dashboard/ron/[session_id]` | PAGE | Page | `app/dashboard/ron/[session_id]/page.tsx` | L1 |
| `/dashboard/ron` | PAGE | Page | `app/dashboard/ron/page.tsx` | L1 |
| `/dashboard/runbook` | PAGE | Page | `app/dashboard/runbook/page.tsx` | L1 |
| `/dashboard/scheduling-readiness` | PAGE | Page | `app/dashboard/scheduling-readiness/page.tsx` | L1 |
| `/dashboard/scripts` | PAGE | Page | `app/dashboard/scripts/page.tsx` | L1 |
| `/dashboard/security` | PAGE | Page | `app/dashboard/security/page.tsx` | L1 |
| `/dashboard/seo-authority` | PAGE | Page | `app/dashboard/seo-authority/page.tsx` | L1 |
| `/dashboard/seo-revenue` | PAGE | Page | `app/dashboard/seo-revenue/page.tsx` | L1 |
| `/dashboard/seo/editorial` | PAGE | Page | `app/dashboard/seo/editorial/page.tsx` | L1 |
| `/dashboard/seo` | PAGE | Page | `app/dashboard/seo/page.tsx` | L1 |
| `/dashboard/settings` | PAGE | Page | `app/dashboard/settings/page.tsx` | L1 |
| `/dashboard/shipping` | PAGE | Page | `app/dashboard/shipping/page.tsx` | L1 |
| `/dashboard/sops/[id]/edit` | PAGE | Page | `app/dashboard/sops/[id]/edit/page.tsx` | L1 |
| `/dashboard/sops/[id]` | PAGE | Page | `app/dashboard/sops/[id]/page.tsx` | L1 |
| `/dashboard/sops/new` | PAGE | Page | `app/dashboard/sops/new/page.tsx` | L1 |
| `/dashboard/sops` | PAGE | Page | `app/dashboard/sops/page.tsx` | L1 |
| `/dashboard/stagnation` | PAGE | Page | `app/dashboard/stagnation/page.tsx` | L1 |
| `/dashboard/system/integrations` | PAGE | Page | `app/dashboard/system/integrations/page.tsx` | L1 |
| `/dashboard/terminal` | PAGE | Page | `app/dashboard/terminal/page.tsx` | L1 |
| `/dashboard/testing/tiffany-e2e` | PAGE | Page | `app/dashboard/testing/tiffany-e2e/page.tsx` | L1 |
| `/dashboard/tools` | PAGE | Page | `app/dashboard/tools/page.tsx` | L1 |
| `/dashboard/topical-authority` | PAGE | Page | `app/dashboard/topical-authority/page.tsx` | L1 |
| `/dashboard/translations` | PAGE | Page | `app/dashboard/translations/page.tsx` | L1 |
| `/dashboard/trust-network` | PAGE | Page | `app/dashboard/trust-network/page.tsx` | L1 |
| `/dashboard/trust` | PAGE | Page | `app/dashboard/trust/page.tsx` | L1 |
| `/dashboard/truth` | PAGE | Page | `app/dashboard/truth/page.tsx` | L1 |
| `/dashboard/va/command` | PAGE | Page | `app/dashboard/va/command/page.tsx` | L1 |
| `/dashboard/va` | PAGE | Page | `app/dashboard/va/page.tsx` | L1 |
| `/dashboard/witness-network` | PAGE | Page | `app/dashboard/witness-network/page.tsx` | L1 |
| `/dashboard/workbook/[sheet]` | PAGE | Page | `app/dashboard/workbook/[sheet]/page.tsx` | L1 |
| `/dashboard/workbook` | PAGE | Page | `app/dashboard/workbook/page.tsx` | L1 |
| `/de/[...slug]` | PAGE | Page | `app/de/[...slug]/page.tsx` | L1 |
| `/docs/api` | PAGE | Page | `app/docs/api/page.tsx` | L1 |
| `/docs/auth` | PAGE | Page | `app/docs/auth/page.tsx` | L1 |
| `/docs/embeds` | PAGE | Page | `app/docs/embeds/page.tsx` | L1 |
| `/docs/rate-limits` | PAGE | Page | `app/docs/rate-limits/page.tsx` | L1 |
| `/docs/webhooks` | PAGE | Page | `app/docs/webhooks/page.tsx` | L1 |
| `/document-authentication/[country]` | PAGE | Page | `app/document-authentication/[country]/page.tsx` | L1 |
| `/documents/[document]/[country]` | PAGE | Page | `app/documents/[document]/[country]/page.tsx` | L1 |
| `/documents/[document]` | PAGE | Page | `app/documents/[document]/page.tsx` | L1 |
| `/dunedin/apostille-services` | PAGE | Page | `app/dunedin/apostille-services/page.tsx` | L1 |
| `/es/[...slug]` | PAGE | Page | `app/es/[...slug]/page.tsx` | L1 |
| `/faq` | PAGE | Page | `app/faq/page.tsx` | L1 |
| `/florida/apostille-services` | PAGE | Page | `app/florida/apostille-services/page.tsx` | L1 |
| `/florida/international-notary` | PAGE | Page | `app/florida/international-notary/page.tsx` | L1 |
| `/forgot-password` | PAGE | Page | `app/forgot-password/page.tsx` | L1 |
| `/founder` | PAGE | Page | `app/founder/page.tsx` | L1 |
| `/fr/[...slug]` | PAGE | Page | `app/fr/[...slug]/page.tsx` | L1 |
| `/global-document-intelligence` | PAGE | Page | `app/global-document-intelligence/page.tsx` | L1 |
| `/guides/apostille-for-italian-citizenship-documents` | PAGE | Page | `app/guides/apostille-for-italian-citizenship-documents/page.tsx` | L1 |
| `/guides/apostille-for-vital-records` | PAGE | Page | `app/guides/apostille-for-vital-records/page.tsx` | L1 |
| `/guides/apostille-vs-legalization` | PAGE | Page | `app/guides/apostille-vs-legalization/page.tsx` | L1 |
| `/guides/document-origin-vs-destination-country` | PAGE | Page | `app/guides/document-origin-vs-destination-country/page.tsx` | L1 |
| `/guides/florida-apostille-timeline` | PAGE | Page | `app/guides/florida-apostille-timeline/page.tsx` | L1 |
| `/guides/how-to-prepare-documents-for-use-abroad` | PAGE | Page | `app/guides/how-to-prepare-documents-for-use-abroad/page.tsx` | L1 |
| `/guides/notarized-document-for-use-abroad` | PAGE | Page | `app/guides/notarized-document-for-use-abroad/page.tsx` | L1 |
| `/guides/power-of-attorney-for-use-abroad` | PAGE | Page | `app/guides/power-of-attorney-for-use-abroad/page.tsx` | L1 |
| `/guides/remote-online-notary-international-documents` | PAGE | Page | `app/guides/remote-online-notary-international-documents/page.tsx` | L1 |
| `/guides/what-is-an-apostille` | PAGE | Page | `app/guides/what-is-an-apostille/page.tsx` | L1 |
| `/intake/confirmation` | PAGE | Page | `app/intake/confirmation/page.tsx` | L1 |
| `/intake` | PAGE | Page | `app/intake/page.tsx` | L1 |
| `/international-affidavit` | PAGE | Page | `app/international-affidavit/page.tsx` | L1 |
| `/international-affidavits` | PAGE | Page | `app/international-affidavits/page.tsx` | L1 |
| `/it/[...slug]` | PAGE | Page | `app/it/[...slug]/page.tsx` | L1 |
| `/lakewood-ranch/apostille-services` | PAGE | Page | `app/lakewood-ranch/apostille-services/page.tsx` | L1 |
| `/land-o-lakes/apostille-services` | PAGE | Page | `app/land-o-lakes/apostille-services/page.tsx` | L1 |
| `/largo/apostille-services` | PAGE | Page | `app/largo/apostille-services/page.tsx` | L1 |
| `/lawyer-access` | PAGE | Page | `app/lawyer-access/page.tsx` | L1 |
| `/learn/apostille-vs-authentication` | PAGE | Page | `app/learn/apostille-vs-authentication/page.tsx` | L1 |
| `/learn/can-a-ron-document-be-apostilled` | PAGE | Page | `app/learn/can-a-ron-document-be-apostilled/page.tsx` | L1 |
| `/learn/can-ron-documents-be-apostilled` | PAGE | Page | `app/learn/can-ron-documents-be-apostilled/page.tsx` | L1 |
| `/learn/fbi-background-check-apostille` | PAGE | Page | `app/learn/fbi-background-check-apostille/page.tsx` | L1 |
| `/learn/hague-vs-non-hague-countries` | PAGE | Page | `app/learn/hague-vs-non-hague-countries/page.tsx` | L1 |
| `/learn/international-document-courier-release` | PAGE | Page | `app/learn/international-document-courier-release/page.tsx` | L1 |
| `/learn/international-document-courier` | PAGE | Page | `app/learn/international-document-courier/page.tsx` | L1 |
| `/learn/italy-citizenship-affidavit` | PAGE | Page | `app/learn/italy-citizenship-affidavit/page.tsx` | L1 |
| `/learn` | PAGE | Page | `app/learn/page.tsx` | L1 |
| `/learn/power-of-attorney-abroad` | PAGE | Page | `app/learn/power-of-attorney-abroad/page.tsx` | L1 |
| `/learn/power-of-attorney-for-use-abroad` | PAGE | Page | `app/learn/power-of-attorney-for-use-abroad/page.tsx` | L1 |
| `/learn/what-is-an-apostille` | PAGE | Page | `app/learn/what-is-an-apostille/page.tsx` | L1 |
| `/locations` | PAGE | Page | `app/locations/page.tsx` | L1 |
| `/login` | PAGE | Page | `app/login/page.tsx` | L1 |
| `/map` | PAGE | Page | `app/map/page.tsx` | L1 |
| `/new-port-richey/apostille-services` | PAGE | Page | `app/new-port-richey/apostille-services/page.tsx` | L1 |
| `/notary/join` | PAGE | Page | `app/notary/join/page.tsx` | L1 |
| `/oldsmar/apostille-services` | PAGE | Page | `app/oldsmar/apostille-services/page.tsx` | L1 |
| `/operator/login` | PAGE | Page | `app/operator/login/page.tsx` | L1 |
| `/` | PAGE | Page | `app/page.tsx` | L1 |
| `/palm-harbor/apostille-services` | PAGE | Page | `app/palm-harbor/apostille-services/page.tsx` | L1 |
| `/partners/[segment]` | PAGE | Page | `app/partners/[segment]/page.tsx` | L1 |
| `/partners/attorneys` | PAGE | Page | `app/partners/attorneys/page.tsx` | L1 |
| `/partners/international-clients` | PAGE | Page | `app/partners/international-clients/page.tsx` | L1 |
| `/partners/medical` | PAGE | Page | `app/partners/medical/page.tsx` | L1 |
| `/partners/private-clients` | PAGE | Page | `app/partners/private-clients/page.tsx` | L1 |
| `/partners/real-estate` | PAGE | Page | `app/partners/real-estate/page.tsx` | L1 |
| `/partners/ron-notary-alliance/apply` | PAGE | Page | `app/partners/ron-notary-alliance/apply/page.tsx` | L1 |
| `/partners/ron-notary-alliance` | PAGE | Page | `app/partners/ron-notary-alliance/page.tsx` | L1 |
| `/portal/[token]` | PAGE | Page | `app/portal/[token]/page.tsx` | L1 |
| `/portal/documents` | PAGE | Page | `app/portal/documents/page.tsx` | L1 |
| `/portal/invoice` | PAGE | Page | `app/portal/invoice/page.tsx` | L1 |
| `/portal/matter-room` | PAGE | Page | `app/portal/matter-room/page.tsx` | L1 |
| `/portal/messages` | PAGE | Page | `app/portal/messages/page.tsx` | L1 |
| `/portal` | PAGE | Page | `app/portal/page.tsx` | L1 |
| `/portal/payment` | PAGE | Page | `app/portal/payment/page.tsx` | L1 |
| `/portal/release` | PAGE | Page | `app/portal/release/page.tsx` | L1 |
| `/portal/review` | PAGE | Page | `app/portal/review/page.tsx` | L1 |
| `/portal/ron/complete` | PAGE | Page | `app/portal/ron/complete/page.tsx` | L1 |
| `/portal/ron` | PAGE | Page | `app/portal/ron/page.tsx` | L1 |
| `/portal/tracking` | PAGE | Page | `app/portal/tracking/page.tsx` | L1 |
| `/portal/trackingNow` | PAGE | Page | `app/portal/trackingNow/page.tsx` | L1 |
| `/portal/v2` | PAGE | Page | `app/portal/v2/page.tsx` | L1 |
| `/ports/port-tampa-bay-document-execution` | PAGE | Page | `app/ports/port-tampa-bay-document-execution/page.tsx` | L1 |
| `/power-of-attorney-international` | PAGE | Page | `app/power-of-attorney-international/page.tsx` | L1 |
| `/pricing` | PAGE | Page | `app/pricing/page.tsx` | L1 |
| `/privacy` | PAGE | Page | `app/privacy/page.tsx` | L1 |
| `/process` | PAGE | Page | `app/process/page.tsx` | L1 |
| `/professional-network` | PAGE | Page | `app/professional-network/page.tsx` | L1 |
| `/professional/[country]` | PAGE | Page | `app/professional/[country]/page.tsx` | L1 |
| `/professional/account` | PAGE | Page | `app/professional/account/page.tsx` | L1 |
| `/professional/damiani` | PAGE | Page | `app/professional/damiani/page.tsx` | L1 |
| `/professional/matters/new` | PAGE | Page | `app/professional/matters/new/page.tsx` | L1 |
| `/professional/matters` | PAGE | Page | `app/professional/matters/page.tsx` | L1 |
| `/professional` | PAGE | Page | `app/professional/page.tsx` | L1 |
| `/professional/profile` | PAGE | Page | `app/professional/profile/page.tsx` | L1 |
| `/professional/start` | PAGE | Page | `app/professional/start/page.tsx` | L1 |
| `/professionals/family-offices` | PAGE | Page | `app/professionals/family-offices/page.tsx` | L1 |
| `/professionals/institutional-access` | PAGE | Page | `app/professionals/institutional-access/page.tsx` | L1 |
| `/professionals/law-firms` | PAGE | Page | `app/professionals/law-firms/page.tsx` | L1 |
| `/professionals` | PAGE | Page | `app/professionals/page.tsx` | L1 |
| `/professionals/white-label-support` | PAGE | Page | `app/professionals/white-label-support/page.tsx` | L1 |
| `/pt-br/[...slug]` | PAGE | Page | `app/pt-br/[...slug]/page.tsx` | L1 |
| `/pt/[...slug]` | PAGE | Page | `app/pt/[...slug]/page.tsx` | L1 |
| `/reset-password` | PAGE | Page | `app/reset-password/page.tsx` | L1 |
| `/review/[token]` | PAGE | Page | `app/review/[token]/page.tsx` | L1 |
| `/review` | PAGE | Page | `app/review/page.tsx` | L1 |
| `/sarasota/apostille-services` | PAGE | Page | `app/sarasota/apostille-services/page.tsx` | L1 |
| `/secure-portal` | PAGE | Page | `app/secure-portal/page.tsx` | L1 |
| `/services/[service]` | PAGE | Page | `app/services/[service]/page.tsx` | L1 |
| `/services/airport-emergency-document-execution` | PAGE | Page | `app/services/airport-emergency-document-execution/page.tsx` | L1 |
| `/services/apostille-authentication` | PAGE | Page | `app/services/apostille-authentication/page.tsx` | L1 |
| `/services/apostille` | PAGE | Page | `app/services/apostille/page.tsx` | L1 |
| `/services/attorney-document-execution-referrals` | PAGE | Page | `app/services/attorney-document-execution-referrals/page.tsx` | L1 |
| `/services/education-credential-apostille` | PAGE | Page | `app/services/education-credential-apostille/page.tsx` | L1 |
| `/services/embassy-consular-legalization` | PAGE | Page | `app/services/embassy-consular-legalization/page.tsx` | L1 |
| `/services/equine-document-apostille` | PAGE | Page | `app/services/equine-document-apostille/page.tsx` | L1 |
| `/services/fbi-background-check-apostille` | PAGE | Page | `app/services/fbi-background-check-apostille/page.tsx` | L1 |
| `/services/fbi-fingerprinting-document-routing` | PAGE | Page | `app/services/fbi-fingerprinting-document-routing/page.tsx` | L1 |
| `/services/federal-apostille-authentication` | PAGE | Page | `app/services/federal-apostille-authentication/page.tsx` | L1 |
| `/services/fingerprint-cards` | PAGE | Page | `app/services/fingerprint-cards/page.tsx` | L1 |
| `/services/fingerprinting-document-support` | PAGE | Page | `app/services/fingerprinting-document-support/page.tsx` | L1 |
| `/services/florida-apostille-courier` | PAGE | Page | `app/services/florida-apostille-courier/page.tsx` | L1 |
| `/services/florida-ron-international` | PAGE | Page | `app/services/florida-ron-international/page.tsx` | L1 |
| `/services/gem-diamond-document-apostille` | PAGE | Page | `app/services/gem-diamond-document-apostille/page.tsx` | L1 |
| `/services/government-document-execution` | PAGE | Page | `app/services/government-document-execution/page.tsx` | L1 |
| `/services/high-value-asset-document-execution` | PAGE | Page | `app/services/high-value-asset-document-execution/page.tsx` | L1 |
| `/services/hnwi-document-execution` | PAGE | Page | `app/services/hnwi-document-execution/page.tsx` | L1 |
| `/services/immigration-documents` | PAGE | Page | `app/services/immigration-documents/page.tsx` | L1 |
| `/services/immigration-fingerprinting-documents` | PAGE | Page | `app/services/immigration-fingerprinting-documents/page.tsx` | L1 |
| `/services/international-affidavit-execution` | PAGE | Page | `app/services/international-affidavit-execution/page.tsx` | L1 |
| `/services/international-execution` | PAGE | Page | `app/services/international-execution/page.tsx` | L1 |
| `/services/international-passport-document-execution` | PAGE | Page | `app/services/international-passport-document-execution/page.tsx` | L1 |
| `/services/italy-apostille` | PAGE | Page | `app/services/italy-apostille/page.tsx` | L1 |
| `/services/loan-signing-agent-services` | PAGE | Page | `app/services/loan-signing-agent-services/page.tsx` | L1 |
| `/services/luxury-asset-document-apostille` | PAGE | Page | `app/services/luxury-asset-document-apostille/page.tsx` | L1 |
| `/services/maritime-global-logistics-document-execution` | PAGE | Page | `app/services/maritime-global-logistics-document-execution/page.tsx` | L1 |
| `/services/medical-document-apostille` | PAGE | Page | `app/services/medical-document-apostille/page.tsx` | L1 |
| `/services/mobile-fingerprinting-coordination` | PAGE | Page | `app/services/mobile-fingerprinting-coordination/page.tsx` | L1 |
| `/services/mobile-notary` | PAGE | Page | `app/services/mobile-notary/page.tsx` | L1 |
| `/services` | PAGE | Page | `app/services/page.tsx` | L1 |
| `/services/power-of-attorney-for-use-abroad` | PAGE | Page | `app/services/power-of-attorney-for-use-abroad/page.tsx` | L1 |
| `/services/private-client-apostille` | PAGE | Page | `app/services/private-client-apostille/page.tsx` | L1 |
| `/services/regenerative-medicine-document-support` | PAGE | Page | `app/services/regenerative-medicine-document-support/page.tsx` | L1 |
| `/services/remote-online-notarization` | PAGE | Page | `app/services/remote-online-notarization/page.tsx` | L1 |
| `/services/remote-online-notary` | PAGE | Page | `app/services/remote-online-notary/page.tsx` | L1 |
| `/services/translation-coordination` | PAGE | Page | `app/services/translation-coordination/page.tsx` | L1 |
| `/services/us-documents-abroad` | PAGE | Page | `app/services/us-documents-abroad/page.tsx` | L1 |
| `/services/vital-record-apostille` | PAGE | Page | `app/services/vital-record-apostille/page.tsx` | L1 |
| `/services/yacht-document-apostille` | PAGE | Page | `app/services/yacht-document-apostille/page.tsx` | L1 |
| `/speak-with-nicholas` | PAGE | Page | `app/speak-with-nicholas/page.tsx` | L1 |
| `/st-petersburg/apostille-services` | PAGE | Page | `app/st-petersburg/apostille-services/page.tsx` | L1 |
| `/tampa/apostille-services` | PAGE | Page | `app/tampa/apostille-services/page.tsx` | L1 |
| `/terms` | PAGE | Page | `app/terms/page.tsx` | L1 |
| `/today` | PAGE | Page | `app/today/page.tsx` | L1 |
| `/today/professional` | PAGE | Page | `app/today/professional/page.tsx` | L1 |
| `/trinity/apostille-services` | PAGE | Page | `app/trinity/apostille-services/page.tsx` | L1 |
| `/trust` | PAGE | Page | `app/trust/page.tsx` | L1 |
| `/va/checklists` | PAGE | Page | `app/va/checklists/page.tsx` | L1 |
| `/va/courier` | PAGE | Page | `app/va/courier/page.tsx` | L1 |
| `/va/dashboard` | PAGE | Page | `app/va/dashboard/page.tsx` | L1 |
| `/va/documents` | PAGE | Page | `app/va/documents/page.tsx` | L1 |
| `/va/escalations` | PAGE | Page | `app/va/escalations/page.tsx` | L1 |
| `/va/follow-ups` | PAGE | Page | `app/va/follow-ups/page.tsx` | L1 |
| `/va/matters` | PAGE | Page | `app/va/matters/page.tsx` | L1 |
| `/va/messages` | PAGE | Page | `app/va/messages/page.tsx` | L1 |
| `/va` | PAGE | Page | `app/va/page.tsx` | L1 |
| `/va/portal` | PAGE | Page | `app/va/portal/page.tsx` | L1 |
| `/va/ron` | PAGE | Page | `app/va/ron/page.tsx` | L1 |
| `/va/tasks` | PAGE | Page | `app/va/tasks/page.tsx` | L1 |
| `/va/uploads` | PAGE | Page | `app/va/uploads/page.tsx` | L1 |
| `/verify/[verificationId]` | PAGE | Page | `app/verify/[verificationId]/page.tsx` | L1 |
| `/verticals/equine` | PAGE | Page | `app/verticals/equine/page.tsx` | L1 |
| `/verticals/international-lawyers` | PAGE | Page | `app/verticals/international-lawyers/page.tsx` | L1 |
| `/verticals/life-sciences` | PAGE | Page | `app/verticals/life-sciences/page.tsx` | L1 |
| `/verticals/luxury-assets` | PAGE | Page | `app/verticals/luxury-assets/page.tsx` | L1 |
| `/verticals/maritime` | PAGE | Page | `app/verticals/maritime/page.tsx` | L1 |
| `/verticals/private-wealth` | PAGE | Page | `app/verticals/private-wealth/page.tsx` | L1 |
| `/wesley-chapel/apostille-services` | PAGE | Page | `app/wesley-chapel/apostille-services/page.tsx` | L1 |
| `/westchase/apostille-services` | PAGE | Page | `app/westchase/apostille-services/page.tsx` | L1 |
| `/workspace/release` | PAGE | Page | `app/workspace/release/page.tsx` | L1 |

## Governance

- Never manually label a production-critical route as missing.
- Add/remove the underlying source route, then regenerate this file.
- Vercel production validation fails when this file drifts from source.
- `/today` is a read-only Milano Operator Intelligence surface.
- `/dashboard/control-plane` is the canonical platform meta-governance and system-registry surface.
- `/dashboard/reconciliation` is the canonical read-only cross-domain discrepancy surface.
- `/dashboard/matters/[matterId]/truth` is the operator Matter Truth inspection surface and does not own canonical state.
- `/portal/payment` remains canonical-Matter and Wise-reconciliation driven.
- `/api/webhooks/wise` is the canonical production Wise webhook.
- Live TIFF and Damiani acceptance remain mandatory after code/deployment validation.
