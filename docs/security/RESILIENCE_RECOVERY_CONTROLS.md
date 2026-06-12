# Milano Seal — Resilience & Recovery Controls

Practical data protection and recovery controls for production operations.

---

## Supabase Backup

- Supabase Pro plan includes daily automated backups.
- Verify backup schedule is active in Supabase dashboard → Settings → Backups.
- Export critical matter data monthly to a founder-controlled secure location.
- Do not rely solely on Supabase backup for compliance-critical records.

## Final Document Immutability

- Final released PDFs must not be overwritten after delivery confirmation.
- The Vault should store final PDFs as immutable objects.
- Any correction requires a new version with a new filename and delivery log entry.
- Old versions are retained, not deleted.

## Delivery Log Requirement

- Every document release must generate a `delivery_logs` record (migration 030).
- Record: matter_id, file_name, sent_by, sent_at, status, confirmation_received.
- Delivery log is permanent — no delete policy.

## Final Release Package Snapshot

- Before international courier release: snapshot the complete apostille package to The Vault.
- Snapshot includes: final PDF, apostille attachment, identifier lock confirmation, payment confirmation.
- Snapshot timestamp must be earlier than courier handoff timestamp.

## Founder Approval Record

- Every `FOUNDER_RELEASE_OVERRIDE` event must be retained in `custody_ledger`.
- Fields: matter_id, actor, reason, timestamp.
- These records are not deletable by VA or client roles.

## Bad Deploy Rollback — Vercel

1. Go to Vercel → Project → Deployments.
2. Find the last known-good deployment.
3. Click the three-dot menu → Promote to Production.
4. Verify `/api/health` returns `status: ok` after promotion.
5. Notify team of rollback and document reason.

## Bad Deploy Rollback — Database

- Supabase migrations are forward-only. Do not run destructive rollbacks in production.
- If a migration causes data loss, restore from the most recent backup.
- For schema-only issues (new column, new table), assess impact before restoring.
- Critical matter data: `deals`, `execution_safety_checks`, `identifier_locks`, `final_release_reviews`, `legacy_client_credits`, `delivery_logs`, `custody_ledger`.

## Export Critical Matter Data

Periodically export:
```sql
SELECT * FROM deals ORDER BY created_at DESC;
SELECT * FROM identifier_locks ORDER BY created_at DESC;
SELECT * FROM final_release_reviews ORDER BY created_at DESC;
SELECT * FROM delivery_logs ORDER BY sent_at DESC;
SELECT * FROM legacy_client_credits ORDER BY created_at DESC;
```

Store exports in encrypted, founder-controlled storage.

## Service Continuity

- If Wise webhook fails: manual payment confirmation via `PAYMENT_CONFIRMED_MANUAL` (founder only).
- If Shippo is unavailable: document courier handoff manually in `delivery_logs`.
- If BlueNotary/RON platform is unavailable: schedule mobile notarization alternative.
- If Supabase is unavailable: no portal access. Communicate ETA to active clients.
