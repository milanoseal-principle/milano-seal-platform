# The Milano Seal™ — Persona QA Testing Script

**Purpose:** A tester runs through each of the four surfaces (Webpage / Dashboard / Portal / Alliance) as each of four personas. Each row is a specific click path, expected state, and pass/fail criterion. Jurisdiction-specific routing is verified per persona.

**Surfaces under test:**
- `https://themilanoseal.com` (Webpage)
- `https://themilanoseal.com/dashboard` (Operator Dashboard — Execution Center)
- `https://themilanoseal.com/portal` (Client Secure Matter Portal)
- `https://themilanoseal.com/alliance` (Alliance Member Portal)

**Test environment:** Desktop Safari, desktop Chrome, iPhone Safari, iPhone Instagram in-app browser, iPhone WhatsApp in-app browser, Android Chrome. Test reduced-motion (System Settings) on at least one device per persona.

**Reporting format:** Mark each step PASS / FAIL / BLOCKED / N/A. Capture screenshot + console log on FAIL.

---

## Persona 1 — Lucas Almeida, Litigation Attorney, São Paulo, Brazil

**Profile**
- **Role:** Civil litigation attorney at a São Paulo firm
- **Matter:** Brazilian client needs a U.S. Power of Attorney executed in Florida and apostilled for use before the 2nd Civil Registry of São Paulo (Cartório de Registro Civil das Pessoas Jurídicas, 2º Subdistrito)
- **Destination jurisdiction:** Brazil (Hague Apostille Convention member since 2016)
- **Language:** Portuguese primary, English working proficiency
- **Device:** Desktop Chrome (Mac) + iPhone Safari
- **Expected routing:** Florida origin → Apostille (Florida Department of State) → DHL release to São Paulo → translation review (sworn translator in Brazil typically required by the registry)

### Webpage path

| # | Action | Expected | Pass/Fail criteria |
|---|---|---|---|
| 1.1 | Load `themilanoseal.com` on desktop Chrome | Hero loads in <2s; LEFT routing field visible with Florida origin + 5 corridor arcs; founder card present in RIGHT column | FAIL if hero text dominates LEFT column / FAIL if founder card absent / FAIL if no corridor arcs visible |
| 1.2 | Check Entry Ritual overlay first visit | Overlay appears for <2.7s with crest + checklist; sessionStorage flag set; homepage SEO content mounted underneath (view source confirms) | FAIL if overlay persists / FAIL if no homepage HTML in source view |
| 1.3 | Scroll to Global Document Intelligence map | Map renders; click Brazil node | Drawer opens showing: Hague Route Reviewed = Member, RON Eligibility = "See routing", Apostille = "Required", Legalization = "Not needed" |
| 1.4 | Click "Begin Secure Intake for Brazil" in drawer | Navigates to `/intake?country=Brazil` | FAIL if 404 or wrong query param |
| 1.5 | Verify "Not Sure What You Need?" cards visible | 6 routing cards including "Need Apostille Coordination?" | FAIL if card count ≠ 6 |
| 1.6 | Click `Need Apostille Coordination?` card | Navigates to `/intake?service=apostille` | FAIL if not routed |
| 1.7 | Verify execution lanes section | 3 lanes visible: Signature / Priority / Executive; Priority shows "Most Selected" badge | FAIL if any lane missing badges or copy |
| 1.8 | Hover trust badges in operational rail | Hover state lifts +2px; aria-label readable to screen reader | FAIL if hover doesn't lift / FAIL if no aria-label |
| 1.9 | Open Reduced Motion (Chrome DevTools → emulate `prefers-reduced-motion: reduce`) | Atmosphere drift stops; routing arc breath stops; ticker still scrolls slowly OR stops cleanly | FAIL if any animation continues at full speed |
| 1.10 | Open iPhone Safari, load same URL | Routing field stacks ABOVE content; founder card below; no horizontal scroll | FAIL if horizontal scroll appears / FAIL if grid stays 2-col on mobile |

### Intake path (Brazil routing)

| # | Action | Expected | Pass/Fail criteria |
|---|---|---|---|
| 1.11 | Land on `/intake?country=Brazil` | Country pre-selected as Brazil; "Destination Country" field shows Brazil | FAIL if country not pre-populated |
| 1.12 | Verify form separates Document Origin Jurisdiction / Signer Location / Destination Country | Three distinct fields | FAIL if any field is merged or missing |
| 1.13 | Select Document Origin = "U.S. State" → Florida | State dropdown appears conditionally | FAIL if dropdown doesn't conditionally appear |
| 1.14 | Select Signer Location = "Foreign Country" → Brazil | Routing preview indicates POA may be executed at Brazilian consulate OR via RON (Florida) for use in Brazil | FAIL if no contextual routing hint |
| 1.15 | Submit intake | Returns Matter ID format `MS-YYYY-NNNN`; advances to confirmation state `intake_received` | FAIL if no matter ID returned / FAIL if state machine skips |
| 1.16 | Verify Portuguese-language reassurance text shows somewhere OR a language note ("Coordinator communication is available in English") | Either language support hint OR explicit English-only note (not silently failing) | FAIL if zero language signal anywhere |

