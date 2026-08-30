# The Milano Seal - Final Coded Injection Ledger

**Control point:** `766257049af884def26f678c9523de73a598b631`

**Canonical branch:** `main`

**Includes:** PR #285, BlueNotary Signing Room readiness UX
**Operating rule:** Systematic elevation. No random feature expansion. No rebuilding excellent systems.

This ledger is the locked implementation map for the production platform. It records what is built, what must be preserved, what was rejected or deferred, and what still requires live certification. It does not certify that an external transaction occurred.

## 1. Master non-rebuild lock - PRESERVE

The platform has one canonical Matter engine, Matter schema, Matter state machine, payment authority, Wise reconciliation system, scheduling authority, execution sequence, country/document intelligence layer, Atlas/corridor intelligence layer, BlueNotary/RON system, apostille workflow, custody/release workflow, courier/tracking workflow, client portal, operator dashboard architecture, SEO Authority Engine, human-review workflow, and evidence architecture.

- Wise is the only canonical payment system. Stripe is prohibited.
- Do not create parallel engines, lifecycle truth, registries, portals, adapters, notification truth sources, release systems, or authoritative payment fields.
- Do not fabricate legal or compliance certainty, payment settlement, delivery, or search metrics.
- Changes may fix defects and improve accessibility, mobile usability, hierarchy, feedback, performance, security, observability, idempotency, action clarity, and restrained premium execution.
- Every change must preserve the same Matter, payment truth, execution truth, event semantics, release truth, authority provenance, and role boundaries.

## 2. Public website and authority experience - BUILT / PRESERVE

The public experience positions The Milano Seal as the trusted U.S. execution side of an international document Matter: premium, precise, international, calm, institutional, and execution-focused. It is not a law firm, legal-advice provider, commodity notary site, or generic apostille marketplace.

Preserve the homepage, professional lane, country and document intelligence, country-document authority pages, Global Document Intelligence, Pre-Flight Certainty, Matter Review System, custody messaging, Atlas corridor experience, and Secure Intake routing. The primary action remains **Begin Secure Intake**. Improve presentation and route continuity without redesigning information architecture or representing The Milano Seal or Nicholas as legal counsel.

## 3. Authentication and role routing - BUILT / HARDEN ONLY

Supabase Auth remains canonical. Preserve login, recovery, reset, sessions, route guards, dashboard authorization, and portal ownership checks.

- Clients route to `/portal` and may access only owned Matter projections and permitted client actions.
- Operators, admins, and founders route to `/dashboard`.
- RON operators use `/dashboard/ron`.
- Matter ownership never grants operator authority.
- Tiffany may test client and operator experiences only as distinct authorization contexts.
- Authorization is server-enforced with RLS; privileged state is never client-authored.

## 4. Secure Records Intake - BUILT / DO NOT REPLACE

The canonical flow is Secure Intake -> structure -> validate -> price/review -> persist exactly one Matter -> portal. Intake must not create separate quote, portal, RON, or apostille Matters. Unknown notarial acts, Hague posture, receiving authorities, signer jurisdictions, witnesses, eligibility, and apostille requirements remain unknown or review-required. A success state may appear only after persistence and capture of the canonical Matter ID.

## 5. Atlas, globe, and global intelligence - BUILT / PRESERVE CORE

Atlas visualizes canonical origin, destination, country/document corridor, Convention and authority posture, execution considerations, receiving-jurisdiction considerations, evidence, and route certainty. It is not a second routing engine. Desktop and mobile must project identical intelligence truth.

Permitted changes include camera easing, responsive anchoring, labels, mobile sheets, selection persistence, reduced motion, loading transitions, high-DPI optimization, touch controls, and focus transitions. Visual effects must never alter routing or status, hide uncertainty, block interaction, or harm mobile performance.

## 6. Country, authority, and compliance intelligence - BUILT / ONE LAYER

Preserve the country, document, and country-document registries; compliance and authority evidence; receiving-authority data; freshness; provenance; and route review flags. Hague membership alone does not prove the Convention is operative for every bilateral corridor.

Supported evidence states include `VERIFIED`, `REVIEW_DUE`, `STALE`, `SOURCE_CONFLICT`, `CHANGE_DETECTED`, and `UNVERIFIED`. Unresolved authority truth produces **Review Required**, not an automatic Matter transition or definitive public legal conclusion. Authority changes require governed review before becoming canonical execution truth.

