# Milano Seal OS Canonical Intelligence
Status: Canonical internal source — FINAL
Scope: The Milano Seal™ only
Source: The_Milano_Seal_Canonical_System
Exclusion: Not Liaison OS, not D&D PIP Intelligence, not provider recovery reporting

============================================================
COPY BLOCK 1 — FINAL AUDIT DECISION
============================================================

STATUS: ACCEPTED AS CANONICAL MILANO SEAL SYSTEM SOURCE.

CONTROL:
The Milano Seal™ is now treated as a separate production operating system from Liaison OS.

The Milano Seal™ = Global Document Execution Infrastructure.
Liaison OS = Provider / PIP Intelligence Operating System.

DO NOT MERGE.
DO NOT CROSS-CONTAMINATE.
DO NOT REUSE LIAISON OS LANGUAGE IN MILANO SEAL PUBLIC ROUTES.

MILANO SEAL IS:
- secure document execution
- notary / RON coordination
- apostille preparation
- international document routing
- payment-gated scheduling
- chain-of-custody visibility
- secure client portal
- operator execution center
- Atlas intelligence
- final release review
- identifier exact-match safety
- cinematic premium trust interface

MILANO SEAL IS NOT:
- PIP recovery
- provider intelligence
- carrier posture reporting
- claimant tracking
- D&D liaison workflow
- chiropractic audit reporting
- demand package recovery system
- Body Shop reporting engine

FINAL RULE:
Any module involving document execution, apostille, notary, RON, client portal, custody, or release belongs to The Milano Seal.
Any module involving providers, PIP, carriers, posture, claimants, or recovery belongs to Liaison OS.

============================================================
COPY BLOCK 2 — CANONICAL IDENTITY SOP
============================================================

LEGAL:
Milano Seal International LLC dba The Milano Seal.

BRAND:
The Milano Seal™

TAGLINE:
Sealing Trust with Every Signature.

CATEGORY:
Global Document Execution Infrastructure.

POSITIONING:
The Milano Seal coordinates secure execution, notarization, apostille preparation, international routing, payment-gated scheduling, custody visibility, portal access, and final-release integrity for high-trust documents.

PUBLIC TONE:
- premium
- calm
- international
- secure
- concierge-level
- execution-focused
- trust-centered

VISUAL STANDARD:
- OLED black shell
- gold accents
- cinematic but controlled
- black/gold ritual energy
- luxury document-infrastructure feel
- no cartoon UI
- no cheap SaaS look
- no generic notary clipart
- no PIP/provider language

FORBIDDEN PUBLIC LANGUAGE:
- PIP
- carrier posture
- provider recovery
- claimant recovery
- suit filed
- benefits exhausted
- paid correctly
- Body Shop
- D&D
- chiropractic audit
- demand packet recovery

ALLOWED PUBLIC LANGUAGE:
- secure document execution
- apostille preparation
- notarization coordination
- Remote Online Notarization review
- international document pathway
- chain-of-custody visibility
- payment-gated scheduling
- final release review
- document vault
- Global Document Intelligence Atlas

============================================================
COPY BLOCK 3 — CORE PLATFORM SOP
============================================================

PRIMARY ROUTES:

/
Landing page

/intake
Smart and structured intake

/map
Global Document Intelligence Atlas

/portal
Secure Matter Portal

/dashboard
Execution Center

/va/portal
Operations Desk

/verify
Public-safe verification shell

PRIMARY MODULES:
1. Landing / Trust Entry
2. Smart Intake
3. Atlas
4. Secure Matter Portal
5. Execution Center
6. VA Operations Desk
7. Payment Integrity Gate
8. Identifier Exact-Match Gate
9. Final Seal Review
10. Execution QA Matrix
11. Custody Rail
12. Verification Shell
13. Legacy Client Credit
14. Ritual Lock / Assistant Orb

PLATFORM RULE:
Every module must support the same matter lifecycle, same payment gate, same final release logic, same client-safe projection, and same operator-only/internal boundary.

