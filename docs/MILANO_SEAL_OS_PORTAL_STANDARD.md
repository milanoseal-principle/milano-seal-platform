# The Milano Seal™ OS — Portal and UX Isolation Standard

Status: ACTIVE PRODUCTION STANDARD

## Controlling principle

The Milano Seal OS may reuse proven interaction patterns from external UX references only as abstract information-architecture and usability patterns. No external product identity, industry terminology, business logic, data model, field names, dashboards, workflow semantics, colors, proprietary copy, or brand may enter the Milano Seal production application.

The production application is The Milano Seal™ only.

## Foreign-product isolation

Active Milano Seal source must not contain or depend on foreign product branding, outside-employer workflows, unrelated event-intelligence systems, provider-business-development systems, case-recovery systems, medical-referral systems, or copied claims-administration schema.

Insurance-related words may exist only when they are legitimate subject matter of an actual Milano Seal document, procurement requirement, or company compliance record. They must never define Milano Seal platform navigation, role logic, canonical Matter state, payment logic, or operating-system schema by copy-paste from another product.

## Milano Seal canonical object model

The primary operating object is a Matter.

Core Milano Seal concepts are:

- Matter
- Client
- Document
- Execution Truth
- Destination / Jurisdiction
- Receiving Authority
- Quote / Invoice
- Wise Payment Truth
- Scheduling
- Execution
- Apostille / Authentication
- Courier / Custody
- Release
- Timeline / Audit Event
- Alliance Assignment
- Execution Support Task

No unrelated claims, provider-referral, event-targeting, case-recovery, or outside-employer engine is part of the Milano Seal canonical product model.

## One operating-system shell

Every authenticated Milano Seal workspace should use the same interaction doctrine:

COMMAND
→ ATTENTION
→ PRIORITY
→ MATTER INTELLIGENCE
→ CONTEXT
→ NEXT BEST ACTION
→ EXECUTION
→ OUTCOME
→ CHRONOLOGICAL MEMORY

Shared UX patterns should include:

- consistent Milano Seal identity
- compact command metrics
- What Needs Attention
- Matter-aware search
- list → detail → full Matter view
- persistent contextual actions
- one chronological timeline model
- evidence / provenance where relevant
- honest UNKNOWN / NOT LOADED / REVIEW REQUIRED states
- mobile-first execution
- fail-closed authoritative actions

Compression is allowed. Data deletion is not.

## Canonical access topology

All access remains on the canonical Milano Seal application origin:

`https://themilanoseal.com`

Role homes:

- Client → `/portal`
- Operator → `/dashboard`
- Admin → `/dashboard`
- Owner → `/dashboard`
- Virtual Assistant / Execution Support → `/va/dashboard`
- Alliance Partner → `/alliance/dashboard`

Public access gateway:

- `/login`
- `/access`

All internal navigation should use same-origin relative paths. No foreign product or third-party portal domain may become an alternate Milano Seal application shell.

## Role isolation

Authorization is derived only from service-controlled authentication metadata and the canonical role map.

- Clients stay inside `/portal`.
- Alliance users stay inside `/alliance`.
- VA / execution-support users stay inside `/va`.
- Operators, admins, and owners use `/dashboard` and explicitly authorized oversight surfaces.
- Missing or unknown roles fail closed.

A page-level shell must not create a second permission model that conflicts with the proxy or canonical role map.

## Client Portal

The client portal should answer immediately:

- What is my Matter?
- What is its current verified state?
- What is required from me?
- Is payment required or verified?
- What documents are controlled?
- What is happening with execution / apostille / release / courier?
- What is the next action?
- What has already happened?

Client-facing state must derive from canonical Matter and payment truth. The portal must never invent success or expose operator-only controls.

## Operator Command Center

The operator workspace is the primary execution-intelligence surface.

It should prioritize:

- What Needs Attention
- payment blockers
- document blockers
- authority review
- scheduling readiness
- apostille state
- courier / custody exceptions
- release readiness
- follow-up obligations
- exact Matter drill-through

It may project intelligence from the canonical Matter read model but must not create a second state machine or payment engine.

## VA / Execution Support Workspace

The VA workspace is task and coordination focused.

It may expose only actions permitted to the role. Financial settlement, payment confirmation, protected release authority, and governed Matter transitions remain outside VA authority unless the canonical authorization model explicitly permits them.

## Alliance Portal

The Alliance portal is a partner execution surface, not a referral CRM.

Its domain concepts are Milano Seal concepts such as:

- assignments
- Matter coordination
- credentials
- jurisdiction capability
- execution readiness
- documents
- messaging
- governed compensation / commission truth where applicable
- audit history

Do not import provider-relations, medical-referral, claims-recovery, unrelated event-targeting, or outside-employer terminology.

## Domain and link standard

Environment defaults remain:

- `NEXT_PUBLIC_SITE_URL=https://themilanoseal.com`
- `NEXT_PUBLIC_APP_URL=https://themilanoseal.com`
- `PAYMENT_BASE_URL=https://themilanoseal.com`

Protected workspaces use relative internal navigation so authenticated users remain inside the canonical Milano Seal origin.

## Production gate

`scripts/validate-milano-os-isolation.mjs` is a blocking production gate.

It must fail the production build if active source reintroduces foreign product identity, copied claims-model implementation fields, conflicting client-portal authorization, or non-canonical portal topology.

## Final doctrine

ONE MILANO SEAL OS.

ONE MATTER MODEL.

ONE ROLE MAP.

ONE PAYMENT TRUTH.

ONE TIMELINE / AUDIT MEMORY.

ONE TRUST MODEL.

MULTIPLE ROLE-SPECIFIC PROJECTIONS.

No foreign product branding.
No outside-employer product logic.
No copied claims-administration model.
No disconnected portal products.
