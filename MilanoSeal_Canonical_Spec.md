# The Milano Seal™
## Canonical Pricing, Payments & Revenue Specification
**Version:** 1.0 — June 2026
**Classification:** Internal Operator · CTO-Grade
**Author:** Nicholas Milano, Founder
**Status:** Active — Governing

---

## Part 1 — Pricing Architecture

### 1.1 Public Service Lanes (Three Only)

Three lanes are defined, locked, and non-negotiable at the lane level. No bespoke lanes. No partial lanes. No hybrid lane pricing offered at intake.

| Lane | Public Price | Description |
|---|---|---|
| Signature | $750 | Single document, single signer, domestic execution, standard processing |
| Priority | $975 | Priority processing, courier coordination, multi-touch handling |
| Executive | $1,850+ | Multi-document, multi-signer, international, white-glove full service |

**Locked display copy rules:**

- Never display pricing on the public website under any circumstance
- Never quote pricing verbally before the structured Pre-Flight Review completes
- Pricing is confirmed only after the Pre-Flight Review has been completed by the operator
- All public-facing pages must carry the footer line: "Pricing confirmed after structured review"
- Marketing copy, social posts, and ad creatives must not include dollar amounts
- Any intake form, chatbot, or AI assistant must not quote a price until Pre-Flight completes

### 1.2 Internal Complexity Engine (Never Exposed to Client)

The Complexity Engine computes the final matter price entirely on the operator side. The client never sees line items, add-on codes, or the formula. The client receives a single Pro Forma Invoice total. All computation is internal.

**Base pricing formula:**

```
Final Price = Lane Base Price
            + (extra_documents × $75)
            + (extra_signers × $150)
            + (apostille_first × $250)
            + (apostille_additional × $150 each)
            + (international_signers × $200 each)
            + (expedited_processing × $200)      -- 3-5 business day
            + (urgent_same_day × $400)
            + (weekend_service × $250)
            + (certified_translation_standard × $175 per language)
            + (certified_translation_rush × $300 per language)
```

**Add-on definitions:**

| Add-On | Unit | Price |
|---|---|---|
| Extra document | Per document beyond the first | +$75 |
| Extra signer | Per signer beyond the first | +$150 |
| Apostille (first) | Per matter, first apostille | +$250 |
| Apostille (each additional) | Per apostille beyond the first | +$150 |
| International signer (non-US) | Per non-US-located signer | +$200 |
| Expedited processing | 3–5 business day turnaround | +$200 |
| Urgent / same-day | Same-day scheduling and execution | +$400 |
| Weekend service | Saturday or Sunday execution | +$250 |
| Certified translation (standard) | Per language, standard turnaround | +$175 |
| Certified translation (rush) | Per language, rush turnaround | +$300 |

**Complexity Engine rules:**
- Operator inputs facts during Pre-Flight Review; the engine outputs a single total
- Operator may apply a single discretionary adjustment (±10%) for relationship context — logged with reason code
- All computed prices are stored in the `matters` table with individual add-on line items in `matter_line_items` (internal table, never API-exposed)
- The engine result is the `amount_due` stored on the matter record
- Once the Pro Forma Invoice is issued, `amount_due` is immutable unless operator explicitly re-issues with a logged reason

### 1.3 Notary & Witness Pricing

These services may be offered standalone or bundled into a lane. When bundled, the lane price governs; standalone pricing applies only when the client purchases notary or witness service in isolation without an apostille or document-management component.

| Service | Standard | Rush |
|---|---|---|
| RON session (single signer) | $75 | $125 |
| RON session (2 signers) | $125 | $200 |
| In-person notarization | $100 | $175 |
| Witness coordination (RON) | $25–$50 per witness | +$35 rush surcharge |
| Witness coordination (in-person) | $35–$75 per witness | +$50 rush surcharge |

**Witness coordination pricing note:** The per-witness range reflects geography and scheduling complexity. Florida local witnesses: $25 (RON) / $35 (in-person). Remote or hard-to-schedule witnesses command the upper end. Operator sets the exact amount during Pre-Flight and it is included in the single invoiced total — never broken out for the client.

**Rush surcharge trigger:** Rush applies when the client requests scheduling within 24 hours of intake confirmation OR when the matter is escalated to urgent by the operator. Rush and urgent/same-day surcharges are cumulative with weekend surcharges when applicable.

### 1.4 Productized Packages (Eight Total)

Packages are pre-computed bundles of the Complexity Engine output. They exist for internal quoting speed and marketing positioning — they are never listed publicly with prices. The operator may offer a package as the starting quote during Pre-Flight, then adjust if the client's facts add complexity.

