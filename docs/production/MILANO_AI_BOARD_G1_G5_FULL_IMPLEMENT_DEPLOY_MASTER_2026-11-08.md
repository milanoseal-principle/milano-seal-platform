# THE MILANO SEAL™ — AI CORPORATE GOVERNANCE OS
## G1–G5 FULL CODE IMPLEMENTATION, PRODUCTION WIRING & CONTROLLED DEPLOYMENT MASTER
**Company:** Milano Seal International LLC, dba The Milano Seal™  
**Production:** https://www.themilanoseal.com  
**Repository:** https://github.com/milanoseal-principle/milano-seal-platform  
**Verified main at directive creation:** `e29b37cfa37ad8528cb5ff96c0e3e9cc72524548` (2026-11-08)  
**Status:** ENGINEERING DIRECTIVE, NOT IMPLEMENTATION OR CERTIFICATION EVIDENCE.

# EXECUTION ORDER — DO NOT STOP AT A PLAN

You are Claude Code/Codex operating as the accountable CTO, Principal Engineer, AI Orchestration Architect, Security Architect, Supabase Database Architect, Full-Stack Product Engineer, QA Lead and Release Engineer. **Actually modify the repository, write tests, build features, create a reviewable PR, and prove results.** Do not respond only with a new prompt, report, or theoretical architecture.

1. Fetch latest `main` and its SHA. Rebase your starting point on the newest verified main; do not reset newer changes to the historical SHA above. Inspect open PRs and existing implementations.
2. Read the complete governing files: `docs/production/P6-P23_FINAL_EXECUTION_MASTER_2026-11-08.md`, `docs/production/P3-P23-directive.txt`, `memory/PRD.md`, `docs/P4B_P23_REPOSITORY_STATUS.md`, the locked master/SOP/Section 71 where available, and existing architecture/control plane directives.
3. Inspect `app/dashboard/control-plane`, `lib/control-plane`, Supabase migrations/RLS, `lib/dashboardAuth`, audit ledgers, workflows, queues, production agent integrations, `docs/ROUTE_MAP.md`, `docs/architecture/LAYER_MANIFEST.json`. Reuse, do not build a second control plane.
4. Build a file-level deduplication matrix: EXISTING / PARTIAL / MISSING / BLOCKED. Apply only missing G1–G5 implementation deltas. Keep P6–P23 regressions and current architecture authoritative.
5. Implement G1, G2, G3, G4, G5 in dependency order. Commit bounded code changes, migrations, tests and docs. Continue without stopping between phases except where a real privileged external action requires explicit human approval.
6. Run actual typecheck, lint, full tests, build, validators, migration replay, RLS/authorization negatives, browser/mobile E2E and preview verification; fix code failures. Treat CI infrastructure errors separately from application errors.
7. Create a reviewable PR. **Do not merge or deploy production, apply hosted migrations, trigger real transfers or send external communications without human release authorization.** Prepare exact release handoff, and after authorized deployment verify the deployed commit SHA and routes.
8. Provide machine-checkable results: paths changed, migrations, commands with exit codes, test counts, PR and SHA, preview/hosted evidence, remaining blockers, and honest verdicts. No fabricated results.

# NON-NEGOTIABLE CANONICAL LOCK

- Canonical client Matter: `public.deals`. Corporate board decisions MUST be separate records; never fork Matter truth or invent new client execution states.
- Wise Business ONLY, no Stripe/fallback. Payment status is authoritative only after verified reconciliation. Scheduling, execution and release follow existing gates.
- BlueNotary separately sets and collects notarial fees; no external notarial fee in Milano quotes/invoices/Wise expected amounts/revenue. Never restore `ron_cost`, per-signature charge or the retired $25 Milano fee logic.
- Client execution preference is not confirmed execution method; review-required intake persists without automatically authorizing service.
- Existing Matter state machine, event names, Trust Engine, evidence hashes, consent, privacy, RLS, dispatch, review, operator/portal workflows and international route logic remain authoritative.
- RON provider success is NOT enough to declare verified execution. Require applicable statutory evidence and exact immutable executed document byte hash.
- Apostille/authentication must respect issuing authority, destination, document class, current Hague/non-Hague requirements and receiving-institution uncertainty. Do not provide legal advice or imply Milano is a law firm.
- No fake cash, conversion, traction, customer data, provider results, legal determinations, government issuances, shipments or agent activity.
- AI titles are internal functional agents, NOT legally appointed directors/officers, licensed professionals or independently empowered fiduciaries.
- Real banking, company contracts, securities actions, legal filings, production release and destructive operations require authorized human signoff.

