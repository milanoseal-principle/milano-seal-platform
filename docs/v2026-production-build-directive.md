# MILANO SEAL™ — v2026 FULL PLATFORM SYNCHRONIZATION
## FINAL CLAUDE CODE PRODUCTION BUILD DIRECTIVE

> Source standard: COMPILATION LOCK v2026 · Section 71 Platform/Network/SEO Authority Engine · 2026 Milano Seal Master Playbook · Locked operational SOP

---

## GATE: DO NOT START UNTIL

- [ ] PR #22 (`claude/hero-widescreen-layout`) merged into main
- [ ] `git pull origin main` confirmed fresh
- [ ] `pnpm build` passes on main before any edits

---

## BRANCH

```bash
git checkout main
git pull origin main
pnpm build
git checkout -b claude/repository-engine-sync-v2026
```

---

## SECURITY LOCK

- Do not touch `.env` files
- Do not print secrets
- Do not expose tokens
- Do not add binary files
- Do not import uploaded ZIPs wholesale
- Do not add new dependencies unless absolutely required
- Do not change backend/API contracts unless needed for existing state alignment
- Do not invent fake telemetry, fake metrics, fake operators, fake tracking, fake courier statuses, or fake payment states

---

## PRE-FLIGHT SECURITY CHECK

```bash
find . -name ".env*" -not -path "./node_modules/*" -not -path "./.next/*" -print

grep -RIn --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git \
  "eval(\|Function(\|atob(\|Buffer.from\|base64\|fromCharCode\|obfuscate\|sk_live\|sk_test\|SUPABASE_SERVICE_ROLE_KEY\|WISE_API_KEY\|WISE_WEBHOOK_SECRET\|TWILIO_AUTH_TOKEN\|RESEND_API_KEY\|ANTHROPIC_API_KEY\|eyJ" . || true
```

---

## SOURCE STANDARD

The Milano Seal is a luxury international document execution and apostille coordination platform.

It is NOT:
- a generic notary site
- a generic SaaS dashboard
- cyberpunk
- crypto
- fake mission control

It MUST feel:
- luxury · calm · structured · international · procedural
- high-trust · founder-led · system-backed
- black / gold / parchment
- cinematic but restrained
- state-driven, not random

---

## CORE SYSTEM FLOW (IMMUTABLE)

```
Client → Intake → Validation → Trust Engine → Pricing → Compliance →
Invoice → Payment → Scheduling → Execution → Apostille → Delivery →
Completion → Review
```

---

## GLOBAL TERMINOLOGY SUPERSEDE

Replace prior labels where visible in UI:

