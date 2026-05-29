# The Milano Seal™ — Remote P0 Infrastructure Clearance
**Document Reference:** MS-ENG-P0-FINAL-LOCK-2026-V1  
**Run after:** P0 code is confirmed committed to `claude/exciting-goodall-zCgCF`  
**Owner:** Platform Operator  
**Status gate:** This checklist must be fully signed before P1 opens.

---

## Pre-Conditions

Before starting this runbook, confirm:

- [ ] Branch `claude/exciting-goodall-zCgCF` is merged or deployed to Vercel production
- [ ] You have access to Supabase Dashboard (project owner or admin)
- [ ] You have access to Vercel Dashboard (project owner or admin)
- [ ] You have a secure terminal or password manager to generate secrets

---

## Step 1 — Apply Migration 009

**Location:** Supabase Dashboard → SQL Editor

Open `supabase/migrations/009_notifications_table.sql` from the repository.

Paste the full contents into the SQL Editor and run.

**Verify after running:**

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'notifications';
```

Expected: 1 row returned.

```sql
SELECT relrowsecurity FROM pg_class
WHERE relname = 'notifications';
```

Expected: `t` (RLS enabled).

```sql
SELECT indexname FROM pg_indexes
WHERE tablename = 'notifications';
```

Expected: at least `notifications_deal_id_idx`, `notifications_status_idx`,
`notifications_type_idx`, `notifications_created_at_idx`.

- [ ] Migration 009 applied without error
- [ ] `public.notifications` exists
- [ ] RLS enabled on notifications
- [ ] Indexes exist

---

## Step 2 — Apply Migration 010

**Location:** Supabase Dashboard → SQL Editor

Open `supabase/migrations/010_operator_file_isolation.sql` from the repository.

Paste and run.

**Verify after running:**

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'deals' AND column_name = 'assignee_user_id';
```

Expected: 1 row returned.

- [ ] Migration 010 applied without error
- [ ] `deals.assignee_user_id` column exists

---

## Step 3 — Confirm 011 and 012 Are NOT Applied

These migrations are P1/P2 gated. Do not run them.

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('alliance_partners', 'alliance_campaigns',
                     'alliance_payouts', 'country_registry',
                     'featured_globe_destinations');
```

Expected: **0 rows returned.**

If any of these tables exist, stop and investigate before proceeding.

- [ ] 011 NOT applied (no alliance tables)
- [ ] 012 NOT applied (no country registry tables)

---

## Step 4 — Set Documents Bucket to Private

**Location:** Supabase Dashboard → Storage → Buckets

1. Click the `documents` bucket
2. Click **Edit bucket** (or gear icon)
3. Set visibility to **Private**
4. Save

**Verify:**

Attempt to open a file URL that follows the pattern:
`https://<project-ref>.supabase.co/storage/v1/object/public/documents/...`

Expected: Request fails or returns 400/403 — file is not publicly accessible.

- [ ] `documents` bucket set to Private
- [ ] Public URL access blocked

---

## Step 5 — Seed Vercel Environment Variables

**Location:** Vercel Dashboard → Project → Settings → Environment Variables

Add the following. Set scope to **Production** for all. Add to **Preview** if the
portal auth flow is used in preview deployments.

| Variable | Value |
|---|---|
| `PORTAL_SESSION_SECRET` | Generate with `openssl rand -hex 32` — paste the output |
| `NEXT_PUBLIC_APP_URL` | `https://themilanoseal.com` |
| `NEXT_PUBLIC_ENVIRONMENT` | `production` |
| `NEXT_PUBLIC_VERSION` | `1.0.0` |
| `LOG_LEVEL` | `info` |

Verify these already exist (do not rotate unless there is confirmed exposure):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM`

See `docs/vercel-env-production.md` for the full variable reference.

- [ ] `PORTAL_SESSION_SECRET` set in Vercel (Production)
- [ ] `NEXT_PUBLIC_APP_URL` set
- [ ] `NEXT_PUBLIC_ENVIRONMENT=production` set
- [ ] `NEXT_PUBLIC_VERSION` set
- [ ] `LOG_LEVEL=info` set
- [ ] Supabase and Resend vars confirmed present

---

## Step 6 — Trigger Vercel Production Deployment

1. In Vercel Dashboard, trigger a new production deployment (redeploy or push)
2. Wait for the build to complete
3. Confirm build status is **Ready** — not Failed

If the build fails: stop, capture the exact error, and do not proceed to smoke testing.

- [ ] Vercel production build: **PASS** / **FAIL**
- [ ] Build error (if any): _______________

---

## Step 7 — Run Automated Smoke Test

From a terminal with `curl` available:

```bash
./scripts/smoke-test.sh https://themilanoseal.com
```

All automated checks must pass before proceeding to manual tests.

If `jq` is available, the database latency gate (< 2000ms) will also run.

- [ ] Smoke test result: **PASS** / **FAIL**
- [ ] Failing routes (if any): _______________

---

## Step 8 — Manual Intake Test

Use a real email address you control. Delete the test deal from the dashboard after.

1. Navigate to `https://themilanoseal.com/intake`
2. Complete the intake wizard with a valid test submission
3. Submit

**Verify:**

- [ ] No 500 error on submission
- [ ] Deal appears in Supabase `deals` table
- [ ] Row exists in `notifications` table for this deal
- [ ] Confirmation page loads at `/intake/confirmation?id={deal_id}`
- [ ] Confirmation email arrives at the test address
- [ ] Deal is visible in operator dashboard at `/dashboard`

---

## Step 9 — Manual Portal Confirmation Test

Use a matter that has an active portal access link and a registered OTP.

1. Navigate to the portal access URL for a test deal
2. Request an OTP at the email address on file
3. Submit the OTP via the portal confirm flow

**Verify:**

- [ ] `PORTAL_SESSION_SECRET` is detected (no 503 returned)
- [ ] Valid OTP confirms successfully
- [ ] OTP row in `portal_otps` is marked `used=true` and `otp=null`
- [ ] Response contains HMAC-signed session token (not plain base64)
- [ ] Submitting the same OTP a second time fails (single-use enforcement)
- [ ] Expired or invalid OTP fails closed (not 200)

---

## Step 10 — Go / No-Go Decision

Review all checklist items above.

**GO criteria — all of the following must be true:**

- 009 applied ✓
- 010 applied ✓
- 011 NOT applied ✓
- 012 NOT applied ✓
- documents bucket private ✓
- PORTAL_SESSION_SECRET set ✓
- Vercel build passed ✓
- Smoke test passed ✓
- Intake test passed ✓
- Portal test passed ✓

**NO-GO:** Any unchecked item above blocks go-live.

---

**Decision:** PRODUCTION READY / STILL BLOCKED  
**Signed off by:** _______________  
**Date:** _______________  
**Vercel Deployment ID:** _______________
