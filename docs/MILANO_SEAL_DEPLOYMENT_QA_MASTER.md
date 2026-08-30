# MILANO SEAL DEPLOYMENT QA MASTER

Status: CANONICAL DEPLOYMENT VALIDATION SYSTEM

Purpose: final operational gate before production release. This is not a product specification or marketing document.

## Source and authority rules

- Current production code and locked control-plane doctrine control over historical prompts.
- One canonical Matter, state machine, Wise payment truth, RON truth, apostille/authentication truth, custody/release truth, shipping truth and authority-intelligence layer.
- No fake data, no fabricated route certainty, no duplicate engine, no second portal/dashboard/shipping surface.
- Unknown stays unknown. Review-required stays review-required.
- Public website, dashboard, portal and Alliance remain separate experience surfaces.

## Four-surface gate

### Public website

Validate public trust/conversion routes, secure intake, Global Document Intelligence, country/document pages, payment-gated execution messaging, founder assets, mobile behavior, accessibility and no prohibited legal-advice/firm positioning.

### Dashboard

Validate operator execution state, Matter identity, Wise visibility, pricing truth, custody history, apostille/authentication, RON, release, shipping, follow-ups, exceptions and operational evidence.

### Portal

Validate client-safe Matter summary, current stage, action required, payment/scheduling gate, documents, invoice, tracking, release and next expected event. No operator-only detail or raw provider payloads.

### Alliance

Validate role isolation, verified capability/credential gates, routing eligibility, no Matter/payment authority, no fake capacity/coverage and no client-data leakage.

## Canonical Matter progression

Current production state truth controls. Compatibility labels are acceptable where mapped to the same canonical lifecycle. A deployment must not fail solely because historical documentation uses legacy labels.

Operational journey to validate:

INTAKE → REVIEW → AWAITING PAYMENT → SCHEDULED → EXECUTION → APOSTILLE / AUTHENTICATION → TRANSIT → RELEASE / DELIVERY → COMPLETE

Payment truth, scheduling authority and execution truth remain distinct.

## Persona matrix

Run realistic end-to-end test Matters. Never seed fabricated production metrics to make the personas look complete.

1. Brazil counsel — affidavit/POA/international-use routing; receiving-authority and translation review language must remain conditional.
2. Italy professional — POA/affidavit/citizenship-adjacent U.S. execution; Hague route and receiving-authority review preserved.
3. Federal-document client — FBI, IRS, FDA, USPTO, federal court, naturalization or Social Security record. Federal authentication must never be routed through Florida DOS.
4. UAE signer/private client — route remains contextual and review-driven. Never present UAE as universally Hague or universally non-Hague without current authority context.
5. International life-sciences executive — FDA/corporate/manufacturing/quality records; verify federal vs state origin and translation/receiving-authority review.
6. Private equity / VC — board resolutions, POAs, fund/corporate records; verify entity/document origin and destination-specific routing.
7. HNWI estate client — trust, death, inheritance, probate and estate records; verify issuing authority and document-origin routing.
8. International recruitment — FBI checks, degrees, transcripts, employment verification and licenses; verify mixed federal/state/academic authority paths.
9. Equine transaction — bills of sale, ownership affidavits, veterinary/supporting records and export-related documents; do not imply regulatory/export approval from notarization alone.
10. High-value asset broker — ownership declarations, POAs, corporate records and affidavits; enhanced custody/identity review without inventing asset valuation or legal authority.

## Jurisdiction and authority hard gates

### Federal routing

Critical fail if a federal record is sent through Florida Department of State apostille workflow.

Test at minimum:
- FBI background checks
- IRS documents
- FDA documents
- USPTO documents
- federal court documents
- naturalization records
- Social Security records where applicable

### Mexico

Mexico must not be classified as non-Hague.

### UAE

Use current authority intelligence and receiving-authority context. If acceptance/routing is not fully verified, state must remain VERIFICATION_REQUIRED / REVIEW_REQUIRED.

### Translation

Never state universal "translation required" unless source-backed for the actual receiving authority. Use review-required language where unresolved.

### Florida language

Do not claim a document is "accepted by the State of Florida." Describe the relevant notarization, apostille or authentication authority accurately.

## Payment gate

Critical fail if:
- client can author paid state
- observed Wise submission is treated as verified settlement
- scheduling bypasses canonical authorization policy
- execution starts without the required payment/compliance gate
- a secondary payment provider appears
- Wise reference format diverges from canonical production format

Test:
- quote/pro forma amount
- discount behavior if authorized
- amount due
- observed submission
- verified settlement
- reconciliation idempotency
- scheduling authorization
- no duplicate Matter/payment