NO LOGIC DRIFT:
Do not create alternate state names.
Do not create alternate payment rules.
Do not create alternate release conditions.
Do not create alternate client portal projections.

============================================================
COPY BLOCK 4 — MATTER MODEL SOP
============================================================

MATTER STATE MACHINE:
intake_received
under_review
quoted
awaiting_payment
scheduled
in_execution
apostille_processing
in_transit
delivered
completed

PAYMENT REFERENCE:
MS-YYYY-####

CORE MATTER FIELDS:
- matter_id
- client_name
- client_email
- document_type
- destination_country
- origin_jurisdiction
- signer_location
- signer_count
- document_count
- apostille_required
- urgency
- selected_lane
- price
- payment_status
- payment_confirmed
- scheduling_unlocked
- execution_status
- apostille_status
- custody_status
- delivery_status
- release_status
- verification_id

LEDGER EVENTS:
SMART_REQUEST_PARSED
STRUCTURED_INTAKE_CREATED
MATTER_CREATED
COMPLIANCE_VERIFIED
LANE_ASSIGNED
INVOICE_CREATED
INVOICE_SENT
PAYMENT_LINK_CREATED
PAYMENT_CONFIRMED
PAYMENT_CONFIRMED_MANUAL
SCHEDULING_UNLOCKED
EXECUTION_SCHEDULED
RON_COMPLETED
APOSTILLE_SUBMITTED
APOSTILLE_COMPLETED
COURIER_RELEASED
DELIVERY_CONFIRMED
PAID_AND_RELEASED
FINAL_RELEASE_BLOCKED
FINAL_RELEASE_APPROVED
IDENTIFIER_MISMATCH_BLOCKED
IDENTIFIER_EXACT_MATCH_CONFIRMED
FOUNDER_RELEASE_OVERRIDE

RULE:
No matter may skip payment gate, identifier gate, final review gate, or founder release gate when those checks apply.

============================================================
COPY BLOCK 5 — PRICING / PAYMENT SOP
============================================================

LOCKED LANES:
Signature Lane: $750
Priority Lane: $975
Executive Lane: $1,850

ADD-ONS:
Apostille: +$250
Rush: +$400
Extra signer: +$150

PAYMENT PROVIDER:
Wise Business payment links / references.

PAYMENT REFERENCE FORMAT:
MS-YYYY-####

PAYMENT RULE:
Scheduling, execution, and final release remain locked until payment_confirmed = true.

PLATFORM-FEE-ONLY EXCEPTION:
For domestic platform-only RON matters:
- Wise is hidden
- Milano Seal service fee may be waived
- external platform fee can still show
- scheduling can unlock only after platform_fee_only is confirmed/approved

MANUAL CONFIRMATION:
Only founder_admin may manually confirm payment.

IDEMPOTENCY:
Duplicate payment confirmation must return ok without double-writing events or unlocking twice.

EVENTS:
PAYMENT_GATE_CREATED
PAYMENT_CONFIRMED
PAYMENT_CONFIRMED_MANUAL
PAYMENT_GATE_UNLOCKED
PAYMENT_CONFIRMATION_REJECTED
PLATFORM_FEE_ONLY_CONFIRMED

CLIENT PORTAL MAY SHOW:
- payment status
- invoice state
- Wise reference if applicable
- scheduling unlocked status
- platform-fee-only state if applicable

CLIENT PORTAL MUST NEVER SHOW:
- raw webhook payload
- service role key
- internal payment notes
- margin
- net margin
- discount reason
- internal reason

============================================================
COPY BLOCK 6 — SMART INTAKE SOP
============================================================

ROUTE:
/intake

PURPOSE:
Convert client request into a structured matter without making final legal/compliance promises.

INTAKE CAPTURES:
- client name
- client email
- phone
- document type
- destination country
- origin jurisdiction
- signer location
- signer count
- document count
- apostille needed
- urgency
- translation likely
- RON possible
- notes
- uploaded document if available

SMART INTAKE OUTPUT:
- estimated lane
- estimated price
- recommended pathway
- RON review flag
- apostille/legalization flag
- translation flag
- operator review flag

