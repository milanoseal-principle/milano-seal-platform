# Counsel acquisition Phase 2

## Scope and base

This branch builds on merged PR #414, main `f28c8a0abf2a2c29f5513a8f49b549616cd78d93`. Its tree includes #414's authoritative `344de2138583e4865e5b4b107c1f32c9c660bcd7`. Phase 1 remains in `COUNSEL_ACQUISITION.md`. Phase 2 extends the existing capture journey; it does not recreate it.

No production deployment, hosted migration, production Matter mutation, marketing enrollment or automatic relationship email is part of this change. No new migration, table, database enum, payment provider or professional identity model is added. Hosted certification remains separate from repository implementation.

## Architecture decisions and deduplication

- Existing `sales_leads.details` holds a bounded append-only operator action history. NEW/REVIEWING/RESPONDED/QUALIFIED/CLOSED are projections of evidenced operator actions, not additional Matter states or a second CRM. MATTER CREATED requires a real joined canonical `deals` row.
- Existing operator authorization, private inquiry endpoint and inbox are extended. Anonymous/professional callers cannot invoke operator mutations or document access. Server-stamped actor/time/evidence scope cannot be supplied by the request.
- Existing `professional_profiles`, public prospect creation, operator invitation/activation, professional account defaults, Matter submission, signed client handoff and Matter dashboard are reused. Prospect capture grants no role. Qualification requires an existing matching profile and a prior completed-response attestation. Activation stays an explicit operator action through the existing API.
- Existing professional country routes and public country-intelligence projection provide corridor content. The nine priority destinations reuse one enhanced template; UAE is added to the professional route's supported discovery list without changing the Convention registry or claiming apostille eligibility.
- Existing UX event registry and storage carry observational acquisition events. Existing canonical profile attribution and paginated read helpers supply account history. No new operational event family or analytics truth source is created.
- Existing notification transport, delivery evidence/retry and cron remain controlling. Operator alerts now have an absolute authenticated inbox link with an inquiry anchor. No document links or contents are sent through that alert.
- Canonical Matter schema/state, execution truth, pricing, quote authority, Wise reconciliation, payment-gated scheduling, execution, custody and release code remain unchanged.

## Acquisition and operator flow

Anonymous inquiry → existing persisted lead/private upload → authenticated operator inbox → review → record a completed response with channel/evidence reference → prospect lookup or canonical prospect creation → qualification against the existing profile → operator-controlled canonical Professional Access invitation when appropriate → existing professional intake or signed client handoff → canonical Matter → operator association preserving original inquiry/attribution → existing governed quote/Wise/scheduling/execution/release → canonical completed-Matter follow-up opportunity → START ANOTHER MATTER.

A response is explicitly **operator-attested**, not provider-delivered. Provider acceptance, provider delivery and operator response remain separate. Qualification cannot be inferred from a visit, anonymous email or marketing signal. Creating a prospect never activates an account. Existing professional intake may require activation after a qualified relationship and before the first professionally attributed submission; anonymous acquisition remains account-free.

Operator actions have UUID retry identities, bounded notes and history, next-action guidance and optional follow-up dates. Follow-up commands require a date. Closed inquiries are not queued for follow-up or activation. Optimistic JSON compare-and-swap prevents concurrent operators/uploads from overwriting one another. Upload metadata confirmation now merges the latest inquiry record and checks its snapshot. Repeated canonical association is idempotent and preserves its original operator stamp. Handoff attribution failures are retained as bounded diagnostics when persistence succeeds; the response states if that diagnostic could not be recorded.

The inbox shows age, context, source, document state, response evidence, profile/Matter linkage, last action, next action, follow-up due, provider failures and retry. Its Today metric uses the New York business day. It provides an explicit prospect-create action after response evidence, existing-profile lookup, qualification and existing activation controls. None of these writes payment, quote, execution or scheduling truth.

## Measurement and context