| # | Package Name | Price | What's Included | Ideal Client |
|---|---|---|---|---|
| 1 | Citizenship Starter | $750 | One affidavit or POA, apostille for one country (Italy or Portugal), standard processing, single signer, single document | Italian or Portuguese citizenship applicants with a single-document requirement; first-time applicants testing the service |
| 2 | Citizenship Full | $1,200 | Two to three documents (affidavit + birth certificate or POA + supporting document), apostille coordination for Italy or Portugal, standard processing, multi-document chain of custody | Clients with a complete Italian or Portuguese citizenship documentation set requiring coordinated apostille submission |
| 3 | International POA | $975 | Priority lane, Power of Attorney drafted-ready or client-supplied, apostille for any Hague Convention country, courier coordination | Property purchase abroad, legal representation in a foreign jurisdiction, clients closing real estate transactions outside the US |
| 4 | RON Package | $750 | Remote online notarization session (single or two signers), certified recording, compliant with Florida E-Notary standards, digital delivery of notarized document | Foreign clients who cannot appear in person, US real estate signings with remote parties, attorneys needing compliant RON for court or government submission |
| 5 | FBI Background Apostille | $975 | FBI Identity History Summary channel authentication, US Department of State apostille (federal-level, not state), verified delivery tracking | Digital nomad visa applicants (Spain D-Type, Portugal D8, Mexico FM3), immigration attorneys, clients relocating internationally requiring criminal background apostille |
| 6 | Corporate Resolution Package | $1,200 | Corporate resolution notarization, apostille, certified translation into one language, chain-of-custody documentation, operator-managed submission | Yacht registration in foreign registry, international business registration, corporate governance documents requiring foreign-country filing |
| 7 | Estate / Succession Package | $1,850 | Multi-document set (up to four documents), multi-country apostille coordination (up to two countries), full chain-of-custody tracking, operator-managed intake through delivery, death certificate and succession document handling | Estate attorneys managing international succession, clients with assets in two or more countries, Italian or European succession matters requiring authenticated US documents |
| 8 | White Glove Full Service | $2,500+ | Complete matter management from intake through final delivery, 7-business-day end-to-end turnaround guarantee, all documents in scope, dedicated operator contact, real-time status reporting, all apostille and translation coordination included, DHL priority delivery | Ultra-high-net-worth individuals, repeat attorney clients with complex multi-jurisdictional matters, clients for whom time and certainty carry premium value |

**Package pricing variance:** All package prices are starting points. If the client's Pre-Flight facts exceed what the package covers (e.g., a third country added to the Estate package), the operator applies Complexity Engine add-ons and re-quotes. The client is not told the package price was a baseline — the final Pro Forma Invoice reflects the single total only.

---

## Part 2 — Payments Architecture

### 2.1 Payment Rails — Wise Only

Wise is the exclusive primary payment rail for The Milano Seal™. Stripe has been permanently removed from the payment stack. No Stripe integration, no Stripe references, and no Stripe recovery path exists. This is a governing architectural decision, not a configuration preference.

**Wise payment link:** `wise.com/pay/me/nicholassamm1`
**Zelle contact:** `contact@themilanoseal.com`
**Venmo handle:** `@NicholasMilano`
**Apple Cash / Cash App name:** `Nicholas Milano`

**Alternative rails policy:** Zelle, Venmo, Apple Cash, and Cash App are accepted for domestic clients when Wise is not available to the client. All alternative-rail payments require manual operator confirmation before the matter gate advances. The operator marks the payment confirmed in the Command Center, triggering the same DB transaction as the Wise webhook.

**Payment gate doctrine:** The payment gate is a hard, three-layer constraint enforced at the database level, the service layer, and the UI. The three layers are:

1. **Database constraint:** `CONSTRAINT payment_gate CHECK (state IN ('intake_received','under_review','awaiting_payment') OR amount_paid >= amount_due)` — the database will reject any state transition past `awaiting_payment` if `amount_paid < amount_due`. This is enforced at the row level and cannot be bypassed by any application code.
2. **Service layer gate:** All matter service functions that advance state past `awaiting_payment` must re-read `amount_paid` and `amount_due` from the database inside the same transaction before updating state. If `amount_paid < amount_due`, the service throws a `PaymentGateError` and returns without advancing state.
3. **UI gate:** The Command Center blocks the operator from viewing the "Schedule Execution" action until the matter's `amount_paid >= amount_due` as returned by the matter API. The "Mark Paid" button is the only action available on a matter in `awaiting_payment` state.

**No execution scheduling before payment.** No apostille submission before execution. No document release before fully paid. These are sequential hard gates, not soft reminders.

### 2.2 Payment Reference System

Every matter generates a unique payment reference at the point the Pro Forma Invoice is issued. The reference is auto-generated by the system at invoice creation time. The client must include the reference verbatim in the Wise payment note field. The operator's reconciliation workflow uses this reference to match incoming Wise transfers to matters.

**Reference format:** `MS-YYYY-NNNN-{suffix}`

- `MS` = Milano Seal prefix (always uppercase, always present)
- `YYYY` = four-digit calendar year of matter creation
- `NNNN` = sequential four-digit matter number, zero-padded, restarting at 0001 each January 1
- `{suffix}` = payment type code (see below)

**Suffix codes:**

