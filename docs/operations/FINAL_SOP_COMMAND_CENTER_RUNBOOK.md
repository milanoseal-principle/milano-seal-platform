# THE MILANO SEAL™ — FINAL SOP + COMMAND CENTER RUNBOOK

**Status:** REFERENCE LOCKED  
**Execution State:** NOT LIVE CODE  
**Workbook State:** NOT GENERATED  
**Alliance Routing State:** NOT ACTIVE  
**Tool Belt State:** NOT ACTIVE  
**Implementation Gate:** P1/P2 ONLY AFTER P0 REMOTE CLEARANCE  
**Source Type:** Uploaded final SOP + deployment + Command Center runbook

---

## Control Rule

This document is retained as an operator-ready reference for Milano Seal operations, Command Center planning, alliance onboarding, Tool Belt monetization, compliance controls, and deployment governance.

It does not override:

- MS-RECON-MASTER-2026-V1
- MS-ENG-P0-FINAL-LOCK-2026-V1
- Remote P0 clearance docs
- Active repo reality
- P0 launch lock
- Existing security gates

No workbook, deployment package, alliance routing system, Tool Belt engine, or backend mutation may be generated from this reference without a separate implementation prompt, branch, review, and explicit P1/P2 authorization.

---

## Purpose

This reference combines:

- build SOP
- deployment system
- Command Center control logic
- alliance onboarding
- Tool Belt monetization system
- compliance controls
- backend mapping
- testing protocol
- operator-ready execution rules

---

## What This Document Fixes

- prevents premature output generation
- enforces a system-lock gate before exports
- separates Client, CTO, and CEO operating lenses
- connects Command Center logic to backend execution
- connects automation to alliance onboarding
- connects Tool Belt adoption to partner eligibility
- adds compliance gating before deal routing
- adds clone-and-deploy reference steps
- keeps secrets out of Excel/workbooks

---

## Phase-Lock SOP

**PHASE 1 — EXTRACTION:**  
Dump all logic, inputs, architecture, rules, and references. No formatting. No exports.

**PHASE 2 — STRUCTURE:**  
Organize into modules: API, fields, state machine, event engine, failure handling, automation, Command Center, Tool Belt, compliance, deployment.

**PHASE 3 — EXPANSION:**  
Fully expand all contracts, matrices, rules, branching flows, tables, and edge cases. No summaries.

**PHASE 4 — VALIDATION:**  
Audit for missing logic, broken connections, duplicate sections, undefined behavior, or missing deployment steps.

**PHASE 5 — SYSTEM LOCK:**  
Explicit approval required: `SYSTEM LOCKED — PROCEED TO OUTPUT.`

**PHASE 6 — OUTPUT:**  
Only now generate DOCX, XLSX, code bundles, or deployment packages.

---

## Anti-Frustration Rules

- Never request a final document before expansion is complete.
- Never treat endpoint lists as full API contracts.
- Never treat conceptual states as a complete state machine.
- Never mix CEO, CTO, and Client outputs in the same build pass.
- Never store secrets directly inside Excel.
- Store links, key names, locations, and setup actions only.
- Never route alliance members deals until Tool Belt completion and compliance readiness are satisfied.

---

## Three-Role Operating Model

**CLIENT ENGINE:**  
Controls intake clarity, trust, conversion, status visibility, and partner experience.

**CTO ENGINE:**  
Controls backend logic, data, API contracts, automation, validation, integrations, sync rules, and deployment.

**CEO ENGINE:**  
Controls pricing posture, partner economics, alliance incentives, growth leverage, and white-label scale.

---

## Core System Flow

```
Client
→ Intake
→ Validation
→ Trust Engine
→ Pricing
→ Compliance
→ Pro Forma / Quote
→ Payment
→ Scheduling
→ Execution
→ Apostille
→ Delivery
→ Completion
→ Review
```

---

## Backend Deployment Reference

Repository bootstrap:

1. `git clone <repo>`
2. `cd milano-seal-backend`
3. `npm install`
4. `cp .env.example .env`
5. populate required variables
6. `npm start`
7. verify `GET /health` returns success

