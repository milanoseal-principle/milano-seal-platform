# P4B statutory evidence reconciliation

Base: `69c5a0859a58214f5507fc3b10ddb76d3069f2ee`, merged P4 PR #437.
The missing P4B delta preserves provider-completion evidence while making Milano
completion depend on an authorized, operator-verified statutory evidence revision.

## Authoritative behavior

- Provider completion records provider truth and leaves Milano evidence pending.
- Webhook and operator retrieval share content-addressed PDF ingestion. Existing
  objects are reused only after SHA-256 verification; source bytes are checked
  against the hash recorded when actually submitted to the provider.
- A transactional, service-only capture RPC serializes on the existing session,
  creates separate canonical source/executed document versions, and appends a
  capture/custody event to the existing RON audit ledger. Changed returned bytes
  preserve both versions and open a blocking compliance incident.
- Verification requires the exact signer roster, selected executed versions,
  commission jurisdiction/expiration, act/count, certificate/seal, identity/KBA,
  actual execution time, journal, recording/retention, witness applicability and
  a passed canonical RON QA review. Blocking incidents prevent progression.
- Florida recording evidence requires the established ten-year minimum.
- Previously verified evidence is locked. Authorized reopen requires a reason,
  appends an audit event, and revokes completion until re-verification. History
  and captured source/executed hashes cannot be rewritten.
- External provider fee evidence is optional and system-classified as
  `EXTERNAL_PROVIDER_NOTARIAL_FEE`. Amounts and alternate classifications are
  rejected. This evidence does not author Milano financial facts.
- Portal completion requires current server verification, not a stored pointer.
  Legacy incomplete evidence fails closed. Wise settlement gates remain intact.

## Validation and scope

`npm run test:p4-database` applies actual dependent migrations to isolated PGlite
PostgreSQL, then exercises capture/retry, missing/invalid evidence, authorization,
reopen, immutability, changed bytes, QC, incidents and progression. It is not a
hosted migration run or evidence of a real notarization.

`CHROMIUM_PATH=/usr/bin/chromium node scripts/test-p4-rendered.mjs` renders the
actual operator panel at 320/360/375/390/412/430/768/1024/1280/1440px. Transport is
intercepted; screenshots and payload assertions do not establish hosted persistence.

The stale postpayment validator now checks migration 089's verified-settlement
rule and the governed Apostille endpoint; it no longer endorses superseded 079
observed-submission scheduling or the disabled legacy Apostille mutation.

The former ignore-only ESLint config did not evaluate TypeScript production
files. Pinned ESLint/parser/plugin dependencies now parse production source with
active rules; a coverage probe verifies enforcement on representative surfaces.

The new migration is forward-only and has **not** been applied to hosted Supabase.
Deploying routes that require it must follow a verified migration rollout. No
production order, provider session, payment, notification or deletion was executed.

P3 remains **P3 DEPLOYED — CONTROLLED LIVE VERIFICATION REMAINS**. This P4B source
work does not certify completion of P5–P23 or controlled live provider transactions.

## Protected scope review

The historic salvage and canonical-foundation validators reject protected RON
paths by default. Their existing explicit phase allowlists now include only the
paths enumerated in `scripts/governed-production-scope.mjs` for this directive.
Wise, release, courier, unrelated RLS and unrelated migrations remain protected.
The checks themselves still run; no gate or behavioral assertion is disabled.