## Shipping Control Room

Canonical operator surface: `/dashboard/courier`.

Compatibility route: `/dashboard/shipping` must redirect to the canonical surface and must not own separate shipping logic.

Validate:
- approved-carrier filtering
- DHL Express primary international posture
- FedEx and UPS approved backup posture
- USPS approved domestic/government-mail posture
- conditional/unapproved carrier requires founder/admin override
- `CARRIER_OVERRIDE_APPROVED` evidence is recorded when used
- label/tracking data stays operator-side
- client portal receives sanitized tracking only
- webhook idempotency
- status mapping
- exception/return visibility
- no fake ETA
- no fake GPS/map location
- no auto-release on DELIVERED
- no auto-complete on DELIVERED

## Client delivery gate

Before final client release validate the sequence:

1. final artifact generated
2. correct final version selected
3. governed file name applied
4. master/archive copy preserved
5. client-safe delivery sent
6. delivery evidence logged

Never overwrite a previously released final artifact. Corrections create a new version/revision with preserved history.

## Truth / Memory / DNA surfaces

These names may exist as operator intelligence/read-model surfaces only. They must never become second authorities.

### Truth

Any score/count must reconcile to canonical records or be explicitly unavailable. Fail on fabricated revenue, execution, authority, trust, partner, deployment or corridor metrics.

### Memory

May summarize append-only Matter/evidence history such as rejections, authority changes, corrections, courier issues, payment issues, partner observations and release issues. Every record must retain provenance. No invented historical incidents.

### Execution DNA

May provide observational corridor/route maturity and recurring-pattern intelligence only where backed by governed evidence. No fabricated maturity/performance score and no mutation of canonical routing from an unsupervised model.

## Quick-action route gate

From `/dashboard`, any visible quick action must either reach its canonical working route or be absent. No dead, placeholder or coming-soon control.

Validate intended targets where those controls are exposed:
- Create Matter → `/dashboard/intake`
- Generate Invoice → canonical invoice creation surface
- Compliance / routing review → canonical Global Document Intelligence/review surface
- Create Shipment → canonical Shipping Control Room
- Send Client Update → canonical communications surface
- Create Ledger Event → canonical operational/evidence log surface
- Open Document Vault → canonical document surface
- Release Review → canonical release surface

No destructive action may execute merely by opening a quick-action link.

## Fake-data hard gate

Critical/major fail if unlabeled production UI displays invented:
- active Matter counts
- country counts
- completion percentages
- compliance percentages
- SLA percentages
- queue positions
- route scores
- authority scores
- success rates
- courier ETA/GPS data
- AI confidence presented as legal/authority truth

If demo data is intentionally shown outside production, label it clearly as demo/preview and isolate it from production state.

## Mobile and accessibility gate

Major fail before release:
- horizontal overflow on supported mobile widths
- tap target under 44px for primary controls
- broken safe-area behavior
- inaccessible focus state
- reduced-motion preference ignored on significant motion
- text/control clipping
- modal/drawer trap
- critical action hidden behind hover-only behavior

Test direct browser, in-app browser behavior where relevant, and common mobile viewport widths.

## Founder/brand asset gate

Critical fail if an approved founder image/logo is AI-regenerated, face-modified, distorted or silently replaced.

Brand evolution rule: enhance current black/gold institutional execution system only. Historical "Legal & Notary Group," "Notary Group Alliance," "Sovereign Command," cyberpunk, crypto, Mission Control or fake telemetry language must not be restored as live brand hierarchy.

## Severity model

### CRITICAL — deployment blocked

- prohibited payment provider/reference
- payment gate bypass
- federal/state routing corruption
- fabricated authority fact driving execution
- duplicate Matter/payment/release/shipping authority
- unauthorized release
- founder asset alteration
- fake live tracking/delivery truth
- broken auth/role boundary
- client writes operator authority

### MAJOR — fix before production

- broken primary route/control
- mobile overflow/clipping
- reduced-motion failure
- tap targets below minimum
- misleading next action
- missing reconciliation/error state
- stale source presented as current without review-required state

### MINOR — backlog allowed

- non-critical hover inconsistency
- cosmetic copy drift
- footer styling inconsistency
- empty-state wording differences that do not misstate truth

## Release verdict

Required final result:

- typecheck passes
- full tests pass
- production build passes
- repository validators pass
- critical route smoke passes
- no critical/major QA failure remains
- production/live external-provider actions are separately certified where physical/provider evidence is required

Code/control-plane green is not proof of physical Wise settlement, BlueNotary completion, government apostille return, carrier delivery or client receipt. Those remain real-world evidence gates.