| Suffix | Meaning | When Used |
|---|---|---|
| `-R` | Retainer | Initial payment at invoice issuance; first payment on any matter |
| `-F` | Final balance | Balance due payment when matter was split into retainer + balance |
| `-U` | Upgrade | Lane change or add-on added after initial payment confirmed |
| `-T` | Translation add-on | Certified translation added after initial payment |
| `-A` | Apostille add-on | Additional apostille country added after initial payment |
| `-S` | Shipping / courier | Courier or DHL fee added after initial payment when not in original invoice |

**Example references:**
- `MS-2026-0042-R` — Matter #42 in 2026, retainer payment
- `MS-2026-0042-F` — Same matter, final balance
- `MS-2026-0043-A` — Matter #43, apostille add-on added post-payment

**Reference generation rule:** The system generates the reference when `state` advances to `awaiting_payment`. The reference is stored on the matter record and in the invoice record. References are immutable once generated — a re-issued invoice for the same payment slot keeps the same reference; a new payment type gets a new suffix reference on the same matter number.

### 2.3 Wise Webhook Engineering Spec

**Webhook endpoint:** `POST /api/webhooks/wise`

**Authentication and security:**

The endpoint must verify the `X-Signature-SHA256` header on every request before processing any payload data. Wise signs the request body using RSA-SHA256 with Wise's public key (obtained from the Wise API Keys page, stored as an environment variable `WISE_PUBLIC_KEY`).

Verification steps:
1. Extract `X-Signature-SHA256` header value (base64-encoded RSA-SHA256 signature)
2. Decode the raw request body as bytes (do not parse JSON before verification)
3. Verify the signature against the raw body bytes using the stored Wise RSA public key
4. If signature verification fails → respond `401 Unauthorized` immediately, log the rejection with IP and timestamp, do not process payload
5. If signature valid → proceed to idempotency check

**Idempotency check:**

Before any processing, query `webhook_events` table: `SELECT id FROM webhook_events WHERE wise_event_id = $1`. If a row exists → respond `200 OK` immediately with `{"status": "already_processed"}`. Do not re-process. This prevents double-payments caused by Wise retry behavior.

**Rate limiting:** 100 requests per minute per IP address. Requests exceeding the limit receive `429 Too Many Requests`. Rate limit state is held in Redis with a 60-second sliding window.

**Event processing (full sequence):**

1. Parse JSON payload from request body
2. Confirm `event_type` is `transfer.completed` — if any other type, log and return `200 OK` (Wise may send other event types; ignore gracefully)
3. Insert row into `webhook_events` table with `wise_event_id`, full `payload` JSONB, and `processed_at` timestamp — this serves as the idempotency record even before processing completes
4. Extract `reference` field from the transfer object inside the payload
5. Parse the reference to extract the matter `NNNN` number and suffix code
6. Query `payments` table and `matters` table: `SELECT m.id, m.state, m.amount_due, m.amount_paid FROM matters m WHERE m.ref = $1` using the base reference (`MS-YYYY-NNNN`)
7. If no matching matter found: log `REFERENCE_NOT_FOUND`, update `webhook_events.result` to `reference_not_found`, return `200 OK` (do not error — Wise will retry on non-2xx)
8. Extract transfer amount from payload. Verify: `ABS(transfer_amount - expected_payment_amount) <= 0.01`. If outside tolerance: log `AMOUNT_MISMATCH`, update `webhook_events.result` to `amount_mismatch`, trigger operator alert, return `200 OK`
9. Open a database transaction:
   a. Insert row into `payments` table with `matter_id`, `wise_event_id`, `amount`, `reference`, `method = 'wise'`, `operator_confirmed = FALSE`
   b. Execute state advancement query (see below) — capture row count
   c. If row count = 1: state advanced, `amount_paid` updated
   d. If row count = 0: matter already past `awaiting_payment` or fully paid — log `ALREADY_ADVANCED`, continue
   e. Commit transaction
10. Trigger operator notification (push notification + email) with matter reference, amount received, and new state
11. Update `webhook_events.result` to `processed` or `already_advanced` as applicable
12. Return `200 OK`

**State advancement SQL:**

```sql
UPDATE matters
SET
  state = 'scheduled',
  amount_paid = amount_paid + $1,
  updated_at = NOW()
WHERE
  id = $2
  AND state = 'awaiting_payment'
  AND amount_paid + $1 >= amount_due
RETURNING id;
```

The webhook NEVER trusts client-supplied state. It re-reads from the database inside the transaction. If 0 rows are updated, the webhook logs the outcome and returns 200 without error — the payment is recorded in the `payments` table regardless, but no state change occurs if the matter is not in the correct state. The operator receives an alert for any payment that does not advance state as expected.

**Partial payment handling:** If the incoming transfer amount plus existing `amount_paid` does not reach `amount_due` (i.e., client paid a partial amount), the payment is recorded in `payments` but the state advancement query returns 0 rows. The operator is alerted. The matter remains in `awaiting_payment`. The operator may contact the client for the balance and, upon receipt, manually confirm or the next Wise transfer will trigger another webhook cycle.

