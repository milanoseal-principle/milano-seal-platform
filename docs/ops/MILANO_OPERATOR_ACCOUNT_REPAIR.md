# Milano Seal — Operator Account Repair

## Required Operator Accounts

| Email | Role |
|---|---|
| nicholas@themilanoseal.com | founder_admin |
| tiffany@bulbtech.io | founder_admin |

---

## Method 1 — Repair Script (Recommended)

Uses the Supabase Admin API server-side. Handles create-or-update idempotently.

**Required env vars (never commit values):**
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
MILANO_NICHOLAS_TEMP_PASSWORD=
BURTT_TIFFANY_TEMP_PASSWORD=
```

**Run:**
```bash
SUPABASE_URL=... \
SUPABASE_SERVICE_ROLE_KEY=... \
MILANO_NICHOLAS_TEMP_PASSWORD=... \
BURTT_TIFFANY_TEMP_PASSWORD=... \
npm run repair:operators
```

Script sets:
- `email_confirm: true`
- `password` via Admin API (not logged, not stored in code)
- `app_metadata.role: "founder_admin"`
- `user_metadata.display_name` and `milano_role_label`

**Rotate passwords after first successful login.**

---

## Method 2 — SQL Role Repair Only

Use this if the account exists but the role is missing or wrong.
This does NOT set or change passwords — use the dashboard or repair script for password changes.

```sql
UPDATE auth.users
SET raw_app_meta_data =
  COALESCE(raw_app_meta_data, '{}'::jsonb) ||
  '{"role":"founder_admin"}'::jsonb
WHERE lower(email) IN (
  'nicholas@themilanoseal.com',
  'tiffany@bulbtech.io'
);
```

Run in Supabase Dashboard → SQL Editor.

---

## Method 3 — Supabase Dashboard (Manual)

1. Open Supabase Dashboard → Authentication → Users
2. Find user by email
3. Click user → Edit
4. Set password (use a strong temporary password)
5. In App Metadata (raw_app_meta_data) set: `{"role": "founder_admin"}`
6. Save

---

## Route Access — founder_admin

`founder_admin` is in `ADMIN_ROLES` in `lib/dashboardAuth.ts`. It has access to:

- `/dashboard/**` — full operator dashboard
- `/dashboard/testing/tiffany-e2e` — E2E demo harness (requires `MILANO_E2E_DEMO_MODE=true`)
- `/portal/**` — preview mode (FOUNDER_PREVIEW_ROLES)
- `/va/**`, `/alliance/**`, `/ops/**`, `/workspace/**`, `/admin/**` — all protected prefixes

---

## Required Vercel Env Vars

| Var | Purpose |
|---|---|
| `MILANO_E2E_DEMO_MODE` | Set to `true` to enable /dashboard/testing/tiffany-e2e |
| `MILANO_NICHOLAS_TEMP_PASSWORD` | Used by repair:operators script only |
| `BURTT_TIFFANY_TEMP_PASSWORD` | Used by repair:operators script only |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin key — server/script only, never client |

---

## Security Notes

- Never commit passwords to git.
- Never log passwords in scripts or server routes.
- The repair script reads passwords from env vars and passes them directly to Supabase Admin API. No intermediate storage.
- Service role key must never appear in client-side code or be exposed to the browser.
- After running the repair script, rotate both passwords via Supabase Dashboard.