# G1 — BUILD THE 12-DIRECTOR AI GOVERNANCE LAYER

Implement exactly 12 role definitions in the existing authorized application framework, with typed, versioned charters:

01 BOARD CHAIR / CHIEF STRATEGY GOVERNOR — strategy, company-wide priorities, international expansion, founder decision synthesis, capital allocation recommendation, strategic risk.
02 VICE CHAIR / CHIEF OPERATING GOVERNOR — assignments, milestones, operating cadence, dependencies, blockers, verified delivery, escalations.
03 CORPORATE SECRETARY / LEGAL & REGULATORY DIRECTOR — company records, governance calendar, contract preparation, Florida notary/RON regulation research, cross-border procedure, legal-review escalation.
04 TREASURER / CFO — Wise-backed actuals, margin, pricing, budgets, forecasts, cash/runway when source-backed, accounting and tax preparation support.
05 LEAD INDEPENDENT DIRECTOR / AUDIT & RISK CHAIR — independent challenge, fraud/false-completion identification, audit verification, risk register, evidence sufficiency and dissent.
06 CTO / TECHNOLOGY & AI STRATEGY DIRECTOR — GitHub, Supabase, Vercel, integrations, Trust Engine, migrations, CI/CD, agent architecture, systems reliability.
07 CISO / CYBERSECURITY & PRIVACY DIRECTOR — authorization, RLS, private documents, identity evidence, secrets, backups, vulnerabilities, incidents, AI/tool security.
08 CPO / PRODUCT & CLIENT EXPERIENCE DIRECTOR — luxury UX, mobile, Global Document Intelligence, Atlas Corridor, intake, portal, accessibility, client journey and quality.
09 CRO / REVENUE & GLOBAL PARTNERSHIPS DIRECTOR — foreign attorneys/law firms, referral networks, alliances, CRM, acquisition, repeat revenue and ethical outreach.
10 CHIEF CAPITAL & INVESTOR RELATIONS DIRECTOR — investor/strategic capital research, grants, pitch/data room, diligence, funding models; no autonomous securities commitments.
11 CHIEF GLOBAL EXECUTION & ALLIANCE OPERATIONS DIRECTOR — RON coordination, apostille/authentication, chain of custody, courier dispatch, partner qualification, vendor readiness and fulfillment.
12 CHIEF GLOBAL INTELLIGENCE & MARKET AUTHORITY DIRECTOR — Hague/non-Hague research, destination guides, affidavit/document authority library, SEO and global expansion intelligence.

Each registered director must have a versioned and machine-validated charter:
`agent_id, role_key, title, mission, authoritative_source_ids, data_scopes, allowed_tool_ids, denied_tool_ids, maximum_permission_level, approval_triggers, consultation_directors, evidence_requirements, output_schema_id, reporting_cadence, cost_budget, timeout, max_retries, failure_policy, escalation_target, charter_version, status`.

Permissions L0=read-only observation, L1=drafting/recommendation, L2=explicitly authorized low-risk bounded execution, L3=human approval required. Enforce in server/tool authorization, NOT prompt alone. An agent cannot raise its own permissions, self-approve, call an unregistered tool, pass credentials into prompts, access unscoped private Matters, or recursively delegate without a bound.

Use actual authorized AI runtime/integration already present. If no agent model credentials or execution backend are configured, **implement complete compile-tested abstractions, explicit disabled configuration and deterministic sandbox mocks**, expose truthful UNCONFIGURED/NOT_ACTIVATED status, and specify only missing environment variable NAMES (no secret values). Do not claim 12 active agents merely because charters exist.

G1 acceptance: 12 exact unique roles, charter versions validated, least-privilege enforcement, forbidden tool/role spoofing fails, human approvals hold, idempotency, bounded retries and pause/kill switch tested.

# G2 — NON-VOTING BOARD INTELLIGENCE OFFICER

Create Agent 13 as a NON-VOTING Board Intelligence Officer / Corporate Secretariat with no executive approval privilege.