**Database schema:**

```sql
-- Canonical 9-state machine
CREATE TYPE matter_state AS ENUM (
  'intake_received',
  'under_review',
  'awaiting_payment',
  'scheduled',
  'in_execution',
  'apostille_processing',
  'in_transit',
  'delivered',
  'completed'
);

CREATE TABLE matters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref TEXT UNIQUE NOT NULL,            -- MS-2026-XXXX
  client_name TEXT,
  email TEXT,
  document_type TEXT,
  destination_country TEXT,
  state matter_state NOT NULL DEFAULT 'intake_received',
  amount_due NUMERIC(10,2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
  lane TEXT NOT NULL DEFAULT 'Signature',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Payment gate constraint: cannot move past awaiting_payment without payment
  CONSTRAINT payment_gate CHECK (
    state IN ('intake_received','under_review','awaiting_payment') OR
    amount_paid >= amount_due
  )
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id UUID REFERENCES matters(id),
  wise_event_id TEXT UNIQUE,           -- idempotency key from Wise event
  amount NUMERIC(10,2) NOT NULL,
  reference TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'wise', -- 'wise' | 'zelle' | 'venmo' | 'apple_cash' | 'cash_app'
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  operator_confirmed BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wise_event_id TEXT UNIQUE NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  result TEXT                          -- 'processed' | 'already_processed' | 'reference_not_found' | 'amount_mismatch' | 'already_advanced'
);
```

**Additional internal tables (never API-exposed):**

