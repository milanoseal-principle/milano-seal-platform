# The Milano Seal™ — QA Test Checklist
**Version:** 1.0  
**Platform:** milano-seal-platform  
**Branch:** claude/exciting-goodall-zCgCF  
**Surfaces:** Webpage · Dashboard · Portal · Alliance  

---

## How to Use This Checklist

- **Result values:** Pass | Fail | Blocked | N/A  
- **Severity codes:** P0 = Critical (deploy blocker) · P1 = High · P2 = Medium · P3 = Low  
- A **Fail on any P0 item** halts the release until resolved and re-tested.  
- Run Universal Checks after each persona's full surface sweep.  
- Record tester initials, date, and browser/device in the Sign-Off Matrix.

---

## Persona 1 — Lucas Almeida

**Bio:** Lucas Almeida is a litigation attorney based in São Paulo, Brazil, who requires an authenticated Power of Attorney apostille destined for use in Brazilian courts. Brazil acceded to the Hague Apostille Convention in 2016; sworn Portuguese translation is a destination requirement.

---

### Surface: Webpage

| # | Action | Expected Result | Pass/Fail |
|---|--------|-----------------|-----------|
| L-W-01 | Navigate to the homepage. Observe the hero section. | Page loads with no console errors. Crest image renders at `/milano-seal-crest-icon.png` (no broken img icon). No emoji visible anywhere on the page. | |
| L-W-02 | Inspect hero CTA button text. | Button reads one of the four approved variants: "Begin Secure Intake", "Request Execution Coordination", "Discuss Your Document", or "Begin Engagement". No other CTA phrasing present. | |
| L-W-03 | Search the rendered page text (Cmd+F / Ctrl+F) for "guaranteed", "government approved", "embassy verified". | Zero matches on any banned phrase. | |
| L-W-04 | Navigate to the Global Document Intelligence page (route `/map`). Search for "Brazil". | Brazil country entry loads. `hague_status` field reflects accession year 2016. No "Hague confirmed" phrasing used for unverified status. | |
| L-W-05 | On the Brazil destination entry, check the `translation_req` field display. | Display indicates sworn Portuguese translation is required. Language is informational, not a guarantee of acceptance. | |
| L-W-06 | On the Brazil entry, observe `apostille_req` and `execution_path` values. | Apostille required: Yes. Execution path references Florida Secretary of State (or appropriate issuing authority for the document type). | |
| L-W-07 | Check the `/map` page route title and any H1 heading. | Route heading reads "Global Document Intelligence" or similar approved variant. The phrase "Compliance Map" does not appear anywhere on this page. | |
| L-W-08 | Open Chrome DevTools → Network. Reload the homepage. Filter for XHR/Fetch calls. | No API responses contain fields named `internal_notes`, `margin`, `base_cost`, or `partner_payout`. | |
| L-W-09 | Run Lighthouse (mobile preset) on the homepage. | Performance score >= 85. | |
| L-W-10 | Enable OS-level reduced-motion (System Preferences → Accessibility → Reduce Motion). Reload the page. | All ambient/atmospheric animations stop. No movement from the Sovereign Atmosphere radial gradients. Page is fully legible and functional. | |

---

### Surface: Dashboard (Command Center — internal)