Hosting reference:

| Layer | Platform |
|---|---|
| Backend | Render or equivalent Node host |
| Frontend | Vercel |
| Database | Supabase |
| Messaging | Twilio WhatsApp |
| Optional CRM mirror | Airtable |

**Important:** This deployment reference is historical/architecture reference only. Active production reality uses Vercel/Next.js routes. If this conflicts with the current repo, the current repo and MS-RECON-MASTER-2026-V1 win.

---

## Required Environment Variables Reference

```
PORT
NODE_ENV
CORS_ORIGIN
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_WHATSAPP_NUMBER
AIRTABLE_API_KEY        # optional
AIRTABLE_BASE_ID        # optional
```

Do not store live secret values in this document.

---

## Command Center Role

Excel is the human control layer.  
Backend is the execution layer.  
Supabase is the source of truth.

The workbook must preserve all original tabs and data while adding mapped operational columns, formulas, alliance onboarding, Strategic access, Tool Belt monetization, and compliance gates.

---

## Command Center Tabs

| Tab | Purpose |
|---|---|
| `COMMAND_CENTER` | Live operating grid for matter movement, system status, payment status, priorities, and operator control |
| `KPI_DASHBOARD` | Summary visibility across matters, revenue, and process health |
| `CLIENT_REGISTRY` | Client-facing registry and record index |
| `DEAL_FINANCIALS` | Payment, values, lane economics, and revenue tracking |
| `PRICING_ENGINE` | Operational pricing reference aligned to backend logic |
| `DEAL_LOGIC` | Lifecycle rules, business logic, and deal interpretation |
| `APOSTILLE_TRACKER` | Execution and apostille tracking |
| `INBOUND_SCRIPTS / EMAIL_TEMPLATES` | Reusable conversion and follow-up copy |
| `REFERRAL_ENGINE` | Referral partner and revenue route visibility |
| `OPS_RUNBOOK` | Daily execution instructions |
| `LEGAL_STRUCTURE` | Entity, banking, compliance, and legal-ops reference |
| `SEO_SOCIAL / WEBSITE_ALIGNMENT / REVIEW_FLOW / ASSETS_LINKS` | Brand, audience, and growth surfaces |
| `System_Map` | Excel-to-backend field mapping |
| `Automation_Map` | Event-trigger-action mapping |
| `State_Machine` | Allowed transitions and conditions |
| `Revenue` | Formula layer for financial scenarios |
| `Strategic` | Single-sheet infrastructure and system access registry |
| `Alliance_Onboarding` | Partner lifecycle and qualification control |
| `Alliance_Toolbelt` | Partner stack adoption and referral monetization engine |
| `Alliance_Compliance` | Partner behavior, compliance rules, and response logic |

---

## Strategic Tab Specification

The Strategic tab is the operator's one-stop control reference for:

- links
- dashboards
- key names
- setup actions
- owners
- security rules

It must not contain live secrets.

Track per item:

- Supabase project URL, table names, setup notes, and service-role-key location policy
- Twilio dashboard, WhatsApp sender setup link, and auth-token location policy
- Render and Vercel deployment dashboards
- Stripe, Calendly, BlueNotary, Wise, Adobe, and translation partner links
- owner / setup action / status / security rule

---

## Alliance Onboarding Specification

`Alliance_Onboarding` is the partner lifecycle controller.

**Core identity:**
- Partner Name, Email, Phone, State

**Operational status:**
- `ONBOARDING_STATUS`, `REFERRAL_STATUS`, `LAST_CONTACT`, `NOTES`

**Stack activation:**
- `SUPABASE_ACCESS`, `TWILIO_SETUP`, `RON_PLATFORM`, `STRIPE_ACCOUNT`

**Compliance layer:**
- `ACCOUNT_STATE`, `LAST_WARNING_AT`, `ACTIONS_TODAY`, `SESSIONS_TODAY`
- `WARM_TOUCH_COUNT`, `DM_ALLOWED`, `RAMP_LEVEL`, `COMPLIANCE_READY`

