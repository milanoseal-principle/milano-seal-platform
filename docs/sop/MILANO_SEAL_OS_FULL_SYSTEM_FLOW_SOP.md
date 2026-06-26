# THE MILANO SEAL™ OS SOP

## Universal Full System Flow, Production Spine, and Operating Protocol

Version: Production Operating Spine  
System: Milano Seal OS  
Brand: The Milano Seal™  
Tagline: Sealing Trust with Every Signature  
Core Standard: Controlled U.S. document execution, RON coordination, apostille coordination, Wise-first payment, international release, client portal tracking, operator command center, and authority-growth intelligence.

## 1. Purpose

The Milano Seal OS controls every international document matter from first inquiry through final delivery. The system prevents loose execution, missing data, payment confusion, apostille packet errors, courier uncertainty, and client communication gaps.

Every matter moves through one controlled spine:

Client Inquiry → Smart Intake → Trust Engine → Matter Qualification → Compliance Routing → Pricing Engine → Pro Forma Invoice → Wise Deposit / Payment → Scheduling → RON / Execution → Apostille Packet → State Processing → Final Balance → Paid & Released → Branded Final Packet → Courier Tracking → Delivery → Completion → Review → Relationship / SEO / Data Growth.

## 2. Universal System Rules

1. No matter moves outside structured intake.
2. Every matter receives a unique matter reference.
3. Supabase or the active matter database is the source of truth.
4. Wise is the primary production payment rail.
5. Discount codes apply before Wise payment instructions.
6. Client-side payment status is never trusted.
7. Scheduling unlocks only after confirmed payment or approved retainer.
8. Final release unlocks only after final balance is confirmed.
9. Every operator action writes an event ledger entry.
10. Client portal shows only client-safe matter data.
11. Operator dashboard shows full internal control data.
12. No Stripe checkout or Stripe promotion-code dependency.
13. No cheap notary, discount marketplace, or DIY legal positioning.
14. No legal advice is provided by Milano Seal.
15. Every document is treated as a controlled international execution record.

## 3. Locked Pricing

- Signature Lane: $750.
- Priority Lane: $975.
- Executive Lane: $1,850.
- Custom Matter: review path only, not a public fourth lane.
- Apostille Coordination: $275 first document.
- Rush / Same-Day Handling: $175.
- Additional Signer: $75.

## 4. Payment Gates

- No quote means no payment instructions.
- No deposit or payment means no scheduling.
- No scheduled execution means no RON.
- No RON completion means no apostille submission.
- No apostille received means no final packet.
- No final payment means no release.
- No tracking means no shipment confirmation.
- No delivery means no completion.
- No completion means no review request.

Client-side query parameters cannot mark paid. Only a verified Wise webhook or authenticated operator confirmation can unlock gates.

## 5. Client Portal Safety

The client portal may show matter reference, client-safe status, document type, destination country, lane, invoice totals, discount, Wise reference, payment status, release status, courier status, tracking number, next step, completion status, and support CTA.

The client portal must hide internal notes, cost, margin, operator flags, admin controls, raw database fields, and unrelated matters.

## 6. Operator Event Ledger

Every matter action writes an event ledger entry with matter ID, event type, actor, timestamp, status before, status after, message, and metadata.

Core event names include INTAKE_CREATED, MATTER_CREATED, SMART_REQUEST_PARSED, COMPLIANCE_VERIFIED, PORTAL_LINK_CREATED, QUOTE_GENERATED, INVOICE_SENT, DISCOUNT_APPLIED, DISCOUNT_REJECTED, DISCOUNT_REMOVED, PAYMENT_INSTRUCTIONS_SENT, WISE_PAYMENT_PENDING, WISE_PAYMENT_CONFIRMED, MANUAL_PAYMENT_CONFIRMED, PAYMENT_MISMATCH_FLAGGED, DEPOSIT_CONFIRMED, FINAL_PAYMENT_CONFIRMED, SCHEDULING_UNLOCKED, RELEASE_UNLOCKED, EXECUTION_SCHEDULED, EXECUTION_STARTED, RON_COMPLETED, EXECUTION_COMPLETED, APOSTILLE_SUBMITTED, APOSTILLE_PROCESSING, APOSTILLE_RECEIVED, APOSTILLE_REJECTED, FINAL_PAYMENT_REQUESTED, READY_FOR_RELEASE, FINAL_PACKET_ASSEMBLED, TRACKING_ADDED, SHIPPED, DELIVERED, COMPLETED, REVIEW_REQUESTED, LOST, DORMANT, and FOLLOWUP_STOPPED.

## 7. Final Control Statement

The Milano Seal OS is not a notary website. It is a controlled international document execution operating system. Its value is structured intake, jurisdiction routing, clean execution, payment control, apostille packet discipline, chain-of-custody tracking, premium client communication, and relationship-driven authority growth.