Responsibilities: ingest signed/traceable director reports; validate structure; deduplicate source claims; flag missing reports, stale or conflicting evidence; preserve dissent; assemble daily/weekly/monthly/quarterly board packets; track resolution promises versus verified outcomes; calibrate predictions only when actual closed outcomes exist; maintain risk/escalation ledger; prepare founder briefs.

Implement report/version schema linked to source IDs, agent charter version, evidence freshness, calculation basis, risk confidence, reporting period, approval status, created/verified timestamps and audit actions. Aggregations MUST suppress confidential raw document contents and must never invent agent performance percentages or forecasts.

Implement bounded scheduling using **the existing scheduler if available**, with an actual configured delivery target and failure audit. No claim of continuous monitoring without a running job/hosted integration. Ensure this officer cannot execute financial/production/legal decisions, modify independent audit findings or impersonate an authorized human.

G2 acceptance: duplicate reports collapse without losing provenance, missing reports flagged, stale claims labeled, unauthorized access rejected, confidential data redacted, source-less metrics display UNVERIFIED, queued ≠ delivered, forecast scoring cannot use imagined actuals.

# G3 — 12 EXECUTIVE ROLES, FIVE COMMITTEES, SPECIALIST WORKER REGISTRY

Register exactly 12 governed executive roles with one-to-one functional reporting:
E01 Chief Executive Strategy → D01
E02 Operations/Program Management → D02
E03 Corporate Legal Operations → D03
E04 Finance Operations & Reconciliation → D04
E05 Independent Assurance & Control Testing → D05
E06 Principal Engineering / Platform Agent → D06
E07 Security Operations → D07
E08 Product & Client Experience → D08
E09 Revenue/Partner Operations → D09
E10 Investor/Capital Operations → D10
E11 Global Execution/Dispatch → D11
E12 Global Research/Authority Growth → D12.

Register five committees and enforce consultation requirements on material proposals:
A Audit, Finance & Capital: D04, D05, D10.
B Technology, AI & Cyber: D06, D07, D08 with D05 assurance when material.
C Legal, Regulatory & Governance: D03, D11, D05.
D Product, Revenue & Global Markets: D08, D09, D12, D11.
E Strategy, Investment & Scale: D01, D02, D04, D06, D09, D10.

Support on-demand bounded workers for database, API, frontend, QA, DevOps, security/RLS, corporate research, finance/Wise, investor diligence, attorney research, RON, apostille, courier, custody, country intelligence and SEO; do not launch dozens of paid persistent agents without purpose and approval.

Task contract:
`task_id, parent_task_id, originating_director_id, assigned_agent_id, committee_id, permitted_action_class, allowed_data_scope, required_approvals, dependency_ids, source_refs, expected_output_schema, evidence_required, status, attempt_count, max_attempts, timeout_at, cost_limit, completed_at, verified_by`.

Implement delegation ceiling inheritance, DAG/cycle detection, bounded concurrency, compensation/rollback for reversible tasks, no duplicate execution for same idempotency key, timeout/retry/dead-letter, independent verifier separation and founder intervention. Committee recommendations are **not legal board resolutions**.

G3 acceptance: missing committee cannot be bypassed where required; agent cannot approve own payment/release; recursive delegation blocked; wrong privacy scope denied; budgets/timeouts enforced; competing agent opinions and dissent retained; critical finding cannot self-close.

# G4 — PRIVATE BOARD ROOM, DECISION LEDGER AND HUMAN APPROVAL CONTROL

**Extend** the existing `/dashboard/control-plane` and approved dashboard navigation/role system. Audit existing `lib/control-plane/*`, audit trail and material decision services. Create a Board Room route within existing authenticated /dashboard structure only if no equivalent exists. Do not create a second command-center shell.

