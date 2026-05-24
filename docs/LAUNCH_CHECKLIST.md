# The Milano Seal™ — Launch Checklist
## LAUNCH-CHECKLIST-01 · Production Go-Live Lock

---

## Pre-Launch SQL — Run in Order

Run each script in Supabase SQL Editor → SQL Editor → New Query.

| # | Script | Purpose | Status |
|---|--------|---------|--------|
| 1 | `scripts/001_create_deals_table.sql` | Deals table + base indexes | Run once |
| 2 | `scripts/002_os_migration.sql` | Deals column additions (invoice fields) | Run once |
| 3 | `scripts/003_trust_engine_schema.sql` | Compliance rules, messages, RLS | Run once |
| 4 | `scripts/004_alliance_operator_schema.sql` | Operator schema, eligibility gate, Mexico fix | Run once |
| 5 | `scripts/005_portal_safe_views.sql` | Client-safe views (portal data boundary) | Run once |
| 6 | `scripts/006_e2e_seed.sql` | Schema patches + test data | Run once (dev/staging) |

> Script 006 adds missing columns to deals and creates matter_events, custody_ledger,
> files, audit_logs, and portal_otps tables. Run it before deploying the application
> even in production — the schema patches (`ADD COLUMN IF NOT EXISTS`) are idempotent.
> The test deals (email: `@test.milanoseal.local`) should be deleted before go-live.

---

## Environment Variables

All required. Set in Vercel / hosting provider.

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=           # server-only, never in browser
NEXT_PUBLIC_SITE_URL=

RESEND_API_KEY=
RESEND_FROM=

WISE_API_TOKEN=
WISE_PROFILE_ID=
PAYMENT_BASE_URL=

ANTHROPIC_API_KEY=
GROQ_API_KEY=

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
TWILIO_WHATSAPP_NUMBER=
ADMIN_WHATSAPP=

SHIPPO_API_KEY=

CRON_SECRET=                         # 32+ random chars
WEBHOOK_SECRET=                      # 32+ random chars
```

---

## Supabase Storage Setup

Bucket creation is automated in `scripts/006_e2e_seed.sql` (step 7).
After running script 006, confirm in Supabase Dashboard → Storage → Buckets:
- Bucket `documents` exists and **Public** is **OFF**
- If Public shows ON, go to bucket Settings → Visibility → Private → Save

---

## Security Gates — Verify Before Go-Live

| Gate | File | Status |
|------|------|--------|
| Service role key server-only | `lib/supabase/admin.ts` | Enforced |
| Portal safe fields allowlist | `app/api/portal/me/route.ts` | Enforced |
| Portal blocked fields denylist | `lib/portalProjection.ts` (30+ fields) | Enforced |
| No raw storage paths in responses | `lib/vault.ts`, portal routes | Enforced |
| Operator eligibility 7-gate | `lib/alliance/operatorEligibilityGate.ts` | Enforced |
| Toolbelt ≥80% required for routing | `evaluateEligibilityGate()` | Enforced |
| Payment confirmed before scheduled | State machine guard | Enforced |
| Admin override audited | `app/api/admin/override/route.ts` | Enforced |
| Signed URLs only (15 min expiry) | `lib/vault.ts` | Enforced |
| Idempotency on dispatch assign | `app/api/dispatch/assign/route.ts` | Enforced |
| Phantom data guard | `lib/alliance/phantomDataGuard.ts` | Active |
| Mexico: Hague/apostille correct | `lib/compliance.ts` + `scripts/004` | Fixed |
| Pricing: Signature $750, Priority $975, Executive $1,850 | `lib/lib/pricingEngine.ts` | Locked |

---

## Pre-Launch Cleanup

- [ ] Delete test deals: `DELETE FROM deals WHERE email LIKE '%@test.milanoseal.local';`
- [ ] Delete test operator: `DELETE FROM operator_profiles WHERE email LIKE '%@test.milanoseal.local';`
- [ ] Rotate `CRON_SECRET` and `WEBHOOK_SECRET` to production values
- [ ] Confirm `SUPABASE_SERVICE_ROLE_KEY` is not exposed in any `NEXT_PUBLIC_` variable
- [ ] Set `documents` bucket to **Private** in Supabase Storage dashboard
- [ ] Confirm Supabase RLS is enabled on: deals, files, audit_logs, matter_events, custody_ledger, portal_otps, operator_profiles, operator_assignments

---

## Go-Live Verification

After deploying, verify these endpoints respond correctly:

| Endpoint | Expected |
|----------|----------|
| `GET /api/health/dispatch` | `{ eligibility_gate: "enforced", phantom_data_guard: "active" }` |
| `GET /api/health/payment` | `{ payment_gate: "enforced" }` |
| `GET /api/health/webhooks` | Lists active handlers |
| `GET /api/health/assistant` | `{ human_review_gate: "enforced" }` |
| `GET /api/portal/me` (unauthenticated) | `401 Unauthorized` |
| `GET /api/portal/files` (unauthenticated) | `401 Unauthorized` |

---

## Forbidden Phrases — Do Not Use in Any Copy

The following phrases must never appear in client-facing content:

- Mission Control, Sovereign Command
- government approved, guaranteed acceptance
- instant apostille, AI approved
- legal advice (except in disclaimers: "we do not provide legal advice")
- certified partner (unless actually certified)
- Buy Now, Checkout, Order
- cheap notary, fully automated legal service

---

## Branch Status

All patches on branch: `claude/festive-ramanujan-Vil9x`

| Patch | Description | Commit |
|-------|-------------|--------|
| ALLIANCE-03 | Operator gate + Tool Belt compliance | 59a3c42 |
| PORTAL-03 | Client-safe data boundary | 59a3c42 |
| STORAGE-VAULT-01 | Signed document access | f5b615e |
| PORTAL-MOTION-01 | Premium status rail | 6f161e2 |
| FINAL-E2E-SEED-01 | Test matters + schema patches | fd670ff |
| QA-01 | Production audit fixes | 469d5a5 |
| LAUNCH-CHECKLIST-01 | This file | current |
