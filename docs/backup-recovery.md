# The Milano Seal™ — Backup & Recovery Runbook

**Status: Supabase Free plan; managed daily backups and PITR are NOT enabled.**

The source of truth for the independent off-site backup strategy, activation requirements, and restore drill is [Independent Free-plan Backups](independent-free-plan-backups.md).

## Operational requirements

- Do not claim any scheduled backup has succeeded until GitHub Actions reports success AND the independently owned external bucket contains the verified encrypted artifact.
- Do not claim restoration readiness until an isolated restoration is tested, including actual private Storage document bytes, authentication continuity, policies, and application flows.
- Backups must be encrypted before transfer; never upload plaintext database or document files to GitHub or public object storage.
- The automated workflow is staged for review, and requires external S3-compatible storage credentials, database credentials, service credentials, and a private encryption passphrase before it can run.
- Before each risky production migration, take a separate verified encrypted snapshot.
- Treat failures as blockers for risky migrations and investigate promptly. Never restore directly onto production without a documented incident decision and verified clean point.
- Monitor backup freshness every day. Keep the encryption decryption secret in an independent, secured offline location.

## Recovery sequence

1. Contain incident; preserve forensic evidence; avoid unreviewed writes.
2. Locate the latest verified backup artifact and check its cryptographic hash and manifest.
3. Decrypt only in an access-controlled environment.
4. Restore into an isolated test environment first, handling Supabase managed auth/storage schemas and project keys carefully.
5. Re-upload document binaries and validate metadata, checksums, and permissions.
6. Verify account sign-in, RLS, app health, document workflows, audit trails, and third-party integration configuration.
7. Approve production recovery only after independent evidence review and change control.
8. Record incident timeline, last safe restore point, recovery time, tests performed, and final signoff.

## What a database dump does NOT back up

Supabase Storage object bytes; provider configuration; production encryption root keys; integration secrets; Vercel environment values; third-party records; or independently deployed Edge Functions. Keep secure inventories and separate recovery procedures for these.

## Ownership

Nicholas Milano / authorized platform operator owns backup verification, key custody, restore drills, and incident approval. Do not give a GitHub workflow or AI agent unrestricted authority to overwrite production data.