Board Room views:
1. Founder overview: actual verified cash/revenue (or NOT_VERIFIED), runway only if defensible, Matters/operational exceptions, payment mismatch, RON/custody holds, security and compliance, release readiness, investor pipeline, key approvals.
2. Director council: 12 role cards with actual registry, charter version, execution config, limited permissions, tasks and verified activity.
3. Non-voting intelligence officer: daily brief, weekly/monthly packets, evidence completeness, disagreements, missed commitments and outcome calibration.
4. Corporate Board Decision Ledger: evidence → case for/against → dissent → committee recommendation → human approval → authorized execution → independent verification → outcome/postmortem.
5. Founder approval center: cryptographically/action-bound approvals, reason and exact target, payload/version hash, request ID, TTL/expiry, authenticated actor, replay lock, revocation and audit.
6. Five committees: members, pending consultation, opinions, independent challenge, dissent, follow-up.
7. Finance/capital: actual Wise source-backed metrics, forecasting clearly labeled, investor/grant pipeline unconfused with committed/funded cash.
8. Operations: client Matter metrics are READ-ONLY projections of canonical production truth, with authorized drill-down; no governance UI changing Matter state directly.
9. Security/risk: incidents, release holds, access failures, evidence and owner.
10. Product/global growth: SEO/country freshness, attorney funnel, UX defects and releases when actually measured.

Corporate decision schema SHOULD reuse existing audit/approval infrastructure where possible; add distinct minimal tables only for missing domain facts. Suggested conceptual fields (adapt to canonical names):
`decision_id, title, category, originating_agent_id, responsible_director_id, committee_id, source_refs, risk_level, financial_impact, legal_impact, security_impact, recommendation_for, recommendation_against, dissent, evidence_missing, required_human_approval, approval_state, approval_actor_id, approval_action_hash, approval_expires_at, execution_owner, execution_state, independent_verifier_id, verification_state, outcome, created_at, updated_at, closed_at`.
Append-only history for proposals, votes/recommendations, approvals, execution and verification. No mutable deletion of unfavorable dissent.

Implement strictly server-authorized APIs/mutations with CSRF/session protections as appropriate, RLS, immutable evidence, max page sizes and deterministic pagination. Clients, anonymous visitors and alliance users have NO Board Room access. Support founder pause, agent disable, safe retry and operator-specific restricted visibility. Every UI button must invoke an actual authorized action; avoid mock data on production pages. Missing data = UNKNOWN/NOT_VERIFIED rather than 0 or false PASS.

Founder's approval must attach to an exact action, target resource, intended payload hash, expiry, authorized actor and once-only execution claim; proposed changes after approval invalidate that approval. Security and independent audit can issue governed HOLD; clearing critical holds needs appropriately authorized human review. Do not allow AI to modify production Matter payment truth or statutory evidence from this dashboard.

G4 acceptance: IDOR/RLS negative tests, founder-only approval, expired/mismatched approvals denied, duplicate execution denied, critical HOLD respected, dissent preserved, source-driven finance, accurate failure states, 320–1440px rendered QA, keyboard/screen-reader usability, no financial data leak.

# G5 — TIFFANY + AVV. DAMIANI LIVE REGRESSION AND BRAND PROTECTION

**Extend existing tests; DO NOT rebuild discount pricing or activate promotional codes.** Inspect:
`scripts/validate-tiff-15-step-production-certification.mjs`
`app/dashboard/testing/tiffany-e2e/`
`docs/CODEX_TIFF_PRODUCTION_CERTIFICATION_FINALIZATION.md`
`docs/qa/LIVE_DISCOUNT_WISE_CERTIFICATION.md`
`scripts/validate-damiani-production-wiring.mjs`
`app/professional/damiani/`
`supabase/migrations/051_damiani50_governed_scope.sql`
current private pricing, Wise, discount, portal, policies, notification and global map code.

Implement **separate automated test suites** for:
A TIFFANY 15-STEP canonical client test (reuse the FULL original checklist rather than the condensed steps): fresh mobile session → real intake → single persisted test Matter → approved synthetic upload → quote correct → TIFFTEST50 exactly 50% **eligible service subtotal**, pass-through courier ineligible → Wise payment truth → same Matter reconciled exactly once → scheduling blocked pre-payment/unlocked after verified authorization → client portal/auth → real notification status evidence → invoice/custody/operator release/close truth → mobile failure and link QA. Keep actual Wise transfer behind explicit approval.
B TIFFTEST50 negative finance: no stacked/unapproved discounts, no negative amounts, no provider fee contamination, no premature redemption, no fake verified payment; independent regression for discount and remaining retainer/balance.
C AVV. DAMIANI `/professional/damiani`: Italian default, English choice, named professional reentry, attorney-specific positioning without legal representation, secure professional intake routing, session and country context retention, relevant counsel pack where implemented, verified partner attribution, portal auth, mobile and accessibility.
D DAMIANI50: never automatically redeem, activate, reset usage, alter expiry/limit or touch real commercial redemption; verify read-only current state and test using isolated synthetic fixtures; eligible subtotal and courier exclusion remain canonical; Wise gate unchanged.
E GLOBAL DOCUMENT INTELLIGENCE: searchable country directory, focus/keyboard, preserved destination, rapid country switching/stale cancellation, Florida-to-destination Atlas corridor, reduced motion, selected country synchronized into Matter without false jurisdiction claims.
F NEGATIVE E2E: duplicate intake, cross-Matter access, expired policy, wrong amount, failed upload, failed provider callback, attempted scheduling/release bypass, forged discount and network retry.

