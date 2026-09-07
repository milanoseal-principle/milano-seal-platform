# BRTH Source Reconciliation

**Status:** Production donor audit
**Control standard:** Current Milano Seal production architecture and canonical Matter controls
**Rule:** BRTH assets are feature donors only when they do not conflict with current production truth.

## Canonical locks preserved

- Supabase remains the system of record.
- Wise remains the only canonical Milano Seal payment system.
- Governed payment-submission authority and verified settlement remain separate truths.
- Scheduling authority may be satisfied where current production policy permits while settlement remains pending.
- Final settlement-dependent international release remains fail-closed until required Wise settlement is verified.
- Notarial act is never guessed. `review_required` remains unresolved until an authorized operator confirms the act.
- BlueNotary/RON readiness remains subordinate to canonical Milano Matter execution truth.
- No second Matter engine, payment engine, scheduler, RON authority, courier authority, release engine, or event ledger may be introduced.
- No fake telemetry, fake payment, fake Matter event, or fabricated execution state may appear as production truth.
- The Milano Seal does not provide legal advice or legal representation.

## Source-family decisions

### 1. Snapdocs residential field-visit packet — INJECT

**Decision:** INJECT as a generalized internal field-visit operating protocol.

**Unique value recovered:**
- unannounced residential visit handling
- packet-legibility preflight
- no-response contact-letter handling
- residence evidence when ordered
- explicitly authorized second visit as a separate attempt/fee event
- scanback after execution
- secure retention and return of originals

**Production implementation:**
- `lib/operations/field-visit-protocol.ts`
- `/dashboard/field-visits`

**Governance changes applied during injection:**
- no client-specific name, address, claim, or case facts copied into product code
- no unsecured affidavit/originals left at a residence
- no second visit without explicit assignment authority
- no legal advice or alteration of supplied legal documents
- no inferred notarial act
- all evidence remains tied to the existing Matter system

### 2. Comune di Vastogirardi historical civil-status request form — INJECT

**Decision:** INJECT as source-specific municipal-record intelligence, not universal Italy doctrine.

**Unique value recovered:**
- 13 listed civil-record request types
- applicant / researched-subject / relationship data requirements
- relationship-evidence requirements for specified record categories
- identity, payment, delegation, and supporting-document attachment controls
- postal, PEC, and ordinary-email delivery choices listed on the form
- historical-search contribution table shown on the supplied form
- source language on inadmissibility when required contribution is missing
- source language stating the contribution is not refundable after a negative historical search

**Production implementation:**
- `lib/intelligence/italy-municipal-records.ts`
- `/dashboard/italy-records`

**Governance changes applied during injection:**
- operator must verify the actual Comune holding the record
- operator must verify current form/fee/submission instructions before use
- no inference that the applicant is legally entitled to parentage data or full copies
- no issuance or timing guarantee
- legal-eligibility questions route to the client or their attorney

### 3. MilanoSeal_Dashboard.jsx — VISUAL DONOR ONLY

**Decision:** Do not port executable logic.

**Useful donor concepts:**
- execution-center hierarchy
- operational-ledger visual treatment
- payment/readiness status grouping
- chain-of-custody presentation
- Matter drawer and operator-action visual hierarchy
- restrained black/gold tactical interface

**Rejected runtime behavior:**
- hard-coded Matters presented as operating data
- generated/random fake live events
- fake operational counts and receivables
- generic client-side state advancement
- simplistic payment gate that does not match current payment-submission/settlement separation
- alternate event authority outside the canonical ledger

Current production already contains real Matter projections, payment reconciliation, RON readiness, custody, and operator intelligence. The donor may inform presentation only.

### 4. milano-seal-terminal-v2.jsx — VISUAL / INVOICE DONOR ONLY

**Decision:** Do not port runtime/payment logic.

**Useful donor concepts:**
- compact operator-terminal density
- invoice/pro-forma paper styling
- internal intelligence input presentation
- structured output tabs

**Rejected behavior:**
- non-canonical payment rails
- standalone client-side invoice/payment authority
- any direct mutation outside current Matter APIs
- any old assumptions that conflate scheduling authority with verified settlement

Current Invoice Studio and canonical payment architecture remain authoritative.

### 5. milano-seal-website.jsx — VISUAL DONOR ONLY

**Decision:** Reject executable scaffold; retain only presentation ideas.

