# Milano Seal™ — Standalone HTML Prototype Prompt

**Use:** Paste into Claude to generate a one-file interactive HTML mockup.  
**Do NOT:** Deploy to production, merge into repo, or replace any live route.

---

## Usage Instructions

1. Copy everything inside the `---PROMPT START---` block below
2. Paste into a fresh Claude conversation
3. Add: `Generate the complete standalone HTML file.`
4. Download the output and open locally in your browser
5. Review design → extract only approved UX ideas into the real Next.js app

**Use for:**
- Investor demo
- Client portal concept preview
- Dashboard flow visualization
- Progress Passport concept
- VA portal concept
- Pricing/intake simulation
- Internal product planning

**Do NOT use for:**
- Live production code
- Replacing themilanoseal.com
- Replacing /dashboard, /portal, /va/portal
- Replacing Supabase auth
- Replacing Wise/payment logic
- Replacing current intake

---

## Production Priority (unchanged)

```
1. Vercel build green
2. /api/admin/db-health JSON
3. Intake live test
4. Portal invoice test
5. Launch lock
```

---

---PROMPT START---

CREATE A SINGLE-FILE STANDALONE INTERACTIVE HTML PROTOTYPE FOR:

PROJECT NAME:
The Milano Seal™

PRIMARY DOMAIN:
themilanoseal.com

PRIMARY ROUTES TO REPRESENT:

1. themilanoseal.com
2. themilanoseal.com/intake
3. themilanoseal.com/dashboard
4. themilanoseal.com/portal
5. themilanoseal.com/va/portal
6. themilanoseal.com/review
7. themilanoseal.com/map
8. themilanoseal.com/verify

PROJECT PURPOSE:
The Milano Seal™ is a premium global document execution and international logistics platform for high-trust document matters involving notarization, Remote Online Notarization, apostille coordination, legalization routing, courier visibility, payment-gated scheduling, client portal tracking, operator workflow control, and final release.

BRAND:
The Milano Seal™
Tagline: Sealing Trust with Every Signature™

BRAND FEEL:
Embassy-grade.
Private banking precision.
Dark luxury.
Gold execution rails.
Global document intelligence.
Calm, premium, controlled, and operationally exact.

PRIMARY USERS:

1. Public visitor / prospective client
2. Client with an active matter
3. Founder / admin operator
4. Virtual assistant / VA operator
5. Execution coordinator
6. Apostille / courier coordinator

CORE PRODUCT EXPERIENCE:
Build the prototype so it feels like a real usable production platform, not a checklist or simple wireframe.

The full journey must be represented:

visitor → smart intake → quote estimate → lane selection → payment simulation → matter created → client portal → operator dashboard → VA portal → document status tracking → audit ledger → review capture → final release

TECHNICAL REQUIREMENTS:

* Must be one standalone .html file.
* Use only HTML, CSS, and vanilla JavaScript.
* No React. No Vue. No Vite. No build tools. No external dependencies. No CDN dependencies.
* Must open directly in a browser.
* Must work on desktop and mobile.
* Must include visible static UI immediately, even if JavaScript is blocked.
* JavaScript should enhance the UI into a fully interactive prototype.
* Store mock data in local JavaScript state.
* Include realistic sample data.
* Include buttons that update UI state.
* Include simulated matter creation.
* Include simulated status changes.
* Include simulated audit/activity logs.
* Include export buttons where useful.
* Use clean modern CSS with cards, dashboards, tables, tabs, forms, badges, timelines, maps, portals, and responsive layout.

DESIGN SYSTEM:

* Background: #0A0A0A
* Gold: #C6A55A
* Soft gold: #E4C879
* Charcoal panels
* Thin gold borders
* Glassmorphism where appropriate
* Premium serif headings
* Clean sans-serif body text
* World map / global route visual motif using CSS/SVG only
* Gold animated route rails
* Status badges
* Timeline checkpoints
* Operator-grade dashboard cards

Do not use cartoon styling.
Do not use generic SaaS blue.
Do not make it look like a startup template.
It should feel like a legal-tech command center for international document execution.

PUBLIC WEBSITE / FRONT DOOR:
Include these public sections:

1. Hero
   * The Milano Seal™
   * Sealing Trust with Every Signature™
   * Global Document Execution Infrastructure
   * CTA: Start Secure Intake
   * CTA: View Global Document Intelligence

2. What The Milano Seal Does
   * Remote Online Notarization
   * Florida notarial execution
   * Apostille coordination
   * Embassy / consular legalization routing
   * Courier release visibility
   * Client portal tracking
   * Payment-gated scheduling

3. How It Works
   * Submit matter → Review pathway → Receive quote → Confirm payment → Schedule execution → Complete notarization → Apostille / legalization if required → Courier / release → Final completion

4. Pricing Lanes
   * Signature Lane: $750
   * Priority Lane: $975
   * Executive Lane: $1,850
   * Apostille add-on: +$250
   * Rush add-on: +$400
   * Extra signer: +$150
   * Domestic simple RON platform-fee-only example: $25 platform/state fee, service fee waived

5. Global Document Intelligence
   * Highlight Italy, Greece, Spain, Portugal, UAE, France, Germany, Brazil, Mexico, UK, Canada
   * Show mock country cards
   * Show Hague / non-Hague routing status as placeholder intelligence

6. FAQ
   * What is apostille?
   * When do I need legalization?
   * Can I notarize remotely?
   * What does payment-gated scheduling mean?
   * How do I track my documents?

7. Review CTA
   * Use only placeholder review request copy
   * Do not include fake reviews
   * Do not include fake star ratings
   * Do not include AggregateRating schema

SMART INTAKE / QUOTE FLOW:

