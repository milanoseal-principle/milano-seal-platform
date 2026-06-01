# Milano Seal OS — Permanent Protocols

**Status:** Active  
**Authority:** Nick × Tiff  
**Last Updated:** 2026-05-31

These protocols are permanent. They govern operator behavior, system logic, and client-facing copy across all surfaces. No feature or automation may override them.

---

## 1. Protected Identifier Lock

### Doctrine

Protected identifiers are non-generative text. The system may display, compare, and flag them. It may never retype, normalize, format, shorten, correct, autofill, infer, reconstruct, translate, or alter them.

### Protected Field Types

- codice_fiscale
- bank_account_number, routing_number, IBAN, SWIFT
- passport_number, SSN, EIN, tax_id
- foreign_registration_number, court_case_number, property_parcel_id
- birth_date, legal_name, address
- notary_commission_number, tracking_number

### Validation States

`UNVERIFIED` → `SOURCE_CAPTURED` → `CHARACTER_VERIFIED` → `CLIENT_CONFIRMED` → `LOCKED_FOR_EXECUTION` → `LOCKED_FOR_APOSTILLE` → `LOCKED_FOR_RELEASE`

If discrepancy is found after release: `POST_RELEASE_CORRECTION_REQUIRED`

### Required Checkpoints

1. Before draft sent to client
2. Before RON session
3. Before notarization certificate applied
4. Before apostille packet submitted
5. Before shipping label created
6. Before final release email sent
7. After delivery if client flags discrepancy

### Failure Action

If mismatch exists: stop execution, set `RELEASE_HOLD`, create correction task, notify operator, block shipping.

---

## 2. Payment Rail Control

### Rule

Never send raw bank account numbers in emails, portal messages, invoices, drafts, PDFs, or API responses.

### Primary Payment Rail

**Wise payment link only:** `https://wise.com/pay/me/nicholassamm1`

All payment instructions must use the Wise link. Every payment must include a Matter ID reference.

### Payment Status Flow

`AWAITING_PAYMENT` → `PAYMENT_LINK_SENT` → `PAYMENT_RECEIVED` → `PAYMENT_RECONCILED` → `PAYMENT_LOCKED` → `SCHEDULING_UNLOCKED`

### Gate

Scheduling does not unlock until:
- `payment_status = PAID`
- `reconciliation_status = VERIFIED`

---

## 3. Italy Apostille QA Gate

### Trigger

Any matter where `destination_country = Italy` AND `apostille_required = true`.

Also applies to documents containing: codice fiscale, citizenship records, identity affidavits, civil registry matters, court matters, POA, name discrepancy affidavits, acknowledgment of maternity, birth/marriage/death/divorce/adoption records.

### 13-Point QA Checklist

1. Verify signer legal name
2. Verify all name variants
3. Verify birth date
4. Verify birthplace
5. Verify codice fiscale
6. Verify address
7. Verify attorney delivery address
8. Verify country of use
9. Verify notarial act type
10. Verify apostille cover letter
11. Verify shipping label
12. Verify final PDF matches approved version
13. Verify no AI-retyped identifier drift

### Hard Stop

No Italy matter may transition to `APOSTILLE_SUBMITTED`, `SHIPPED`, `RELEASED`, or `COMPLETED` unless `Italy_QA_Status = PASSED`.

---

## 4. Final Release QA Gate

### Release Authorization Requires

- Payment confirmed and reconciled
- Protected identifiers locked
- Italy QA passed (if Italy)
- Apostille complete (or apostille-not-required confirmed)
- Custody timeline complete
- Shipping label verified
- Final packet verified
- Client-safe release package generated

### Hard Stops

| Trigger | Blocks |
|---|---|
| PAYMENT_NOT_RECONCILED | SCHEDULED |
| PROTECTED_ID_UNVERIFIED | RON_COMPLETED |
| ITALY_QA_FAILED | APOSTILLE_SUBMITTED |
| RELEASE_QA_FAILED | SHIPPED |
| POST_RELEASE_ERROR | CLOSED |
| RELEASE_AUTHORIZATION_FAILED | PAID_AND_RELEASED |