| # | Action | Expected Result | Pass/Fail |
|---|--------|-----------------|-----------|
| L-D-01 | Log in to the Dashboard as an admin. Locate a test order with document type "Power of Attorney" and destination "Brazil". | Order record is accessible. State machine shows the correct current state (e.g., `intake_received`). | |
| L-D-02 | Inspect the order detail view for the Brazil POA order. Check that the translation flag is surfaced. | A translation requirement indicator is visible (e.g., "Portuguese sworn translation required"). This flag must be present before the `scheduled` state is reachable. | |
| L-D-03 | Attempt to advance the order from `awaiting_payment` to `scheduled` without a payment confirmation logged. | System blocks the state transition. A payment gate error or warning is displayed. The state does not advance. | |
| L-D-04 | Log a mock payment confirmation. Attempt to advance to `scheduled`. | State advances to `scheduled` successfully after payment confirmation is present. | |
| L-D-05 | Inspect the pricing display for the order. | No raw fee calculation, margin percentage, base cost, or partner payout figure is shown on any client-facing view or in any API response visible in DevTools Network panel. Execution lane labels (Standard / Expedited / Concierge) are used instead. | |
| L-D-06 | Check the Dashboard internal label in the navigation. | Navigation or page title reads "Command Center", not "Dashboard" as a public-facing label. | |

---

### Surface: Portal (Matter Control Portal — client-facing)

| # | Action | Expected Result | Pass/Fail |
|---|--------|-----------------|-----------|
| L-P-01 | Log in to the Portal as Lucas Almeida (test account). Navigate to the active matter for the Brazil POA apostille. | Matter is visible. Current state badge is displayed accurately. | |
| L-P-02 | On the matter view, check the destination routing display. | Brazil is identified as the destination. The Hague convention status is stated as "Hague member (acceded 2016)". Phrasing does not say "Hague confirmed" without qualification. | |
| L-P-03 | Verify that sworn Portuguese translation requirement is surfaced to the client within the Portal. | Translation requirement is clearly communicated on the matter detail view. The language used is informational (e.g., "Destination requires sworn Portuguese translation"). | |
| L-P-04 | Navigate to the Invoice section of the Portal. | Invoice shows execution lane pricing only. No margin, base cost, or internal cost data is visible. | |
| L-P-05 | Check the Portal payment methods display. | At least one of the following is shown: Wise, Zelle, Venmo, Apple Cash. Stripe is not shown on any client-facing payment view. | |
| L-P-06 | Inspect the Portal page for any broken image tags. | Crest image (`/milano-seal-crest-icon.png`) renders correctly on all Portal pages. No `alt` text fallback showing in place of the image. | |
| L-P-07 | Check the order tracking view. | Current state is displayed. State machine progression is visible. The word "live" is not used to describe any data or status. | |

---

### Surface: Alliance

| # | Action | Expected Result | Pass/Fail |
|---|--------|-----------------|-----------|
| L-A-01 | Navigate to the Alliance pre-login page. Verify all four benefit blocks render. | Four benefit blocks are present. Crest renders. No emoji. No banned phrases ("guaranteed dispatch", "government approved"). | |
| L-A-02 | Read the pre-login disclaimer at the bottom of the page. | Disclaimer text reads (or closely matches): "Alliance participation does not guarantee dispatch volume, client assignment, or routing eligibility." | |
| L-A-03 | Click "Sign In to Alliance Portal". Observe loading screen. | Loading screen appears with crest centered, animated progress bar, and "Verifying Alliance credentials..." text. No emoji. | |
| L-A-04 | After the 1.8s load delay, observe the Alliance shell. | App phase loads. Header shows "The Milano Seal™ Alliance" wordmark, member name, and "Sign Out" button. | |

---

## Persona 2 — Giulia Romano

**Bio:** Giulia Romano is an Italian yacht broker based in Porto Cervo, Sardinia, who needs a corporate resolution notarized and apostilled for use in Italy in connection with a yacht title transfer. Italy is a Hague Convention member; the relevant apostille authority is the Prefettura.

---

### Surface: Webpage

