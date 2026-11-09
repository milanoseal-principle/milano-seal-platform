# THE MILANO SEAL™ — FINAL CHAT-WIDE RESIDUAL PRODUCTION ENGINEERING INJECTION
## Delta only · build and prove, never duplicate · 2026-11-08

**Company:** Milano Seal International LLC dba The Milano Seal™  
**Repository:** https://github.com/milanoseal-principle/milano-seal-platform  
**Production:** https://www.themilanoseal.com  
**Verified main at creation:** `7f6f511fb805598a5f485f3b1133ea9d3549fa4d`. Synchronize latest main before work.
**This file is an engineering work order, not an implementation or certification result.**

## CONTROLLING ASSIGNMENT

You are the accountable CTO, principal backend/full-stack engineer, Supabase/security architect, QA lead and release engineer. **Implement and validate actual remaining code deltas**, not another report, prompt, dummy validator, duplicate master or speculative architecture. Start by inspecting actual latest main, merged PRs #448–#452, and these authoritative sources:

- `docs/FINAL_PRODUCTION_CERTIFICATION.md` (MS-OPS-FINALCERT-2026-V1), particularly actual Wise scheduling/settlement/release distinction and separate Gate 37 TIFFTEST99.
- `docs/production/FINAL_GAP_CLOSURE_IMPLEMENTATION_2026-11-08.md` for evidence-based P6–P23 + G1–G5 matrix, limitations and migrations.
- `docs/production/FINAL_G1_G5_P6_P23_GAP_CLOSURE_EXECUTION_2026-11-08.md`
- `docs/production/P6-P23_FINAL_EXECUTION_MASTER_2026-11-08.md`
- `docs/production/MILANO_AI_BOARD_G1_G5_FULL_IMPLEMENT_DEPLOY_MASTER_2026-11-08.md`
- `docs/production/AI_GOVERNANCE_IMPLEMENTATION_2026-11-08.md`
- `docs/control-plane/09_TIFFANY_FINAL_15_STEP_PRODUCTION_TEST.md`, `docs/qa/LIVE_DISCOUNT_WISE_CERTIFICATION.md`, `memory/PRD.md`, latest locked Milano master, SOP and Section 71 CTO specification, if available.
- Active code, migrations, `docs/ROUTE_MAP.md`, `docs/architecture/LAYER_MANIFEST.json`, architecture/brand locks, CI config.

**Deduplicate per endpoint/file before touching code.** G1–G5 agent council/Board Room/12 executives/5 committees/B13 and P6–P23 large source additions already landed. PR #450 implemented governance, PR #452 added security, financial, document, notification, recovery and certification deltas (1,272 tests; 122 migration replay; local build). None of these local results establishes hosted deployment or live provider certification.

### HIGHEST-PRIORITY PAYMENT-DOCTRINE CONFLICT — RESOLVE FROM CANONICAL SOURCE, NOT HISTORICAL PROMPT

Historic directives sometimes say “settlement before scheduling.” Current `docs/FINAL_PRODUCTION_CERTIFICATION.md` explicitly distinguishes:

1. AUTHORIZED QUOTE / DISCOUNT / INVOICE: pricing and invoicing only; not payment.
2. INTEGRITY-MATCHED **WISE SUBMISSION OBSERVED**: governed scheduling authorization **may** be established only after authoritative server-side amount/currency/reference integrity checks; must NOT set `payment_confirmed`, `payment_status=paid`, or authorize execution/final release.
3. AUTHENTIC WISE PROVIDER EVIDENCE: separate higher execution/signer-link gate where required by current state machine.
4. WISE VERIFIED/SETTLED PAYMENT **plus canonical full balance and all release controls**: final payment and courier/release authority.

**Do not weaken OR tighten scheduling arbitrarily.** Trace implemented state machine and authoritative tests; resolve conflicts in stale docs/tests only if they contradict current locked rules. Preserve stronger controls for execution, final release and financial truth. Test pending, observed-but-not-settled, invalid amount/currency/reference, provider verified, settled, partial, replayed and cross-Matter Wise evidence separately. Keep Wise-only, external BlueNotary fees excluded, no Stripe. Verify 50/50 invoice and retainer doctrine where in canonical current source. Never let 'observed submission' produce a paid receipt, verified revenue or delivered status.

### REMAINING IMPLEMENTATION AND CERTIFICATION WORK — ORDERED

**R0: Current-main audit and evidence freshness**
- Fetch current main, deployed Vercel SHA and PR status separately. Determine if already repaired since #452. Inventory existing code/test/migrations/CI for every gap below and classify as VERIFIED_EXISTING / ACTUAL_CODE_GAP / HOSTED_UNVERIFIED / HUMAN_APPROVAL / PROVIDER_LIVE.
- Reconcile the historical P6–P23 status ledger with current source only after evidence. Do not reintroduce a broken baseline.