## 7. Secure client portal - BUILT / UX HARDEN ONLY

Preserve `/portal`, `/portal/payment`, `/portal/documents`, `/portal/invoice`, `/portal/release`, and `/portal/tracking`. The top Matter view prioritizes current stage, action required, and next expected event, followed by journey, Controlled Records, payment, custody/tracking, and timeline.

The portal is a server-truth projection, never a client-local state machine. Paid, scheduled, executed, apostilled, released, delivered, and complete states require canonical backend evidence.

## 8. Wise payment and retainer - BUILT / LOCKED

Payment truth distinguishes required, Wise processing, verified, and issue states. `payment_observed_at`, `payment_settlement_status`, `payment_confirmed`, and verified payment authority remain separate. Observed submission is not verified settlement, and clients cannot author financial truth.

"Check Wise settlement now" must expose checking, processing, verified, and failure feedback. Replay must not create a second payment, confirmation event, discount redemption, scheduling transition, or revenue entry. Tiffany's existing Matter must not be charged again.

## 9. Operator notifications - EMAIL AND RECONCILIATION BUILT

Preserve intake, payment-observed, and payment-confirmed client/operator email events and the configured operator recipients. `/api/cron/notification-reconcile` is recovery infrastructure, not lifecycle authority.

Transport distinguishes pending, provider accepted, delivered, failed, bounced, complained, suppressed, and unknown; provider acceptance is not delivery. A future in-app command layer must consume the same canonical Matter events and remain idempotent.

## 10. Scheduling authority - BUILT / ONE GATE

Canonical scheduling authority may come from verified Wise settlement, policy-authorized observed Wise submission, or valid complimentary authorization. Scheduling authorization during processing does not set `payment_confirmed` and does not redefine paid truth. Existing signer-link and execution-release guards remain authoritative. Do not create another scheduling gate.

## 11. BlueNotary RON Signing Room - BUILT / UI UPGRADED

PR #285 established `/dashboard/ron` as the BlueNotary Signing Room with visible ready, blocked, and active metrics; Matter reference and party details; payment/scheduling and notarial posture; inline blocker count and blocker text; and an explicit readiness/session action.

Scheduling authority, signer information, RON execution facts, and the Matter document package must visibly read ready or blocked without hover. Actions retain the same `matter_id`, use the canonical session endpoint, and must not create a duplicate session. Mobile targets remain at least 44px.

## 12. RON to apostille handoff - BUILT

The sequence remains readiness -> BlueNotary session -> identity verification -> session -> RON completion -> signed-document retrieval -> ready for apostille -> operator review. Signed documents return to the same Matter. RON completion does not claim apostille submission or completion. The portal may show notarization complete, then apostille in process only after the real apostille workflow begins.

## 13. Apostille and authentication - BUILT / LIVE CERTIFICATION REQUIRED

Preserve `/dashboard/apostille`, the same Matter and documents, authority evidence, execution truth, and custody chain. Determine document origin/type, execution posture, competent authority, destination, Convention applicability, and receiving-jurisdiction requirements before proceeding. Status comes only from real events and may include ready for review, submitted, in process, completed, or review required.

## 14. Custody, international release, and courier - BUILT

Preserve `/dashboard/courier`, `/workspace/release`, `/portal/release`, and `/portal/tracking`. Release follows execution, required authentication, custody verification, readiness, shipment, tracking, delivery, and close review. It fails closed when evidence is missing. Authorized courier events control tracking and delivery; client requests, browser state, optimistic UI, and unverified provider responses do not.

## 15. SEO Authority Engine - SUBSTANTIALLY BUILT / HARDENED

Preserve authority records and pages, evidence, intent governance, localization, schema, sitemaps, quality controls, Search Console integration, editorial review, and revenue feedback architecture. Indexability fails closed for missing/stale evidence, source conflict, required review, blocked content, or absent editorial approval.

Search Console data is acquisition evidence, never legal, authority, Matter, or execution truth. Do not fabricate impressions, clicks, CTR, rankings, or revenue. An unconfigured integration must say unconfigured. Preserve the canonical PR #281 and #283 implementations.

## 16. Milano human review - BUILT / GOVERNED

Copilot uncertainty may create a persisted review request that proceeds through `REQUESTED`, `ACKNOWLEDGED`, `IN_REVIEW`, `RESOLVED`, and `CLOSED`. Participation and resolution labels require corresponding persisted events. Review requests do not create Matters or authorize payment, scheduling, execution, or release.

