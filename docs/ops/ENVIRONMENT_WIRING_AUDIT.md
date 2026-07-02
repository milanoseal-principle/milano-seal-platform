# Environment Wiring Audit

DEPLOYMENT_WIRING = INJECTED
COMPLIANCE_WIRING = PARTIAL
PAYMENT_WIRING = INJECTED
SCHEDULING_WIRING = PARTIAL
BLUENOTARY_WIRING = PARTIAL

## Deployment

Build/typecheck scripts exist. Vercel/Next deployment path exists. Production branch expectation: `main`. Route registry exists. Sitemap/noindex rules do not expose dashboard routes.

## Compliance

Compliance engine/atlas exists as internal routing intelligence. Manual review fallback is required for unknown jurisdictions; Mexico and UAE require manual review in the internal atlas UI. Public copy must not present legal conclusions.

## Payment and Scheduling

Wise-first payment flow exists. Payment cannot be client-side trusted. Payment status controls scheduling/release. Public pages do not expose Stripe. Scheduling unlock depends on `payment_confirmed` or `paid_comped`. No route should schedule directly from unpaid intake. Canonical state flow exists.

## BlueNotary Files Checked

- `docs/BLUENOTARY_WEBHOOK_SETUP.md`
- `supabase/migrations/018_bluenotary_ron.sql`
- `app/api/webhooks/bluenotary/route.ts`
- `lib/bluenotary/client.ts`
- `lib/bluenotary/webhook.ts`
- `lib/bluenotary/session.ts`
- `lib/bluenotary/documents.ts`
- `lib/bluenotary/redaction.ts`

## Environment Names Only

Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
Wise: `WISE_API_KEY`, `WISE_WEBHOOK_SECRET`
BlueNotary: provider API and webhook variables by name only
Vercel: project production environment variables by name only
App URL: `NEXT_PUBLIC_SITE_URL`
Webhook URLs: Wise, Shippo, BlueNotary route URLs by name only