**Qualification layer:**
- `TOOLBELT_COMPLETION_PERCENT`, `ACTIVE_TOOLS_COUNT`, `STACK_LEVEL`
- `ELIGIBLE_FOR_DEALS`, `CUSTOM_MILANO_LINK`, `PARTNER_PORTAL_STATUS`

---

## Alliance Tool Belt Specification

`Alliance_Toolbelt` is the monetization and enablement engine for notary alliance members.

**Core execution tools:** BlueNotary · Wise Business · Adobe Acrobat  
**Core infrastructure tools:** Supabase · Twilio  
**Growth / ops tools:** Google Workspace · Canva Pro · Calendly · Zapier / Make  
**Internal owned system:** Milano Command Center

**Columns:**

| Column | Description |
|---|---|
| `TOOL_NAME` | Tool identifier |
| `CATEGORY` | Execution / Infrastructure / Growth |
| `REQUIRED` | YES / NO |
| `WHY_IT_MATTERS` | Operational rationale |
| `MILANO_REFERRAL_LINK` | Tracked referral URL |
| `PARTNER_SIGNUP_STATUS` | Current adoption state |
| `OWNER` | Responsible operator |
| `REVENUE_TYPE` | Referral / Direct / Commission |
| `EST_MONTHLY_VALUE` | Revenue estimate |
| `STACK_LEVEL` | Core / Advanced |
| `COMPLIANCE_GATE` | Gate requirement |
| `NOTES` | Free text |

---

## Tool Belt Qualification Logic

The Tool Belt is a parallel system module. It must never modify core deal logic.

It only controls: partner qualification · tool adoption · revenue routing · readiness for routed matters.

**Rules:**

- Below threshold completion → partner is NOT eligible for deal routing
- At 80%+ completion AND `COMPLIANCE_READY = YES` → partner becomes eligible for deals
- `STACK_LEVEL` is derived from completion percent
- Core required tools must be complete before advanced automation tools are recommended

---

## Compliance Layer

`ACCOUNT_STATE` values: `SAFE` · `CAUTION` · `COOL_DOWN` · `LOCKED`

**Rules:**

- no burst activity
- no repetitive messaging patterns
- no immediate cold DM
- `WARM_TOUCH_COUNT` must justify outreach
- on warnings, reduce activity and cool down before resuming
- no routed deals until partner is compliance-ready

---

## Command Center ↔ Backend Mapping

| Workbook Field | Backend Column |
|---|---|
| `SYSTEM_STATUS` | `deals.status` |
| `PAYMENT_STATUS` | `deals.payment_status` |
| `PRIORITY_LEVEL` | tier / pricing lane |
| `FOLLOW_UP_STAGE` | follow-up cron logic |
| Alliance_Onboarding qualification fields | routing eligibility decisions |

---

## Testing Protocol

**Test client flow:**

Create sample client deal and move through:
`INTAKE → VALIDATION → PRICING → PAID → EXECUTING → COMPLETED`

Verify Revenue formulas respond to lane and apostille inputs.

**Test alliance flow:**

Create sample alliance member and confirm:
- Tool Belt completion updates
- Stack level updates
- routing eligibility updates

**Test compliance states:** `SAFE → CAUTION → COOL_DOWN`

**Validate:**
- no tab deleted
- no original data removed
- no existing structure overwritten

---

## Operator Instruction For Future Builds

Use this exact instruction when expanding future system specs:

> "Use SYSTEM SPEC DOCUMENT MODE. No summaries. No overviews. No explanation-only docs. Expand every API, matrix, state machine, event chain, failure path, sync rule, and deployment step before output. Wait for SYSTEM LOCKED before generating files."

---

## Final Lock

Backend complete.  
Command Center upgraded.  
Strategic tab complete.  
Alliance Onboarding complete.  
Alliance Tool Belt complete.  
Compliance layer integrated.  
Deployment runbook corrected.  
System ready for final system-spec expansion and then frontend build.

**Important:** This final lock is preserved as source language from the uploaded SOP. It does not override current production truth or P0 remote clearance requirements.

---

## Source Preservation Note

The uploaded SOP remains the canonical source artifact. This markdown file is the repo-level operational reference wrapper.