| Semantic requirement | Existing primitive / truth |
| --- | --- |
| Counsel landing | `counsel_visit` |
| Primary/secondary CTA | `review_clicked` + `ctaIntent`, `journeySurface=counsel` |
| Inquiry started | `counsel_inquiry_opened` |
| Inquiry/question submitted | `counsel_inquiry_submitted` + intent; authoritative receipt is the persisted lead |
| Document received | `document_uploaded` only after confirmed metadata; persisted document status controls operations |
| Abandonment | Existing `intake_abandoned` on page exit before confirmed receipt; observational, not unique lost leads |
| Submission failure | `counsel_submission_failed` with machine failure category |
| Upload failure | Existing `upload_failed` only for evidenced storage failure/unavailability; network or metadata uncertainty is not inferred as failed upload |
| Operator response / qualification | Server-stamped operator attestations in the existing inquiry |
| Profile identified / active | Canonical matching professional profile and its actual status |
| Matter / quote / verified payment / completion | Joined canonical Matter, approved-quote timestamp, confirmed cleared settlement, completion timestamp |
| Repeat professional source | Existing canonical profile attribution summary across paginated account history |

URL context allows source, medium, campaign, content, destination, corridor, practice interest and originating page plus their supported UTM equivalents. Actual supplied values carry through contextual links; private profile/referral tokens and operational flags do not. Canonical first-touch context is retained separately with private/referrer parameters excluded. Unknown source remains unknown. Destination and practice context are suggestions/interests, never authoritative Matter facts.

Operator segments include source, medium, campaign, content, originating page, destination, professional country, practice interest and identified professional. The inquiry cohort is explicitly the latest 100 persisted inquiries before filters. Marketing counts are all-time stored observations, not unique visitors or a filtered cohort. No percentages are fabricated. Professional account history is separately paginated across all canonical Matters for the identified profiles; repeat business is not allocated to a campaign without an actual inquiry association. Notification failure counts explicitly cover the latest 300 notification records.

Analytics insertion reports unavailable telemetry rather than claiming successful recording. Diagnostic logs contain event/surface/error code, not inquiry content. Analytics remains non-blocking and cannot mutate Matter lifecycle.

## Discovery, content, SEO and trust

- `/counsel/corridors` links into existing `/professional/{country}` routes for Italy, Spain, Portugal, Greece, Brazil, Mexico, France, Germany and UAE.
- Priority country pages use canonical public intelligence and explain review dependencies, likely sources of delay, what to send and what happens next. UNKNOWN and REVIEW REQUIRED remain visible. Country membership does not determine instrument-level requirements.
- `/counsel/use-cases` and one shared `/counsel/use-cases/[useCase]` template cover private client, immigration/nationality, citizenship, real estate, estates, private wealth, corporate, cross-border family, litigation support and maritime/yacht situations. Each has situation-specific document examples, facts needed, delay dependencies and related existing scope. They describe execution support, not legal practice by Milano.
- Existing educational country/document pages show a contextual counsel invitation only when their canonical audience includes counsel/professional users.
- `/counsel` keeps its existing capture experience and gains server-rendered discovery/FAQ sections. The credential wording is: “Nicholas Milano is a commissioned Florida Notary Public.” No fabricated metrics, testimonials, partnerships or acceptance claims are added.
- Public metadata/canonical URLs, breadcrumb markup, internal links and sitemap entries contain public content only. Query strings never become public identity/quote metadata. Existing Milano social imagery is reused.

## Repeat Matter and controlled referrals

The existing professional dashboard offers START ANOTHER MATTER after a prior Matter is present. The existing entry form reuses identity/workflow instructions and handoff mode, never automatically reusing destination, receiving authority, signer, document, deadline, route or execution method. Users explicitly reconfirm the current Matter facts. Changing fields/mode invalidates reconfirmation and clears stale handoff links. Inputs are disabled during persistence. Clipboard failure has a truthful manual-copy recovery path.

Signed referral generation/verification, mode-bound signatures, server-resolved professional identity, active-profile restrictions and cross-professional access controls are reused unchanged. A signed referral attributes a submission; it never grants Matter visibility or operational authority. No second referral form or portal is introduced.

