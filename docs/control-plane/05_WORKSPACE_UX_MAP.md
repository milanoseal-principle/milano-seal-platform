# The Milano Seal™ — Workspace & UX Map

## Presentation Principle

Present Milano Seal by user workspace, not by implementation module. Engines and reports are backend or operator details unless the user needs a direct action surface.

## Public Workspace

Purpose: authority, education, professional acquisition, referrals and secure entry into Matter intake.

May show:
- Public services and destination/document authority pages.
- Professional and institutional entry points.
- Intake and approved public pricing/positioning.
- Public trust/compliance explanations supported by verified sources.

Must not show:
- Private Matter data.
- Internal operator intelligence.
- Alliance-private data.
- Unverified claims or fabricated telemetry.

## Client Workspace — `/portal`

Purpose: one client sees only that client's governed Matter experience.

Primary presentation:
- Matter status.
- Required client actions.
- Documents.
- Invoice/payment state.
- Schedule status.
- Execution timeline.
- Delivery tracking.
- Messages/notifications appropriate for the client.
- Completed Matter history.
- Start another Matter.

The client does not need separate Trust Engine, Reconciliation Center or Authority Intelligence products. Those systems support the Matter experience behind the scenes.

## Operator Workspace — `/dashboard`

Primary information architecture:

- **Today** — what requires attention now.
- **Matters** — canonical Matter records.
- **Execution** — intake, dispatch, apostille/authentication, packaging, delivery and release.
- **Intelligence** — exceptions, reconciliation, compliance, authority, trust and relationship context.
- **Finance** — Wise settlement, revenue, discounts and governed reporting.
- **Network** — Alliance and partner operations.
- **Growth** — acquisition, referrals, return clients and verticals.
- **System** — Control Plane, settings, SOP, deployment/readiness and administration.

Operator decision model:
1. What happened?
2. What is canonically true?
3. What needs attention?
4. What is the governed next action?
5. What blocks progression?
6. What state follows?

## VA Workspace — `/va/dashboard`

Purpose: assigned operational support only.

Allowed:
- Assigned tasks.
- Evidence/document collection.
- Approved procedural steps.
- Scoped status updates where policy allows.

Not allowed:
- Finance authority.
- Payment settlement authority.
- Release authority.
- Hidden founder intelligence.
- Uncontrolled Matter state mutation.

## Alliance Workspace — `/alliance/dashboard`

Purpose: scoped partner execution.

Primary presentation:
- Profile and certification/compliance.
- Availability/capacity.
- Assigned work.
- Execution instructions.
- Proof submission.
- Assignment status.
- Partner-appropriate payment/benefit information when governed.

Alliance Intelligence remains primarily an operator/system interpretation layer. It must not expose unrelated partner data or create synthetic rankings.

## Mobile Rule

All five presentation layers must remain usable on mobile. Shared Milano chrome, navigation, safe-area behavior, responsive tables/cards, reduced-motion handling and role boundaries remain production-gated.