**R1: Fix any actual code gaps in protected public API routes**
- Validate auth before resource existence disclosures for invoice, custody, evidence, export and download. Specifically recheck previously observed hosted synthetic probes: export returned 404, evidence 500, custody 200 where protected auth was expected; #452 fixed source guards but hosted version was not remediated.
- Security negatives: unauthenticated unknown and existing IDs, foreign Matter, wrong role, expired signed URL, signer evidence column access, sensitive error redaction. Use server-side RLS/RPC authorization and prevent IDOR. Do not permit healthy public API responses to reveal protected document contents or evidence.
- If source is already complete, do not patch it just for activity. Capture deployment gap instead.

**R2: Hosted CI / low-cost gate continuity**
- GitHub Actions four jobs reportedly failed before startup from account billing/spending limit. THIS CANNOT BE FIXED BY TEST CODE. Preserve required check integrity and exact failed status. Document owner UI action to repair payment/spend limit if remote CI required.
- Use real canonical local merge gate, production build, 1,272+ test baseline, real SQL/replay/security/QA with exact SHA. Inspect newer test total.
- Confirm Vercel protected main build runs merge gate. Previous ordinary previews were intentionally canceled via Ignored Build Step. Do not globally override the cost-saving predicate.
- For approved safe preview, opt in with the existing `[validate-preview]` convention (only after isolation) and verify READY, commit SHA, redirect/alias, auth and runtime. Do not mark GitHub jobs green from local logs. If an alternative independent CI runner is approved, it must have real isolated test execution and independent status; do not bypass protected branch requirements.

**R3: Supabase hosted provenance and 11 migration rollout**
- Existing `scripts/verify-hosted-schema.mjs` is read-only; use approved `SUPABASE_ACCESS_TOKEN` and `SUPABASE_QA_PROJECT_REF` bindings only, never secrets in chat or commit. Review its output against actual migration filenames, table/column/function/grant/RLS/trigger/storage rules.
- Existing 11 additive migrations from `20261108200000` to `20261108214000` were locally replayed, NOT hosted in PR evidence. Confirm whether a later deployment already applied them before planning rollout. Include governance two migrations and historical `is_operator()` prerequisite/clean replay rules. No production baseline wipe or rewriting old migration files.
- Run isolated upgrade, real SQL fixture, RLS, backfill/reconciliation and physical restore; record correct application order and compatibility. Stage only necessary forward migrations and obtain human approval before hosted write. Check backups and rollback/forward repair.

**R4: Authenticated preview certification — board and client flows**
- Current G1–G5 board source: `lib/control-plane/governance/*`, Board Room route, cron, reporting, 12 directors+B13, 12 executives, 5 committees, controlled tools, task budgets, approval/hold/verification.
- Prove these against actual isolated hosted authentication + persisted DB, not intercepted browser fixtures. Founder/admin versus client/partner anonymous; invalid/expired/cross-resource/exact-payload approvals, D05/D07 read-only under holds, pause kill switch, task leases, retries, credits, overlapping cron, reports and retention.
- Agents are DISABLED/PAUSED by default; read-only shadow activation requires **separate explicit founder approval** and environment validation. Never infer active model operation from charters or registry. Model source injection, privacy and tool scope tested.

**R5: P6–P18 outstanding certification**
- P6 external fee separation, quote/discount/invoice/Wise reconciliation; P7 RON and non-RON retention review-required durations and legal holds; P8 exact approved policy publication and byte-hash acceptance before governed payment; P9 source/executed/apostille/courier version hashes; P10 immutable financial snapshots/receipt; P11 entire hosted RLS/role grants/storage and API security; P12 drift/migration provenance; P13 paginated PostgREST under caps <1000 and query plans; P14 operator workflow and final release guards; P15 error ownership/retry; P16 signed notification delivery and bounce evidence; P17 referrals/revenue derived only from settled Wise proof; P18 full mobile, accessibility and measured performance.
- Resolve only concrete code defects; tag human approved terms/retention durations as HUMAN_APPROVAL and current hosted proof as HOSTED_UNVERIFIED.
- Global Global Document Intelligence/Atlas Corridor behavior must retain country-keyed selection, rapid switching cancellation, reduced motion, keyboard directory and canonical destination persistence. Keep premium Milano brand and no lawyer impersonation.

**R6: Tiffany / Damiani / separate controlled certification**
- Preserve Gate 37 TIFFTEST99 (controlled actual Wise E2E) and separate TIFFTEST50 synthetic 50%-eligible-service-subtotal regression. Never conflate or automatically redeem.
- DAMIANI50 must remain unchanged; /professional/damiani Italian default/English option, professional attorney positioning, governed prefill/referral/discount, no actual redemption in unattended QA. Preserve privacy and Wise-only code.
- Full Tiffany 15-step hosted run includes exactly one Matter, upload, quote, legitimate Wise reconciliation, scheduling gate, portal, messages, operator apostille/courier close and mobile failure analysis; only execute live actions with specific approval.
- Distinguish safe read-only tests from hosted synthetic transactions and real provider-backed certification.

