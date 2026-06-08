# Operator Governance Doctrine

**Status: DOCTRINE — Governs language, structure, and operator tooling**

---

## 1. Quick Action Routing Language

### Core Rule

A Quick Action may route, summarize, flag, prepare, or recommend.

A Quick Action may **not** approve, charge, schedule, execute, release, certify, or close a matter without the required system state being satisfied.

### Quick Action Classes

**A. REVIEW ACTIONS**
Move the operator to a review surface. Do not change matter state.
- Review Intake, Review Documents, Review Compliance, Review Payment Status, Review Delivery Status, Review Client Message, Review Source Conflict

**B. PREPARE ACTIONS**
Create draft-ready outputs only. Do not send, submit, or finalize.
- Prepare Pro Forma, Prepare Client Update, Prepare Apostille Packet, Prepare Delivery Instructions, Prepare Missing Info Request

**C. ROUTE ACTIONS**
Move the matter into the correct operator lane. Do not complete execution.
- Route to Compliance Review, Route to Payment Follow-Up, Route to Apostille Review, Route to Manual Review, Route to Founder Review

**D. FLAG ACTIONS**
Identify issues that may block progress. Require operator review before any resolution is recorded.
- Flag Missing Field, Flag Payment Mismatch, Flag Source Conflict, Flag Document Risk, Flag Jurisdiction Conflict, Flag Delivery Exception

**E. LOCKED ACTIONS**
Remain unavailable until required preconditions are satisfied.
- Schedule Execution, Release Documents, Mark Paid & Released, Close Matter

### Routing Language Standard

Use: Review, Prepare, Route, Flag, Confirm, Lock, Unlock, Hold, Resume

Avoid: Auto-approve, Auto-certify, Auto-release, Auto-complete, Guaranteed valid, Fully verified (unless operator verified), Live status (unless verified by production data)

### Canonical Quick Action Rule

Every Quick Action must answer:
1. What surface does this move the operator to?
2. What system condition must be true before it can progress?
3. What human confirmation is still required?

### Display Language

| State | UI Copy |
|---|---|
| Review Required | This matter has a suggested next action, but no execution step has been completed automatically. |
| Prepared for Operator Review | A draft or routing recommendation is ready. Confirm before sending, scheduling, submitting, or releasing. |
| Locked Until Payment | Scheduling and execution remain unavailable until payment is confirmed. |
| Locked Until Compliance Review | This matter requires review before execution. |
| Locked Until Source Conflict Is Resolved | One or more source fields conflict. Operator review required. |
| Ready for Confirmation | All visible prerequisites appear satisfied. Operator must confirm before the system records the next state. |

---

## 2. Atlas Source Governance

### Core Rule

No source is treated as final simply because it exists. Every source must carry origin, authority, freshness, scope, and verification status.

Atlas governs source confidence before the Truth Engine displays system confidence.

### Source Object Fields

| Field | Values |
|---|---|
| `source_type` | client_submission, operator_entry, uploaded_document, generated_document, payment_provider, courier_provider, apostille_authority, compliance_reference, internal_sop, website_content, dashboard_record, portal_record, email_thread, manual_override |
| `source_authority_level` | controlling, primary, supporting, contextual, unverified, deprecated |
| `source_freshness` | current, recent, aging, stale, unknown |
| `verification_status` | not_reviewed, pending_review, verified, partially_verified, conflicting, rejected, superseded |
| `conflict_status` | no_conflict, possible_conflict, confirmed_conflict, resolved_conflict |
| `resolution_status` | unresolved, operator_resolved, client_confirmed, provider_confirmed, authority_confirmed, superseded |
| `source_visibility` | internal_only, operator_only, client_safe, public_safe, restricted |
| `source_risk_level` | low, medium, high, critical |
| `operator_action_required` | none, review, verify, reconcile, request_client_confirmation, block_progress, escalate |

### Governance Rules

1. Client-submitted information is never final until reviewed.
2. Uploaded documents outrank typed intake fields for document content.
3. Payment provider records outrank manual payment notes for payment status.
4. Courier provider records outrank manual delivery assumptions for delivery state.
5. Internal SOP controls process sequence.
6. Public website copy does not control matter-specific execution.
7. Operator override must be logged with reason.
8. Conflicting sources must block affected downstream actions.
9. Deprecated sources remain visible for audit but cannot control current state.
10. Client-safe surfaces must never expose restricted source notes.

### Source Display Language