### Portal path (post-payment view)

| # | Action | Expected | Pass/Fail criteria |
|---|---|---|---|
| 1.17 | Navigate `/portal/trackingNow` directly in browser | Hard-redirect to `/portal/tracking` (no broken route) | FAIL if 404 or broken render |
| 1.18 | Open Portal demo matter; switch to "Tracking" tab | Tracking stages visible: Intake Received → ... → Paid & Released | FAIL if stages don't render or stages out of order |
| 1.19 | Verify Tracking empty state (matter without courier activity) | Shows neutral copy: "Tracking details will appear here once release or courier activity is created." | FAIL if any fake DHL/FedEx/courier data shown |
| 1.20 | Open Documents tab | Vault states visible: Not Uploaded / Uploaded / Under Review / Approved / Ready for Execution / Ready for Release / Released | FAIL if state list incomplete |
| 1.21 | Confirm Invoice tab shows Wise payment reference format `MS-YYYY-NNNN-R` | Reference shown in copy-to-clipboard format | FAIL if Stripe language anywhere / FAIL if reference format wrong |

### Brazil-specific compliance check

- [ ] No claim of "guaranteed acceptance" by Brazilian registries
- [ ] No claim of "Hague Convention Compliant" (replaced with "Hague Route Reviewed")
- [ ] Apostille language is "Coordination" not "Authority"
- [ ] Receiving-authority disclaimer present at footer
- [ ] Translation routing acknowledged or referenced (Brazilian registries typically require sworn translation)

---

## Persona 2 — Giulia Romano, Yacht Broker, Porto Cervo, Sardinia, Italy

**Profile**
- **Role:** Independent yacht broker handling a €18M sale of a U.S.-flagged motor yacht to an Italian buyer
- **Matter:** U.S. seller's Affidavit of Title + Bill of Sale (Florida) + apostille for Italian Capitaneria di Porto registration
- **Destination jurisdiction:** Italy (Hague Apostille Convention member)
- **Language:** Italian primary, fluent English
- **Device:** Desktop Safari (Mac) + iPad Safari
- **Expected routing:** Florida origin → RON + Apostille (Florida Department of State) → certified translation (Italian sworn translator) → DHL Express to broker in Porto Cervo

### Webpage path

| # | Action | Expected | Pass/Fail criteria |
|---|---|---|---|
| 2.1 | Load homepage on desktop Safari | Italy node visible in map; hero corridor arc to ITALY labeled in mono font | FAIL if no Italy label / FAIL if arc opacity <0.4 |
| 2.2 | Click Italy node in Global Document Intelligence map | Drawer opens; copy reads "Hague Route Reviewed" not "Hague Convention Member" | FAIL if banned language appears |
| 2.3 | Verify trust badges link correctly | Click "Apostille Coordination" badge → routes to `/intake?service=apostille` | FAIL if href broken |
| 2.4 | Verify execution lane copy mentions "international release" not "delivery" | "International Release" doctrine present in lane 3 | FAIL if "Delivery" used as primary verb |
| 2.5 | Open Founder section | Real founder card image loads; no AI regeneration; "Meet the Founder" overlay badge visible | FAIL if image is broken / FAIL if face is altered |
| 2.6 | iPad Safari portrait mode | Layout reflows; routing field stacks above content; no clipping at notch/dynamic island | FAIL if any element clipped by safe-area |
| 2.7 | Verify the dual-rail ticker | Rail A scrolls left, Rail B scrolls right, gold sweep crosses between rails | FAIL if both rails scroll same direction / FAIL if sweep absent |

### Intake path (Italy routing — yacht context)

| # | Action | Expected | Pass/Fail criteria |
|---|---|---|---|
| 2.8 | Land on `/intake?country=Italy` | Italy pre-selected | FAIL if not pre-populated |
| 2.9 | Document type = "Affidavit" — confirm field exists | Affidavit available in document type dropdown OR free-text accepts | FAIL if "Affidavit of Title" cannot be specified |
| 2.10 | Add note: "Yacht transaction — Italian Capitaneria di Porto" | Free-text field accepts; no validation rejection | FAIL if rejected |
| 2.11 | Verify "Smart Matter Intake" parser concept is communicated (even if backend not wired) | "Structured for Human Review" label visible | FAIL if "AI-approved" or "AI-certified" appears anywhere |
| 2.12 | Submit; confirm matter ID returned and state = `intake_received` | Same as Persona 1 step 1.15 | Same criteria |

