# Paused Work Recovery Checklist — 2026-11-26

Evidence is scoped to the repository and external state inspected on 2026-11-26. A passing local test, merged PR, Ready deployment, or authenticated live test is recorded separately; none substitutes for another.

## 1. Preview and route-topology release repair

- [x] Workspace preview service is listening on port 3000; the public homepage renders at `http://localhost:3000` in the workspace browser. `agent-browser` found no page-level startup failure.
- [x] Vercel CLI confirms `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are configured for Preview and Production. No values were displayed and no binding was added. The workspace `.env.development.local` currently lists only `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL`, so this verifies Vercel scope, not local API credential injection.
- [x] Fixed the preview's React hydration mismatch in Trust Core orbit-node inline styles by using deterministic precision and CSS strings; browser console had reported numeric/string and percentage precision differences.
- [x] PR #563 is merged (`7aabc06`, merge `7aabc06fb19234f5e164b8e221f43dbacf078adb`); its hosted `validate` check failed at `tests/unit/aiGovernanceIsolation.test.ts` because `scripts/validate-milano-os-isolation.mjs` still expected `admin: "/dashboard"`.
- [x] PR #564 is merged (`2507213`, merge `2a7cadfc47a647eaabacb15f73e9397ae0d66bd3`); its hosted `validate` check failed at the same stale assertion. The route inventory, typecheck, lint, and earlier steps passed on that run; later release-gate steps were skipped after the failing test step.
- [x] Recovered local validator/docs fix changes admin to `/dashboard/admin`, owner to `/dashboard/founder`, and asserts both landing pages exist. `node scripts/validate-milano-os-isolation.mjs` and `node --import tsx --test tests/unit/aiGovernanceIsolation.test.ts` pass locally.
- [ ] Publish the verified repair on the feature branch and open/update a draft PR. No open PR for this exact repair was found.
- [ ] Confirm hosted CI and the Vercel Production build pass on the exact repair head.
- [x] Both `www.themilanoseal.com` and `themilanoseal.com` resolve to the same Ready Vercel deployment `dpl_8Xp2c6MZyPD9xWSQ36QUax2GkxyP`, source commit `a79a4b21df2fdfb5e3fe91fb0b0fd9030e8380db`.
- [x] Latest Production build for `2a7cadfc47a647eaabacb15f73e9397ae0d66bd3` failed in the merge gate at the stale administrator-route assertion, before `next build`. The preceding Ready alias deployment remains the `a79a4b21` build.

## 2. Public intake, payable quotes, and durable submission replay

- [x] Indicative estimates are represented separately from payable quotes by `lib/pricing/intakeIndicativeQuote.ts` (`basis: indicative_not_payable`).
- [x] The current public intake code saves unresolved orders into review without invoice or Wise request (`app/api/intake/core.ts`, `tests/unit/intakeReviewRequiredCapture.test.ts`).
- [x] The canonical 50/50 calculation is shared in `lib/pricing/paymentSplit.ts`; payable quote composition is in `lib/pricing/governedQuotePreview.ts`; the private quote writer is `app/api/deals/[id]/quote/route.ts` plus `approve_reviewed_matter_quote` in `supabase/migrations/20261107215959_p3_domestic_execution.sql`.
- [ ] Automatic payable eligibility is blocked pending a written, approved eligibility policy. The public wizard currently carries `notarial_act: "review_required"`, and the governed quote composer therefore fails closed. Do not infer legal execution facts or activate new payable scope by weakening that guard.
- [ ] Verify acceptance/invoice/portal parity in an isolated end-to-end fixture; live settlement remains separately gated.
- [x] PR #562 merged (`a79a4b21`) and prevents overlapping submission calls in one form.
- [x] Durable cross-tab/lost-response idempotency was absent before this recovery; the prior form lock alone was not server-side authority.
- [x] Implemented the public server-side reservation/replay service, HTTP-only submission-key cookie, service-role-only SQL migration, and UI initialization/reset path in `app/api/intake/route.ts`, `app/api/intake/idempotency/route.ts`, `lib/intake/durableSubmissionIdempotency.ts`, `supabase/migrations/20261126100000_public_intake_idempotency.sql`, and the two intake forms/confirmation screen.
- [x] Cross-tab first-cookie initialization is serialized with the Web Locks API in `lib/intake/submissionCookieLock.ts`; unsupported browsers fail closed rather than creating separate keys. `tests/intakeSubmissionCookieLock.test.ts` verifies concurrent initializers share one key. A service test concurrently invokes eight requests and asserts one execution.
- [x] Six isolated PGlite/unit tests pass for hashing, unique reservation behavior, exact completed-response replay, changed-payload conflict, expired tombstones, and saved-response replay (`tests/intakeSubmissionIdempotency.test.ts`). `npm run typecheck` passes.
- [ ] Independent PostgreSQL connections and the route-level Supabase recovery path are not yet tested. The process-crash window between Matter insert and idempotency response commit remains fail-closed: retries cannot duplicate, but do not yet reconstruct a saved response.
- [ ] Run full canonical intake/quote acceptance, invoice/portal parity, and end-to-end Supabase route fixture. No production migration or live payment was run; the SQL is not applied to production.
- [ ] Publish the verified code and migration in a draft PR; do not apply the migration to production.

## 3. Role workspaces and interactions

- [x] The canonical route map is `lib/auth/roleRedirect.ts`: founder/founder_admin and owner land at `/dashboard/founder`, admin at `/dashboard/admin`, operator at `/dashboard`, VA at `/va/dashboard`, alliance roles at `/alliance/dashboard`, professional at `/professional/matters`, and client at `/portal`.
- [x] `tests/auth-role-routing.test.ts` covers role homes, authorized deep links, isolation, missing/unknown-role denial, and hostile redirect paths. `npm run validate:route-registry` and `node scripts/generate-route-map.mjs --check` pass; the current inventory reports 735 L1 routes and zero currently valid L2+ certifications.
- [x] Password login UI/API and `/auth/callback` use the canonical role resolver; local auth-role routing tests pass for authorized deep links and denied unknown/missing roles.
- [ ] Authenticated browser checks across Founder, Admin, Operator, Alliance Management, Alliance Partner, VA Management, VA, Professional, and Client remain blocked: no approved role sessions were available in this workspace. Do not manufacture sessions or exercise production credentials.
- [ ] Review each role-specific navigation control and verify its actual action/destination under approved sessions; record unavailable role/device coverage.

## 4. Database authority, Wise, and Resend

- [x] The requested `codex/recovery-authority-guards` worktree/ref and matching open PR were not present in the inspected local worktree list, local refs, or GitHub branch/PR lookup. Exact original patch and two uncommitted tests were not recovered.
- [x] Authoritative current source includes `20261126050000_current_account_authorization_hardening.sql` and `20261126060000_atomic_complimentary_authorization.sql`; their isolated replays still need to be recorded for this recovery.
- [ ] Any replacement migration must be a separately identified forward-only migration, tied to reproduced regressions, rehearsed on clean and upgraded isolated schemas, and recorded with order/checksum. `npm run validate:migration-chain` passes its static contract across 159 SQL files; this is not a clean/upgraded database rehearsal. No production SQL is authorized or executed here.
- [x] Wise payment authority remains `confirm_wise_payment_for_deal(...)`; the Tiffany recovery rule and evidence are documented in `docs/qa/TIFFANY_WISE_PROVIDER_SETTLEMENT_RECOVERY.md`. The evidence is preserved as regression material; no payout or recovery was initiated.
- [ ] Run source/isolated Wise retry and reconciliation checks; production settlement is not certified.
- [x] Prior Resend evidence for `MS-2026-9166` recorded three provider-accepted notifications and zero delivered events. Provider acceptance is not recipient delivery.
- [ ] Fresh signed delivery evidence was not queried from production in this recovery; no email was sent.

## 5. Validation and release state

- [x] Recovered the Vercel build-gate and hosted CI root cause to one stale route-topology assertion. The changed validator passes locally.
- [x] Focused local evidence so far: route topology/auth tests 17/17; intake idempotency tests 6/6; control-plane tests 10/10; route registry 735 source records and 31 critical-route matches; migration-chain static check across 159 SQL files; TypeScript typecheck passes.
- [ ] Run the full test suite, lint, production build, full release gate, and clean/upgraded migration rehearsals on the final PR head.
- [ ] Track hosted CI and independent review on the exact final PR head.
- [ ] Record final branch/PR/commit and post-merge deployment separately. No PR merge, production deployment, production SQL, live payment, refund, Wise recovery, or email send is authorized by this checklist.
- [ ] Live transaction certification remains open until an authorized transaction completes and is verified with provider evidence.

## 6. Enterprise extension — Sections 251–285

Status key: **Implemented** means source/workflow exists; **Tested** means the named local check passed; **Merged** is GitHub ancestry; **Deployed** is a Vercel deployment; **Live-verified** requires authenticated production evidence; **Blocked** names missing evidence, access, or approval. These statuses are independent.

### 251–259 — Archive, isolation, registry, dependency evidence, explorer

- [blocked] `Archive(3).zip` and its archived `build_ecosystem_registry.py` are not present in this checkout or supplied read-only files. The pasted reconciliation and engineering documents are available; the archive source manifest cannot be fingerprinted end-to-end. Do not execute an unreviewed archived script.
- [implemented] Milano native route/source authorities are `lib/routes/routeRegistry.ts`, `lib/routes/routeInventory.generated.json`, `lib/internal/moduleRegistry.ts`, `lib/control-plane/systemRegistry.ts`, and `lib/control-plane/hardeningRegistry.ts`. Route inventory/check tooling is `scripts/lib/route-inventory.mjs`, `scripts/generate-route-map.mjs`, and `scripts/validate-route-registry.mjs`.
- [tested] `npm run validate:route-registry` and `node scripts/generate-route-map.mjs --check` pass: 735 route files at HEAD; historical baseline 734 present and none removed; current state is 735 L1, 0 currently valid L2+; the committed access-review backlog is 0. L1 is registration, not certification.
- [implemented/tested] The existing Founder/CTO/Operator Control Plane already includes executive architecture, search, parent-system/status filters, source paths, validators, and runtime SHA. This recovery adds an accessible expandable dependency drill-down backed by `getDependencyEvidence()` in `lib/control-plane/architectureGovernance.ts`; `lib/control-plane/__tests__/systemControlPlane.test.ts` verifies direct/transitive separation and cycle safety.
- [blocked] The dependency explorer graph is curated and partial (eight current architecture edges), not full AST/import, database-contract, or runtime evidence. The UI labels this boundary. Per-module tree SHA, deployment identity, freshness date, and complete source-import evidence are not populated.
- [implemented] Canonical route certification levels and meanings remain exactly those in `lib/routes/routeRegistry.ts`: L0 discovered; L1 registered; L2 dependency verified; L3 secured; L4 authenticated workflow; L5 operational/recovery; L6 commercial. L0/L1 are derived; L2–L6 require human-approved source/dependency-hash-bound evidence. Current generator reports no valid L2+ routes.
- [implemented/blocked] Existing Milano Seal orb and Trust Core assets are in `public/brand/milano-seal-orb-v2.png` and `public/brand/milano-seal-core-brain-feather.png`; duplicated public/brand copies match by SHA-256. The root `milano-seal-orb-v2.png` differs. Since the archive is absent, the authoritative original artwork and intended master variant cannot be established from this pass. Non-Milano source data, credentials, and ledgers were not imported.

### 260–266 — GDEI, government sources, public-records tracking, corridors

- [implemented] Existing surfaces include `app/dashboard/government-intelligence/page.tsx`, `lib/government/intelligence/agencyRegistry.ts`, and the Global Document Intelligence/authority and corridor registries. Existing system pages remain the integration points; no new standalone intelligence engine was introduced.
- [blocked] No source-linked GDEI observation dataset or dedicated ranking method is present. Proposed 35/20/15/15/10/5 weights remain a research scenario only. No official authentication-volume source, reporting period, geography/coverage, confidence, or missing-input ledger was verified in this pass; no destination ranking is asserted.
- [blocked] Government public-records request tracking for Florida, California, New York, Texas, Delaware, New Jersey, Illinois, and federal FOIA is not evidenced as a dedicated workflow. No request was submitted and no fees were incurred. Agency datasets, permissions, and response evidence are still required.
- [implemented/blocked] Corridor, recipient-authority, and international execution controls exist in the current authority and execution registries; Italy is already represented. Foreign-origin fulfillment and the historical corridor shortlist remain unapproved until current authority, recipient, partner capability, custody, and delivery evidence are attached.

### 267–271 — Professional accounts, agreements, pricing, unit economics

- [implemented] Existing sources include `app/dashboard/professional360/page.tsx`, `lib/professional360/read-model.ts`, `lib/pricing/*`, `app/dashboard/economics/page.tsx`, and `lib/economics/matterEconomics.ts`. Professional360 is a canonical-Matter read model; Matter Economics separates observed from unknown values.
- [blocked] Professional Access/Plus/Elite/Institutional recurring account entitlements, approved agreements, and the proposed retail/B2B packages are not established by the current verified source. Proposed prices and legal/service terms were not activated or hardcoded.
- [implemented] Actual collected revenue remains evidence-bound; direct execution cost and contribution margin remain UNKNOWN where no canonical cost ledger exists. No forecast or illustrative planning input is treated as actual revenue.

### 272–280 — Competitor, courier, Alliance, executive cadence and milestones

- [implemented] Existing courier, Shippo/custody, Alliance, partner qualification, and corridor routes are present in `app/dashboard/courier`, `app/dashboard/alliance`, `lib/shippo`, `lib/alliance`, and the authority registries.
- [blocked] Historical competitor/courier prices, named candidate partners, proposed score weights/thresholds, Italy recipient-first acceptance, and courier SLA targets have not been independently source-verified in this pass. No partner is represented as contracted or qualified from proposal text alone; no outreach or external commitment was made.
- [blocked] A source-backed weekly executive briefing schedule, approved 30/60/90/180/365-day objectives, and actual-versus-target milestone records were not confirmed. Proposed targets and scenarios remain planning inputs, not achieved performance.

### 281–285 — Workbook, financing, investor reporting, exports, approvals

- [implemented/blocked] The attached `data/Milano_Seal_Investor_Financial_Model-9ff21f.xlsx` is available but ignored/untracked. Maintained-library inspection confirms the six expected sheets and 1,676 formula cells; every formula has a cached value. No spreadsheet calculation engine was run, so formula recalculation and financial sign-off remain open. Do not add this private workbook to the application commit.
- [blocked] Milano Seal financing proposals are not receipts or spending authority; unrelated ventures retain separate books and ownership. No capital deployment or corporate ownership change was made.
- [implemented/blocked] Existing Founder revenue/economics read models preserve actual-versus-forecast boundaries. A sanitized investor interface/export with independently verified adoption, collections, margins, risks, and approved audience was not found or authorized; no KarmaGate confidential IP or raw client/provider evidence was exposed.
- [implemented/blocked] `lib/routes/routeInventory.generated.json` is the existing route inventory authority and the route schema contains direct-local/package dependency counts, tests, integration, authorization and evidence fields. The broader requested exports (complete permission test results, full dependency edges, investor summary/dashboard, corridor certification and risk register) were not found as populated authoritative deliverables in this checkout. Generate them only from verified source and evidence; do not duplicate registries or fabricate status.
- [blocked] Sections 000–285 remain cumulative. Production SQL/deployment, payable-policy activation, live payments/refunds, email, government requests, outreach, and confidential disclosure remain outside this authorization. Live transaction certification stays open.