Keep tests separated as UNIT / INTEGRATION / RENDERED E2E / HOSTED CONTROLLED LIVE; do not mark mock/sandbox as live. Include trace records with environment, SHA, test Matter ID (synthetic), scenario, actual vs expected, PASS/FAIL/BLOCKED/NOT_RUN and redacted evidence.

# INTEGRATION REQUIREMENTS — END-TO-END WIRING

Ensure G1–G5 integrate with current:
- Server authentication/role authorization and founder-only governance;
- Supabase schemas, RLS, RPCs, migrations and service role;
- GitHub source/PR/CI and exact SHAs;
- Vercel deployment status/runtime, aliases and environment variables;
- Matter Review and Trust Engine via read-only projections, never second Matter truth;
- Pricing/Wise through read-only verified financial records (no agent ability to forge payment);
- RON evidence and authorized incidents, custody, apostille, courier, client portal, alliances;
- Resend or existing email notification truth, if agents actually deliver approved reports;
- approved project brand/design standards and mobile accessibility;
- P6–P23 original and newer canonical implementation, including operator workflow and recovery.

Each module needs: actual API route, storage/service adapter, authorization check, role and tool permission boundary, idempotency/retry policy, failure logging, audit/evidence, state semantics, focused tests and observable runtime status. Do not produce a decorative front-end-only mock or fake integrations.

# REQUIRED ACTUAL FILE/TASK DELIVERABLES (ADAPT AFTER INSPECTION)

- Versioned director, executive, intelligence and committee registries/charters.
- Typed server-side agent execution service and guarded tool-dispatch layer.
- Agent invocation and task records with strict data scopes.
- Corporate decision/approval/audit storage and forward-only Supabase migrations **only if current systems lack them**.
- Server-side action-bound approval API and audit/hold mechanisms.
- Executive and committee work queues and bounded routing.
- Non-voting intelligence report ingestion and versioned briefs.
- Authenticated Board Room screens integrated with existing control plane.
- Source-backed metrics with UNKNOWN/NOT_VERIFIED fallback.
- Tiffany/Damiani specific real regressions and safe QA harnesses.
- Real observability and founder pause/disable controls.
- Protected configuration schema, environment variable documentation and runbooks.
- CI validator integration, migration replay fixtures, security negative tests and rendered QA.
- Phase-level verification matrix with explicit human/provider blockers.

Do not literally create speculative file paths if existing code uses another convention. Choose canonical locations after scanning source. No unnecessary new npm dependencies; if needed pin and audit.

# SECURITY, LEGAL, AND SAFETY RELEASE GATES

1. Service-role and provider secrets never reach browser or LLM prompt context.
2. Model output is untrusted; validate JSON/output contract, sanitize HTML/Markdown and resist prompt injection from client files/web search/provider data.
3. Agent tool execution is allowlisted, least privilege, server authorized, logged and bound to task/resource; rate limits, spend budgets and backoff apply.
4. Per-Matter data access is denied by default and client content is excluded from general corporate research.
5. No agent independently signs LLC contracts, communicates binding legal advice, initiates banking/wires, issues equity, makes regulatory submissions, sends unsanctioned bulk outreach or deploys to production.
6. Human approval is distinct from downstream independent verification.
7. A production security incident/hold is never bypassed via recommendation.
8. All data classes have approved retention/hold controls and no unauthorized destructive cleanup.
9. Never disable or weaken tests, validators or CI solely to make release green.
10. Protect Wise, RON, apostille, custody and release truth from governance-agent writes.

# FULL BUILD GATES

