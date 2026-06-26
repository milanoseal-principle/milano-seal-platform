# Milano Seal — Full Production Completion Report

**Date:** 2026-06-26
**Branch:** claude/funny-maxwell-hlxQN
**Final Commit:** See git log

---

## Files Changed This Pass

| File | Change |
|---|---|
| `app/api/deals/[id]/apply-discount/route.ts` | **NEW** — Server-side discount apply (POST) + remove (DELETE) |
| `app/api/deals/[id]/payment/route.ts` | Removed "stripe" from VALID_METHODS → `["wise", "wire", "manual"]` |
| `app/portal/invoice/page.tsx` | Added discount code input UI + applied discount summary |
| `docs/audits/MILANO_FULL_PRODUCTION_PORTAL_AUDIT.md` | **NEW** — Full platform audit |
| `docs/testing/TIFFANY_OPERATOR_E2E_TEST.md` | **NEW** — 31-step operator E2E test guide |
| `docs/audits/MILANO_FULL_PRODUCTION_COMPLETION_REPORT.md` | **NEW** — This report |

---

## Routes Verified

- `/portal/invoice` — Discount code UI added, server-side validation, Wise payment card
- `/api/deals/[id]/apply-discount` — New endpoint, full server-side validation
- `/api/deals/[id]/payment` — Stripe reference removed
- `/dashboard/deals/[id]` — Operator payment confirmation verified present
- `/api/webhook/wise` — Signature-verified Wise webhook verified present

---

## Protected Routes Verified

| Surface | Guard | Status |
|---|---|---|
| `/portal/*` | `portal-context` + layout auth check | ✅ |
| `/dashboard/*` | `requireDashboardAccess()` | ✅ |
| `/va/*` | `requireVAAccess()` | ✅ |
| `/alliance/*` | Alliance auth guard | ✅ |
| Internal APIs | `createAdminClient()` server-side only | ✅ |

---

## Wise-First Payment Flow

- Wise webhook: ✅ Present (`app/api/webhook/wise/route.ts`)
- Wise signature verification: ✅ Present (`lib/wise.ts`)
- Wise URL builder: ✅ Present (`lib/payments/wiseUrl.ts`)
- Portal invoice Wise card: ✅ Present
- Manual Wise confirmation (operator): ✅ Present in dashboard matter detail
- Payment gate (scheduling locked until paid): ✅ Enforced in deals PATCH API

---

## Discount Code Support

- DB schema: ✅ `discount_codes`, `discount_redemptions`, `discount_audit_log` tables
- Server-side validation: ✅ Active/expired/usage-limit/matter-restriction checks
- Server-side amount calculation: ✅ No client-side math trusted
- Portal UI: ✅ Discount input field on unpaid invoices only
- Event logging: ✅ `DISCOUNT_APPLIED`, `DISCOUNT_REMOVED` written to activity log
- Payment gate: ✅ Cannot apply discount after payment confirmed

---

## Manual Payment Confirmation

- Operator UI: ✅ Dashboard matter detail (`/dashboard/deals/[id]`)
- Payment reference required: ✅ `payment_reference` field
- Amount received tracked: ✅ `payment_amount_received` field
- Status logic: ✅ `paid` → `invoice_status = paid`, matter → `scheduled`
- Event: ✅ `payment_confirmed` logged to activity
- Scheduling unlock event: ✅ `stage_advanced` → `scheduled` logged

---

## Wise Webhook Status

- Route: `/api/webhook/wise` ✅
- Signature verification: ✅ `verifyWiseSignature()`
- Deduplication: ✅ `webhook_events` insert with duplicate handling
- Payment confirmed path: ✅ Sets `payment_status = paid`, logs event
- Payment failed path: ✅ Sets failure reason

---

## Payment Gate Verified

- Deals PATCH: ✅ Blocks state advancement if `payment_status !== "paid"` (line 321)
- Override API: ✅ Requires authenticated operator + payment_status check (line 115)
- Release route: ✅ Checks `payment_status` before release

---

## Client Portal Verified

- Safe field filtering: ✅ `PORTAL_SAFE_FIELDS` whitelist in `/api/portal/me`
- No internal fields exposed: ✅ `internal_notes`, `cost`, `margin`, `operator_notes` not in client response
- Matter scoping: ✅ Portal context fetches only the authenticated user's matter
- Status tracker: ✅ `portal-status-rail.tsx` with stage display
- Discount code entry: ✅ Added to invoice page (unpaid only)
- Payment confirmation display: ✅ Wise payment card with reference

---

## Pricing Lock

| Item | Value | Verified |
|---|---|---|
| Signature Lane | $750 | ✅ |
| Priority Lane | $975 | ✅ |
| Executive Lane | $1,850 | ✅ |
| Custom Matter | Review path only | ✅ |
| Apostille | $275 first doc | ✅ |
| Rush | $175 | ✅ |
| Additional Signer | $75 | ✅ |

---

## Security Checks

- Service role key in client bundle: ✅ NOT exposed — server-side only
- Stripe references: ✅ REMOVED from payment VALID_METHODS
- Private pages noindex: ✅ Portal + dashboard layouts have `robots: { index: false }`
- Client discount math bypass: ✅ Impossible — all discount calculation is server-side
- Payment bypass via URL param: ✅ Not present — server verifies payment_status
- Client cannot access other matters: ✅ Portal scoped to authenticated user's matter

---

## Commands Run

```
npx tsc --noEmit   → 0 errors
npx next build     → Build successful
```

## Deferred Items

1. **Global `middleware.ts`** — No Next.js edge middleware. Layout-level guards are present on all protected routes. Edge middleware would add defense-in-depth but is not a production blocker given current layout guards.
2. **Discount UI on `/portal/payment`** — Payment page also shows Wise instructions. Invoice page (`/portal/invoice`) is the primary payment UI and now has full discount support. Payment page is secondary.
3. **200+ internal/SEO/ops brand token wiring** — Deferred per earlier decision. Public brand surfaces are wired; internal operational pages remain on legacy hex aliases.