## 17. Operator OS - BUILT / UX HARDEN ONLY

Preserve the dashboard, RON, apostille, courier, ledger, review, SEO/editorial, authority verification, certification, and release workspaces. Operator surfaces prioritize current truth -> blocker -> next action, retain Matter context, and never create execution objects through navigation. Mobile operation is first class.

## 18. Production certification - CONTROL PLANE BUILT

Code validation is not live transaction certification. Preserve certification runs, evidence, fail-closed GO eligibility, and same-Matter continuity validation. Required checks default to pending and require live human evidence for pass. Any pending, failed, or missing evidence means not eligible/NO GO.

Certification may observe SHA, routes, Matter state, Wise state, scheduling, event history, and tracking. It may not mutate payment, Matter lifecycle, RON authority, apostille authority, or release authority.

## 19. Tiffany continuity - IN PROGRESS / LOCKED

Continue Tiffany's existing Matter and history. Do not charge again, redeem another discount, create another Matter, or create a duplicate BlueNotary session. Validate the same Matter from portal and real Wise truth through operator readiness, RON, apostille, release, tracking, delivery, and close. Record dead controls, incorrect truth, missing notifications, false success, clipping/overflow, hidden blockers, unclear or duplicate actions, and wrong Matter references as defects.

## 20. Mobile and responsive UX - ONGOING ELEVATION

UI fixes must not change business logic. Require 44px controls, no horizontal scrolling or clipped actions, safe-area support, visible disabled reasons and operation feedback, one-handed critical actions, stable Matter references, responsive cards/tables, stable navigation, and predictable back behavior. Motion is subtle, GPU-conscious, and reduced-motion aware; it never impairs readability, speed, touch accuracy, accessibility, or operator awareness.

## 21. Observability and automation - BUILT IN PART / HARDEN

Direct event dispatch is primary; reconciliation is secondary. Automate notification recovery, shipment tracking, SEO sync, SLA checks, provider reconciliation, and missing-evidence detection with idempotent retries. Do not automate human legal/compliance judgment, unsupported country certainty, manual production certification, fabricated settlement, or ungated execution approval.

## 22. Security - HARDENED / MONITOR

Preserve RLS, server authorization, service-role isolation, signed provider verification, private Matter storage, role guards, and database-function hardening. Never expose secrets, raw provider payloads, privileged public RPCs, or client-authored financial truth. Security-definer functions require an explicit `search_path`, required policy dependencies, and no anonymous privileged execution. Never disable RLS for a UI fix.

## 23. Rejected and superseded work - DO NOT RESTORE

PR #280 and PR #282 remain closed. Their older conflicted Search Console/review and platform snapshots must not be reopened or copied into canonical code; PR #282 was superseded by #283.

Rejected patterns include second Matter, Wise, scheduling, country/Hague, BlueNotary, portal, apostille, or courier systems; Stripe; fake live chat or operator participation; and fabricated SEO, payment, or compliance truth.

## 24. Deliberately deferred - ALLIANCE REDESIGN

Do not spend current build cycles on Alliance redesign. Before final certification, only security fixes, production-breaking defects, Matter compatibility fixes, and critical route failures are allowed there. Full Alliance work resumes after client, operator, Wise, RON, apostille, release, and mobile acceptance are certified.

## 25. Live certification - NOT IMPLIED BY CODE

The full Wise lifecycle and reconciliation, physical RON and real BlueNotary execution, real apostille submission/completion, real courier shipment and delivery, full client-to-close continuity, and physical iPhone/Android acceptance remain uncertified until physically proven. The system may be architecturally ready without being live-transaction certified.

## 26. Final Nick x Tiff control directive - LOCKED

Preserve excellent systems; elevate mediocre ones; simplify confusion; harden fragility; consolidate duplication to canonical truth; add evidence to unobservable operations; optimize slowness; fix mobile hostility; improve weak visuals without changing truth; label unverified facts; expose exact blockers; and show exact next actions.

Every surface must feel like one connected ecosystem: web authority -> Global Document Intelligence -> Atlas/country/document -> Secure Records Intake -> one Matter -> Matter Control Portal -> Wise -> operator command -> BlueNotary RON -> apostille -> custody -> International Courier Release -> Courier Release Tracking -> delivery -> close -> evidence/certification.

**One Matter. One truth. One execution chain. One Milano Seal.**
