# The Milano Seal™ — Production Smoke Test Matrix

**Document Reference:** MS-OPS-SMOKETEST-2026-V1  
**Run after:** Every production deployment, Supabase migration, or Vercel environment variable change  
**Owner:** Platform Operator / Prince (deployment executor)

---

## Pre-Test Requirements

- Production deployment status: **Ready** (confirmed in Vercel dashboard)
- All environment variables set (Vercel → Settings → Environment Variables)
- Supabase migrations 001–010 executed
- Base URL: `https://themilanoseal.com`

---

## 13-Route Verification Matrix

---

### Route 1 — Public Homepage

| Field | Value |
|---|---|
| **Request** | `GET /` |
| **Expected** | HTTP 200, page renders with IntelligenceRail and hero section |
| **Failure condition** | 500 error, blank page, or missing components |
| **Rollback** | Revert to previous Vercel deployment |
| **Data required** | None |

---

### Route 2 — Intake Page

| Field | Value |
|---|---|
| **Request** | `GET /intake` |
| **Expected** | HTTP 200, intake wizard renders |
| **Failure condition** | 404, 500, or wizard does not load |
| **Rollback** | Check `app/intake/page.tsx` and `components/intake/intake-wizard.tsx` |
| **Data required** | None |

---

### Route 3 — Intake API Submission

| Field | Value |
|---|---|
| **Request** | `POST /api/intake` with valid test payload (use staging email) |
| **Expected** | HTTP 200, returns `deal_id`, confirmation email sent |
| **Failure condition** | 500 error — most likely cause is missing `notifications` table (migration 009) |
| **Rollback** | Execute `supabase/migrations/009_notifications_table.sql` if not yet run |
| **Data required** | Use a real email you control; delete the test deal from dashboard after |

---

### Route 4 — Intake Confirmation Page

| Field | Value |
|---|---|
| **Request** | `GET /intake/confirmation?id={deal_id}` |
| **Expected** | HTTP 200, confirmation page renders with matter reference |
| **Failure condition** | 404 or blank page |
| **Rollback** | Check `app/intake/confirmation/` route |
| **Data required** | Valid `deal_id` from Route 3 test |

---

### Route 5 — Operator Dashboard

| Field | Value |
|---|---|
| **Request** | `GET /dashboard` (authenticated as operator) |
| **Expected** | HTTP 200, dashboard renders, deals list visible |
| **Failure condition** | 401 redirect loop, 500, or empty dashboard on valid account |
| **Rollback** | Verify `OPERATOR_EMAILS` env var contains the operator email |
| **Data required** | Operator credentials |

---

### Route 6 — Deals API

| Field | Value |
|---|---|
| **Request** | `GET /api/deals` (authenticated session) |
| **Expected** | HTTP 200, returns deal array |
| **Failure condition** | 401, 500, or empty response on account with deals |
| **Rollback** | Check Supabase RLS policies on `deals` table |
| **Data required** | Authenticated operator session |

---

### Route 7 — Client Portal

| Field | Value |
|---|---|
| **Request** | `GET /portal` |
| **Expected** | HTTP 200, portal landing or OTP prompt renders |
| **Failure condition** | 500 or blank page |
| **Rollback** | Check `app/portal/` route files |
| **Data required** | None (unauthenticated landing) |

---

### Route 8 — Portal OTP Confirmation

| Field | Value |
|---|---|
| **Request** | `POST /api/portal/confirm` with `{ token, email, otp }` |
| **Expected** | HTTP 200, returns HMAC-signed session token |
| **Failure condition** | 503 = `PORTAL_SESSION_SECRET` not set in Vercel; 404 = invalid token; 403 = wrong OTP |
| **Rollback** | Set `PORTAL_SESSION_SECRET` in Vercel → trigger redeploy |
| **Data required** | Valid portal access link token, matching email, active OTP |

---

### Route 9 — Public Payment Status

| Field | Value |
|---|---|
| **Request** | `GET /api/public/payment-status?deal_id={id}&access_token={token}` |
| **Expected** | HTTP 200 with `payment_status`, `deal_status`, `amount_due`, `invoice_reference` |
| **Failure condition** | 400 = missing params; 404 = mismatched deal_id/access_token |
| **Rollback** | Verify both `deal_id` and `access_token` match the same deals row |
| **Data required** | Valid `deal_id` + matching `access_token` from deals table |
| **Security note** | Request without `access_token` must return 400, not 200 |

---

### Route 10 — File Upload

| Field | Value |
|---|---|
| **Request** | `POST /api/upload` with `multipart/form-data` containing `file` and `deal_id` |
| **Expected** | HTTP 200, returns file record with signed URL (no public CDN path) |
| **Failure condition** | 500 = storage bucket misconfigured; 404 = deal not found |
| **Rollback** | Verify `documents` Supabase storage bucket exists and service role has access |
| **Data required** | Valid `deal_id`, test PDF under 20MB |

---

### Route 11 — Shipping Label (Production Guard)

| Field | Value |
|---|---|
| **Request** | `POST /api/shipping/create-label/{deal_id}` with `test_mode: true` |
| **Expected** | HTTP 501 with message `"Live shipping provider is not configured."` |
| **Failure condition** | If returns 200 with fake label data — mock is still active, deployment is wrong |
| **Rollback** | Verify `NODE_ENV=production` is set in Vercel; redeploy |
| **Data required** | Valid deal ID |

---

### Route 12 — Health Root

| Field | Value |
|---|---|
| **Request** | `GET /api/health` |
| **Expected** | HTTP 200 with `status: ok`, `environment`, `version`, `timestamp` |
| **Failure condition** | 500 or missing fields |
| **Rollback** | Check `app/api/health/route.ts` |
| **Data required** | None |

---

### Route 13 — Database Health

| Field | Value |
|---|---|
| **Request** | `GET /api/health/database` |
| **Expected** | HTTP 200 with `status: ok`, `latency_ms` under 2000ms |
| **Failure condition** | HTTP 503 or `status: degraded` = Supabase connection failed |
| **Rollback** | Verify `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel |
| **Data required** | None |

---

## Supplemental Health Routes

Run these after Routes 1–13 pass:

| Route | Expected |
|---|---|
| `GET /api/health/storage` | `status: ok` or storage configuration note |
| `GET /api/health/webhooks` | Shows `configured/not_configured` — never prints secret values |
| `GET /api/health/payment` | Shows `configured/not_configured` — never prints secret values |
| `GET /api/health/dispatch` | Shows `stubbed` until dispatch handlers are implemented |

---

## Failure Reporting Format

Use this format for any failed route during smoke testing:

```
ROUTE:
EXPECTED:
ACTUAL:
ERROR MESSAGE (if any):
ROLLBACK TAKEN:
```

Do not add narrative. Log the exact values only.

---

## Post-Smoke-Test Sign-Off

- [ ] All 13 routes passed
- [ ] No 500 errors on any route
- [ ] Route 11 returns 501 (shipping guard active)
- [ ] Route 8 returns HMAC session (not base64)
- [ ] Route 9 rejects requests missing `access_token`
- [ ] Route 13 latency under 2000ms
- [ ] Health routes show correct `configured/not_configured` state
- [ ] No `example.com` or `TEST MODE` in any response body

**Signed off by:** _______________  
**Date:** _______________  
**Deployment ID (Vercel):** _______________