Run actual installed scripts and list exact exit statuses:
- package install/lockfile integrity (as applicable);
- TypeScript typecheck;
- ESLint;
- complete unit + integration test suite;
- production Next.js build;
- all repository governance/brand/control-plane/route/architecture validators;
- Wise-only and fee separation validator;
- state-machine and scheduling/payment/release validators;
- clean ordered migration replay and RLS/API negatives;
- AI agent charter/tool-permission/approval/concurrency tests;
- independent audit and Board Intelligence reports/permissions tests;
- Tiffany 15-step and Damiani dedicated validators/harness;
- actual rendered desktop/mobile accessibility and regression browser tests;
- authorized preview deployment smoke/monitoring and exact SHA;
- hosted schema compatibility when permitted.

For every failure: identify root cause, make a complete correction, rerun affected and global gates. Report runner billing/spending-limit blocks as CI_INFRA_BLOCKED rather than code PASS.

# RELEASE / DEPLOYMENT SEQUENCE

PHASE 0 — READ-ONLY AUDIT: latest main SHA, Vercel deployed SHA, hosted Supabase migration state, current gates, open PR collisions, existing control plane.
PHASE 1 — SOURCE: implement G1→G5 and necessary P6–P23 compatibility deltas with bounded commits on one review branch or appropriately split non-conflicting implementation PRs. Do not produce prompt-only PR as the completion artifact.
PHASE 2 — CI: all actual tests/validators, security and database replay. Store evidence.
PHASE 3 — PREVIEW: approved Vercel preview and isolated test database; verify Board Room, role isolation, exact deployment SHA, no production data mutation, Tiffany/Damiani sandbox regressions.
PHASE 4 — RELEASE APPROVAL: prepare migration-first manifest, compatibility/rollback plan and exact resources to change. Request explicit founder authorization before applying hosted migrations/merging/releasing production.
PHASE 5 — CONTROLLED DEPLOYMENT AFTER APPROVAL: back up as appropriate; apply reviewed forward migrations before schema-dependent app code; verify host migration IDs; merge approved PR; deploy exact merged SHA on Vercel; verify READY, `www.themilanoseal.com` alias and apex redirect, `githubCommitSha`, protected endpoints, Board Room and mobile surfaces, logs and payment/scheduling gate regression. Roll back or forward-repair safely on failure.
PHASE 6 — OPERATIONAL ACTIVATION AFTER APPROVAL: enable configured agent runtime in read-only shadow mode, validate scope and budgets, then incrementally turn on bounded L2 actions; run alerting and report delivery; verify founder pause/kill switch. Live money/RON/government/courier/communications remain separately approved.
PHASE 7 — FINAL CERTIFICATION: compare source, hosted schema, exact deployed SHA, runtime observed evidence, provider-live evidence and operational governance. Never infer live certification from mocks.

# FINAL REQUIRED RESPONSE

A. HEAD: latest main, branch, commits, PR and files changed.
B. G1–G5 matrix: implementation, test, security and hosted certification evidence; exact incomplete items.
C. P6–P23 non-regression matrix with links to actual existing tests and any fixed deltas.
D. Code changes: schemas/RLS, APIs, UI, agent runtime, orchestrator, reporting, QA.
E. Actual commands, exit codes, test totals, build and deployment findings.
F. Preview screenshots/QA evidence, exact SHA, auth/RLS negative proof.
G. Environment variables required by NAME only; never secrets.
H. Deployment manifest: migration order, approved PR, exact SHA, alias, smoke tests, rollback.
I. Separate verdicts for SOURCE IMPLEMENTED / PREVIEW VERIFIED / HOSTED DEPLOYED / AGENTS OPERATIONAL / LIVE PROVIDER CERTIFIED.
J. BLOCKERS labeled CODE / AUTHORIZATION / CI_INFRA / HOSTED_DB / CONFIG / LIVE_PROVIDER / HUMAN_APPROVAL.
K. No “completed”, “injected working agents”, “production deployed” or “fully certified” claim without real execution proof.

**FINAL COMMAND:** Execute the entire G1–G5 implementation and all required compatibility regressions against the real Milano Seal repository now. Work through every source-code deliverable. Stop only at actions requiring explicit human authorization or unavailable infrastructure, recording honest blockers; do not stop at drafting, documentation, shell UI, or static tests. The actual objective is a working, governed, secure, tested, deployment-ready Milano Seal AI Corporate Governance OS.
