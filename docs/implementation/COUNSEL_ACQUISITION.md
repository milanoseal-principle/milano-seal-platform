# Counsel acquisition implementation and verification

## Business cause and resulting behavior

Public attorney discovery previously led into country-route selection, professional activation or full intake. There was no dedicated account-free counsel first-contact experience. `/contact` redirects into full intake. `/api/sales/capture` returned `ok: true` even when its best-effort `sales_leads` insert failed, and that existing table contract had no checked-in migration. The existing public document upload requires an already-created canonical Matter.

`/counsel` now explains the U.S. execution desk, counsel's retained legal control, operational examples, and the review-to-release relationship. It offers anonymous execution-review and question paths. Optional documents are stored privately and confirmation requires persisted inquiry data and confirmed document metadata. Pricing and execution authorization are not created by an inquiry.

## Files and architecture

- `app/counsel/*`, `components/counsel/CounselExperience.tsx`: acquisition page, metadata, responsive editorial layout, form, optional upload, retry, confirmation, mobile action.
- `lib/counsel/inquiry.ts`, `receive.ts`, `funnel.ts`, `handoff.ts`, `app/api/counsel/route.ts`: bounded validation/streaming, file signatures, persisted retry identity/fingerprint, basic persisted hourly abuse limit, lead receipt and canonical read-only funnel projections.
- `app/api/admin/counsel/route.ts`, `app/dashboard/marketing/counsel/page.tsx`, `components/dashboard/OperatorShell.tsx`: role-gated inbox, private document access, notification evidence/retry, operator-stamped association with an existing canonical Matter.
- `app/api/sales/capture/route.ts`: fails truthfully when existing lead persistence fails.
- `lib/notifications/transactionalEmailAlerts.ts`, `app/api/cron/notification-reconcile/route.ts`: reuse Resend, recipient configuration, notification log and existing reconciliation cron for inquiry alerts.
- `lib/intake/intakeAnalytics.ts`, `lib/intelligence/ux-events.ts`, `app/api/intake/analytics/route.ts`: counsel events extend the existing UX analytics pipeline, with no Matter mutation.
- `app/page.tsx`, `components/landing/{header,persona-routing}.tsx`, `components/conversion/MilanoPublicCtaModule.tsx`, `app/lawyer-access/page.tsx`, `app/professionals/law-firms/page.tsx`, `app/verticals/international-lawyers/page.tsx`, `components/professional/UniversalProfessionalCountrySurface.tsx`: public acquisition CTAs converge on counsel; professional country CTAs retain destination context.
- `components/assistant/MilanoExecutionCopilot.tsx`: suppress the competing floating launcher on counsel only.
- `lib/routes/routeRegistry.ts`: register counsel as a public route.
- `tests/counsel-inquiry.test.ts`, `tests/professional-lawyer-journey.test.ts`, `tests/sql/counsel-inquiry-security.sql`, `scripts/qa-counsel.cjs`: behavioral regressions, revised acquisition routing contract, isolated SQL checks and rendered browser harness.
- `artifacts/proof/counsel-acquisition/*`: rendered evidence and actual gate outputs. Confirmation screenshot uses an explicit browser response mock.

Reused architecture: `sales_leads` capture contract, canonical `deals`, professional profile/referral permissions, canonical professional intake, private `deal-documents` bucket, existing notifications/Resend configuration and cron, existing UX event pipeline, PublicShell, brand imagery and public route registry.

New capability is limited to the counsel surface, strict anonymous inquiry receiver, an operator inbox/action endpoint, read-only funnel projection and a migration completing existing lead persistence. No alternate Matter, professional identity, CRM, quote, payment, country-intelligence or notification architecture was introduced. Wise and scheduling implementations are unchanged.

## Schema and security

The CLI-generated `20261107094755_counsel_inquiry_capture.sql` completes the existing `sales_leads` table contract and adds hashed-network-address abuse-limit context plus canonical Matter association and operator/time stamps. The canonical Matter schema and state machine are unchanged. Anonymous and ordinary authenticated roles receive no lead-table privileges. Writes and reads use service-role server code behind input validation or operator authorization. No new public storage policy or bucket is created.

Actual PostgreSQL 17 checks in an isolated container passed: migration application twice, service-role persistence, RLS enabled, denial of anonymous reads/writes, denial of ordinary authenticated reads/association writes, canonical Matter FK, and duplicate receipt IDs. This does not certify the hosted project's full RLS or storage configuration.

Uploads are limited to 4 MB PDF/JPEG/PNG with byte signatures, private-bucket verification, server-generated paths and metadata confirmation. Operator document URLs expire after 60 seconds. Inquiry contents are not persisted in browser storage. No fixed execution pricing, legal-advice offer, acceptance guarantee or timing guarantee was added.

## Notification path and email diagnosis

Inquiry persistence → pending `notifications` record → existing Resend transport → evidence update. A provider ID is required for `provider_accepted`; no `delivered`, `read` or operator receipt is inferred. Missing provider configuration or failed provider requests record failure. The existing secret-protected reconciliation cron retries recent inquiries, and the inbox provides manual retry.