### Portal path (Italy buyer view)

| # | Action | Expected | Pass/Fail criteria |
|---|---|---|---|
| 2.13 | Open Portal demo matter (Italy POA scenario) | Welcome banner shows matter, state = `apostille_processing` per demo seed | FAIL if state drift |
| 2.14 | Verify Coordinator card lists coordinator name + secure messaging | Card present; messaging available | FAIL if card empty |
| 2.15 | Check Document Vault — "Apostille Completed" state visible | Document state advances correctly in demo flow | FAIL if state machine skips |
| 2.16 | Verify Italy receiving-authority disclaimer present somewhere in portal | "International use is subject to destination and receiving-authority requirements" appears in footer or document tab | FAIL if disclaimer absent |

### Italy-specific compliance check

- [ ] No claim that documents are accepted by Italian Capitaneria di Porto without sworn translation step
- [ ] No claim of "embassy approved"
- [ ] Translation coordination acknowledged in execution path
- [ ] DHL Express courier release language is generic, not promising specific transit times

---

## Persona 3 — Caroline Whitfield, Equine Professional, Wellington, Florida → Buyer in Kentucky

**Profile**
- **Role:** Sport horse agent representing a Wellington-based seller; transaction is interstate but matter involves federal-routing FBI background check apostille (buyer is acquiring stable property and needs background-checked grooms with H-2B visa documentation)
- **Matter:** FBI Identity History Summary (background check) apostilled for H-2B visa worker (Mexican groom) → use at U.S. Consulate in Monterrey
- **Destination jurisdiction:** Federal apostille routing (U.S. Department of State, Office of Authentications) — **not** state apostille; eventual destination Mexico (Hague Convention member 1995)
- **Language:** English
- **Device:** Desktop Chrome + iPhone Safari + WhatsApp in-app browser (the way Caroline actually reads links from her US Equestrian network)
- **Expected routing:** FBI document → U.S. State Department Federal Apostille → DHL to Monterrey consulate

### Webpage path

| # | Action | Expected | Pass/Fail criteria |
|---|---|---|---|
| 3.1 | Open homepage in **WhatsApp in-app browser** on iPhone | Page renders without crash; no horizontal scroll; hero stacks; CTAs tappable (44px min) | FAIL if any tap target <44px / FAIL if WhatsApp browser crashes |
| 3.2 | Tap "Begin Secure Intake" CTA | Navigates to `/intake` inside the in-app browser without breaking | FAIL if WhatsApp browser blocks navigation |
| 3.3 | Verify "Document Origin Jurisdiction" field offers "Federal / FBI" as distinct option (not just U.S. State) | Three-option selector: U.S. State / Federal-FBI / Foreign Country | **CRITICAL FAIL** if Federal/FBI not separable |
| 3.4 | Document type = "FBI Background Check" OR "Identity History Summary" | Available in dropdown OR free-text accepted | FAIL if document type cannot be specified |
| 3.5 | Confirm intake captures destination = Mexico (Hague) | Mexico in destination dropdown; routing preview shows Hague apostille pathway | FAIL if Mexico missing / FAIL if non-Hague language used |

### Federal routing-specific check

| # | Action | Expected | Pass/Fail criteria |
|---|---|---|---|
| 3.6 | Verify execution path shows federal apostille (Washington D.C.) not Florida apostille | Routing preview or country drawer indicates federal-level apostille required for FBI documents | **CRITICAL FAIL** if system routes FBI doc through Florida Dept of State |
| 3.7 | Confirm copy does not promise "same-day federal apostille" | Federal apostille realistic timeline (8–12 weeks regular) referenced or no false speed claim | FAIL if specific aggressive SLA promised |
| 3.8 | Verify SEO doc page `/fbi-background-check-apostille` link exists in footer or services | Link present | FAIL if missing |

### Mobile / cross-app

| # | Action | Expected | Pass/Fail criteria |
|---|---|---|---|
| 3.9 | Switch from WhatsApp browser → tap "Open in Safari" | URL preserved, session continues | FAIL if session lost / FAIL if URL drops query params |
| 3.10 | iPhone Safari with iOS keyboard open, fill intake form | Inputs scroll into view; no input clipped under keyboard | FAIL if any field clipped |
| 3.11 | Submit, screenshot confirmation matter ID | `MS-YYYY-NNNN` format | FAIL if format breaks |

