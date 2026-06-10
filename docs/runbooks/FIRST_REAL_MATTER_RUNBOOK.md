# First Real Matter Runbook
## The Milano Seal™ — Operator SOP

**Audience:** Founder / Admin Operator only  
**Applies to:** Every matter from intake to completion

---

## STEP 1 — Intake Received

- Confirm intake email arrives at `themilanoseal@gmail.com`
- Confirm matter appears in `/dashboard` with `deal_status = awaiting_payment`
- Confirm `payment_status = unpaid`
- Confirm `deal_id` format: `MS-YYYY-NNNN`
- Confirm `portal_url` was sent to client

**If intake failed:**  
Check `/api/admin/db-health` → paste result and fix before proceeding.

---

## STEP 2 — Review Document

- Open matter in dashboard
- Review: client name, destination country, document type, signer count
- Check for compliance flags (apostille required, federal conflict, RON eligibility)
- Check routing warnings in the matter record

---

## STEP 3 — Classify Matter

| Pattern | Classification |
|---|---|
| Apartment/ID verification/domestic RON | Domestic Simple — platform_fee_only |
| Single doc, domestic, no apostille | Signature Lane |
| Apostille required | Priority or Executive |
| Multi-country / multi-signer | Priority or Executive |
| Urgent + international | Executive Lane |

---

## STEP 4 — Assign Lane & Confirm Price

**Standard lanes:**
- Signature: $750
- Priority: $950+
- Executive: $1,500+

**Domestic Simple (platform_fee_only):**
- Navigate to `/dashboard/founder-pricing`
- Enter deal_id or client email
- Set `finalClientPrice = 25`, `discountType = platform_fee_only`, `serviceFeeWaived = true`
- Apply override → Wise invoice is suppressed
- Client directed to BlueNotary platform payment

---

## STEP 5 — Confirm Jurisdiction

- Verify origin state (signer's state at time of execution)
- Verify destination country requirements (Hague member vs. non-Hague)
- Confirm apostille path: Secretary of State → Embassy/Consulate if needed
- Confirm notary type: RON (Colorado) vs. wet ink vs. mobile

---

## STEP 6 — Confirm Signer Location

- Signer must be physically present in RON-eligible state for RON
- If mobile: confirm address, mileage, after-hours flag
- If wet ink: confirm signing location

---

## STEP 7 — Quote & Payment Path

**Full Milano Seal matter:**
- Wise payment link auto-generated at intake
- Client sees: invoice retainer (50%) due now, balance due on completion
- Send client to `portal_url`

**Platform-fee-only matter:**
- No Wise invoice
- Direct client to BlueNotary or state fee payment externally
- Confirm payment manually, mark `payment_status = paid` in dashboard

---

## STEP 8 — Confirm Payment

- Monitor Wise webhook → `payment_status` updates to `paid` automatically
- For platform-fee-only: update manually in dashboard after external confirmation
- Confirm `deal_status` advances to `scheduled`

---

## STEP 9 — Schedule Execution

- Contact client to schedule RON session or in-person appointment
- Confirm date, time, platform (BlueNotary for RON)
- Add scheduling note to matter

---

## STEP 10 — Complete Notarization

**RON:**
- Launch BlueNotary session
- Verify signer identity via KBA/credential analysis
- Execute document with electronic seal + journal entry
- Download completed PDF from BlueNotary
- Upload to matter vault (`/portal/documents`)

**Wet Ink / Mobile:**
- Execute at signing location
- Scan and upload completed document

---

## STEP 11 — Submit Apostille (if required)

- Prepare cover letter addressed to Secretary of State
- Submit document + cover letter to SOS apostille department
- Note tracking number / submission date in matter
- Update `deal_status = apostille`

---

## STEP 12 — Create Courier Label (if required)

- Once apostille is received, prepare courier package
- Create label via Shippo (or FedEx/UPS direct for high-value)
- Upload tracking confirmation to matter
- Update `deal_status = shipped`

---

## STEP 13 — Confirm Delivery

- Monitor tracking
- On delivery confirmation, update matter
- Note delivery date, recipient confirmation if available
- Update `deal_status = delivered` (if used) or proceed to release

---

## STEP 14 — Release Documents

- Navigate to `/portal/release` or trigger release from dashboard
- Confirm balance payment received before releasing (if balance outstanding)
- Mark release confirmed
- Update `deal_status = completed`

---

## STEP 15 — Request Review

- Triggered automatically when `deal_status = completed` or `released`
- Verify `SealImpressionReview` prompt appears in client portal
- If client needs manual reminder: send portal link with `/review` path
- DO NOT request review before completion
- DO NOT offer incentives for reviews

---

## STEP 16 — Mark Completed

- Confirm `deal_status = completed`
- Confirm `payment_status = paid`
- Confirm all documents uploaded to vault
- Confirm custody ledger entries are present

---

## STEP 17 — Close Audit Log

- Verify `activity_logs` has entries for:
  - `created`
  - `payment_confirmed`
  - `execution_scheduled` (or equivalent)
  - `completed`
- If founder pricing override was applied, verify `founder_pricing_override` event is logged

---

## QUICK REFERENCE

| Status | Meaning |
|---|---|
| `awaiting_payment` | Intake complete, payment not received |
| `scheduled` | Payment confirmed, execution scheduled |
| `in_execution` | Notarization in progress |
| `apostille` | Submitted to SOS |
| `shipped` | Courier in transit |
| `completed` | Delivered and released |
| `lost` | Matter did not convert |

---

## SECURITY REMINDERS

- Never share `internal_notes`, `discount_reason`, or `operator_notes` with client
- Never confirm document is "legally approved" or "guaranteed by government"
- Never request review before completion
- Never apply pricing to a matter that involves referral fees or case kickbacks
- Portal projection blocklist enforced server-side — no manual override needed

---

*The Milano Seal™ — Sealing Trust with Every Signature™*
