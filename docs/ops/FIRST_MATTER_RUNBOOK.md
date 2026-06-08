# First Matter Operator Runbook

**The Milano Seal™ — Operator Reference**
Version: 1.0 | Classification: Operator-Facing

This runbook covers the complete lifecycle of a paid matter from intake to archive. Every step must be executed in order. No step may be skipped without documented operator justification.

---

## 1. INTAKE

- [ ] **(Client)** Client submits Smart Intake form via /intake
- [ ] **(Operator)** Operator reviews scope: confirms document type, count, and service required
- [ ] **(Operator)** Operator confirms destination country and intended use (e.g., court filing, consulate submission, property transaction)
- [ ] **(Operator)** Operator flags any missing information and assigns a VA follow-up task if applicable
- [ ] **(VA)** VA contacts client for missing items per assigned follow-up task
- [ ] **(Operator)** Operator sets matter status: `intake_review` → `reviewed`

---

## 2. QUOTE & INVOICE

- [ ] **(Operator)** Operator generates invoice in Invoice Studio
- [ ] **(Operator)** Operator confirms pricing matches full scope: apostille, notarization, RON, courier, translation coordination as applicable
- [ ] **(Operator)** Operator sends invoice to client via approved method (platform message or email)
- [ ] **(Client)** Client receives invoice with Wise payment instructions and matter reference number

---

## 3. PAYMENT CONFIRMATION

- [ ] **(Client)** Client initiates Wise transfer per invoice instructions
- [ ] **(System)** Wise webhook `outgoing_payment_sent` event received — **this event does NOT confirm payment has cleared**
- [ ] **(Operator)** Operator reviews Wise transaction in Reconciliation Desk — do not rely on webhook alone
- [ ] **(Operator)** Operator confirms full payment amount received and reconciled
- [ ] **(Operator)** Operator marks matter status: `awaiting_payment` → `payment_confirmed`
- [ ] **(System)** Payment gate opens; scheduling becomes available for this matter

---

## 4. SCHEDULING

- [ ] **(Operator or VA)** Operator or VA confirms appointment type: RON (Remote Online Notarization) or in-person
- [ ] **(VA)** VA confirms signer's email address — spelling verified character by character before sending
- [ ] **(System or Operator)** Client receives scheduling confirmation with date, time, and session instructions
- [ ] **(Operator)** Operator sets matter status: `payment_confirmed` → `scheduled`

---

## 5. EXECUTION (NOTARIZATION / RON)

- [ ] **(Operator or Notary)** Operator or commissioned notary executes the signing session
- [ ] **(Operator)** All required notarial certificates prepared and attached to session record
- [ ] **(System)** Signed documents stored privately in secure vault — not accessible to client at this stage
- [ ] **(System)** BlueNotary `session_completed` webhook received — **this event does NOT auto-release documents to client**
- [ ] **(Operator)** Operator holds documents pending QA; marks matter: `in_execution` → `execution_complete`

---

## 6. APOSTILLE / AUTHENTICATION

- [ ] **(Operator)** Operator identifies correct apostille authority: state-level Secretary of State or federal authority (U.S. Department of State) depending on document origin
- [ ] **(Operator)** Documents submitted to issuing authority per their requirements (mail, in-person, or courier)
- [ ] **(Operator)** Operator tracks apostille status; updates matter notes with submission reference if available
- [ ] **(Operator)** Apostille certificate returned and attached to matter record
- [ ] **(Operator)** Operator marks matter: `apostille_in_progress` → `apostille_complete`

> **Note:** For Authentication / Legalization (non-Hague countries), the chain may include state-level notarization, state authentication, federal authentication, and consular legalization. Each step must be tracked separately.

---

## 7. PACKAGING QA

- [ ] **(VA)** VA prepares packaging checklist against matter scope
- [ ] **(VA)** All documents accounted for: originals, certified copies, apostille certificates, translations if applicable
- [ ] **(VA)** Final document count confirmed and noted in matter record
- [ ] **(Operator)** Operator reviews and approves final packet — no items missing
- [ ] **(Operator)** Packet marked: `ready_for_courier`

---

## 8. COURIER / SHIPPO LABEL

- [ ] **(Operator)** Operator validates final delivery address against intake record — any discrepancy must be resolved before label purchase
- [ ] **(Operator)** Operator previews shipping rates in Shippo integration
- [ ] **(Operator)** Operator purchases Shippo label — **VA cannot purchase labels**
- [ ] **(System)** Tracking number assigned to matter record automatically
- [ ] **(System)** Shipment status set: `in_transit`

---

## 9. DELIVERY TRACKING

- [ ] **(System)** Shippo webhook `track_updated` received and logged
- [ ] **(Operator)** Tracking number and carrier updates visible in Courier Custody Rail
- [ ] **(System)** Shippo webhook `delivered` event received
- [ ] **(System)** System creates `DELIVERED_NOT_RELEASED` state — documents remain in operator custody
- [ ] **(Operator)** **Documents are NOT released automatically on delivery confirmation**

---

## 10. RELEASE REVIEW

- [ ] **(Operator)** Operator confirms delivery with carrier confirmation number or scan record
- [ ] **(Operator)** Operator confirms full payment has cleared — reconcile again if matter was on extended timeline
- [ ] **(Operator)** Operator reviews Release Desk — all matter requirements visible in single view
- [ ] **(Operator)** Operator confirms all matter requirements are met: execution complete, apostille complete, delivery confirmed, payment cleared
- [ ] **(Operator)** Operator explicitly approves release — no automated trigger
- [ ] **(System)** Status updated: `delivered` → `paid_and_released`

---

## 11. RELEASE & CERTIFICATE

- [ ] **(Operator or System)** Documents released to client via approved secure method
- [ ] **(System)** Verification certificate generated with matter ID and release timestamp
- [ ] **(System)** Certificate logged in verification records — accessible at /verify/[matter-id]
- [ ] **(Operator)** Client notified of release with verification link

---

## 12. CLIENT FINAL COMMUNICATION

- [ ] **(Operator or VA)** Final delivery confirmation email sent to client
- [ ] **(Operator or VA)** Client instructed on how to present document abroad: consulate submission, registry filing, or recipient-specific requirements as applicable
- [ ] **(Operator or VA)** Any remaining client questions answered before matter is closed

---

## 13. INTERNAL CLOSE

- [ ] **(Operator)** Operator adds institutional memory note: routing details, authority contact, any issues encountered — for future matters on same corridor
- [ ] **(Operator)** Matter marked: `completed`
- [ ] **(Operator)** Revenue logged in financial record
- [ ] **(Operator)** If Alliance partner referred this matter: referral commission calculated per program terms
- [ ] **(System)** Matter archived and removed from active queue

---

**End of Runbook**

> Questions about a specific step? Contact the operator on duty. Do not improvise steps not listed here. If a situation arises that is not covered, escalate to operator before proceeding.
