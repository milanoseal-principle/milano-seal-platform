# Milano Seal OS Canonical Intelligence
Status: Canonical internal source
Scope: The Milano Seal™ only
Exclusion: Not Liaison OS, not D&D PIP Intelligence, not provider recovery reporting

============================================================
LOCKED SEPARATION RULE
============================================================

Milano Seal is separate from Liaison OS.

Milano Seal is:
Global Document Execution Infrastructure.

Milano Seal is not:
- Liaison OS
- D&D PIP Intelligence
- provider recovery reporting
- carrier posture reporting
- law firm liaison workflow
- SigningOS clone

No PIP/provider/carrier language may appear in Milano Seal production routes unless explicitly scoped to a separate founder-only experimental module.

============================================================
LOCKED BRAND RULE
============================================================

Brand:
The Milano Seal™

Legal:
Milano Seal International LLC dba The Milano Seal

Tagline:
Sealing Trust with Every Signature.

Visual standard:
- black shell
- gold accents
- premium international trust
- cinematic but controlled
- concierge-level execution
- secure document infrastructure

Avoid:
- cheap notary clipart
- generic stamp graphics
- checkerboard logo backgrounds
- fake legal advice
- chaotic SaaS UI
- provider recovery language

============================================================
LOCKED CORE PRODUCT RULE
============================================================

The Milano Seal coordinates:
- notarization
- RON/mobile notary support
- apostille preparation
- international document routing
- payment-gated scheduling
- chain-of-custody visibility
- document vault
- client portal
- operator dashboard
- final release controls

Primary routes:
/
/intake
/map
/portal
/dashboard

Portal subroutes:
/portal/tracking
/portal/invoice
/portal/documents

============================================================
LOCKED MATTER MODEL
============================================================

Matter states:
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

Event ledger:
SMART_REQUEST_PARSED
STRUCTURED_INTAKE_CREATED
MATTER_CREATED
COMPLIANCE_VERIFIED
LANE_ASSIGNED
INVOICE_CREATED
INVOICE_SENT
PAYMENT_LINK_CREATED
PAYMENT_CONFIRMED
SCHEDULING_UNLOCKED
EXECUTION_SCHEDULED
RON_COMPLETED
APOSTILLE_SUBMITTED
APOSTILLE_COMPLETED
COURIER_RELEASED
DELIVERY_CONFIRMED
PAID_AND_RELEASED

Do not create alternate state names.

============================================================
LOCKED PAYMENT RULE
============================================================

Payment provider:
Wise Business payment links / references.

Stripe is not part of the locked payment flow unless explicitly re-added later.

Matter payment reference:
MS-YYYY-####

Payment confirmation unlocks:
- scheduling
- execution
- release where payment-gated release applies

Pricing:
Signature Lane = $750
Priority Lane = $975
Executive Lane = $1,850

Add-ons:
Apostille = +$250
Rush = +$400
Extra signer = +$150

============================================================
LOCKED SAFETY RULE
============================================================

Every matter must preserve exact critical fields.

Critical fields:
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
- addresses
- dates
- destination-country identifiers

Rules:
- no silent deletion
- no identifier shortening
- no character normalization that changes meaning
- no final release if identifier length changes
- no final release if foreign-use field is missing
- no AI output allowed to alter identifiers
- client/founder confirmation required before final release

Italian hard rule:
If destination_country = Italy and codice fiscale exists, Codice Fiscale Lock is required before apostille/international release.

============================================================
LOCKED EXECUTION QA RULE
============================================================

No packet leaves operator control until Execution QA passes.

Execution QA checks:
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

============================================================
LOCKED PORTAL RULE
============================================================

Client portal must show:
- matter status
- pre-flight checks
- invoice panel with Wise reference when applicable
- document vault
- tracking timeline
- final paid-and-released state
- client-safe next action

Client portal must never show:
- internal_notes
- operator_notes
- raw_webhook
- raw_payload
- margin
- net_margin
- discount_reason
- internal_reason
- label_url
- shipping_cost
- service role data
- operatorSummary

============================================================
LOCKED DASHBOARD RULE
============================================================

Operator dashboard must show:
- KPI cards
- pipeline
- payment ledger
- chain-of-custody log
- operational ledger
- matter state tracking
- intake review queue
- payment status
- scheduling unlock status
- shipping / delivery status
- Execution QA
- Final Seal Review
- Payment Integrity
- Identifier Lock status

Operational Ledger columns:
Time
Matter
Event
Actor
Status

============================================================
LOCKED ATLAS RULE
============================================================

Atlas route:
/map

Atlas purpose:
- global document intelligence
- jurisdiction/destination pathway
- Hague/non-Hague review
- apostille/legalization pathway
- country click to intake

Atlas must not provide legal advice.
Atlas must not overpromise acceptance.
Atlas must not expose operatorSummary or revenue scoring publicly.

Priority countries:
Italy
Spain
France
Germany
Portugal
Greece

Fallback:
Other / Not sure

============================================================
LOCKED RITUAL RULE
============================================================

Current ritual lock cinematics may stay because the cinematic system has been corrected.

Do not remove RitualEntryLock by default.

Only remove or bypass RitualEntryLock if:
- it breaks login
- it blocks conversion
- it causes bad asset display
- it harms performance
- it shows checkerboard/incorrect logo
- founder explicitly orders removal

Current accepted ritual requirements:
- no checkerboard
- no static broken logo
- no white/gray square
- main ritual orb uses public/milano-seal-orb-v2.png
- bottom-right assistant orb uses public/milano-seal-feather-m-orb.png
- ORB_RITUAL_LOCK.png is reference only, never imported

============================================================
LOCKED CASE STUDY LESSONS
============================================================

First Italian client:
- client paid $750
- international use case validated
- Wise became stronger payment path
- final apostille detail failure occurred because codice fiscale lost two digits
- system now requires exact-field preservation and final release gate

System outcome:
- Identifier Exact-Match Gate
- Codice Fiscale Lock
- Payment Integrity Gate
- Final Seal Review
- Execution QA Matrix
- Legacy Client Courtesy Credit

Do not expose internal case-study failure language to clients.

Client-facing legacy language:
First Client Legacy Courtesy Credit
50% off next eligible Milano Seal service fee
Third-party, platform, courier, state, government, and filing fees excluded

============================================================
LOCKED AUTH RULE
============================================================

Auth uses role-based routing.

Required role:
founder_admin

Role storage:
auth.users.raw_app_meta_data.role

Allowed routing:
founder_admin → /dashboard
operator → /dashboard
client → /portal
va → /va/portal

Do not rely on client-provided role.

============================================================
LOCKED DEPLOYMENT RULE
============================================================

Production must be Next.js / Vercel safe.

Known historical fixes:
- proxy.ts must export function named proxy in Next.js 16
- avoid duplicate export const dynamic
- avoid route conflicts
- avoid broken JSX tags
- do not commit node_modules
- do not commit .next
- do not commit package-lock.json if pnpm is source of truth

============================================================
VALIDATION
============================================================

After any production change, run:

pnpm build
pnpm lint || true
git diff --check

Contamination check:

rg -n "Liaison OS|D&D|PIP|provider recovery|carrier posture" app components lib docs/system

Allowed:
- docs/system/MILANO_SEAL_OS_CANONICAL_INTEL.md only if documenting separation
- founder-only notes if clearly marked not for production UI

Not allowed:
- public Milano Seal routes
- portal
- intake
- Atlas public copy
- dashboard unless explicitly separate experimental module
