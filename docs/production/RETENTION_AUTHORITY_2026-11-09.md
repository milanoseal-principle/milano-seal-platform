# Retention authority and recovery delta

Depends on Wise attempt remediation PR #456. Existing P5/P7 tables, policies and retention durations remain canonical. No duration, legal rule or deletion decision is invented or activated.

The previous route removed storage bytes before final persistence and could return success for zero-row updates. Hold scope could name an unrelated Matter's record/session. Hold releases had no immutable event in the audit ledger. An uncertain remote deletion could invite blind retry.

This delta adds a service-only, fresh-role-authorized retention command to the existing registry. Hold placement/release and deletion claims serialize on the Matter lock. Scoped session/record ownership is enforced in SQL. Holds committed before a deletion claim block it; a new hold cannot report preservation while destruction is in flight. Released holds remain immutable and the existing audit ledger records immutable placement/release history. Only protected human roles can release holds, authorize/claim deletion or reconcile outcomes.

A committed deletion claim precedes any storage request. Pending/unknown outcomes cannot be automatically reclaimed. A matching provider/storage response and exact claim are required before reporting deletion; timeout, ambiguous response or failed outcome persistence returns reconciliation-required, never success. Founder reconciliation requires evidence of deletion or preservation. Actual destructive truth may be recorded after a later preservation hold; that hold continues to protect remaining evidence. No expired claim is blindly retried.

The existing operator RON panel now displays hold history, release controls, authorized record deletion and evidence-based reconciliation. It is also reused in the Matter drawer for non-RON visibility; no second retention UI or portal. Server authorization is independent of button visibility. Matter reads page to exhaustion through the existing bounded keyset helper and errors cannot become empty-success responses. The service client supports an optional per-request timeout used by this endpoint.

New uploads, versions, Matter records, issued financial artifacts, notifications and custody/Matter evidence are now registered by database triggers. Registration never resolves an unapproved policy or rewrites historical rows. Protected humans can publish an owner-approved class duration/basis with evidence and apply it to an individually verified start event; the expiry is computed from that approved duration and becomes immutable.

New forward-only migration: `20261109061000_retention_claim_and_hold_authority.sql`. Three nullable claim fields and functions/triggers only; no existing row rewrite or policy-duration change. Manual migration file creation follows the CLI execution limitation described in the dependency's security report.

Local PostgreSQL tests cover actual functions/triggers, role/scope denial, immutable histories, single-use claims, hold-before-claim and claim-before-hold ordering, unknown outcomes, reconciled retries and actual expiry. They exercise serialized orderings in one isolated PostgreSQL fixture, not a hosted multi-connection concurrency drill. Browser tests use isolated intercepted transport and cannot certify hosted storage deletion.

Release: review the target ledger and function/grant/index/RLS provenance, verify backup/recovery evidence, then apply only pending migrations with founder approval before deploying dependent code. Rollback stops destructive controls and retains claims/history. Never clear an unknown claim or restore an old destructive route to retry it. Resolve outcome with independent provider/storage evidence and a reviewed forward repair.

No production storage deletion, hold mutation, policy publication, provider operation, deployment, migration or agent activation was performed.

Focused local evidence: 35 actual PostgreSQL checks, complete unit suite, TypeScript, lint, upgrade/physical restore and controlled browser proof at 320/1440 passed before the final aggregate gate. The rendered proof intercepts synthetic transport and tests rejected authorization, uncertain destruction, blocked retry and evidence-bound reconciliation. It does not certify hosted authentication or external destruction. A worktree dependency symlink initially prevented Turbopack resolution; an isolated local dependency copy corrected that fixture setup.