Fields:
* Client name, Email, Phone
* Document type, Document origin jurisdiction, Signer location, Destination country
* Number of signers, Number of documents
* Apostille required yes/no/not sure
* Urgency, Translation needed yes/no/not sure
* Preferred execution method, Notes

Dynamic estimate logic:
* Signature: $750 / Priority: $975 / Executive: $1,850
* Apostille add-on: +$250
* Rush add-on: +$400
* Extra signer: +$150
* Platform-fee-only domestic RON: $25

On submit:
* Create mock matter record with ID like MS-2026-0001
* Add audit events: SMART_REQUEST_PARSED, MATTER_CREATED
* Route to confirmation screen
* Add matter to client portal, admin dashboard, VA portal queue

MATTER STATE MACHINE:
intake_received → under_review → quoted → awaiting_payment → scheduled → in_execution → apostille_processing → in_transit → delivered → completed

EVENTS:
SMART_REQUEST_PARSED, STRUCTURED_INTAKE_CREATED, MATTER_CREATED, COMPLIANCE_VERIFIED, LANE_ASSIGNED, INVOICE_CREATED, PAYMENT_LINK_CREATED, PAYMENT_CONFIRMED, SCHEDULING_UNLOCKED, EXECUTION_SCHEDULED, RON_COMPLETED, APOSTILLE_SUBMITTED, APOSTILLE_COMPLETED, COURIER_RELEASED, DELIVERY_CONFIRMED, PAID_AND_RELEASED, REVIEW_REQUESTED

PAYMENT / INVOICE FLOW:
* Full matter: show Wise payment card
* Platform_fee_only: suppress Wise, show External Platform Payment card
* Payment confirmed: unlock scheduling
* Payment not confirmed: scheduling locked

CLIENT PORTAL:
* Matter overview, status timeline, invoice, payment status, scheduling status
* Document Vault (upload/download simulation)
* Progress Passport
* Courier tracking panel
* Review request after completion only

Client portal must NEVER show: internal notes, operator notes, discount notes, margin, shipping cost, raw webhook data, system data, internal audit payloads.

Client portal copy: Secure Matter Portal, Pre-Flight Review, Payment-Gated Execution, Scheduling Unlocked, Execution Progress, Document Vault, International Release, Paid & Released, Final Completion.

OPERATOR DASHBOARD:
* KPI cards, active matters, matter detail drawer, pipeline by state
* Payment ledger, audit ledger, chain of custody
* High-value lead alerts, founder pricing controls, review capture status, courier release status

Admin actions: Change status, assign lane, confirm payment, unlock scheduling, mark RON complete, mark apostille submitted/completed, release courier, mark delivered, request review, mark completed.

FOUNDER PRICING CONTROL:
* Courtesy discount, relationship pricing, founder exception, platform fee only, service fee waived, lock pricing override
* Only founder_admin can apply. VA and client cannot edit. Internal note hidden from client.

VA PORTAL:
* Assigned task queue, intake review queue, missing info flags, document checklist, client follow-up tasks

VA allowed: Mark document received, flag missing info, add follow-up reminder, mark preflight complete, send to founder review.
VA blocked: Payment confirmation, pricing override, final release, courier release, deleting matters, editing payment data.

BUILD / OPERATIONS CENTER:
* Production readiness checklist with status: Not Started / In Progress / Complete / Blocked
* Sections: Vercel build, Supabase DB health, Intake write, Dashboard matter receive, Portal invoice, Platform-fee-only invoice safety, Founder admin role, Audit ledger, Concierge alerts, Execution queue, Progress Passport, Review capture, First matter test, Launch lock

AUDIT / MONITORING:
Activity ledger table: Time, Matter ID, Event, Actor, Module, Status, Reference.
Every interactive action appends a mock audit log entry.

PROGRESS PASSPORT:
* Florida origin, destination country, current stage, planned route, actual tracking placeholder
* Do not fake live tracking. Label planned movement as "planned route."
* Show actual courier status only after courier release is clicked.

SEAL OF AUTHENTICITY:
* User enters matter ID → returns verified/not found
* Safe output only: verified status, matter type, destination country, completed date, seal status, privacy notice
* Never show: client email, uploaded documents, payment data, internal notes

REPORTS:
* Total matters, paid matters, unpaid pipeline, international lane revenue, domestic platform-fee-only count, review requests, completion rate, average matter stage
* Mock export CSV button

SETTINGS:
* Env var checklist, Supabase status, Wise status, GBP review link status, domain status, role matrix

REQUIRED MOCK DATA:
1. Italy apostille matter
2. Greece POA matter
3. Domestic RON platform-fee-only matter
4. Executive lane UAE matter
5. Completed matter ready for review

BUSINESS RULES:
* Payment confirmed gates scheduling and final release
* Platform-fee-only suppresses Wise invoice
* Founder pricing notes never show to clients
* VA cannot confirm payment or release documents
* Client only sees own matter
* Public verify page shows safe data only
* Review request only appears after completion
* No fake reviews. No fake star ratings.
* No legal advice claims. No guaranteed outcomes.
* No attorney-client relationship language.

COPY STYLE — USE:
Secure Matter Portal, Global Document Intelligence, Chain-of-Custody Visibility, Payment-Gated Scheduling, Founder Courtesy Pricing, International Release, Progress Passport, Seal of Authenticity, Operator Ledger, Execution Center

COPY STYLE — AVOID:
Generic SaaS wording, cartoon UI language, overhype, fake guarantees, legal advice, referral/kickback language, PIP/D&D provider logic

OUTPUT REQUIREMENT:
Return the complete HTML code only. Do not explain it. Do not use markdown. Do not omit CSS. Do not omit JavaScript. Final answer must be one complete working .html file.

---PROMPT END---