**Useful donor concepts:**
- premium typography rhythm
- process storytelling
- ivory/gold document presentation
- responsive intake presentation ideas

**Rejected behavior:**
- retired standalone Render backend calls
- duplicate intake/backend architecture
- non-canonical payment methods
- hard-coded execution/pricing assumptions
- founder or public copy that could overstate professional/legal specialization

Current Next.js/Vercel/Supabase production remains the only application architecture.

### 6. milano-seal-platform.jsx — ARCHIVE / FEATURE DONOR

**Decision:** Do not deploy.

The file uses retired standalone backend assumptions and a simplified intake/invoice implementation. Current production already supersedes this with governed intake, pricing, Matter persistence, payment authority, portal, and operator controls.

### 7. MilanoSealMotionDemo_Visible.jsx — ANIMATION DONOR ONLY

**Decision:** Do not create a second cinematic system.

**Useful donor concepts:**
- staged boot/reveal pacing
- network/route motion
- pipeline/custody reveal choreography
- module activation sequencing

**Rejected behavior:**
- fake jurisdiction telemetry
- fake active Matter counts
- fake courier progress
- simulated operational events presented as live
- hard-coded legal/jurisdiction conclusions
- authority language that overstates Milano's role

Current production already owns the canonical Framer Motion system, global cinematic page shell, reduced-motion behavior, route coverage validation, and dashboard motion building blocks.

### 8. MilanoSealSovereignCommand.jsx — ANIMATION DONOR ONLY

**Decision:** Do not deploy or adopt its authority language.

**Rejected language/behavior includes:**
- sovereign-authority framing
- diplomatic-logistics framing
- artificial integrity/throughput percentages
- simulated authenticated modules presented as operational fact
- fake global jurisdiction telemetry

Milano public/operator language remains execution, coordination, intelligence, review, custody, and verified authority-source routing.

### 9. Command Center XLSX family — TAXONOMY / SOP DONOR

**Decision:** Extract useful operating taxonomy; do not restore spreadsheets as system of record.

**Useful donor concepts:**
- operator runbook taxonomy
- referral scripts
- client registry concepts
- apostille tracking categories
- KPI/revenue organization
- assets/index discipline
- review-flow timing

**Rejected architecture:**
- spreadsheet as primary system of record
- manual status changes that override canonical transaction truth
- obsolete payment-before-scheduling rules where they conflict with current submitted-payment authority
- optional/alternative payment architecture that conflicts with current Wise-only system
- duplicate CRM, pricing, or execution state machines

Supabase and the existing dashboard module system remain authoritative.

### 10. Milano_Seal_Final_Master_Report.docx — HISTORICAL DONOR ONLY

**Decision:** Archive as historical architecture/reference.

The report contains useful brand, intake, document-output, automation, and operational concepts, but its technical sections include superseded payment architecture, retired hosting assumptions, and old state/payment doctrine. It cannot govern production.

### 11. Milano_Seal_FULL_50_Page_CTO_Report.docx — ARCHIVE / LOW-VALUE REFERENCE

**Decision:** Do not inject implementation from this report.

The uploaded version contains repeated generic example expansion blocks rather than implementation-grade contracts. It does not supersede current code, locked SOPs, migrations, validators, or production behavior.

### 12. Invoice spreadsheets — FEATURE DONOR, CURRENT INVOICE STUDIO CONTROLS

**Decision:** Do not create a spreadsheet invoice engine.

Recover visual/document-field ideas only when they improve the existing Invoice Studio. Payment references, amount due, payment observation, settlement, final balance, and release authority remain generated/read from canonical Matter financial truth.

## Explicitly quarantined from BRTH runtime

The following may appear in historical/audit discussion but must not be reintroduced into BRTH-injected runtime modules:

- retired standalone Render backend URL
- Stripe
- Zelle
- Venmo
- Apple Cash
- Cash App
- fake 'live event' injection
- fabricated Matter telemetry
- sovereign document-execution authority claims
- diplomatic logistics claims
- hard-coded generic state advancement

## Net-new production value recovered

1. **Field Visit Control** — a source-backed internal protocol for residential signing assignments, no-response evidence, return visits, scanback, and originals custody.
2. **Italy Municipal Records Desk** — a source-specific authority profile for historical civil-status requests, attachments, record types, administrative contribution conditions, delivery methods, and operator verification gates.

Everything else is either already materially represented in current production or unsafe/stale as executable code.