AI RULE:
AI may classify and recommend.
AI may not confirm compliance.
AI may not alter identifiers.
AI may not shorten foreign IDs.
AI may not confirm payment.
AI may not release a document.
AI may not create final apostille authority.

SANITIZATION:
All free-text fields must pass safeText().
Destination params must pass safeDestinationParam().
Country slugs must be validated against Atlas.

CLIENT COPY:
Keep intake calm, secure, premium, and non-legal-advice.

BLOCK:
Any request containing critical foreign identifiers must be flagged for exact-match review before release.

============================================================
COPY BLOCK 7 — ATLAS SOP
============================================================

ROUTE:
/map

PURPOSE:
Provide client-safe country and pathway intelligence for international document execution.

ATLAS FUNCTION:
- country selection
- Florida origin routing
- Hague/non-Hague status
- apostille/legalization pathway
- RON likelihood
- translation likelihood
- common document types
- intake prefill
- SEO authority

PRIMARY COUNTRIES:
Italy
Spain
France
Germany
Portugal
Greece
UAE
Brazil
Mexico
United Kingdom
Canada
Colombia
Chile
Argentina
Australia

FALLBACK:
Other / Not sure

PUBLIC DRAWER MAY SHOW:
- country
- region
- Hague status
- apostille/legalization pathway
- common documents
- RON review
- translation likely
- client-safe summary
- Begin Secure Intake CTA

PUBLIC DRAWER MUST NEVER SHOW:
- operatorSummary
- internal confidence notes
- revenue score
- source uncertainty
- private compliance notes
- raw records

CTA:
Begin Secure Intake → /intake?destination=[country_slug]

SEO PRIORITY PAGES:
- Italy apostille
- Greece apostille
- Portugal apostille
- Spain apostille
- UAE legalization
- Brazil apostille
- Mexico apostille
- United Kingdom apostille
- Canada apostille
- France apostille

RULE:
Atlas educates and routes. It does not provide legal advice or acceptance guarantees.

============================================================
COPY BLOCK 8 — CLIENT PORTAL SOP
============================================================

ROUTE:
/portal

PURPOSE:
Give clients clean, safe, controlled visibility into their matter.

PORTAL MAY SHOW:
- matter status
- document type
- destination country
- current state
- next action
- payment status
- invoice state
- Wise reference if applicable
- scheduling unlocked status
- vault document status
- custody timeline
- tracking-safe status
- release status
- legacy client credit if active

PORTAL MUST NEVER SHOW:
- internal_notes
- operator_notes
- raw_webhook
- raw_payload
- margin
- net_margin
- shipping_cost
- label_url
- discount_reason
- internal_reason
- service role data
- operatorSummary
- revenue scoring
- founder override notes

SECURITY:
All portal data must pass projectMatterForClient().
All portal payloads must pass assertNoForbiddenClientFields().
Client must only access their own matter.

PORTAL SUBROUTES:
/portal/tracking
/portal/invoice
/portal/documents

PORTAL STYLE:
- premium black/gold
- client-safe
- calm
- not technical
- no raw system errors
- no backend jargon

RULE:
The portal is client visibility, not operator control.

============================================================
COPY BLOCK 9 — EXECUTION CENTER SOP
============================================================

ROUTE:
/dashboard

PURPOSE:
Founder/operator command center for payment, matter control, QA, release, custody, and ledger visibility.

DASHBOARD MUST SHOW:
- KPI cards
- intake review queue
- pipeline
- payment ledger
- matter drawer
- Payment Integrity Panel
- Matter Intelligence Panel
- Execution QA Matrix
- Final Seal Review Panel
- Identifier Lock status
- chain-of-custody timeline
- operational ledger

OPERATIONAL LEDGER COLUMNS:
Time
Matter
Event
Actor
Status

FOUNDER-ONLY ACTIONS:
- manual payment confirmation
- release override
- final document release
- legacy credit creation
- price/lane override
- close matter
- founder final approval
- view internal reasons