### Equine-specific compliance check

- [ ] No use of "expedited federal apostille" without acknowledging realistic D.C. timeline
- [ ] H-2B / immigration document language is neutral (no immigration legal advice given)
- [ ] No "guaranteed visa approval" language anywhere
- [ ] FBI apostille pathway visually distinguishable from state apostille

---

## Persona 4 — Khalid Al-Mansoori, Luxury Real Estate Investor, Dubai, UAE

**Profile**
- **Role:** Private investor closing on a Manhattan penthouse from his Dubai office; needs U.S. Power of Attorney executed at the U.S. Consulate Dubai OR via Remote Online Notary, then routed for use in New York closing
- **Matter:** Power of Attorney granting NY real estate attorney authority to sign closing docs
- **Destination jurisdiction:** UAE is **non-Hague** for legalization purposes regarding incoming U.S. docs (UAE acceded to Hague Apostille only March 2025, transitional period). Outgoing UAE docs to US = use case here is reverse: U.S. POA signed in Dubai (via RON or consulate) for use in U.S. — different routing.
- **Language:** Arabic primary, fluent English
- **Device:** iPad Pro (Safari) + Mac desktop Safari + LinkedIn in-app browser
- **Expected routing:** Florida-licensed RON + U.S. POA → notarized → courier to NY closing attorney (no apostille needed since both ends are U.S.); OR if signer needs UAE-side acknowledgment, U.S. Consulate Dubai notarial services

### Webpage path

| # | Action | Expected | Pass/Fail criteria |
|---|---|---|---|
| 4.1 | Open homepage on iPad Pro landscape | Hero LEFT routing field dominates ~58% width; UAE node visible on map | FAIL if UAE node missing from map |
| 4.2 | Click UAE node in Global Document Intelligence map | Drawer opens; UAE routing acknowledged as **non-Hague** OR transitional Hague status flagged honestly | **CRITICAL FAIL** if UAE labeled as straightforward Hague apostille destination without nuance |
| 4.3 | Verify trust badges include "Remote Online Notary" linkable to `/intake?service=ron` | Badge clickable | FAIL if href broken |
| 4.4 | Hero "Florida Remote Online Notary" subtitle visible | Subtitle present (Khalid needs to know RON is an option for him as signer abroad) | FAIL if RON option not surfaced |
| 4.5 | Open LinkedIn in-app browser, load same URL | Renders without crash; CTAs tappable | FAIL if LinkedIn browser blocks |

### Intake path (signer abroad — RON workflow)

| # | Action | Expected | Pass/Fail criteria |
|---|---|---|---|
| 4.6 | Land on `/intake?service=ron` | RON pre-selected as service | FAIL if not pre-populated |
| 4.7 | Set Signer Location = "Foreign Country" → United Arab Emirates | Signer abroad accepted | FAIL if foreign signer rejected |
| 4.8 | Verify routing preview indicates Florida-RON eligibility for foreign signers (per Florida statute allowing remote signers anywhere) | Routing preview or contextual hint about RON-for-foreign-signers | FAIL if intake suggests UAE signer must use UAE notary |
| 4.9 | Document Origin = U.S. State → Florida (POA being executed under U.S. law) | Origin captured | FAIL if origin rejected |
| 4.10 | Destination Country = United States (POA used in NY closing) | "Domestic use" routing preview OR explicit acknowledgment that no apostille needed for U.S.-to-U.S. | FAIL if system requires apostille for U.S.-destination document |
| 4.11 | Submit intake | Returns matter ID | Same as 1.15 |

### Portal path (Wise payment flow for international client)

| # | Action | Expected | Pass/Fail criteria |
|---|---|---|---|
| 4.12 | Open Portal demo matter; switch to Invoice tab | Wise payment reference shown `MS-YYYY-NNNN-R` | FAIL if Stripe language present / FAIL if reference format wrong |
| 4.13 | Copy payment reference to clipboard | Copy-to-clipboard interaction works | FAIL if copy fails silently |
| 4.14 | Verify currency handling — UAE client paying USD via Wise | USD amount displayed; AED conversion handled by Wise externally (not faked in UI) | FAIL if any conversion rate displayed (would be fake data) |
| 4.15 | Verify "Continue to Secure Payment" button only enabled when pre-flight review complete | Payment-gating logic enforced | FAIL if button enabled without pre-flight |
| 4.16 | After payment confirmation (demo state), scheduling unlocks | "Scheduling Unlocked" heading appears | FAIL if scheduling unlocks before payment_confirmed state |

