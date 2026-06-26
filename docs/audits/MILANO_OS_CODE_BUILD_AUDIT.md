# Milano Seal OS Code Build Audit

## Existing Routes

- Public routes exist for `/`, `/intake`, `/map`, `/review`, `/pricing`, `/services`, `/about`, `/founder`, country and document-intelligence pages.
- Portal routes exist for `/portal`, tokenized portal surfaces under `/portal/[token]`, and client-safe portal APIs under `/api/portal/me/*`.
- Operator routes exist under `/dashboard`, including matter, payment, release, RON, Shippo, quick-action, and delivery surfaces.
- VA and alliance route families exist under `/va` and `/alliance` with role-separated dashboard pages.

## Existing APIs

- Intake: `/api/intake` and `/api/intake/upload`.
- Matter/deal control: `/api/deals`, `/api/deals/[id]`, schedule, activity, apostille, payment, release, custody, execute.
- Payment and Wise: `/api/webhooks/wise`, `/api/webhook/wise`, `/api/admin/wise/*`, and payment health APIs.
- BlueNotary/RON: `/api/webhooks/bluenotary`, `/api/dashboard/ron/sessions`.
- Courier/shipping: `/api/courier/*`, `/api/dashboard/shippo/*`, `/api/webhooks/shippo`.
- Compliance: `/api/compliance/[jurisdiction]`, `/api/compliance/intelligence`, `/api/compliance/list`.

## Existing Database / Migration Coverage

- Existing migrations already cover initial schema, VA tasks, audit events, operational tables, alliance tracking, country registry, Wise payment gate, Shippo custody, BlueNotary RON, receiving authority, release certificates, execution QA, delivery logs, and delivery protocol controls.
- Added `034_milano_os_operating_spine.sql` to provide a compatibility layer for `clients`, `matters`, `payment_records`, `execution_records`, `apostille_records`, `shipment_records`, `event_ledger`, `terms_acceptances`, and `relationship_sources` without removing current deal/payment tables.

## Current Auth Model

- Server-side role resolution exists in `lib/auth/server-role.ts`.
- Role home routing and path checks exist in `lib/auth/roleRedirect.ts`.
- Route-level redirects and forbidden checks exist in `proxy.ts`.

## Current Wise / Payment Status

- Wise request and gate utilities exist under `lib/payments`.
- Webhook routes exist for Wise.
- Added `src/features/payments/wisePaymentService.ts` and `paymentGateService.ts` to centralize Wise instructions and split-payment gate evaluation for the OS spine.

## Current Discount Status

- Discount/admin pricing functionality exists in admin routes and founder pricing override files.
- Added `/api/deals/[id]/apply-discount` plus `src/features/discounts/discountService.ts` to implement server-side matter discount application against the OS-compatible tables.

## Current Portal Status

- Portal client and token routes already exist.
- Added `src/features/portal/portalSafeMapper.ts` to document and enforce client-safe projection boundaries.

## Current Event Ledger Status

- Existing audit/event files exist under `lib/audit.ts`, `lib/custodyLedger.ts`, and execution QA events.
- Added `src/features/audit/eventLedgerService.ts` as the canonical OS event write helper for new matter/payment actions.

## Implementation Plan Applied

1. Preserve current routes, dashboards, portal logic, role guards, payment gating, and brand assets.
2. Add the SOP as the controlling doc at `docs/sop/MILANO_SEAL_OS_FULL_SYSTEM_FLOW_SOP.md`.
3. Add compatibility Supabase migration for the OS spine tables.
4. Add typed service modules for pricing, compliance, trust engine, intake matter creation, discount application, payment gates, Wise instructions, BlueNotary manual-safe adapter, apostille, shipping, portal safe projection, and event ledger writes.
5. Add minimal API endpoints for compliance lookup, discount application/removal, manual payment confirmation, final payment request, and final payment confirmation aliasing.
6. Add validation and E2E operator test docs.
7. Keep integrations safe when third-party environment variables are missing.
