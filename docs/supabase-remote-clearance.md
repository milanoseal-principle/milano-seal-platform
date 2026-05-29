# The Milano Seal™ — Supabase Remote Clearance Guide
**Document Reference:** MS-OPS-SUPABASE-2026-V1  
**Owner:** Platform Operator  
**Run before:** Vercel deployment and smoke test

---

## Step 1 — Open SQL Editor

Log in to [app.supabase.com](https://app.supabase.com).

Navigate to your project → **SQL Editor** (left sidebar).

---

## Step 2 — Apply Migration 009

Open the file `supabase/migrations/009_notifications_table.sql` from the repository.

Copy the full contents and paste into a new SQL Editor query.

Click **Run**.

**Verify success:**

```sql
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'notifications';
```

Expected result: `1`

If you see an error like `relation "notifications" already exists`, the migration was already applied — that is acceptable.

If you see any other error, stop and resolve before continuing.

- [ ] Migration 009 applied — `public.notifications` confirmed

---

## Step 3 — Apply Migration 010

Open the file `supabase/migrations/010_operator_file_isolation.sql` from the repository.

Copy and paste into SQL Editor, run.

**Verify success:**

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'deals' AND column_name = 'assignee_user_id';
```

Expected result: 1 row with `assignee_user_id`.

If you see `column "assignee_user_id" of relation "deals" already exists`, the migration was already applied — acceptable.

- [ ] Migration 010 applied — `deals.assignee_user_id` confirmed

---

## Step 4 — Do NOT Apply 011 or 012

**Migration 011 (`011_alliance_tracking_schema.sql`) — DO NOT RUN**

This migration is P1/P2 gated. Running it before P1 opens will create alliance and payout tables prematurely. Leave it staged in the repository only.

**Migration 012 (`012_country_registry.sql`) — DO NOT RUN**

This migration is P1 gated. It creates the country registry and featured globe destinations tables. Leave it staged in the repository only.

**Confirm neither is applied:**

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'alliance_partners', 'alliance_campaigns', 'alliance_payouts',
    'country_registry', 'featured_globe_destinations'
  );
```

Expected result: **0 rows.**

- [ ] 011 NOT applied
- [ ] 012 NOT applied

---

## Step 5 — Set Documents Bucket to Private

Navigate to: **Storage** (left sidebar) → **Buckets**

Locate the `documents` bucket.

Click the bucket name → click **Edit bucket** or the settings icon.

Under **Bucket settings**, set:

- **Public bucket**: OFF (disabled)

Save the change.

- [ ] `documents` bucket is now Private

---

## Step 6 — Verify Public Access Is Blocked

Attempt to open a raw storage URL in your browser. These follow the pattern:

```
https://<your-project-ref>.supabase.co/storage/v1/object/public/documents/<any-path>
```

Expected: The request returns an error (400, 403, or similar). The file is **not** served.

If the file is still served publicly, re-check Step 5 and confirm the bucket save was successful.

- [ ] Raw public URL access is blocked

---

## Step 7 — Verify Signed URL Access Works After Deployment

This step is completed after Vercel deployment (not before).

Once the application is deployed:

1. Upload a test file through `/api/upload` with a valid `deal_id`
2. Confirm the API response returns a `url` field containing a signed URL (starts with `https://...supabase.co/storage/v1/object/sign/...`)
3. Open the signed URL in a browser
4. Confirm the file is accessible via the signed URL

The signed URL will expire after 7 days (configured in the upload route).

- [ ] Signed URL returned by upload API
- [ ] Signed URL opens the file successfully
- [ ] Raw public URL for the same file still fails (confirming bucket remains private)

---

## Notes

- Do not rotate `SUPABASE_SERVICE_ROLE_KEY` unless there is a confirmed compromise
- Do not alter RLS policies after applying migrations without reviewing the impact on the operator dashboard and portal flows
- If a migration fails partway through, check for partial table creation before re-running
- Point-in-time recovery instructions are in `docs/backup-recovery.md`
