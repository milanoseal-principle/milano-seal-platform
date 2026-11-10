# Milano Seal — Resilience & Recovery Controls

Practical data protection and recovery controls for production operations.

---

## Supabase Backup

- Production uses Supabase Free; managed daily backups and PITR are not established.
- Follow [Independent Free-plan Backups](../independent-free-plan-backups.md) for the existing encrypted off-site workflow, credential setup, actual remote verification and isolated restore drill.
- Do not infer a successful backup from the schedule or a successful application deployment.
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
- If a migration causes data loss, preserve evidence and validate a verified clean backup in an isolated environment first. Any production restoration requires a separate reviewed incident decision; never blindly restore over production.
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

- If the Wise webhook fails, use the canonical reconciliation/exception workflow and exact provider settlement evidence. Submission, processing, founder assertions and payment flags do not establish settlement or unlock scheduling, execution or final release.
- If Shippo is unavailable, preserve actual handoff/custody evidence through the governed operator workflow; do not manufacture shipment purchase, delivery or closeout evidence.
- If the RON provider is unavailable, record the blocker and obtain governed route review before changing the execution method. Keep payment and statutory-evidence requirements enforced.
- If Supabase is unavailable: no portal access. Communicate ETA to active clients.

## PR473 additional review — 2026-11-10

The existing backup implementation now binds database bytes to manifest format2, rejects symlinked roots/unlisted content, requires revision sizes, commits the manifest atomically, and inspects TAR headers before extraction. The existing workflow verifies its production database target/TLS/PostgreSQL17 and custom-dump readability and is restricted to reviewed main.44 offline regressions pass; actual remote decryption and isolated restoration remain unperformed.

Run42845657797/job129932291740 failed before any steps due to GitHub account billing/spending restrictions. Current execution bindings and secret metadata access are unavailable; no R2 privacy/retention/rotation, independent encryption-key custody, compatible isolated target, consistency window, delivered alert or independent freshness monitor has been verified. Production schema/migration and deployment facts above remain historical observations, not fresh hosted certification. No migration batch was reapplied and no production/restore/provider operation was performed. **Disaster recovery certification: BLOCKED.** See the canonical [backup runbook](../independent-free-plan-backups.md) for exact prerequisites and the actual-archive drill.