OPERATOR MAY:
- review matter
- prepare workflow
- update non-founder fields if permitted
- manage execution queue
- review QA status

DASHBOARD MAY SHOW:
- internal notes
- operator notes
- release blockers
- identifier mismatch reasons
- payment reconciliation
- custody internal status
- revenue segment

DASHBOARD MUST PROTECT:
- service role keys
- raw webhook details unless server-only/protected
- client data boundaries
- founder-only overrides

RULE:
The dashboard blocks mistakes before the client sees them.

============================================================
COPY BLOCK 10 — VA OPERATIONS DESK SOP
============================================================

ROUTE:
/va/portal

PURPOSE:
Preparation-only workspace for assigned support tasks.

VA CAN:
- view assigned tasks
- view pre-flight checklist
- prepare intake summary
- check visible client fields
- prepare delivery checklist
- request founder review
- mark prep item ready

VA CANNOT:
- confirm payment
- release documents
- close matters
- create legacy credits
- edit pricing
- override safety gates
- view margin
- view internal payment notes
- view founder-only release notes
- change compliance pathway

REQUIRED COMPONENT:
FinalReleasePrepPanel

PANEL MUST SHOW:
- client name reviewed
- destination reviewed
- document type reviewed
- signer count reviewed
- apostille question reviewed
- attachments checked
- page count prepared
- shipping details prepared
- founder approval needed

EVENT ON BLOCK:
VA_ACTION_DENIED

RULE:
VA supports execution prep. Founder controls payment, release, and closure.

============================================================
COPY BLOCK 11 — FINAL RELEASE SAFETY SOP
============================================================

PURPOSE:
Prevent document release errors before documents leave Milano Seal control.

FINAL RELEASE IS BLOCKED UNLESS:
- payment confirmed or platform-fee-only approved
- final seal review passed
- identifier exact-match passed
- apostille/legalization pathway reviewed
- document packet reviewed
- delivery recipient confirmed
- final PDF locked
- founder approval completed when required

FINAL SEAL REVIEW CHECKS:
- client name exact match
- destination country
- document type
- origin jurisdiction
- signer location
- apostille/legalization status
- notarial block
- signature blocks
- witness blocks
- page count
- attachments/exhibits
- foreign identifiers
- shipping recipient
- final PDF lock
- founder approval

ITALY HARD RULE:
If destination_country = Italy and codice fiscale exists, Codice Fiscale Lock is required before final release.

IDENTIFIER LOCKS:
- codice fiscale
- tax ID
- passport number
- national ID
- corporate registration number
- court case number
- document reference number
- invoice number
- account number
- tracking number

IDENTIFIER RULE:
No shortening.
No silent deletion.
No AI normalization.
No character removal.
No release if length/order/value changed.

EVENTS:
FINAL_SEAL_REVIEW_STARTED
FINAL_SEAL_REVIEW_PASSED
FINAL_RELEASE_BLOCKED
FINAL_RELEASE_APPROVED
IDENTIFIER_MISMATCH_BLOCKED
IDENTIFIER_EXACT_MATCH_CONFIRMED
FOUNDER_RELEASE_OVERRIDE

RULE:
No document leaves operator control until payment, identifier, QA, custody, and final release gates pass.

============================================================
COPY BLOCK 12 — EXECUTION QA SOP
============================================================

PURPOSE:
Prevent missed signatures, initials, notarial blocks, witness fields, signer data, apostille defects, and courier packet failures.

QA CHECKS:
- signature present
- initials complete
- notarial block complete
- venue complete
- date complete
- signer name matches ID/document
- witness fields complete if required
- apostille-target document checked
- scan-back required if high-risk
- courier release blocked until QA complete
- page count checked
- attachments/exhibits checked
- foreign identifiers checked
- destination country checked
- delivery recipient checked

QA STATUSES:
clear
needs_review
blocked
founder_approved

BLOCKING CONDITIONS:
- missed signature
- missing notarial block
- incomplete witness field
- incomplete signer data
- missing apostille document
- missing courier packet item
- foreign identifier mismatch
- page count mismatch
- client name mismatch
- destination mismatch