| Legacy (PR #21) | Superseded (v2026) |
|---|---|
| `Operational Ledger` | `Sovereign Execution Core` |
| `Matter Control Portal` | `Secure Vault Portal` |

Preserve internal logic names if renaming would break code. Visible UI copy uses new language only.

---

## FORBIDDEN COPY

Do NOT use:
- Compliance Map
- Mission Control
- System Terminal
- Client Portal / Secure Client Portal
- Upload Documents
- Live courier tracking / live courier telemetry
- Government approved
- Guaranteed acceptance
- Embassy verified
- Fake telemetry / fake metrics / fake operator counts

DO use:
- Global Document Intelligence™
- Sovereign Execution Core
- Secure Vault Portal
- Controlled Records Upload
- Execution Path Preview
- Payment-Gated Execution
- Chain-of-Custody Visibility
- Structured International Release
- Begin Secure Intake
- Secure Vault Access
- Alliance Network Access
- Operator Workspace

---

## PHASE RULE

**First produce an audit plan. Do not write code until the implementation plan is complete. Then implement in controlled commits.**

---

## PHASE 1 — AUDIT PLAN FIRST

Before editing, inspect:

```
app/page.tsx · app/layout.tsx · app/globals.css
components/landing/*
components/dashboard/*
components/portal/*
components/intake/*
components/alliance/* (if present)
app/login/* · app/portal/* · app/dashboard/* · app/alliance/* · app/intake/* · app/map/*
lib/*
```

Report:
1. current homepage section order
2. existing ritual status
3. existing Global Trust Core status
4. existing Global Document Intelligence map status
5. existing dashboard structure
6. existing portal structure
7. existing login/access structure
8. existing alliance structure
9. existing virtual assistant/smart intake structure
10. missing files/components
11. duplicate/conflicting terminology
12. forbidden copy locations
13. exact implementation plan

**Then proceed.**

---

## PHASE 2 — PUBLIC WEBPAGE / HOMEPAGE

**Route:** `/`

**Goal:** Unified progressive cinematic vertical journey. No side-by-side collision above the fold. No SaaS block stacking. No gray seams.

**11-Stage Narrative Sequence:**

1. **Hero / Global Trust Core**
   - centered vertical axis
   - title: `Sealing Trust Across Borders`
   - support: `Secure International Document Execution & Authentication Infrastructure`
   - primary CTA: `Begin Secure Intake` → `/intake`
   - secondary CTA: `Explore Global Document Intelligence` → `/map`
   - 3D Global Trust Core globe centered on same vertical axis
   - no founder card dominant in hero

2. **Trust Ticker / Credential Rail**
   - premium institutional gold credential rail
   - slow, linear, calm
   - no erratic marquee

3. **Milano Trust Core**
   - central M crest
   - 6 platform principle nodes
   - viewport-triggered expansion
   - no cyberpunk particles

4. **Comprehensive Document Execution**
   - Remote Online Notarization
   - Apostille Integration
   - International Execution
   - Mobile Dispatch

5. **How It Works + Global Document Intelligence**
   - left: state process steps
   - right: unclipped map preview
   - Florida → Italy / Spain / Brazil / UAE route logic
   - use `Execution Path Preview`

6. **Document Type Library**
   - Power of Attorney
   - Name Discrepancy Affidavit
   - FBI Background Check
   - Birth Certificate
   - Corporate Resolution
   - General Affidavit
   - Marriage Certificate
   - Estate / Inheritance Records

7. **Execution Levels**
   - Signature Standard
   - Priority Expedited
   - Executive Concierge
   - Custom Add-ons

8. **Payment-Gated Execution Panel**
   > No matter is scheduled, routed, or executed until full scope validation is verified and payment settlement is confirmed.

9. **Founder-Led Execution Core**
   - compact Founder Trust Anchor (expandable chip)
   - Nicholas Milano appears here only — not in hero
   - trust credential style, not ego card

10. **Who We Serve**
    - Attorneys · Businesses · Real Estate Professionals
    - Medical Providers · International Corporate Clients · Private Clients

11. **Final CTA Gate**
    - monospace matter-code style
    - CTA: `Begin Secure Intake`

**Homepage layout rules:**
- one cinematic vertical axis
- `bg-[#050507]` continuous background
- no gray SaaS panels
- all major transitions feel like scroll narrative
- mobile and desktop keep same narrative order
- no bifurcated hero layout

---

## PHASE 3 — RITUAL OVERLAY

**File:** `components/landing/ritual-overlay.tsx`

**Rules:**
- Ritual must be isolated from homepage — unmounts after completion
- Click/tap/escape allows entry after ready state
- Reduced motion shows static premium state and exits safely

**Correct sequence:**
1. black vault start
2. faint gold map/particle field
3. Florida origin glow
4. Hague route lines draw outward
5. vault rings form
6. official M seal assembles
7. wordmark appears
8. checklist readiness resolves
9. `Secure Workspace Ready` illuminates
10. pause
11. enter homepage

---

## PHASE 4 — 3D GLOBAL TRUST CORE

**Files:** `components/landing/global-trust-core-hero.tsx` · `app/globals.css`

**Requirements:**
- black glass sphere
- gold molecular continent impression
- Florida origin
- route arcs: Italy, Spain, Brazil, UAE
- Hague destination blooms
- subtle orbit rings
- official crest fused into sphere (translucent glass / `mix-blend-mode` treatment — no solid black blindspot)
- geodesic route arcs
- chromatic edge diffraction:
  - Champagne fringe left at 25–35%
  - Platinum fringe right at 18–25%
- focal depth layers:
  - rear dots blurred / low opacity
  - mid dots visible
  - foreground routes crisp
- environmental vault glow behind globe
- slow breathing only
- reduced-motion fallback

**No:** Three.js · new dependencies · canvas loops · random particle storm · fake telemetry

---

## PHASE 5 — GLOBAL DOCUMENT INTELLIGENCE MAP

**Routes:** `app/map/*` · `components/landing/global-map.tsx` · `components/landing/global-intel.tsx` · `components/landing/global-intel-map-interactive.tsx`

**Requirements:**
- Use `Global Document Intelligence™` only
- Country selection panel
- Hague status display
- `Execution Path Preview`
- `Begin Secure Intake` CTA for selected country
- Internal links to document/country pages
- No `Compliance Map` wording
- No fake legal guarantees

**Map UI states:** `Idle → Hover → Selected → Country Mode → Intake CTA`

**Must support:** country-first · document-first · professional-first · SEO internal linking

---

## PHASE 6 — DASHBOARD / OPERATOR WORKSPACE

**Routes:** `app/dashboard/*` · `components/dashboard/*` · `lib/dashboard-modules.ts`

**Visible rename:**
- `Operational Ledger` → `Sovereign Execution Core`
- `System Terminal` → `Sovereign Execution Core`

**Dashboard must show:**
- matter pipeline
- payment gate
- execution chain
- courier release only when state permits
- global document intelligence
- financial/invoice visibility
- follow-up controls

**Port or build if missing:**
- `PaymentGatePanel`
- `ExecutionChainVisibility`
- `CourierReleaseTracker`
- `MilanoSovereignCommandCore`

Wire into: `app/dashboard/pipeline/page.tsx`

**State rules:**
- payment gate: `awaiting_payment`, `payment_pending`, `payment_confirmed`, `payment_reconciled`
- scheduling unlocks only after payment confirmed
- courier animation: `shipped`, `courier_released`, `delivery_confirmed`, `paid_and_released`
- no fake activity · no fake live operators · no fake telemetry

**Allowed states:**
`intake_received` · `under_review` · `quoted` · `awaiting_payment` · `payment_confirmed` · `scheduled` · `in_execution` · `apostille_processing` · `shipped` · `courier_released` · `delivery_confirmed` · `completed` · `paid_and_released` · `cancelled` · `dormant`

---

## PHASE 7 — PORTAL / SECURE VAULT PORTAL

**Routes:** `app/portal/*` · `components/portal/*`

**Visible rename:**
- `Matter Control Portal` → `Secure Vault Portal`
- `Client Portal` / `Secure Client Portal` → `Secure Vault Portal`
- `Upload Documents` → `Controlled Records Upload`
- `Status Tracking` → `Execution Chain Visibility`

**Portal must show:**
- secure matter status · next step
- controlled records section
- invoice/payment state
- execution chain
- apostille status
- courier/release only when state permits
- coordinator visibility
- clear CTA for payment, scheduling, or intake correction

**No:** fake courier telemetry · fake live tracking · generic SaaS portal language

---

## PHASE 8 — CLIENT LOGIN / ACCESS SPLIT

**Routes:** `app/login/*` · `app/portal/*` · `app/alliance/*` · `app/dashboard/*`

**4 separated login surfaces:**

1. **Client Secure Vault Access** → `/portal`
2. **Alliance Network Access** → `/alliance`
3. **Operator Workspace** → `/dashboard`
4. **Admin / Command Center** → `/dashboard/admin`

Do not create fake auth backend. Use existing auth patterns only. Frontend may show separated access cards if auth is not implemented.

Do not expose role tokens. Do not hard-code secrets. Do not fake logged-in data.

---

## PHASE 9 — ALLIANCE PORTAL

**Routes:** `app/alliance/*` · `components/alliance/*`

**Alliance pages:**
- onboarding · dashboard · toolbelt · compliance
- referrals · matters · training · profile · payouts · support

**Rules:**
- alliance members cannot receive routed matters until onboarding, Tool Belt, and compliance readiness are satisfied
- no fake payout values · no fake referral volume · no fake partner status
- use locked/empty states where real data is missing

**Alliance language:**
Alliance Network · Partner Readiness · Tool Belt · Compliance Readiness · Referral Eligibility · Matter Routing Eligibility

---

## PHASE 10 — VIRTUAL ASSISTANT / SMART INTAKE ASSISTANT

**Routes:** `app/intake/*` · `components/intake/*` · `components/assistant/*`

**Name:** `Milano Seal Virtual Assistant` or `Smart Matter Intake Assistant`

**Assistant flow:**
1. user describes matter
2. assistant extracts: country · document type · signer count · apostille need · urgency · delivery need · missing info
3. assistant shows `Execution Path Preview`
4. assistant routes to `Begin Secure Intake`
5. final review remains human/operator controlled

**Must not:** give legal advice · guarantee acceptance · say government approved · replace attorney review · auto-book execution before payment/scope validation

**Copy:** `"I can help structure your request before review."` · `"Final routing is confirmed after intake validation."`

---

## PHASE 11 — INTAKE

**Route:** `app/intake/page.tsx`

**Must include:** matter type · destination country · document type · signer count · apostille required · urgency · client contact · notes · controlled records upload · payment gate after validation

**Use:** `Smart Matter Intake` · `Begin Secure Intake` · `Execution Path Preview` · `Controlled Records Upload`

---

## PHASE 12 — SEO / AUTHORITY PAGES

**Routes:** `app/affidavit-*` · `app/international-affidavit` · `app/power-of-attorney-international` · `app/florida-apostille-service` · `app/fbi-background-check-apostille` · `app/remote-online-notarization` · other country/document pages

**Each page must have:** H1 · what/when/why · notarization/apostille relevance · destination context · internal links · `Begin Secure Intake` CTA · `Global Document Intelligence` CTA

Do not over-animate SEO pages. Keep them readable, authoritative, and premium.

---

## PHASE 13 — MOTION RULES

**Allowed:**
ritual sequence · globe slow motion · route draw on view · card reveal on viewport · payment gate glow when relevant · execution chain progression by state · courier release by state only · soft gold atmospheric glow · ticker movement

**Not allowed:**
random motion · fake live tracking · fake telemetry · particle storm · cyberpunk scanlines · cheap spinner · dashboard activity simulation

**Reduced motion:** all animations must provide safe static fallback via `@media (prefers-reduced-motion: reduce)`

---

## PHASE 14 — STYLE SYSTEM

**Colors:**
- `#050507` — primary vault black
- `#0A0A0A` — secondary black (inside cards only if needed)
- `#D4AF37` — metallic gold
- `#C6A65B` — muted gold
- `#F4E5B8` — champagne
- `#F6F1E6` — parchment
- `#FFFFFF` / soft white — contrast

**Typography:**
- serif: authority headings
- clean sans: body
- monospace: matter codes, system labels, timestamps only

**Material:** black glass · thin gold border · soft vault glow · parchment panels for authority content · matte finish · luxury negative space

---

## PHASE 15 — VALIDATION

```bash
pnpm build
pnpm lint

git diff --check

rg -n "<<<<<<<|=======|>>>>>>>" app components lib || true

rg -n "Compliance Map|Mission Control|System Terminal|Client Portal|Secure Client Portal|Upload Documents|live courier tracking|live courier telemetry|Government approved|Guaranteed acceptance|Embassy verified|fake telemetry|Fake telemetry|fake metrics|Fake metrics" app components lib || true

find . -name ".env*" -not -path "./node_modules/*" -not -path "./.next/*" -print

grep -RIn --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git \
  "eval(\|Function(\|atob(\|Buffer.from\|base64\|fromCharCode\|obfuscate\|sk_live\|sk_test\|SUPABASE_SERVICE_ROLE_KEY\|WISE_API_KEY\|WISE_WEBHOOK_SECRET\|TWILIO_AUTH_TOKEN\|RESEND_API_KEY\|ANTHROPIC_API_KEY\|eyJ" . || true
```

If lint fails due to known repo config, report it. Do not hide it.

---

## COMMIT PLAN

```
Commit 1: homepage v2026 narrative sync
Commit 2: global trust core and map sync
Commit 3: dashboard sovereign execution core
Commit 4: secure vault portal sync
Commit 5: login alliance access separation
Commit 6: virtual assistant and intake sync
Commit 7: SEO authority copy sync
Commit 8: final style and validation cleanup
```

---

## FINAL REPORT

Return only:

1. active branch
2. commits created
3. exact files changed
4. homepage sequence implemented
5. ritual status
6. globe status
7. Global Document Intelligence map status
8. dashboard status
9. portal / Secure Vault Portal status
10. client login status
11. alliance status
12. virtual assistant / intake status
13. SEO authority pages status
14. terminology supersede completed
15. forbidden copy scan result
16. secret scan result
17. env file status
18. binary file status
19. `pnpm build` result
20. `pnpm lint` result
21. ready for PR or blockers

---

## FOUNDER CARD REFERENCE

**Nicholas Milano — Founder · Chief Trust Officer · The Milano Seal™**

Credentials shown on card:
- Florida Notary Public
- Remote Online Notary Specialist
- International Document Execution Liaison
- Florida Notary Commission #668288

Tagline: `SEALING TRUST ACROSS BORDERS`

Style reference: black background · gold typography · institutional credential layout · M crest mark with feather · columned architectural backdrop · trust anchor card (not hero placement — appears at Section 9 of homepage scroll)

---

## FRONTPAGE VISUAL DE-CONFLICT RULE
### Designer Correction — Locked 2026-05-22

**Root cause:** Ritual → Hero Globe → Trust Strip → Map all use dark space, gold arcs, particles, and routing energy. This creates focal exhaustion. The fix is visual separation by module — not more animation everywhere.

**Critical rule:** Ritual, Hero Globe, and Global Document Intelligence Map must not share the same visual language.

---

### Module Assignments

#### 1. Ritual Overlay
**Purpose:** System initialization / vault unlock.

**Visual language:**
- Abstract hyper-velocity particle streams
- Straight-line light bursts
- Subtle code-grid or readiness matrix
- NO geographic route arcs
- NO Florida-to-country arcs
- NO map-like routing

#### 2. Hero Global Trust Core Globe
**Purpose:** Institutional prestige / luxury trust object.

**Visual language:**
- Heavy glass macro lens
- Ambient black/gold crystal sphere
- Low-opacity matrix continents
- Slow inertial rotation
- NO long-distance flight arcs
- NO active route drawing
- NO pulsing country destinations

#### 3. Global Document Intelligence Map
**Purpose:** Actual operational routing and conversion engine.

**Visual language — EXCLUSIVE OWNER of:**
- Florida origin routing
- Transatlantic arcs
- Champagne center filaments (`#F4E5B8`)
- `mix-blend-mode: plus-lighter` / `screen` additive glow
- Destination ripple pulses
- Country selection and route draw animations

**Reason:** The user should experience a clear narrative progression:

```
System Initialization → Institutional Prestige → Active Operational Authority
```

Not: Gold arcs → Gold arcs → Gold arcs.

---

### Implementation Constraints (v2026)

```
DO NOT add geographic arcs to the Ritual.
DO NOT keep active flight paths in the Hero Globe.
DO NOT make the Map visually similar to the Globe.
DO NOT start full v2026 coding before PR #22 merges.
```

### Validation Checkpoint
The first page must feel like three distinct phases:
1. **Ritual** = system unlock (abstract speed / particle kinetics)
2. **Hero Globe** = institutional seal of trust (heavy ambient glass object)
3. **Map** = active document intelligence (flat tactical radar, maximum route contrast)

When the Florida → Italy arc finally draws across the Atlantic in the Map section, it must carry maximum impact because the user has seen **zero route arcs** in any section above it.