### UAE-specific compliance check

- [ ] No claim that UAE = simple Hague apostille (UAE Hague status is transitional 2025+ — system should be honest)
- [ ] No claim of "embassy partnership" with U.S. Consulate Dubai
- [ ] No Arabic-language marketing promises unless actually staffed for Arabic coordination
- [ ] Wise payment flow respects international currency without faking conversion
- [ ] No legal advice language regarding NY real estate

---

## Cross-persona universal checks (run once per surface)

### Webpage universal

- [ ] Lighthouse Performance ≥ 85 mobile, ≥ 90 desktop
- [ ] Lighthouse Accessibility ≥ 95
- [ ] Lighthouse SEO ≥ 95
- [ ] No console errors on load
- [ ] No hydration mismatch warnings
- [ ] Reduced-motion disables all 6 atmosphere layers + dual ticker animations + arc breath
- [ ] Real crest asset at `/milano-seal-crest-icon.png` (not regenerated)
- [ ] Real founder card asset at `/nicholas-milano-florida-remote-online-notary-apostille-coordination-card.png` (not regenerated, not cropped, not altered)
- [ ] JSON-LD Organization + Person schemas validate at schema.org validator
- [ ] No banned phrases in DOM: `Hague Convention Compliant`, `RON Certified`, `RON Specialist`, `AES-256`, `guaranteed acceptance`, `embassy approved`, `Mission Control`, `Sovereign Command`, `Stripe`, `Compliance Map`

### Dashboard universal

- [ ] State machine enforces payment gate: matter cannot advance from `awaiting_payment` unless `paid >= due`
- [ ] Operational Ledger (renamed from System Terminal) shows only real operator-action events; no auto-injected fake events
- [ ] Event vocabulary uses canonical names (`SMART_REQUEST_PARSED`, `PAYMENT_CONFIRMED`, `PAID_AND_RELEASED`, etc.)
- [ ] No fake operator counts, no fake SLA percentages, no fake throughput numbers
- [ ] Demo matter clearly labeled `DEMO PREVIEW - NOT LIVE DATA` if visible

### Portal universal

- [ ] PreLoginPage sells value before auth wall (not bare login)
- [ ] 5 tabs render (Overview / Tracking / Documents / Invoice / Coordinator)
- [ ] Pre-Flight Review checklist functional
- [ ] Payment/Scheduling Gate enforces correct UI states (Payment Required → Payment Confirmed → Scheduling Unlocked)
- [ ] Document Vault shows correct state per matter (Not Uploaded → ... → Released)
- [ ] Coordinator messaging available
- [ ] No fake DHL GPS, no fake courier ETA, no fake live tracking map
- [ ] `/portal/trackingNow` redirects to `/portal/tracking`

### Alliance universal

- [ ] PreLoginPage sells Alliance value before auth (verification pathway, service categories, disclaimer)
- [ ] 5 verification states render: Application Submitted → Verification Review → Tool Belt → Admin Approved → Routing Eligible
- [ ] Tool Belt requirements list shows 10 items with completion state
- [ ] Service Categories panel shows 8 categories (RON, Mobile, Apostille, Legalization, Translation, Courier, Witness, After-Hours)
- [ ] Routing Eligibility panel honest about non-eligibility until verification complete
- [ ] Disclaimer present: "Alliance participation does not guarantee dispatch volume, client assignment, or routing eligibility"
- [ ] No fake partner network counts, no fake dispatch volume, no fake operator availability map

---

## Failure escalation

**Critical fails** (block deployment):
- Stripe references anywhere
- Banned phrases in DOM
- Founder asset modified or AI-regenerated
- Payment-gate bypass possible
- Brazilian/Italian/UAE document routing logic wrong (e.g., FBI doc routed through Florida apostille)
- `/portal/trackingNow` not redirecting

**Major fails** (fix before next sprint):
- Lighthouse scores below thresholds
- Mobile horizontal scroll
- Reduced-motion not respected
- Tap targets <44px

**Minor fails** (backlog):
- Hover states inconsistent
- Empty state copy variation
- Footer link styling drift

---

## Tester sign-off

| Persona | Tester Name | Date | Surfaces Passed | Critical Fails | Sign-off |
|---|---|---|---|---|---|
| Lucas Almeida (Brazil) | | | | | |
| Giulia Romano (Italy) | | | | | |
| Caroline Whitfield (Equine / FBI) | | | | | |
| Khalid Al-Mansoori (UAE) | | | | | |

**Coordinator final review:** ☐ Approved for deployment / ☐ Returned for fixes
