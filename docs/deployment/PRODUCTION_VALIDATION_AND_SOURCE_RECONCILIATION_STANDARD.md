# The Milano Seal™ Production Validation & Source Reconciliation Standard

**Entity:** The Milano Seal International LLC dba The Milano Seal
**Scope:** International document execution ecosystem including notarization, apostille, legalization, translation, authentication, identity verification, custody, shipment/logistics, payment, and operational intelligence.

This is a validation and reconciliation standard. Architecture readiness is not proof of complete live reconciliation.

## Current control hierarchy

1. `docs/FINAL_PRODUCTION_CERTIFICATION.md`
2. `data/matter-state-machine.ts`
3. `docs/MILANO_SEAL_OS_PORTAL_STANDARD.md`
4. Canonical Wise-only payment and reconciliation implementation
5. Canonical Matter read projection and source/database wiring validators

No historical document may redefine the Matter lifecycle, payment gate, release gate, role model, or client projection.

## Required validation outputs

| Validation Area | Required Evidence |
|---|---|
| Matter reconciliation | Every imported Matter mapped to a canonical Matter ID or documented unresolved record |
| Client reconciliation | Every client identity normalized or documented for review |
| Organization reconciliation | Every authority, professional organization, translator, logistics provider, notary, and partner organization reconciled |
| Document reconciliation | Every uploaded document represented by a canonical document record |
| Execution reconciliation | Every notarization, apostille, legalization, translation, authentication, shipment, and delivery represented as structured execution events |
| Workflow integrity | Every Matter follows the current canonical state machine with no skipped or fabricated states |
| Financial reconciliation | Quotes, invoices, Wise payments, complimentary authorizations, refunds, and revenue events linked without duplication |
| Provenance | Every material fact traceable to its source upload, intake, provider event, operator action, or system event |
| Confidence | Match confidence and review status stored for inferred relationships |
| Completeness | Matter-level and platform-level completeness scoring |
| Exceptions | Human review queue containing unresolved, conflicting, incomplete, or ambiguous records |

## Non-negotiable reconciliation rules

The platform must never silently invent a client, organization, Matter, document, execution event, payment, shipment, authority response, or completed workflow state.

The platform must never silently merge unrelated records, discard unresolved records, overwrite original source material, or convert planned execution into completed execution.

## Required unresolved states

```text
UNRESOLVED_CLIENT
UNRESOLVED_ORGANIZATION
UNRESOLVED_DOCUMENT
UNRESOLVED_MATTER
AMBIGUOUS_MATCH
POSSIBLE_DUPLICATE
SOURCE_CONFLICT
EXECUTION_REVIEW_REQUIRED
FINANCIAL_RECONCILIATION_REQUIRED
LOW_CONFIDENCE_MATCH
MISSING_PROVENANCE
INCOMPLETE_EXECUTION_CHAIN
```

## Execution event minimum

Every material execution event should retain:

```text
Event ID
Canonical Matter ID
Canonical Client ID
Related Organization ID(s)
Related Document ID(s)
Execution Owner
Participants
Execution Type / Subtype
Planned or Actual
Execution Status
Start / End Timestamp
Country / Jurisdiction / Destination
Service Lane
Notarial Act
Authentication / Apostille / Legalization Status
Shipping Status
Payment Status
Outcome
Next Action
Next Action Owner
Next Action Due Date
Source Type
Source File / Source Event ID
Original Source Content
Match Confidence
Verification Status
Created Timestamp
Last Reconciled Timestamp
```

Structured intelligence enriches source material. It never replaces the original source.

## Financial validation

Each financial object reconciles independently and without duplication:

- Quote
- Invoice
- Payment Request
- Wise Payment
- Complimentary Authorization
- Adjustment
- Refund
- Revenue Recognition
- Shipment Charges
- Service Fees

No source-only validator may claim a real payment occurred.

## Workflow validation

The only canonical lifecycle is the implementation in `data/matter-state-machine.ts`.

Do not restate a reduced lifecycle here. This prevents documentation drift from becoming a second state machine.

## Source provenance

Every material fact must be attributable to an authorized source such as:

- Client Intake
- Uploaded File
- Operator Action
- Founder Action
- Wise Event
- Remote Notarization Event
- Courier Event
- Government / Receiving Authority Response
- Internal Platform Event
- Verified API Response
- Manual Administrative Action

## Acceptance criteria

Production acceptance requires:

- every inventoried source file has a documented disposition
- every imported Matter is accounted for
- verified execution events retain provenance
- planned and completed execution remain distinguishable
- financial events pass duplicate and reconciliation checks
- document records reconcile to canonical Matters
- unresolved high-severity conflicts remain visible
- zero silent record drops
- zero fabricated execution/payment/shipping/authority events
- all source/database validators pass
- all type checks, tests, builds, route checks, and production governance gates pass
- live client-to-close acceptance is completed under `docs/FINAL_PRODUCTION_CERTIFICATION.md`

## Isolation rule

The Milano Seal production application may use external UX references only as abstract interaction patterns. External business models, employer workflows, provider/referral systems, claims-recovery logic, event-intelligence products, and foreign branding are excluded from the canonical Milano Seal product.

## Certification language

Until live certification passes, the correct statement is:

> The Milano Seal platform is architecturally and operationally capable of supporting its current international document execution workflows, but live client-to-close production certification remains governed by the controlling production certification runbook.

Only after the controlling live certification passes may production be described as transaction-certified against that acceptance run.