FOUNDER OVERRIDE:
Allowed only for founder_admin.
Requires reason.
Writes FOUNDER_RELEASE_OVERRIDE.
Never visible to client.

RULE:
QA exists to prevent embarrassment, legal rejection, courier failure, and client trust damage.

============================================================
COPY BLOCK 13 — RITUAL / ORB / ASSISTANT SOP
============================================================

PURPOSE:
Create a cinematic premium entry experience that reinforces trust without blocking conversion.

RITUAL LOCK MAY STAY IF:
- it loads fast
- no checkerboard appears
- no empty medallion appears
- login is not blocked
- mobile layout is clean
- reduced motion works
- production build stays green

MAIN RITUAL ORB:
public/milano-seal-orb-v2.png

BOTTOM-RIGHT ASSISTANT ORB:
public/milano-seal-feather-m-orb.svg
or
public/milano-seal-feather-m-orb.png

REFERENCE ONLY:
public/ORB_RITUAL_LOCK.png

NEVER IMPORT:
ORB_RITUAL_LOCK.png

RITUAL REQUIREMENTS:
- world map background preserved
- gold route energy preserved
- black/gold premium look
- no checkerboard
- no square logo background
- no broken SVG tags
- no empty disc
- no static broken overlay
- no forced dark disc if transparent design is intended

ASSISTANT ORB:
- fixed bottom-right
- feather-M crest
- soft gold breathing glow
- hover lift
- click opens assistant panel
- UI-only until AI is explicitly added
- no client data access
- no Supabase access
- no live AI call

ASSISTANT PANEL:
Title:
The Seal Assistant

Greeting:
How can I help route this document?

Actions:
Start Intake → /intake
Review Country Pathway → /map
Check Apostille Requirement → /intake
Track Matter → /portal
Contact Operator → /intake

RULE:
The orb is a premium assistant dock, not a chatbot mascot.

============================================================
COPY BLOCK 14 — SECURITY CONTROL SOP
============================================================

ACCESS ROLES:
founder_admin
operator
va
client
public

ROLE STORAGE:
auth.users.raw_app_meta_data.role

ROUTING:
founder_admin → /dashboard
operator → /dashboard
client → /portal
va → /va/portal

DO NOT TRUST:
- client-provided role
- client-provided matter_id without ownership check
- raw request body role
- unauthenticated portal access

SECURITY MODULES:
access-control
client-projection
payment-security
release-integrity
app-guards
security-events
ai-safety

SECURITY EVENTS:
UNAUTHORIZED_PORTAL_ACCESS_ATTEMPT
ADMIN_ACTION_DENIED
VA_ACTION_DENIED
CLIENT_FIELD_PROJECTION_BLOCKED
PAYMENT_CONFIRMATION_REJECTED
FINAL_RELEASE_BLOCKED
IDENTIFIER_MISMATCH_BLOCKED
RAW_PAYLOAD_EXPOSURE_PREVENTED
INVALID_DESTINATION_PARAM_IGNORED
AI_IDENTIFIER_CHANGE_BLOCKED

SEVERITY:
info
warning
high
critical

RULE:
Security logs must never store secrets or raw private payloads in exposed client surfaces.

============================================================
COPY BLOCK 15 — LEGACY CLIENT CREDIT SOP
============================================================

PURPOSE:
Client-safe courtesy credit for the first Italian client relationship.

CREDIT NAME:
First Client Legacy Courtesy Credit

CLIENT-SAFE COPY:
You have a 50% courtesy credit available toward your next eligible Milano Seal service fee as one of our first legacy clients.

DISCLAIMER:
Third-party, platform, courier, state, government, and filing fees remain separate.

CTA:
Start Next Matter

CTA HREF:
/intake?legacy_client=true&destination=italy

CREDIT APPLIES TO:
Milano Seal service fee only.

CREDIT DOES NOT APPLY TO:
- third-party platform fees
- courier fees
- state fees
- government fees
- filing fees
- apostille authority fees
- external notary platform charges