---

## 5. Post-Release Correction Engine

### Trigger

Client, attorney, partner, operator, or receiving authority flags discrepancy after release.

### Actions

1. Set status `POST_RELEASE_CORRECTION`
2. Lock old version — do not overwrite historical record
3. Preserve original custody history
4. Create correction task
5. Require source comparison
6. Require protected identifier verification
7. Generate corrected packet
8. Send corrected version
9. Record client confirmation (`CLIENT_CONFIRMED_USABLE`)

---

## 6. Revenue Recognition Discipline

### Core Rule

Recognized revenue = actual cash collected only.

### Track Separately

- `recognized_revenue` — cash collected by Milano Seal
- `platform_payout` — platform charges (e.g., RON platform fee)
- `trade_value` — barter/non-cash value (notes only, not revenue)
- `pipeline_revenue` — unpaid open matters

### Prohibited

- Inflating recognized revenue with barter
- Counting platform gross as internal revenue
- Counting lost quotes as revenue
- Counting unpaid work as recognized revenue

---

## 7. Relationship Intelligence

### High-Value Relationship States

`LOST_BUT_WARM` is a high-value state, not a failed state.

### Rule: LOST_BUT_WARM

- Send relationship preservation reply
- Note future availability
- Keep partner warm
- No cheap notary positioning
- Do not archive as dead
- Do not downgrade to retail

### Avv. Irene Damiani / Damiani & Damiani

Classification: High LTV international attorney source  
Future work: Italian citizenship, POA, acknowledgment of maternity, one-and-the-same affidavits, name discrepancy affidavits, U.S. document execution for Italian legal matters.

---

## 8. Matter Criticality Engine

### Levels

| Level | Score | Behavior |
|---|---|---|
| LOW | 0–14 | Normal queue |
| NORMAL | 15–34 | Standard priority |
| HIGH | 35–54 | Elevated queue |
| CRITICAL | 55–79 | Operator escalation |
| EXECUTIVE | 80–100 | Nick review required |

### Inputs (Real Fields Only)

travel_date, court_date, closing_date, embassy_appointment, matter_status, payment_status, protected_identifier_status, apostille_status, courier_status, release_status, italy_qa_status, destination_country, receiving_authority_friction, client_tier, relationship_state.

No fake urgency.

---

## 9. Source of Truth Engine

Every workflow rule requires:

- `source_type` — HCCH / STATE_AUTHORITY / EMBASSY / CONSULATE / RECEIVING_AUTHORITY / PARTNER_CONFIRMED / CLIENT_PROVIDED / OPERATOR_OBSERVED / INTERNAL_CASE_MEMORY
- `source_reference`
- `review_date`
- `confidence_level`
- `verified_by`
- `valid_from` / `valid_to`

**Rule:** If no source, show "Verification Required." Never assert as confirmed fact.

---

## 10. Copy Rules

### Use

- Global Document Intelligence
- Execution Readiness
- Chain of Custody
- Receiving Authority Intelligence
- Payment-Gated Execution
- International Release
- Paid & Released
- Verification Required
- Items to Review Before Execution
- Coordinator Review

### Never Use

- Mission Control
- Sovereign Command / Sovereign OS
- Trust Engine Armed
- Checkout / Buy Now / Order
- Guaranteed acceptance
- Embassy verified
- Government approved
- Legal advice

### Required Disclaimer (Authority Pages)

> The Milano Seal is not a law firm and does not provide legal advice. Requirements should always be confirmed with the receiving authority. International document requirements may change.

---

## 11. Security Field Rules

**Never expose to portal/client:**

internal_notes, operator_notes, margin, base_cost, shipping_cost, label_url, storage_path, file_path, raw webhook payload, partner payout, VA notes, service role keys

**Never expose to alliance:**

Unrelated matters, client-private documents, margin, operator notes, internal shipping cost

**Never expose to VA:**

Revenue, partner payouts, margins, admin controls, unrelated matters
