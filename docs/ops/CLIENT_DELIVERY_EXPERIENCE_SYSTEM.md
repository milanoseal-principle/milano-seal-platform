# The Milano Seal™ — Client Delivery Experience System

**Classification:** Internal SOP  
**Module:** Client Delivery & Final Release  
**Status:** Active  
**Owner:** Founder / Execution Coordinator

---

## Purpose

This SOP defines the end-to-end client delivery experience from execution completion through final document release. Every touchpoint must reinforce the same standard: secure, visible, premium, and operationally exact.

---

## Delivery Trigger

Delivery process initiates when ALL of the following are true:

1. `payment_confirmed = true`
2. `matter_status = "in_transit"` or `"delivered"`
3. Notarization executed and logged
4. Apostille / legalization completed (if required)
5. Courier released by founder (`courier_released_at` set)

---

## Delivery Stages

### Stage 1 — Pre-Release Verification (Internal)

**Actor:** Founder / Execution Coordinator  
**Actions:**
- Verify executed documents match intake specifications
- Confirm page count, notarial certificate, and seal are complete
- Verify apostille certificate (if applicable) is attached
- Log `DOCUMENTS_VERIFIED` event in audit ledger
- Confirm courier tracking number is set in Supabase

**Checklist:**
- [ ] Notarial execution complete
- [ ] Apostille certificate attached (if applicable)
- [ ] Courier label created and tracking number active
- [ ] Wise payment confirmed in ledger
- [ ] Client name and destination on courier label match matter
- [ ] PDF version locked and watermarked (if digital delivery)

---

### Stage 2 — Courier Release

**Actor:** Founder (only)  
**Actions:**
- Click "Release Courier" in dashboard
- System sets `courier_released_at`, logs `COURIER_RELEASED` event
- Client portal shows updated delivery status
- Automated status push to client portal (Supabase realtime)

**VA Restriction:** VA operators cannot trigger courier release.

---

### Stage 3 — Client Notification

**Actor:** Founder / Coordinator  
**Channel:** Email (direct, not automated spam)  
**Template:** See `PAID_AND_RELEASED_EMAIL_TEMPLATE.md`

**Contents:**
- Matter ID confirmation
- Courier tracking number and carrier
- Estimated delivery date
- Portal link for live tracking
- Coordinator contact for questions

---

### Stage 4 — Delivery Confirmation

**Actor:** System / Coordinator  
**Trigger:** Courier delivers (or coordinator manually confirms)  
**Actions:**
- Set `matter_status = "delivered"`
- Log `DELIVERY_CONFIRMED` event
- Client portal status updates automatically
- Begin 48-hour review window

---

### Stage 5 — Final Completion & Review Request

**Actor:** Coordinator  
**Timing:** 48–72 hours after delivery confirmation  
**Actions:**
- Set `matter_status = "completed"`
- Log `MATTER_COMPLETED` event
- Send review request (template: `CLIENT_DELIVERY_FOLLOWUP_TEMPLATE.md`)
- Review request visible in client portal only after `matter_status = "completed"`

**Rule:** Review request is NEVER sent before delivery confirmation.

---

## Digital Delivery (RON / E-Document)

For matters where documents are delivered digitally:

1. PDF locked using version control protocol (see `PDF_LOCKING_AND_VERSION_CONTROL.md`)
2. Document uploaded to Supabase Storage — client vault
3. Client portal Document Vault shows download link
4. Log `DOCUMENT_VAULT_UPLOADED` event
5. Set `digital_delivery_complete = true`
6. Proceed to Stage 5 (review request after 48 hours)

---

## Client Portal — Delivery View

The client portal must show during delivery:

| Field | Value |
|---|---|
| Status | Shipped / Delivered |
| Carrier | [carrier name] |
| Tracking Number | [linked to carrier] |
| Estimated Delivery | [date] |
| Documents | Available in Document Vault (digital only) |

**Never show in client portal:**
- Internal courier cost / shipping spread
- Label URL
- Operator release notes
- Shippo raw API response

---

## Escalation Path

| Scenario | Action |
|---|---|
| Delivery delayed beyond ETA | Coordinator contacts carrier, updates client via direct message |
| Package refused / returned | Founder notified immediately, matter reopened |
| Document damaged in transit | Founder assesses, re-execution or insurance claim initiated |
| Client unreachable for digital delivery | Document held in vault, follow-up at 7 and 14 days |

---

## Prohibited Actions

- Do NOT mark `matter_status = "completed"` before delivery is confirmed
- Do NOT send review request before `matter_status = "completed"`
- Do NOT expose courier cost, label URL, or Shippo data to client
- Do NOT release documents before `payment_confirmed = true`
- VA operators may NOT trigger delivery completion or review request

---

## Audit Events — Delivery Sequence

| Event | Trigger |
|---|---|
| `DOCUMENTS_VERIFIED` | Pre-release check complete |
| `COURIER_RELEASED` | Founder clicks Release Courier |
| `TRACKING_ACTIVE` | Carrier scans package |
| `DELIVERY_CONFIRMED` | Delivery marked complete |
| `MATTER_COMPLETED` | Final completion set |
| `REVIEW_REQUESTED` | Review request sent |