| # | Action | Expected Result | Pass/Fail |
|---|--------|-----------------|-----------|
| G-W-01 | Navigate to homepage. Confirm no emoji anywhere on the page. Confirm crest renders. | Crest renders as PNG. Zero emoji. No console errors. | |
| G-W-02 | Navigate to `/map`. Search for "Italy". | Italy country entry loads. `hague_status` reflects Hague member. Apostille authority references Prefettura (or "Prefettura" appears in the entry's authority field or notes). | |
| G-W-03 | On the Italy destination entry, check `translation_req`. | Display indicates Italian language documentation or translation requirements. | |
| G-W-04 | On the Italy entry, confirm no banned phrases appear in the destination detail view. | "Guaranteed acceptance", "embassy verified", "government approved" are absent from the Italy entry. | |
| G-W-05 | Run Lighthouse (mobile) on `/map`. | Performance score >= 85. | |
| G-W-06 | Inspect the page text on `/map` for the phrase "Compliance Map". | Zero matches. Page heading is "Global Document Intelligence" or approved variant. | |

---

### Surface: Dashboard

| # | Action | Expected Result | Pass/Fail |
|---|--------|-----------------|-----------|
| G-D-01 | Create a test order: document type "Corporate Resolution", destination Italy. Verify intake state. | Order created in `intake_received` state. Destination: Italy is captured in the order record. | |
| G-D-02 | On the order detail, check the apostille routing display. | Apostille routing indicates Italy — Hague member. Prefettura authority confidence is displayed if the system provides authority routing information. | |
| G-D-03 | Add a second document (e.g., "Supporting Authorization") to the same order. Check multi-document handling. | Both documents appear on the order. Each document can have its own state or processing note. No document is silently dropped. | |
| G-D-04 | Verify that the order cannot advance past `awaiting_payment` without payment logged. | Payment gate blocks state transition. Message or indicator shown to admin. | |
| G-D-05 | Check the Pipeline view for the Italy order. | Order appears in the pipeline at the correct stage. Stage labels match the canonical state machine (intake_received → under_review → quoted → awaiting_payment → ...). | |

---

### Surface: Portal

| # | Action | Expected Result | Pass/Fail |
|---|--------|-----------------|-----------|
| G-P-01 | Log in to Portal as Giulia Romano (test). Navigate to the corporate resolution matter. | Matter detail loads. Document type and destination are shown. | |
| G-P-02 | Verify Italy destination routing is surfaced to Giulia. | Destination Italy is shown. Hague member status noted. Prefettura apostille authority is referenced or an equivalent authority confidence signal is shown. | |
| G-P-03 | Check the invoice for this order. | Invoice shows execution lane pricing. No internal cost data exposed. | |
| G-P-04 | Verify multi-document display in the Portal matter view. | Both documents (Corporate Resolution + Supporting Authorization) are listed in the matter. | |
| G-P-05 | Check all Portal pages load with the crest rendering. | `/milano-seal-crest-icon.png` renders on all Portal pages. No broken image. | |
| G-P-06 | Inspect Portal API calls in DevTools. Filter response payloads for `internal_notes`. | No response body contains `internal_notes`, `margin`, `base_cost`, or `partner_payout`. | |

---

### Surface: Alliance

| # | Action | Expected Result | Pass/Fail |
|---|--------|-----------------|-----------|
| G-A-01 | Navigate to Alliance pre-login. Observe the verification pathway preview. | All 5 verification states are displayed: Application Submitted, Verification Review, Tool Belt, Admin Approved, Routing Eligible. | |
| G-A-02 | Sign in to Alliance portal (demo). Navigate to Service Categories tab. | Service Categories tab renders. "Apostille Coordination" is listed as a category. | |
| G-A-03 | On Service Categories tab, verify each category shows its corresponding Tool Belt requirement. | Each category row shows the linked Tool Belt requirement key and its current status. | |
| G-A-04 | Navigate to Routing Eligibility tab. Verify the "Demo Preview — Not Live Data" banner is present. | Banner is visible at the top of the Routing Eligibility tab. | |
| G-A-05 | Read the Routing Eligibility disclaimer. | Text includes: "Routing eligibility does not guarantee assignment volume. Dispatch decisions are made by the operator." | |

---

## Persona 3 — Caroline Whitfield

**Bio:** Caroline Whitfield is an equine professional based in Ocala, Florida, who requires an apostille on her FBI Background Check for submission to Mexico. This is a federal-origin document; it must route through the US Department of State, not through the Florida Secretary of State. Mexico acceded to the Hague Convention in 2023; Spanish translation is required.

---

### Surface: Webpage

| # | Action | Expected Result | Pass/Fail |
|---|--------|-----------------|-----------|
| C-W-01 | Navigate to `/map`. Search for "Mexico". | Mexico entry loads. `hague_status` reflects Hague member (2023 accession). No "Hague confirmed" without qualification noting recency of accession. | |
| C-W-02 | On Mexico entry, check `translation_req`. | Spanish translation requirement is indicated. | |
| C-W-03 | Navigate to the intake form. Select document type "FBI Background Check" and destination "Mexico". | The intake form accepts these selections without error. | |
| C-W-04 | **CRITICAL:** After selecting "FBI Background Check" as document type, verify the routing authority signal. | System must identify the FBI Background Check as a **federal document** and indicate US Department of State as the apostille authority — NOT Florida Secretary of State. Displaying "Florida apostille" for this document type is a critical failure (P0). | |
| C-W-05 | Confirm no banned phrases appear on the intake form or destination information for Mexico. | "Guaranteed acceptance", "embassy verified", "government approved" are absent. | |
| C-W-06 | Open the website in the WhatsApp in-app browser (iOS or Android). Navigate to the homepage. | Page loads without white screen or JS crash. Crest renders. CTA button is tappable. No layout overflow. | |
| C-W-07 | In the WhatsApp in-app browser, navigate to the intake form. | Form inputs are accessible. Email and text fields are tappable. Form submits (or shows static confirmation) without error. | |

---

### Surface: Dashboard

| # | Action | Expected Result | Pass/Fail |
|---|--------|-----------------|-----------|
| C-D-01 | Create test order: document type "FBI Background Check", destination Mexico. | Order created. Document type is captured as "FBI Background Check". | |
| C-D-02 | **CRITICAL:** On the order detail, inspect the apostille routing authority. | Routing authority shown is "US Department of State" (federal). "Florida Secretary of State" is NOT shown as the apostille authority for this document. This is a P0 item. | |
| C-D-03 | Verify Mexico destination shows Hague 2023 accession note in the order routing detail. | Hague membership for Mexico is noted. System does not treat Mexico as a non-Hague country. | |
| C-D-04 | Verify Spanish translation flag appears in the order processing notes or requirements. | Translation requirement (Spanish) is surfaced in the order workflow. | |

---

### Surface: Portal

| # | Action | Expected Result | Pass/Fail |
|---|--------|-----------------|-----------|
| C-P-01 | Log in to Portal as Caroline Whitfield (test). Navigate to the FBI Background Check matter. | Matter loads. Document type "FBI Background Check" is shown. | |
| C-P-02 | **CRITICAL:** Verify that the routing authority shown to Caroline in the Portal. | Portal displays US Department of State as the apostille authority for this federal document. The word "Florida" does not appear as the apostille processing authority on this matter. | |
| C-P-03 | Verify Spanish translation requirement is communicated. | Matter detail or requirement checklist indicates sworn Spanish translation is required for Mexico. | |

---

### Surface: Alliance

| # | Action | Expected Result | Pass/Fail |
|---|--------|-----------------|-----------|
| C-A-01 | Sign in to Alliance portal. Navigate to Tool Belt tab. | Tool Belt renders all 10 requirements. Completion percentage bar is displayed. | |
| C-A-02 | Verify Tool Belt item statuses match demo data. Background Check shows "Pending". Banking shows "Pending". Execution Protocols Review shows "Required". | Status labels on each item match the DEMO_MEMBER `toolBelt` values exactly. | |
| C-A-03 | Verify Tool Belt "Required" items have distinct visual treatment. | Items with status "required" have a visually distinct background (danger-tinted) compared to "pending" and "completed" items. | |

---

## Persona 4 — Khalid Al-Mansoori

**Bio:** Khalid Al-Mansoori is a UAE-based luxury real estate investor who requires a Remote Online Notarization (RON) signing and subsequent document authentication for use in the UAE. The UAE acceded to the Hague Convention in March 2025; the transition period means the system must not represent UAE Hague status as fully operational or confirmed.

---

### Surface: Webpage

| # | Action | Expected Result | Pass/Fail |
|---|--------|-----------------|-----------|
| K-W-01 | Navigate to `/map`. Search for "UAE" or "United Arab Emirates". | UAE entry loads. | |
| K-W-02 | **CRITICAL — UAE Honesty Check:** Read the `hague_status` display for UAE. | Display must NOT say "Hague confirmed", "Hague verified", or any language implying full operational certainty. The entry must reflect the March 2025 accession and note the transitional period. Acceptable language: "Hague member (acceded March 2025 — transitional)", "accession pending full implementation", or equivalent. Stating "Hague confirmed" is a P0 failure. | |
| K-W-03 | On UAE entry, verify execution path guidance is appropriately qualified. | Execution path or notes include language acknowledging that apostille processing for UAE is subject to transitional arrangements. No guarantee of apostille acceptance is implied. | |
| K-W-04 | Navigate to the homepage. Find the RON service description or intake entry for RON. | RON is listed as a service offering. Description does not include commodity language ("cheap", "fast", "notary near me", "buy now"). | |
| K-W-05 | Check homepage payment methods display. | Wise is listed as a payment method. At minimum, one of the following is shown: Wise, Zelle, Venmo, Apple Cash. Stripe is not shown publicly. | |
| K-W-06 | Check for currency display on pricing or service pages. | If USD is shown, no hard conversion to AED is stated as guaranteed. Currency handling note or "contact for pricing" approach used for international clients. | |
| K-W-07 | Run Lighthouse (mobile) on the homepage. | Performance score >= 85. | |
| K-W-08 | Enable reduced-motion. Reload page. | All animations stop. No Sovereign Atmosphere movement. | |

---

### Surface: Dashboard

| # | Action | Expected Result | Pass/Fail |
|---|--------|-----------------|-----------|
| K-D-01 | Create test order: service type "RON", client jurisdiction "UAE", document type "Real Estate Authorization". | Order created. RON is captured as the service type. | |
| K-D-02 | On order detail, verify RON is flagged as applicable to a foreign signer. | Order notes or requirements indicate signer is a foreign national / international signer. RON platform certification requirement is referenced. | |
| K-D-03 | **CRITICAL — UAE Honesty Check:** Inspect the destination routing display for UAE on the order. | Routing notes for UAE must reflect the transitional Hague status. The phrase "Hague confirmed" must not appear. Transitional language is required. | |
| K-D-04 | Verify Wise is shown as the payment method for this order or is referenced in payment options. | Wise appears as a payment option or primary payment rail. Stripe does not appear in client-facing payment display. | |
| K-D-05 | Log a mock Wise payment in USD for this order. Verify payment is recorded. | Payment confirmation is logged. Order is eligible to advance past `awaiting_payment`. Currency (USD) is recorded. | |
| K-D-06 | Verify no internal margin or partner payout data is exposed in the order view. | No field labeled `margin`, `base_cost`, `partner_payout`, or `internal_notes` appears in any client-facing view or unprotected API response. | |

---

### Surface: Portal

| # | Action | Expected Result | Pass/Fail |
|---|--------|-----------------|-----------|
| K-P-01 | Log in as Khalid Al-Mansoori (test). Navigate to the active RON matter. | Matter detail loads. Service type "RON" is shown. | |
| K-P-02 | **CRITICAL — UAE Honesty Check:** Verify the UAE destination information shown in the Portal. | Portal does not say "Hague confirmed" for UAE. Transitional language or a qualification note is present. | |
| K-P-03 | Check that RON-specific information is surfaced in the matter view. | Matter view references RON as the execution method. Foreign signer context is noted. | |
| K-P-04 | Navigate to the Invoice section. Verify payment method shown. | Wise is shown as the payment method. No Stripe link or Stripe branding present on client-facing invoice. | |
| K-P-05 | Inspect all Portal API calls in DevTools. | No response payload contains `internal_notes`, `margin`, `base_cost`, or `partner_payout`. | |
| K-P-06 | Check the Portal on a mobile viewport (375px width). | All content is readable. No horizontal overflow. CTA buttons are tappable (minimum 44px tap target). | |
| K-P-07 | Check the Portal for banned phrases. | "Guaranteed acceptance", "embassy verified", "government approved", "live" (used to describe data/routing) are absent. | |

---

### Surface: Alliance

| # | Action | Expected Result | Pass/Fail |
|---|--------|-----------------|-----------|
| K-A-01 | Navigate to Alliance pre-login. Check all four benefit blocks. | Four benefit blocks rendered. No emoji. No banned phrases. Crest renders. | |
| K-A-02 | Sign in to Alliance (demo). Navigate to Overview tab. | Member status card shows: name, member ID, verification state badge, joined date, declared services. | |
| K-A-03 | On Overview tab, verify current state description and "What Comes Next" content is present. | Both the current state description and the next-step guidance are displayed in the status card area. | |
| K-A-04 | Navigate to Compliance tab. Verify all three compliance items are shown. | E&O Insurance, Background Check, and Notary Commission all have expiry dates and renewal notes displayed. | |
| K-A-05 | Enable reduced-motion. Load the Alliance pre-login page. | Sovereign Atmosphere background gradients are stationary. Progress bar on loading screen is either stationary or renders at full width without animation. | |
| K-A-06 | Sign out of Alliance portal. | Phase returns to pre-login state. Sign In form is displayed. Member data is no longer visible. | |

---

## Universal Checks — Run for All Personas, All Surfaces

These checks must pass for every persona × surface combination. Failures here apply universally.

| # | Action | Expected Result | Pass/Fail |
|---|--------|-----------------|-----------|
| U-01 | Run Lighthouse (mobile preset) on each primary page per surface. | Performance score >= 85 for: Homepage, `/map`, Portal (matter view), Alliance pre-login, Dashboard landing. | |
| U-02 | Search all rendered page text for: "guaranteed acceptance", "embassy verified", "government approved". | Zero matches on all surfaces and all personas. | |
| U-03 | Search all rendered page text for: "guaranteed" (standalone), "100% approved", "guaranteed routing". | Zero matches. (Note: Alliance disclaimer uses "does not guarantee" — this is acceptable as it is a negation.) | |
| U-04 | Check crest image on every page across all surfaces. | `/milano-seal-crest-icon.png` renders as a visible image. No broken image icon. Alt text is present for accessibility. | |
| U-05 | Open DevTools Console on each surface. Reload the page. | Zero console errors. Warnings are acceptable if they are non-blocking React/Next.js development hints, not runtime errors. | |
| U-06 | Enable OS reduced-motion. Visit each page with animations. | All CSS animations and transitions stop or are reduced to a single-frame state. Page is fully usable. Sovereign Atmosphere background is static. | |
| U-07 | Check payment methods display on all client-facing surfaces (Webpage, Portal). | At minimum one of: Wise, Zelle, Venmo, Apple Cash is shown. Stripe is absent from all public/client-facing payment displays. | |
| U-08 | Open DevTools Network. Inspect all XHR/Fetch API responses visible to the client session. | No response payload exposes: `internal_notes`, `margin`, `base_cost`, `partner_payout`. These fields must not be present in any client-accessible response. | |
| U-09 | Check all pages for emoji usage. | Zero emoji on any surface. All iconography is PNG, SVG, or text-based. | |
| U-10 | Check the Alliance pre-login footer disclaimer text. | Disclaimer includes: "Alliance participation does not guarantee dispatch volume, client assignment, or routing eligibility." | |
| U-11 | On the Alliance portal, verify the Routing Eligibility tab "Demo Preview" banner. | Banner is present and reads "Demo Preview — Not Live Data" or equivalent. | |
| U-12 | Check all heading elements across surfaces for font family. | Headings use `Georgia, 'Times New Roman', serif` or the equivalent serif stack. Body text uses system sans-serif. | |
| U-13 | Check background color on all pages. | Background is `#000000` (pure black) or within the approved near-black palette (`#0A0A0A`, `#0D0D0D`). No white or off-white backgrounds on primary page surfaces. | |
| U-14 | Verify the Alliance 5-state machine is fully visible on the pre-login pathway preview. | All five states render: Application Submitted, Verification Review, Tool Belt, Admin Approved, Routing Eligible. | |
| U-15 | Check no scheduling or execution state is reachable without payment confirmation (Dashboard). | Attempting to advance any order to `scheduled` or `in_execution` without payment logged is blocked by the system. | |

---

## Critical-Fail Escalation Table

| Failure Type | Severity | Escalation Path | Sign-off Required |
|---|---|---|---|
| FBI Background Check routes to Florida Secretary of State | P0 — Critical | Engineering lead + Operations director must confirm fix before re-deploy. Re-test by original tester. | Engineering Lead + QA Lead |
| UAE Hague status displayed as "Hague confirmed" | P0 — Critical | Content/data fix required. Operations and compliance review before re-deploy. Blocked from any client-visible release. | Operations Director + QA Lead |
| Banned phrase found on any client-facing surface | P0 — Critical | Remove phrase, re-deploy, full banned-phrase scan re-run across all surfaces. | QA Lead |
| Internal fields (`margin`, `base_cost`, `partner_payout`, `internal_notes`) exposed in API response | P0 — Critical | Security and engineering review. Immediate hotfix. No client-facing deploy until resolved. | Engineering Lead + Principal |
| Crest image broken (404 or empty alt fallback showing) | P1 — High | Asset deploy issue. Fix asset pipeline. Re-test asset delivery on all pages. | QA Lead |
| Payment gate bypassable (scheduling before payment) | P0 — Critical | Engineering fix to state machine gate. Full state machine re-test. | Engineering Lead |
| Stripe visible on public/client-facing payment display | P1 — High | Remove Stripe from public payment options. Verify Wise is primary. | Engineering Lead + QA Lead |
| Console errors on page load | P1 — High | Engineering fix. Re-test affected surface. | QA Lead |
| Lighthouse performance below 85 (mobile) | P2 — Medium | Performance optimization sprint. Re-run Lighthouse after changes. | Engineering Lead |
| Reduced-motion not honored | P2 — Medium | CSS animation fix. Re-test with OS reduced-motion enabled. | QA Lead |
| "Compliance Map" phrase appears on `/map` page | P1 — High | Copy fix. Re-deploy. Verify phrase is absent. | QA Lead |
| Alliance routing eligibility disclaimer missing or incorrect | P1 — High | Content fix. Re-test Alliance Routing Eligibility tab. | QA Lead |

---

## Sign-Off Matrix

| Tester | Date | Surface | Persona(s) | Result | Notes |
|---|---|---|---|---|---|
| | | Webpage | All | | |
| | | Dashboard | All | | |
| | | Portal | All | | |
| | | Alliance | All | | |
| | | Universal Checks | All | | |
| **Release Approver** | | All Surfaces | All | | Final go/no-go sign-off |

---

*The Milano Seal™ — Internal QA Document. Not for client distribution.*  
*All persona data is fictional test data used for QA purposes only.*