PORTAL MAY SHOW:
- credit name
- discount percent
- applies_to
- status
- client_safe_note

PORTAL MUST NEVER SHOW:
- internal_reason
- operator_note
- discount_reason
- AI error
- clerical error detail
- blame language

FOUNDER DASHBOARD MAY SHOW:
- internal reason
- creation history
- use status
- source matter
- created_by

RULE:
Client sees gratitude. Founder sees context. System protects margin.

============================================================
COPY BLOCK 16 — SEO / GO-TO-MARKET SOP
============================================================

PRIMARY COMMERCIAL LANES:
- Signature Lane
- Priority Lane
- Executive Lane
- Apostille add-on
- Rush add-on
- Extra signer add-on
- platform-fee-only domestic RON
- attorney / family office workflow
- Italy dual-citizenship document pathway
- real estate POA workflow
- corporate authorization workflow
- immigration support documents
- academic/vital record pathway

PRIORITY PAGES:
1. Italy Apostille & Document Execution
2. Florida International Notary
3. Secure Document Execution
4. Apostille Preparation
5. Remote Online Notarization Review
6. Power of Attorney for International Use
7. Affidavit for International Use
8. Vital Records Apostille
9. Corporate Authorization Apostille
10. Attorney / Family Office Document Execution

SEO RULES:
- no legal advice
- no guaranteed acceptance
- no fake government affiliation
- no overpromising speed
- no unverified Hague claims
- clear client-safe education
- strong intake CTA
- internal links to Atlas and Intake

SALES LAUNCH:
- send legacy client message
- publish Italy page
- publish pricing page
- outreach to attorneys
- outreach to immigration professionals
- outreach to real estate contacts
- outreach to family office / executive client lanes

============================================================
COPY BLOCK 17 — FINAL PRODUCTION BUILD PLAN
============================================================

PHASE 1 — PRODUCTION VERIFICATION
- confirm Vercel deployment green
- confirm themilanoseal.com loads
- confirm login works
- confirm founder_admin routes to dashboard
- confirm client routes to portal
- confirm db-health passes
- rotate exposed password

PHASE 2 — RITUAL / VISUAL QA
- ritual lock loads
- orb visible
- no checkerboard
- no empty center
- no broken JSX
- assistant orb asset loads
- mobile no overflow
- reduced motion works

PHASE 3 — CLIENT FLOW TEST
- submit intake
- create matter
- assign lane
- generate invoice
- confirm payment
- unlock scheduling
- portal reflects payment
- vault displays safely
- custody timeline works
- verify shell works

PHASE 4 — RELEASE SAFETY TEST
- create Italy test matter
- add codice fiscale full value
- test missing two characters
- release blocked
- event logged
- correct value
- exact-match passes
- final seal review passes
- founder approval required
- release approved

PHASE 5 — LEGACY CLIENT
- credit row exists
- portal banner visible
- internal reason hidden
- Start Next Matter opens /intake?legacy_client=true&destination=italy
- founder sends message personally

PHASE 6 — SEO + SALES
- publish Italy page
- publish Florida international notary page
- publish pricing page
- publish apostille preparation page
- start attorney/immigration/real estate outreach
- push $750 / $975 / $1,850 lanes

============================================================
VALIDATION
============================================================

After any production change:

pnpm build
pnpm lint || true
git diff --check

Contamination scan:
rg -n "Liaison OS|D&D|PIP|provider recovery|carrier posture|Body Shop|claimant|benefits exhausted|paid correctly" app components lib docs/system

Allowed:
- docs/system/MILANO_SEAL_OS_CANONICAL_INTEL.md only for separation documentation
- founder-only notes clearly marked not for production UI

Not allowed:
- public Milano Seal routes
- portal
- intake
- Atlas public copy
- dashboard
- any client-facing page

============================================================
FINAL LOCK
============================================================

THE MILANO SEAL = DOCUMENT EXECUTION INFRASTRUCTURE.

NO LIAISON OS.
NO PIP.
NO PROVIDER RECOVERY.

SHIP CLEAN.