## Security and test evidence

Behavioral tests cover operator denial before any data lookup, server actor stamps, response evidence, duplicate action retries/replay conflicts, concurrent writes, matching-profile qualification, canonical handoff attribution/email mismatch, preserved inquiry diagnostics, idempotent association, provider failure truth, private document access, context tampering, prototype-safe source/destination grouping, malicious filenames, no reused execution facts, privacy of operator history and business-day boundaries. Existing referral/activation/Wise/scheduling regressions remain part of the full suite.

Isolated PostgreSQL tests apply only the existing Phase 1 migration in a disposable local fixture. They verify private grants/RLS, canonical FK and duplicate receipt protections, plus stale JSON snapshot rejection and preservation of upload, operator history and attribution. No hosted database was altered.

Rendered QA has three separately labeled scopes:

1. Real local public pages: nine corridors, ten use cases and two indexes at all ten widths (210 checks), canonical/context checks and practice navigation.
2. Existing `/counsel` form/error/upload/receipt paths: real local page with explicit synthetic success/failure responses, plus actual fail-closed response without configured database credentials.
3. Protected operator/professional components: isolated CSR harness with synthetic API data at all ten widths, operator retry/qualification/prospect/activation controls, repeat-entry reconfirmation and signed-handoff display. This does not bypass or certify hosted application authorization. Real protected routes continue to require authentication.

Chromium is not real-device keyboard certification. Provider/hosted integration success is not inferred from these fixtures.

## Hosted checks and release limits

**UNVERIFIED — HOSTED ACCESS REQUIRED:** hosted Supabase schema/RLS/auth/private storage, real provider acceptance/delivery, live Wise reconciliation/scheduling unlock and authenticated end-to-end operator/professional workflows. Real-device keyboard behavior also remains unverified. Runtime staging credentials and an authorized application identity are not configured in this workspace. No production transaction, hosted migration or production deployment is performed.

The ten known baseline validator failures must remain separately identified. Final local gate counts, rendered results and baseline comparison are recorded in `artifacts/proof/counsel-phase2/`; a failure is never relabeled PASS without an actual successful rerun. No validator is changed for Phase 2.

## File inventory

- `app/api/admin/counsel/route.ts`
- `app/api/intake/analytics/route.ts`
- `app/counsel/corridors/page.tsx`
- `app/counsel/page.tsx`
- `app/counsel/use-cases/[useCase]/page.tsx`
- `app/counsel/use-cases/page.tsx`
- `app/dashboard/marketing/counsel/page.tsx`
- `app/professional/[country]/page.tsx`
- `app/sitemap.ts`
- `components/assistant/MilanoExecutionCopilot.tsx`
- `components/counsel/CounselContent.tsx`
- `components/counsel/CounselContextLink.tsx`
- `components/counsel/CounselExperience.tsx`
- `components/professional/ProfessionalMatterDashboard.tsx`
- `components/professional/ProfessionalMatterForm.tsx`
- `components/professional/UniversalProfessionalCountrySurface.tsx`
- `components/seo/CountryDocumentAuthorityPage.tsx`
- `docs/implementation/COUNSEL_ACQUISITION_PHASE2.md`
- `lib/counsel/content.ts`
- `lib/counsel/inquiry.ts`
- `lib/counsel/operator-actions.ts`
- `lib/counsel/operator.ts`
- `lib/counsel/receive.ts`
- `lib/intake/intakeAnalytics.ts`
- `lib/intelligence/ux-events.ts`
- `lib/notifications/transactionalEmailAlerts.ts`
- `lib/professional/profile.ts`
- `lib/routes/routeRegistry.ts`
- `scripts/qa-counsel-operator.cjs`
- `scripts/qa-counsel-phase2.cjs`
- `scripts/qa-counsel.cjs`
- `tests/counsel-inquiry.test.ts`
- `tests/counsel-operator-api.test.ts`
- `tests/counsel-phase2.test.ts`
- `tests/sql/counsel-phase2-actions.sql`
