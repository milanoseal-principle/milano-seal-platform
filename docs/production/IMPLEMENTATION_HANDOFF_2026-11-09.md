# Source implementation and release handoff — 2026-11-09

## Review outcome

The cancellation defect and verified retention/operational gaps have source implementations and local evidence. This is not a P7–P30 completion certificate. Unexamined requirements and hosted/provider acceptance remain unverified. Existing canonical Matter, Wise, governance, custody, RON and intelligence modules were extended; no parallel lifecycle or outside product architecture was introduced.

## Review history and source

Main baseline was `0d70e0c7abbd41c787cf8ee99c5fbfb305137c17`. PR #456 implemented attempt-bound Wise authority and was externally merged to main at `f18a49c2b515c6e1007b64c21736bfd256c92774`. Codex did not merge it. PR #457 was externally merged into the original Wise feature branch, **not main**; its retention delta is therefore included in this follow-up against main. Later evidence commits on that branch are included here too.

Wise details and 14-stage local evidence: `WISE_ATTEMPT_SECURITY_2026-11-09.md` and `evidence/ATTEMPT_AUTHORITY_LOCAL_2026-11-09.json`. Retention details and 15-stage evidence: `RETENTION_AUTHORITY_2026-11-09.md` and `evidence/RETENTION_AUTHORITY_LOCAL_2026-11-09.json`. Operational changes: `OPERATIONAL_EVIDENCE_2026-11-09.md`. Existing P24–P30 integration mapping: `P24_P30_EXISTING_SOURCE_MAP_2026-11-09.md`.

## Implemented behavior

* Cancellation/failure/expiry invalidates current payment evidence and signing authority. New attempts cannot reuse old provider resources, amounts, currencies, references or timestamps. Replays and provider-notification recovery are checked atomically against the current attempt. Current RON reads revalidate authority.
* Retention uses serialized database deletion claims before remote deletion. Legal holds, exact claims, fresh human roles and unknown outcomes are enforced. Unknown outcomes cannot invite automatic deletion retry. Existing retention tables/panel are reused, including immutable hold history and explicit human reconciliation.
* Wise exception scanning uses fair bounded candidates and resolves only from current locked canonical truth. Absence from a capped scan never resolves an exception. Invoice reentry distinguishes invalidated/unavailable/current observations and avoids duplicate-payment invitations.
* Monitoring uses actual bounded read observations. Missing results stay unverified. Detailed diagnostics require dashboard authorization, avoid raw errors, and no longer mutate a Matter through a health GET.
* Production prebuild reads OpenAPI metadata once and rejects missing required schema capabilities. It executes no RPC, reads no customer rows, and applies no migrations. Metadata presence is not function/policy provenance or live certification.

## Hosted release blocker

Read-only connected Vercel evidence showed production READY at main `f18a49c2b515c6e1007b64c21736bfd256c92774`, deployment `dpl_Dzgk59WrK6Je2doSgXsdtFkFDZ5i`. Supabase project `ehqdzfopsrbwewtddiwq` was ACTIVE_HEALTHY, but its observed 47-entry ledger stopped at `20261108002559` and its schema lacked current payment-attempt columns and earlier retention/policy/governance/financial prerequisites. A READY deployment does not establish schema compatibility. This is a confirmed app/schema mismatch, not a successful production certification.

Historical hosted migration IDs differ from repository filenames. Do not infer a safe deployment by applying only the three new files or replaying every file blindly. Reconcile the actual hosted schema/definitions with the approved repository migration plan first. New forward files are `20261109060000_wise_attempt_authority.sql`, `20261109061000_retention_claim_and_hold_authority.sql`, and `20261109062000_wise_exception_current_truth.sql`. Their prerequisites must be reviewed and aligned before dependent source is deployed. The schema preflight intentionally blocks incompatible future production builds.

GitHub jobs were not started because account payments/spending limits blocked Actions. They are not passing hosted checks. Full local validation is separate evidence. Vercel preview builds were canceled by the existing ignore rule; no opt-in deployment was requested.

## Authorized helper inspection

Automatic approval initially blocked exporting the two private helper definitions. The user then explicitly authorized inspection of only `is_admin()` and `is_operator()`, excluding secrets and mutation. That scoped read succeeded. Both are postgres-owned SECURITY DEFINER PL/pgSQL functions, fixed `search_path=public,pg_temp`, with EXECUTE granted to authenticated and service_role but not anon/PUBLIC. Each queries the current operators row for `user_id=auth.uid()` and `is_active=true`; admin additionally requires `role='admin'`. They do not derive authority from a JWT role claim. The function bodies contain no dynamic SQL or caller-controlled object names.

The public schema grants USAGE, not CREATE, to anon/authenticated. The operators table is postgres-owned with RLS enabled and FORCE RLS disabled. Its SELECT policies allow the caller's own record or an admin. Its ALL policy requires `is_admin()`; absent explicit WITH CHECK, PostgreSQL reuses USING for write checks. A non-admin self row read therefore does not itself grant role changes. Fresh queries observe revocation under ordinary new-statement snapshots; this does not prove every endpoint rechecks roles or bypass-free concurrent transaction behavior. Broad table privileges, including TRUNCATE, remain a least-privilege audit concern and require reviewed privilege cleanup/testing; no hosted grants were changed. Privileged backend/table-owner access is a separate trust boundary.

Advisers also reported public-schema pg_net, disabled leaked-password protection and RLS tables without policies. Deny-all service-only tables are not automatically defects. No blanket permissive policies or hosted settings were added. Full P11 role-matrix, grants, RPC and concurrent revocation acceptance remains open.

## Acceptance boundary and next steps

P7 retention has tested source controls, not live deletion approval or published policy durations. P8–P23 existing modules were preserved and exercised by the release suite where covered; that is not individual acceptance of every directive. P24/P27 governance runtime is reused with existing disabled/default approval boundaries; no real agent/cron run was activated. P25 operational read models improved; actual provider uptime and financial completeness remain unverified. P26 existing intelligence/counsel/locale/acquisition modules remain subject to provenance/freshness/professional review. P28/P29 recovery and adversarial source evidence was extended using synthetic local fixtures; no real codes or provider events were executed. P30 source review is prepared; production acceptance is blocked.

Before release: resolve the app/schema mismatch through an explicitly authorized, schema-aware migration/rollback plan; restore hosted CI billing; review this source; run protected authenticated/provider tests against the aligned target; record exact deployed SHA and schema/policy provenance; then perform separately approved production acceptance. Preserve additive attempt, retention and immutable audit history on rollback. A copied external signing URL may require separately authorized provider cancellation; denying it in current application reads cannot retract a previously copied provider URL.

No Codex merge, deployment, hosted migration, real payment, RON execution, filing, courier purchase, customer outreach, code redemption, destructive storage action or agent activation was performed.

## Final local validation

All 16 local stages passed at `326a45a32656` with 1,286 unit tests. Evidence: `evidence/OPERATIONAL_LOCAL_2026-11-09.json`. A subsequent isolated preflight hardening rejects HTTP redirects so credentials cannot follow metadata redirects; its four tests were rerun. All other subsequent changes are evidence/documentation. The full aggregate was not rerun for those changes.
