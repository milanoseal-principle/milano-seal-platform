# The Milano Seal™ — Backup & Recovery Runbook

**Document Reference:** MS-OPS-BACKUP-2026-V1  
**Owner:** Platform Operator / Nicholas Milano  
**Minimum Backup Cadence:** Daily (automated via Supabase), weekly manual verification

---

## 1. Supabase Automated Backups

Supabase Pro plans include daily automated backups with point-in-time recovery (PITR).

**Verification steps (run weekly):**

1. Log in to [app.supabase.com](https://app.supabase.com)
2. Navigate to your project → **Database** → **Backups**
3. Confirm the latest backup timestamp is within the last 24 hours
4. Confirm backup status shows **Completed** (not failed or pending)
5. Note the retention window (typically 7 days on Pro, 30 days on Team/Enterprise)

**If backups are missing or failed:**
- Open a Supabase support ticket immediately
- Do not deploy schema migrations until backups are restored

---

## 2. Manual Database Export

Run a manual export before any major migration or deployment:

```bash
# Requires psql and the Supabase connection string from Dashboard > Settings > Database

pg_dump \
  "postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres" \
  --no-owner \
  --no-acl \
  --schema=public \
  -f backup-$(date +%Y%m%d-%H%M%S).sql
```

Store the resulting `.sql` file in a secure location (not the repository).

---

## 3. Storage Backup

Supabase Storage buckets are **not included** in database backups.

**Manual storage export steps:**

1. Navigate to Supabase Dashboard → **Storage**
2. For each bucket (`documents`, `evidence`, etc.):
   - Download critical files via the Storage UI or Storage API
   - Or use the Supabase CLI: `supabase storage download --bucket documents ./storage-backup/`
3. Store exports in encrypted cloud storage (e.g., S3, Backblaze B2)

**Cadence:** Weekly or before any schema migration affecting file records.

---

## 4. Point-in-Time Recovery

If data loss or corruption is detected:

1. Navigate to Supabase Dashboard → **Database** → **Backups**
2. Select the most recent clean backup timestamp
3. Click **Restore** — this creates a new project from the backup
4. Update environment variables in Vercel to point to the restored project URL and keys
5. Verify restored data against the last known good state
6. Re-run any migrations from the restored point forward

**Note:** PITR restoration creates a new Supabase project. DNS/env updates take effect on next Vercel redeploy.

---

## 5. Restore Test Checklist

Run this checklist after any restore operation:

- [ ] `/api/health/database` returns `status: ok`
- [ ] `/api/intake` accepts a test submission (use staging credentials)
- [ ] Dashboard deals list loads without error
- [ ] Portal OTP flow completes successfully
- [ ] `client_safe_matter_view` and `client_safe_timeline_view` resolve
- [ ] `webhook_events`, `notifications`, `deals` tables are accessible
- [ ] RLS policies are active (confirm via Supabase Dashboard → Auth → Policies)

---

## 6. Incident Response — Data Loss

If production data loss is suspected:

1. **Do not write to the database** until the scope of loss is understood
2. Pull the most recent Supabase backup timestamp from the dashboard
3. Cross-reference against the last known `audit_events` entry in the affected table
4. If loss is confirmed: initiate PITR restore (Section 4)
5. Notify all active clients with open matters of potential service interruption
6. Document the incident in the platform audit log once service is restored

---

## 7. Responsible Owner

| Role | Responsibility |
|---|---|
| Platform Operator | Verify weekly backup status, execute manual exports before migrations |
| Developer (Prince) | Run restore tests after schema changes, confirm health routes post-deploy |

---

## 8. Do Not Include in This Document

- Supabase connection strings
- Service role keys
- Database passwords
- Vercel environment variable values

All credentials are stored exclusively in Vercel Environment Variables and the operator's secure credential vault.