The source audit found multiple separate notification channels: canonical Matter portal messages, professional pending email records, transactional operator Resend alerts and cron reconciliation. A portal log or pending row does not establish email delivery. No Resend key, Supabase runtime credentials or provider event access is configured in this environment, so the founder's actual production inbox issue cannot be diagnosed to a verified production root cause here. Missing key behavior is observable as `RESEND_API_KEY_MISSING`, not success.

## Attribution and canonical handoff

Real supplied `source`, `audience`, `campaign`, `content` and UTM values are retained with the inquiry. Existing canonical first-touch context is retained separately when available. No source is invented when absent. Contextual professional country CTAs carry destination into the form. Public metadata is not accepted as professional identity or lifecycle authority.

An operator follows up, uses the existing governed professional/Matter intake and associates its resulting canonical Matter UUID with the inquiry. The association stores operator and timestamp, refuses reassignment and preserves existing referral/source fields. It requires an existing canonical professional referral and a referring profile whose email matches the inquiry (case-insensitively); missing attribution or mismatched identities fail closed for operator review. Inquiry documents remain attached to the inquiry; the operator can download them and use the existing canonical Matter document workflow when required. It does not automatically create or activate a professional account.

The inbox separates observational visit/open/submit events from persisted inquiries and canonical approved-quote, cleared-settlement, completion and repeat-profile facts. Canonical counts explicitly cover Matters associated with the displayed latest 100 inquiries. Repeat-source counts cover linked Matters only. They are not lifetime totals. Marketing events can be blocked, duplicated or missing and never authorize operations.

## Rendered QA

Chromium rendered all requested widths: 320, 360, 375, 390, 412, 430, 768, 1024, 1280 and 1440 px, without horizontal overflow or page errors. The harness covers destination prefill, actual multipart requests, long firm/email/country strings, first-invalid-field focus, validation, retry retaining data, question-mode fields, optional document selection/type rejection, simulated document receipt, explicit success states, cleared unfinished drafts on reload, reduced-motion mode and hiding the mobile action while completing the form.

Successful receipts in browser QA are explicitly mocked. The real local API returns `503` and no receipt without database credentials. Headless Chromium does not certify iOS/Android virtual-keyboard or native datalist behavior; those remain device checks.

## Release blockers and scope limits

- Apply/review the new migration in the intended non-production Supabase environment and run hosted integration/RLS/storage tests. No hosted migration was applied.
- Verify a real anonymous inquiry, optional upload, authenticated inbox, canonical Matter association and professional follow-up using configured staging credentials.
- Verify Resend acceptance and supported delivery events against the actual provider, including failure/recovery. No production emails were sent by this task.
- Execute the live canonical review → quote → Wise verified settlement → scheduling journey in the authorized test environment. Source/unit regression gates pass; no live Wise transaction was attempted.
- Validate real mobile keyboard/native country suggestion behavior. Automated desktop Chromium emulation is recorded separately.
- Resolve or explicitly accept the ten reproducible baseline validator failures listed in the evidence JSON. They remain FAIL, not PASS.
- Analytics/report scope is explicit: marketing events are observational; canonical and repeat counts are bounded to the displayed linked cohort.

No production deployment was performed. PR review does not imply release certification.

## Final local gate results

- Typecheck: PASS.
- Lint: PASS (existing package module-type warning only).
- Full test suite: PASS, 1,027 tests, zero failures.
- Production build: PASS, 2,819 pages generated; counsel and operator/API routes included.
- All 80 declared `validate:*` scripts executed: 70 PASS, 10 FAIL. Each failing validator also fails in an isolated checkout of baseline `f92223f`; details and names are preserved in the evidence JSON. Failures were not relabeled as passes.
- Production regression meta-gate: PASS, including its own typecheck/lint/test/build and canonical/scheduling/Wise checks.
- Migration-chain validator: PASS across 93 SQL files.
- Isolated PostgreSQL security/migration checks: PASS, including repeated application.
- Rendered Chromium QA: PASS across ten requested widths; success paths use declared response mocks, real unconfigured API fails closed.
- Hosted Supabase persistence/storage/RLS, authenticated operator integration, provider delivery and live Wise settlement/scheduling: BLOCKED by absent staging runtime credentials/provider access. Real mobile virtual keyboard QA: UNVERIFIED.

`next-env.d.ts` had an existing worktree change at task start and is intentionally excluded from the PR. No production deployment or hosted migration was performed.


## Follow-up attribution hardening

The operator association now fails closed unless the canonical Matter has an established professional referral and the referring professional profile email matches the inquiry. This does not create an identity, rewrite referral/source fields, or activate a profile. Behavioral tests cover both canonical referral modes, absent attribution, absent profiles and mismatched emails.

Post-commit canonical-foundation and legacy branch-salvage checks exposed their protected migration scope guards, which were not exercised by the earlier pre-commit delta. Their reviewed-path allowlists now include only the additive counsel lead migration; the other protected-file rules remain intact. This correction is part of the reviewable PR.
