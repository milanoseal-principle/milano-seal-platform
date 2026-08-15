# The Milano Seal™ — Production Environment Wiring Audit

**Status:** ACTIVE  
**Production Domain:** `https://themilanoseal.com`

```text
DEPLOYMENT_WIRING = INJECTED
PAYMENT_WIRING = WISE_ONLY
OPERATOR_INTELLIGENCE = READ_ONLY
TRANSACTION_CERTIFICATION = LIVE_ACCEPTANCE_REQUIRED
```

## Deployment

- Production branch: `main`.
- Vercel Git integration remains connected.
- Non-production preview builds are intentionally skipped by `vercel.json`.
- GitHub-hosted Actions remain manual-only.
- Vercel production build executes `node scripts/run-vercel-merge-gate.mjs && next build`.
- Generated production-critical route registry: `docs/ROUTE_MAP.md`.

## Supabase

Canonical server-side variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

`SUPABASE_SERVICE_ROLE_KEY` is server-side only.

## Wise Payment

Canonical production variables:

```text
WISE_ENV=production
WISE_API_TOKEN
WISE_PROFILE_ID
WISE_WEBHOOK_ALLOWED_TEST=false
PAYMENT_BASE_URL=https://themilanoseal.com
```

Production webhook:

```text
POST https://themilanoseal.com/api/webhooks/wise
```

Wise webhook authenticity is verified by RSA-SHA256 using the Wise production public key in `lib/wise.ts`.

`WISE_WEBHOOK_TEST_BYPASS` must remain unset in production.

Payment confirmation requires exact canonical Matter/reference, amount and currency reconciliation. Client navigation or manual database edits cannot confirm payment.

## Scheduling / Execution

The canonical Matter state machine controls progression.

Scheduling remains payment-gated.

The Milano Operator Intelligence layer reads canonical Matter truth but cannot mutate Matter, payment, scheduling, execution, apostille, custody, release, delivery, or completion state.

## RON / BlueNotary

BlueNotary variables remain governed by `docs/BLUENOTARY_WEBHOOK_SETUP.md` and current code.

No payment architecture is inferred from RON provider configuration.

## Shipping

Shippo variables remain governed by the current carrier integration code and production environment configuration.

Shipping status does not override canonical Matter release or custody state.

## Certification Boundary

A green deployment is not a transaction certification.

Required after production deployment:

```text
TIFF real 15-step client-to-close acceptance
→ Damiani production dry-run with no payment
→ Final Truth Review
→ GO / NO-GO
```