| State | Label |
|---|---|
| Source Pending Review | This information exists but has not yet been verified. |
| Source Verified | Confirmed against an accepted source. |
| Source Conflict | Two or more sources do not match. Reconciliation required. |
| Source Superseded | Replaced by a newer or more authoritative record. |
| Operator Verified | A human operator reviewed and accepted this field. |
| Authority Verified | Confirmed by an external authority, provider, or official source. |
| Client Confirmed | Client confirmed; operator review may still be required for execution. |

---

## 3. Truth Engine Health Model

### Core Rule

Truth Engine health may inform operator attention. Truth Engine health may not authorize execution by itself.

The Truth Engine must never display fake certainty, imply legal approval, replace operator judgment, or invent health from missing data.

### Health Domains

| Domain | Measures | Labels |
|---|---|---|
| Structure Health | Required fields, matter ID, client record, destination, origin, document type, signer count | Structured / Partially Structured / Missing Required Fields / Intake Incomplete |
| Source Health | Source records attached, authority level, verification status, conflict status | Source Verified / Source Pending / Source Conflict / Source Missing |
| Compliance Health | Destination reviewed, RON eligibility, apostille requirement, translation risk | Compliance Reviewed / Compliance Pending / Compliance Conflict / Manual Review Required |
| Payment Health | Invoice created, payment received, reconciled, gate satisfied | Payment Locked / Payment Pending / Payment Confirmed / Payment Conflict |
| Execution Health | Scheduling unlocked, signer verified, document approved, session completed | Execution Locked / Ready for Scheduling / In Execution / Execution Complete / Execution Blocked |
| Custody Health | Apostille, courier label, tracking, delivery, release approved | Custody Pending / Apostille Processing / Ready for Release / In Transit / Delivered / Released |
| Operator Health | Review completed, open flags, escalation status | Operator Clear / Operator Review Needed / Escalated / Blocked / Dormant |
| System Health | API reachable, DB reachable, providers connected, webhooks valid | Connected / Degraded / Disconnected / Not Verified / Manual Mode |

### Health Tiers

| Tier | Definition |
|---|---|
| **HEALTHY** | All required fields present, controlling sources verified, no conflicts open, payment/compliance gates satisfied, matter in allowed state. |
| **WATCH** | Mostly structured but has pending review, missing supporting data, aging source freshness, or a non-blocking operator task. |
| **BLOCKED** | Cannot move forward — required field, payment, compliance, document approval, signer verification, or source conflict is unresolved. |
| **CONFLICT** | Two or more sources disagree on a field that affects pricing, compliance, payment, execution, apostille, custody, or release. |
| **LOCKED** | Intentionally prevented from moving forward until a required condition is satisfied. |
| **NOT VERIFIED** | Not enough confirmed data to claim system health. |

### Score Doctrine

Do not use fake numeric scores publicly. No public page may show fake trust score, fake matter count, fake country count, fake live status, fake completion percentage, or fake operator activity.

**Recommended public-safe language:** Under Review, Verified by Operator, Payment Confirmed, Scheduled, In Execution, Apostille Processing, In Transit, Delivered, Paid & Released

**Operator-only language:** Source Conflict, Payment Reconciliation Required, Manual Review Required, Compliance Blocked, Webhook Not Verified, Matter Health: Watch, Matter Health: Blocked

### Truth Engine Lock Rules

1. Payment not confirmed → scheduling locked
2. Compliance not reviewed → execution locked
3. Source conflict on destination country → apostille routing locked
4. Signer identity unresolved → execution locked
5. Document type unknown → pricing and compliance pending
6. Courier delivery not confirmed → release pending
7. Webhook unverified → payment must remain pending or manual review
8. Operator override → event log must capture reason
9. System health degraded → operator must be notified
10. Data missing → health must say Not Verified, not Healthy

---

## 4. Combined Doctrine Rule

Quick Actions route operator attention.
Atlas governs source truth.
Truth Engine summarizes readiness.

None of the three replaces the locked Milano Seal SOP.

**The locked execution order remains:**

Client → Intake → Validation → Trust Engine → Pricing → Compliance → Pro Forma / Quote → Payment → Scheduling → Execution → Apostille → Delivery → Completion → Review

### Governance Statement

Quick Actions, Atlas, and Truth Engine must be treated as governance doctrine until implemented, tested, and verified. They may be included in architecture documents, dashboard planning, command center language, and operator SOPs. They must not be represented as active runtime logic, production automation, or verified system telemetry until repo implementation, database migration, endpoint verification, role testing, and smoke testing prove they are live.