```sql
-- Internal line-item breakdown (Complexity Engine output — never sent to client)
CREATE TABLE matter_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id UUID REFERENCES matters(id),
  line_item_code TEXT NOT NULL,        -- e.g. 'apostille_first', 'extra_signer'
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Operator notes, never in client-facing API responses
CREATE TABLE operator_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id UUID REFERENCES matters(id),
  note TEXT NOT NULL,
  operator_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.4 Attribution Lock

Attribution records the source of client origination — direct (organic/paid search), attorney referral (with attorney ID), partner, or other. Attribution is captured at intake and locked permanently at the moment `payment_confirmed` is recorded (i.e., when `amount_paid >= amount_due` for the first time).

**Lock enforcement rules:**
- The `matters` table carries an `attribution_source TEXT` and `attribution_locked BOOLEAN NOT NULL DEFAULT FALSE` column
- The service layer's `confirmPayment()` function sets `attribution_locked = TRUE` in the same transaction that confirms payment
- Any service function that attempts to write `attribution_source` when `attribution_locked = TRUE` throws `AttributionLockedError` and aborts
- There is no operator override for attribution after lock — if attribution was recorded incorrectly, a separate audit log entry is created but the original record is not modified
- The purpose of the lock is commission integrity: if a referral attorney's commission is tied to attribution, the record must be immutable after money moves

**What attribution captures:**
- `attribution_source`: `'direct'` | `'attorney_referral'` | `'paid_search'` | `'partner'` | `'organic_social'` | `'returning_client'`
- `attribution_attorney_id`: UUID of the referring attorney (if applicable), nullable
- `attribution_campaign`: UTM campaign string (if applicable), nullable
- `attribution_captured_at`: timestamp of original attribution capture at intake
- `attribution_locked_at`: timestamp of lock (equals payment confirmation time)

### 2.5 Operator Reconciliation Protocol

Wise's dashboard display of a completed transfer is a reference tool only — it does not constitute payment confirmation for the matter management system. Payment confirmation requires one of two paths:

**Path 1 — Webhook confirmation (primary):**
The Wise webhook delivers a `transfer.completed` event. The system processes it per Section 2.3, records the payment, advances matter state to `scheduled`, and sends the operator a push notification. No operator action required for state advancement, but the operator should review the notification and confirm the matter is correctly scheduled.

**Path 2 — Manual operator confirmation (alternative rails and fallback):**
For Zelle, Venmo, Apple Cash, Cash App, or any situation where the webhook did not fire (e.g., Wise delivery delay), the operator uses the Command Center "Mark Payment Received" button. This button:
1. Opens a confirmation dialog requiring: reference match (operator types or selects the reference), amount match (operator enters the amount received), and operator acknowledgment (checkbox: "I have verified this payment in the Wise dashboard / bank account")
2. On confirmation, the same DB transaction as the webhook fires: inserts into `payments` with `operator_confirmed = TRUE` and `method` set to the correct rail, attempts the state advancement SQL, logs the action with the operator's ID and timestamp
3. If state advancement fails (already advanced or payment insufficient), the operator sees an explicit error message

**Reconciliation constraints:**
- `requires_operator_confirmation: true` is hardcoded in the system configuration — there is no mode in which the system auto-confirms payments without either a valid webhook or operator action
- No autopilot payment confirmation exists or will be built
- Wise dashboard screenshot is not accepted as confirmation — only the webhook event or the operator manual confirmation flow constitutes system confirmation
- Daily reconciliation: the operator should run the Command Center reconciliation report each business day, which lists all `payments` records against all matters in `awaiting_payment` state and flags any mismatches
- All `payments` table records are append-only — no payment record is ever deleted or updated after insertion; corrections are made by inserting a reversal record with a negative amount and a `reversal_reason` field

---

## Part 3 — Revenue Paths & Sales / Marketing

### 3.1 Revenue Path Matrix

Ranked by the combined factor of average matter value and speed to cash, representing the most efficient paths to revenue for current operating capacity.

| Rank | Path | Target Client | Avg Matter Value | Speed to Cash | Volume Potential | Notes |
|---|---|---|---|---|---|---|
| 1 | Italian citizenship attorneys (referral) | Immigration attorneys specializing in citizenship by descent, estate attorneys with Italian clients | $1,200 | 48 hours from referral to payment | High — 50,000+ active applicants/year nationally | Anchor vertical. One attorney relationship generates recurring volume. Loyalty is high once trust is established. |
| 2 | International POA (direct inbound) | US residents purchasing property abroad, US clients granting legal authority to foreign counsel | $975 | 24 hours from intake to payment | Consistent — tied to international real estate and legal markets | Best paid search ROI. High purchase intent. Client already knows they need the service. |
| 3 | FBI Background Apostille (digital nomad) | Remote workers applying for Spain D-Type, Portugal D8, Mexico FM3, or other residency visas | $975 | 48 hours from intake to payment | Growing — digital nomad visa demand accelerating in 2025–2026 | Spain and Portugal visa programs driving consistent demand. Clients are typically tech-educated, high conversion on structured intake. |
| 4 | Corporate / yacht registration | Small business owners, yacht owners, foreign company formation clients | $1,850 | 72 hours from intake to payment | Medium volume, high per-matter value | High LTV — corporate clients return for annual or ongoing filings. Yacht registration is a specialty with very few competitors offering this at premium service level. |
| 5 | Estate / succession (attorney referral) | Estate attorneys with international assets in a client's estate, international succession matters | $1,850 | 7 days from referral to payment | Low volume — tied to death and probate timelines | Highest margin per matter. Attorneys in this space pay for certainty, not price. One estate attorney relationship may generate 3–5 matters per year. |
| 6 | RON-only (entry tier) | Foreign clients who cannot appear in person, remote real estate closing parties, attorneys needing standalone compliant notarization | $750 | Same-day — payment before session scheduled | High frequency | Primary client acquisition entry point. Clients who use RON often return for apostille services. Price point is accessible; service quality converts to loyalty. |
| 7 | UHNW white glove | Ultra-high-net-worth individuals, family offices, private client attorneys | $2,500+ | 14 days from first contact to payment | Low volume | Relationship-dependent. Requires referral or direct introduction. Cannot be acquired via paid search effectively. High margin and high LTV when relationship established. |

### 3.2 Market Sizing

**Italian citizenship by descent:**
Approximately 30 million Americans qualify for Italian citizenship by descent under current Italian law. An estimated 50,000 or more applicants are actively pursuing their claims in any given year, driven by EU passport demand, travel benefits, and generational interest. Each applicant typically requires 2–3 authenticated documents (birth certificates, marriage records, affidavits) at the US end, each requiring apostille. This creates a domestic apostille demand of 100,000–150,000 documents per year from this vertical alone.

**Digital nomad visa demand:**
Spain's D-Type Digital Nomad Visa, Portugal's D8 Digital Nomad Visa, and Mexico's FM3 temporary residency visa all require FBI Identity History Summary apostille plus notarized financial statements as core application documents. Demand has grown materially since 2022 and continues to expand as remote work normalizes. Estimated 15,000–25,000 US applicants pursuing one of these visas annually, each requiring 2–4 authenticated documents.

**US-to-Mexico real estate:**
An estimated 15,000 or more cross-border property transactions occur annually involving US buyers purchasing in Mexico. Each transaction requires a Power of Attorney granted to Mexican counsel, apostilled for use in Mexico (a Hague Convention country). This is a consistent, transaction-driven demand with high purchase intent.

**Total addressable market:**
The US apostille and notary services market is estimated at $2.4 billion per year, encompassing government agencies, commodity notary services, and premium operators. The Milano Seal™ targets the premium tier — clients for whom service quality, certainty, and operator expertise justify a meaningful price premium over commodity alternatives. The premium 0.1% of this market represents $2.4 million per year in serviceable revenue at current operating capacity, achievable through a focused combination of attorney referral relationships and direct inbound search traffic.

### 3.3 Sales Motion — B2C (Direct Client)

The B2C sales motion is designed to convert high-intent searchers and referrals into paying clients through a structured, premium intake experience. No price is quoted before Pre-Flight. No pressure is applied. The tone is always expert and assured.

**Full motion, step by step:**

1. **Discovery:** Client finds The Milano Seal™ through organic search, paid search, or a referral. Primary discovery channels are Google (target search terms below), WhatsApp, and direct email. Social discovery is secondary.

2. **First contact:** Client reaches out via WhatsApp (`contact@themilanoseal.com` is the business number), email, or the intake form on the website. First response is within 2 business hours during operating hours. First message acknowledges the need, confirms it is within scope, and invites the client to complete the Smart Matter Intake.

3. **Smart Matter Intake:** The client completes the structured intake form or the operator conducts the intake via WhatsApp/phone and inputs the facts into the system. The AI parse extracts: document type, destination country, signer count, timeline, and any special requirements.

4. **Pre-Flight Review:** The operator reviews the parsed intake, confirms the lane and add-ons, runs the Complexity Engine, and confirms feasibility. This step confirms: the document type is apostille-eligible, the destination country is a Hague Convention member (or notes transitional status), the signer can be accommodated (RON or in-person), and the timeline is achievable.

5. **Pro Forma Invoice:** The operator issues a Pro Forma Invoice via the Command Center. The invoice contains the single total, the payment reference (`MS-YYYY-NNNN-R`), and the Wise payment link. The invoice does not itemize add-ons. The email accompanying the invoice includes the matter reference, the payment instructions, and the clear statement: "Execution scheduling is confirmed upon receipt of payment."

6. **Payment received:** Client pays via Wise (or alternative rail). Webhook fires (or operator manually confirms). Matter state advances to `scheduled`. Operator receives notification.

7. **Execution scheduling:** The operator contacts the client to schedule the RON session or in-person appointment. Scheduling confirmation is sent via email with the session details.

8. **Execution → Apostille → Release:** Matter progresses through `in_execution` → `apostille_processing` → `in_transit` → `delivered` → `completed` per the state machine in Appendix A.

9. **Review request:** 48 hours after delivery confirmation, the system sends an automated review request email. The operator follows up personally for white-glove and Executive lane matters.

**First-cash search terms (locked — do not change without operator approval):**
- `apostille florida`
- `power of attorney italy`
- `fbi background check apostille`

These three terms represent the highest purchase-intent search volume in the target verticals. Paid search spend is concentrated on these terms. Landing pages for each term are optimized separately and must not contain pricing.

### 3.4 Sales Motion — B2B (Attorney Referral)

The B2B motion targets attorneys in four practice areas: immigration, estate and probate, international real estate, and international business law. Attorneys do not purchase services for themselves — they refer clients and expect flawless execution that reflects well on the attorney's judgment.

**Full motion, step by step:**

1. **Attorney identification:** The operator identifies target attorneys through LinkedIn, state bar directories, legal professional associations, and existing client intake data (noting when a client mentions their attorney). Target profile: immigration attorneys in Florida, California, New York, and Texas; estate attorneys with international client bases; real estate attorneys closing cross-border transactions.

2. **Outreach:** First contact is via LinkedIn DM or direct email. Message is brief, professional, and premium-positioned. No pricing in the first message. Sample framing: "I manage apostille, authenticated notarization, and international document execution for clients pursuing citizenship, foreign property, and cross-border legal matters. If you have clients who need this handled correctly, I'd like to be your resource." No pitch decks. No cold call.

3. **Proof-of-service offer:** The operator offers to handle one matter at no charge to the attorney's client (full service, no cost to the referring attorney). This is a calculated investment — one flawless execution is worth more than any marketing material.

4. **First referred matter:** The attorney refers their first client. The operator handles the matter with maximum attention to quality and communication. The attorney receives a brief status update when the matter reaches `delivered` state. The client thanks the attorney. This closes the loop.

5. **Repeat referral:** The attorney refers subsequent clients. Each referral is handled with the same quality standard as the first.

6. **Volume acknowledgment:** After 3 referred matters, the operator sends the attorney a written acknowledgment of the relationship and may offer a modest volume benefit — not a public discount, but a relationship benefit (e.g., priority scheduling for the attorney's clients, direct operator contact number). No published partner tiers.

**Attorney value proposition:**
"You refer the client. We execute. You stay on the case. Your client receives white-glove international document execution without you managing the process. Your reputation is protected. Your client's matter is completed correctly and on time."

**Attorney communication standard:**
- All communications with attorneys are in writing (email preferred)
- Matter status updates are sent when the matter reaches `delivered`
- The attorney is never told the price paid by the client
- The attorney is never exposed to the internal system, pricing engine, or operator notes
- If a matter has a problem (delay, document rejection), the operator contacts the attorney proactively before the attorney's client complains

### 3.5 Brand Red Lines (Non-Negotiable)

These are the governing brand constraints. Any marketing copy, client communication, social post, website content, or verbal representation that violates these rules must be corrected immediately. No exceptions are authorized.

**Language prohibitions:**
- Never use: "cheap," "affordable," "budget," "discount," "low-cost," "cost-effective" in any client-facing context
- Never use: "guaranteed acceptance," "embassy verified," "government approved," "guaranteed apostille," "guaranteed visa approval," or any language implying a guaranteed outcome
- Never use casual language (slang, abbreviations, emojis in formal communications) in any client-facing email, invoice, or status update
- Never use: "no problem," "sure thing," "yeah," "gonna" or equivalent in written client communications

**Pricing and quoting prohibitions:**
- Never display pricing on the public website or any public-facing page
- Never quote a price verbally or in writing before the Pre-Flight Review completes
- Never include pricing in any social media post, ad creative, or marketing email
- Never quote outside the platform (no informal "it's about $X" messages)

**Operational prohibitions:**
- Never schedule execution before payment is confirmed
- Never release documents before the matter is fully paid (`amount_paid >= amount_due`)
- Never share internal notes, pricing breakdowns, add-on codes, or operator commentary with any client
- No automatic payouts to any partner, VA, or alliance member — all payouts are manual and operator-authorized
- No public partner rankings, public referral leaderboards, or public partner tier displays
- No margin or cost information shared with any VA, sub-contractor, or alliance partner

**Security prohibitions:**
- Never expose `internal_notes`, `operator_notes`, `margin`, `base_cost`, or `shipping_cost` in any API response
- Never expose `label_url`, `storage_path`, `file_path`, or `file_url` in client-facing endpoints
- Never use `service_role` keys in any client-side code

### 3.6 90-Day Revenue Execution Priority

**Weeks 1–2: Payment gate proof**
Objective: Prove that one complete Wise payment moves a matter through the full gate, end-to-end, from `awaiting_payment` to `completed`, with the webhook firing correctly, the state advancing in the database, the operator notification arriving, and the document releasing only after full payment. This is the foundational technical proof that the system works as specified. No client intake should begin at scale until this proof is complete and logged.

**Weeks 3–4: First attorney relationship**
Objective: Identify, contact, and establish the first attorney referral relationship. The attorney must refer at least one client matter during this window. The matter must be executed flawlessly. The attorney must be acknowledged as a referral source in the system with `attribution_source = 'attorney_referral'` and `attribution_attorney_id` set correctly. Document the relationship in the operator CRM.

**Month 2: FBI apostille intake optimization**
Objective: Optimize the FBI Background Apostille intake flow and execute a paid search campaign targeting "fbi apostille florida" and related terms. The landing page must be live, the intake form must be optimized for this use case, and the Pre-Flight Review must handle the FBI routing rule (see Appendix A) correctly — routing to US Department of State, not Florida Secretary of State. Target: 3 or more FBI apostille matters completed in month 2.

**Month 3: Italian citizenship referral pipeline**
Objective: Build the Italian citizenship attorney referral pipeline to a level that produces 2 or more referred matters per week. This requires at least 3–5 active attorney relationships generating referrals. Each matter should be tracked against the `Citizenship Full` package as the expected service baseline. Month 3 ends when the pipeline is producing consistent weekly intake without operator-initiated outreach for every matter.

---

## Appendix A — State Machine Reference (9 States)

**State transition diagram:**

```
intake_received → under_review → awaiting_payment → scheduled →
in_execution → apostille_processing → in_transit → delivered → completed
```

Transitions are strictly sequential. No state can be skipped. No backward transitions are permitted in the normal flow. If a matter must be reversed (e.g., a payment is reversed or a document is rejected post-execution), the operator records a manual exception in the `operator_notes` table and re-enters the matter at the appropriate state — this exception is logged with the operator's ID, timestamp, and reason, and is flagged in the reconciliation report.

**State reference table:**

| State | Display Label | Payment Required to Enter | Operator Action at This State |
|---|---|---|---|
| `intake_received` | Intake Received | No | Review the parsed intake, confirm it is in scope, classify the matter by lane and document type |
| `under_review` | Under Review | No | Complete the Pre-Flight checklist: verify document eligibility, confirm destination country Hague status, check signer availability, run Complexity Engine, confirm price |
| `awaiting_payment` | Awaiting Payment | Gate — must be paid to advance | Issue the Pro Forma Invoice via the Command Center; communicate the payment reference to the client; await Wise webhook or alternative rail confirmation |
| `scheduled` | Scheduled | Yes — full or retainer | Confirm the execution appointment with the client; send calendar invite; confirm notary or RON session logistics |
| `in_execution` | In Execution | Yes | Conduct the notarization or RON session; review the executed documents for completeness and correctness; confirm the notary seal is valid |
| `apostille_processing` | Apostille Processing | Yes | Submit documents to the correct apostille authority (see routing rules below); track submission status; confirm receipt |
| `in_transit` | In Transit | Yes | Generate DHL or courier label; dispatch documents; provide client with tracking number; confirm delivery estimate |
| `delivered` | Delivered | Yes | Confirm delivery receipt with the client via email or WhatsApp; request confirmation that documents are accepted as expected |
| `completed` | Paid and Released | Yes — full amount (`amount_paid >= amount_due`) | Mark the matter released in the Command Center; send the completion record and summary email to the client; trigger the 48-hour review request |

**Apostille routing rules:**

**FBI routing rule (P0 — Priority Zero):** Any matter where `document_type` contains "FBI," "background check," "identity history," or "IBRS" MUST be routed to the **US Department of State** for apostille, not the Florida Secretary of State. The Florida Secretary of State cannot apostille a federally-issued FBI document — submitting to FL DOS would result in rejection and delay. The system must detect these keywords in `document_type` at the `under_review` stage and set an internal `apostille_authority` field to `'US_DOS'` rather than the default `'FL_DOS'`. The operator must review this flag before advancing to `apostille_processing`.

**UAE routing note:** The United Arab Emirates acceded to the Hague Convention on Apostilles in March 2025. A transitional period applies during which UAE acceptance of apostilled documents may vary by government authority. The system must NOT display "Hague confirmed" for any matter with `destination_country = 'UAE'`. Instead, display "Hague (Transitional — verify with receiving authority)." This note remains in force until the operator updates the system configuration to mark the UAE transitional period closed. No automatic removal of this flag.

**State advancement authorization:**
- `intake_received` → `under_review`: Operator action only
- `under_review` → `awaiting_payment`: Operator action only (after Pre-Flight complete)
- `awaiting_payment` → `scheduled`: Webhook (automatic) or operator manual confirm — payment gate enforced
- `scheduled` → `in_execution`: Operator action only (on day of execution)
- `in_execution` → `apostille_processing`: Operator action only (after execution verified)
- `apostille_processing` → `in_transit`: Operator action only (after apostille confirmed, courier dispatched)
- `in_transit` → `delivered`: Operator action only (after delivery confirmed)
- `delivered` → `completed`: Operator action only (after release and completion record sent)

---

## Appendix B — Security Constraints (Non-Negotiable)

These constraints are architectural — they must be enforced at the API response layer (serializer/presenter), the database row-level security policy, and the service layer. No security constraint listed here is configurable, featureable, or bypassable by operator action. If an engineering decision would require relaxing any of these constraints, it requires written approval from the Founder before implementation.

**Data exposure prohibitions (enforced at API serializer — never in client-facing responses):**
- `internal_notes` — internal operator commentary on a matter, never in any client-visible endpoint
- `operator_notes` — operator-to-operator notes, never exposed
- `margin` — internal margin tracking column, never exposed
- `base_cost` — internal cost basis column, never exposed
- `shipping_cost` — internal courier cost column, never exposed
- `label_url` — DHL or courier label URL, never in any client-facing endpoint (security: would allow client to access shipment management)
- `storage_path` — internal document storage path, never exposed
- `file_path` — internal file system path, never exposed
- `file_url` — pre-signed or direct document URL for internal access, never in client-facing endpoint (client document delivery uses a separate, time-limited, scoped URL generated specifically for client access)
- `partner_payout` — any payout calculation fields, never exposed
- `va_notes` — virtual assistant or sub-contractor notes, never exposed
- `admin_notes` — system administration notes, never exposed

**API key security:**
- `service_role` Supabase key must never appear in any client-side code, environment variable exposed to the browser, or API response
- `WISE_PUBLIC_KEY` is stored server-side only
- `WISE_API_KEY` (for Wise API calls) is stored server-side only
- All secrets are stored in environment variables; no secrets are committed to the repository

**Authentication security:**
- `shouldCreateUser: false` is hardcoded in all magic link generation calls — Supabase magic links must never create new user accounts; only existing operator accounts may authenticate via magic link
- No public user registration path exists or will be built
- All Command Center routes require an authenticated session with the operator role

**Webhook security:**
- The raw Wise webhook payload is stored in `webhook_events.payload` (JSONB) — this table is accessible only to the service role, never to client-facing API endpoints
- Webhook event logs are never surfaced in any client-visible interface
- The `webhook_events` table has row-level security: `USING (false)` for all non-service-role access

**Payment and attribution integrity:**
- `requires_operator_confirmation: true` is hardcoded — no system mode exists in which payments are auto-confirmed without either a valid, signature-verified webhook or an explicit operator manual confirmation action
- No automatic payouts to any party — all financial outflows require operator-initiated action
- Attribution source (`attribution_source`, `attribution_attorney_id`) is immutable after `attribution_locked = TRUE` is set at payment confirmation — no override, no admin bypass, no retroactive correction to the original record
- `payments` table is append-only — no `UPDATE` or `DELETE` on payment records; corrections use reversal records
- `webhook_events` table is append-only — no modification after insert

**Partner and alliance confidentiality:**
- No partner margin, commission rate, or payout calculation is ever visible to the partner, VA, or alliance member
- Partner relationships are stored internally with no public-facing representation
- No public partner rankings, leaderboard, or tier system is exposed in any interface

---

*End of The Milano Seal™ Canonical Pricing, Payments & Revenue Specification v1.0 — June 2026*
*This document is internal, operator-grade, and classified. It governs all pricing, payment, and revenue decisions for The Milano Seal™. Any deviation from the rules in this document requires written Founder approval.*