**R7: P19–P23 actual hosted/live evidence**
- Existing `scripts/run-production-certification.mjs`, `scripts/observe-governance-hosted-certification.mjs`, `scripts/verify-hosted-release.mjs`, `lib/certification/checks.ts` are actual existing certification tools. Inspect before enhancing.
- P19 must run isolated hosted authenticated E2E with the same Matter ID, exact SHA, no production payment spoofing, and step-by-step evidence. Source fixture alone is PARTIAL.
- P20 real Wise transfer and reconciliation, replay/partial/mismatch with explicit owner approval.
- P21 real BlueNotary provider identity/recording/journal/seal/certificate plus executed immutable bytes and operator QC with approved participants.
- P22 real authority/apostille/legalization submission when approved, document lineage, custody, shipment and government response. No fictitious official acceptance.
- P23 actual hosted alerts, failure notification evidence, backup/restore in isolated environment, migration/roll-back drills, release/health/RON/Wise/courier outage recovery and final signed human GO/NO-GO.
- Include external condition/approval blockers but complete all safe harness source implementation and tests.
- Never claim full 10/10 production merely because local merges/builds pass.

**R8: Operational reliability and incident limits**
- Verify default-off `GOVERNANCE_ALERTS_ENABLED`, actual signal sources, owner escalation, secrets redaction and safe rate/spend control. Do not invent continuously running monitors.
- Distinguish isolated restore from hosted backup restore. Concurrency/timeout/replay/unknown outcome must be fail-closed. Do not let governance pause affect customer Matter intake/portal/Wise.
- Preserve immutable statutory RON records, audit trails and legal/operational holds.

### EXACT DELIVERY REQUIREMENTS

For each verified actual missing code gap:
1. Implement FULL correction in existing canonical modules.
2. Add real isolated SQL/API/role/hosted-browser tests and negative/replay cases.
3. Update migrations/route manifest only as required.
4. Run typecheck, lint, entire suite, prod build and all production validators.
5. Rerun affected mobile/map and payment/Matter/custody/RON regressions.
6. Commit bounded code changes and PR(s). No duplicate code or PR chain for documentation only.
7. Track all unrun hosted/provider tests as BLOCKED/NOT_RUN with specific evidence; do not fill gaps with claims.

For external blockers:
- GitHub billing/spend cap: responsible repo/account owner must resolve; show actual account-level issue.
- Hosted database: authorized read-only creds, selected QA project, approved isolated DB; no hosted write until release permission.
- Preview: intentional predicate plus approved isolated DB; pass only after actual authenticated browser.
- Live transaction: explicit transfer/provider/filing approvals.
- Founder governance: approval for activation, migrations, merge and production deploy separately.

**RELEASE ORDER:** exact latest main → source/CI fixes → isolated migration replay/restore → authorized DB provenance → safe isolated preview with current SHA → authenticated negative/regression QA → founder-approved hosted migration-first release → approved merge/deploy → Vercel READY SHA+domains+health → safe read-only shadow-mode board → separate controlled Wise/RON/authority/courier test → P23 independent certification.

### NON-NEGOTIABLE SAFETY AND TRUTH

- One canonical `public.deals`; no separate Matter engine or AI-controlled payment.
- Wise Business only. No Stripe or invented payments.
- RON external BlueNotary notarial fees remain external. Provider callback ≠ verified notarization.
- Exact documented Wise scheduling-vs-settlement-vs-final release gates, not historical oversimplification.
- Never leak client docs or confidential statutory RON evidence in logs/model prompts.
- No lawyer/attorney representation, legal advice, false jurisdiction claims or assumed foreign acceptance.
- No tampering with historical evidence, no production reset, no unapproved external actions.
- Distinguish SOURCE_READY, CI_BLOCKED, PREVIEW_CERTIFIED, HOSTED_DEPLOYED, BOARD_SHADOW_VERIFIED, AGENTS_OPERATIONAL, PROVIDER_LIVE_CERTIFIED and FINAL_GO.
- No dummy checks, skipped failures, synthetic real-world claims, direct main pushes, force pushes, release without approval.

### FINAL REPORT (REQUIRED)

1. Latest main, current implementation branch, reviewable PR/head and applied file paths.
2. Exact current source delta and proof already existing (no reimplemented modules).
3. G1–G5 and P6–P23 matrix per source/local/CI/hosted/authenticated/browser/real-provider status.
4. Current payment-gate state machine truth, tests and no regression.
5. Source/hosted migration IDs and real upgrade/restore results.
6. CI billing and preview restrictions as infrastructure, not code test failures.
7. Exact test commands, exit codes, total counts, failing gates and rendered proof.
8. Config key names ONLY, runtime actual enabled/disabled state; never secret values.
9. Safe deployment sequence, rollback, founder human approval checklist.
10. Unresolved blocker owner and next executable action.
11. Honest final GO/NO-GO, no invented certification.

**FINAL COMMAND:** Execute all verifiably missing source-code work immediately against the latest repo. Stop at actual unavailable approvals/hosted resources with completed engineering handoff, not a rewritten plan. Do not create another prompt-only deliverable as the work product.