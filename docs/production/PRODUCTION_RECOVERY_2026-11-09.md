# Production recovery evidence and release boundary

The running domains still point to READY deployment `dpl_Dzgk59WrK6Je2doSgXsdtFkFDZ5i`, source `f18a49c2b515c6e1007b64c21736bfd256c92774`. Latest inspected main is `c2ba69f52ca9417486593f3d17ecebdaed540774` (#465). PRs #461–#465 were merged externally; their source is preserved. Production is not aligned with current source. No production mutation, deployment, provider transaction or GitHub merge was performed by this recovery work.

## Verified failures

| Failed source | Deployment | First failure |
| --- | --- | --- |
| f635c985 | dpl_14js8Ft9DCofoSu5bux8rNbRorUB | Documentation isolation check; current source already passes it |
| 44fed45e | dpl_3ucxTyhjZPZE1X2my4vzkkrGg1R2 | Production schema capabilities missing |
| 42e80d93 | dpl_Eu8a6s8qTS3yG5BRnBz55TX171Mr | Production schema capabilities missing |
| a778b867 | dpl_8Kdr2TNbDdck2u8U6TUxxiGws7JM | Production schema capabilities missing |

The schema validator remains enabled. Public health and both domains returned 200 through the canonical www alias. Public login browser chunks identify `ehqdzfopsrbwewtddiwq.supabase.co`; the public URL environment metadata predates the running deployment. No environment values, keys or private object bytes were exported. Required environment names are present; presence does not prove provider health. The observed production runtime error cluster is `/api/cron/wise-payment-reconcile`; zero production errors are not claimed.

## Concrete compatibility repairs

The hosted ledger has 47 entries. Its history alone does not reproduce its actual schema: manual/unrecorded changes exist. The private isolated baseline reproduces 104 public tables, 1,750 public columns, 52 application functions, 380 public indexes, 32 public triggers, 132 public policies, table/function grants, inspected storage policies and bucket metadata. Managed Auth/Storage primitives are substituted explicitly; no customer rows or private storage bytes are copied.

The exact ordered 35-file upgrade is in `supabase/migration-replay-plan.json` under `hosted_recovery`, with file hashes and a pinned baseline metadata fingerprint. It includes the missing existing `054_notification_delivery_audit.sql` prerequisite, the unapplied forward capability migrations, and the already merged #463 repairs:

- `20261109140000_identifier_hash_extension_compatibility.sql`: the existing identifier SHA helper fails on the real hosted database because its hardened path cannot resolve `extensions.digest`. Use native SHA-256 over the same UTF-8 bytes, preserving its ACL and existing hashes.
- `20261109150000_private_evidence_table_privileges.sql`: remove inherited TRUNCATE/REFERENCES/TRIGGER privileges from anonymous/authenticated roles on ten private evidence/message/RON tables. RLS and row-delete triggers do not protect TRUNCATE. Existing SELECT/DML policies and service-role access remain intact.

The fresh-database operator prerequisite is deliberately excluded from this hosted batch. The real hosted helper uses current active operator rows; replacing it with an app-metadata implementation could change revocation behavior. Its exact definition and inactive-operator denial are verified before and after the rehearsal.

Collect the private read-only input with `supabase/verification/production_recovery_snapshot.sql` through the independently verified project connection. Never publish that definition snapshot. Run:

```sh
npm run rehearse:production-upgrade -- --snapshot /private/production-schema.json
```

The executable checks the inspected baseline fingerprint, every selected SQL file hash, nonempty non-customer preservation fixtures, exact SHA byte vectors, role revocation, private maintenance denials, actual capability presence, real Wise attempt/settlement scheduling RPCs, default-off governance, and physical restore. Artifacts go to `artifacts/production-recovery/rehearsal.json`. A local physical restore is not evidence that a production backup exists. The rehearsal has no hosted connection or provider/write transport.

Observed read-only data preconditions: two unpaid/unverified Matters, no RON sessions/documents or document versions, three custody events with no missing/invalid hashes or forks, no duplicate notification provider IDs, and seven private storage objects. Existing failed/provider-accepted notification history is preserved; acceptance is never promoted to delivery. The fixture mirrors the relevant state shapes without copying actual customer records.

## Branch consolidation

All 473 remote branches were fetched and inventoried without deletion or force pushes: 371 already merged, two superseded, 99 divergent/unrelated/not ready, and the then-open integration branch for PR #462 (now merged externally). These counts describe that observed inventory, not a fresh claim about every current remote head. Exact branch heads, merge bases, changed files, migration paths and security-sensitive paths are in the generated local inventory. No unrelated branch was blindly integrated. The Claude branch and unpublished intake work remain preserved.

## Required production release gate

**BACKUP_UNVERIFIED. PRODUCTION WRITE NOT AUTHORIZED. RELEASE NO-GO.**

Connected tools expose database/project/schema metadata but no recoverable backup/PITR catalog. The owner must verify, in Supabase Dashboard → project `ehqdzfopsrbwewtddiwq` → Database → Backups, a completed backup or PITR restore point with its UTC time/retention and a tested isolated restore procedure. Verify separate recovery of the seven private Storage objects: database backups preserve Storage metadata, not the actual object bytes. Do not restore over production to test recovery.

After the owner reviews/merges the source and verifies recovery, obtain explicit authorization for this exact target and ordered migration batch. Re-read metadata and data preconditions immediately before the approved write and stop on drift. Do not reset production, replay all repository migrations, replace the hosted operator helpers, rewrite historical migration records, disable RLS or loosen RPC permissions.

After approved migrations, re-read definitions/grants/policies, confirm the REST schema cache, rerun the original production capability preflight and build, then deploy only the reviewed approved main SHA. Verify READY, both aliases, actual source SHA, public/private endpoints, persistence and error logs. Real Wise transfers, RON sessions, government filings, commercial redemptions, customer transmissions and courier purchases require separate authorization. AI governance remains paused/default-off until explicitly approved.

## Current-main source completion delta

The latest directive supersedes the earlier missing-commit P19 waiver. `scripts/certification/p19-e2e.mjs` now runs one real canonical synthetic Matter through lead conversion, reviewed private quote, exact policy, unpaid/processing denial, settlement, scheduling, RON statutory append/reopen/reverification, authentication lineage, release, custody, exclusive courier claim, portal projection, notification truth, synthetic delivery/close and repeat attribution. Global network calls are denied; controlled-live mode refuses even when its explicit flag is set. The full source manifest requires all five P19–P23 phases at the exact SHA/tree, including the existing #465 recovery SQL regression in the merge gate.

The new forward migrations repair only proven missing instruction columns, governed RON correction re-verification, and delivery/close release evidence. The portal/VA upload path now uses existing files/document_versions instead of the nonexistent documents table. The recovery plan pins these additional reviewed files after the preserved earlier batch. It remains an isolated rehearsal plan, not permission to apply it.

P12 records exact SQL-hash history equivalences separately from object-capability gaps. Unmatched historical migrations and legacy module relations remain unsafe for blind replay/recreation; a matching date or name is never deployment proof. Managed Auth/Storage and actual object bytes require hosted validation. Source simulation does not establish production alignment, legal acceptance, real provider outcomes or a verified production backup.

## Post-#467 release regression review

Current inspected main is `3baf58165a29f9f40c61c6ce3f863cd42ec63fec`. The no-auth release harness now compares stable receipt fields and the entire persisted ledger instead of equating creation/replay response envelopes. It checks Matter/final-version/hash/key binding, no duplicate event/effect, unchanged payment truth and the canonical identifier lock boundary. The existing no-auth harness is required in the exact-SHA/tree source manifest and live-mode refusal checks.

The reviewed recovery queue now includes PR #467's existing no-auth migration plus a forward correction of its identifier check: canonical `field_id`/`status` and current hashed lock evidence replace references to retired legacy-only columns, with UUID/text Matter IDs compared consistently. This was found by executing the real release RPC against the captured hosted-schema reconstruction, not inferred from filenames. The 40-file batch must pass the extended 14-check rehearsal, including no-auth release and Italy identifier denial/confirmation on the upgraded schema. No production write is authorized by this plan update.

Read-only reinspection found the same application catalog capabilities as the previous snapshot after order/empty-category normalization. Security advisories still include service-only RLS tables without public policies, the existing public pg_net placement, intentional authenticated role-helper execution, and unverified leaked-password protection. These are reported for hosted review; they do not establish production security certification. Neither a recoverable database backup/PITR point nor private Storage byte recovery is exposed/proven by the connected controls. Both production gates remain blocked; no client documents were downloaded.
