# The Milano Seal™ — Master Architecture Blueprint

## 1. Business Architecture

The platform is a purpose-built international document execution OS organized into five parent systems: Demand, Matter Control, Execution Network, Intelligence & Control, and Governance & Platform.

The business domain is Remote Online Notarization (RON), physical notarial execution when required, apostille/authentication/legalization coordination, receiving-authority review, custody, courier release and cross-border delivery.

## 2. User Roles

- Public: international document education, acquisition and secure intake entry only.
- Client: owned Matter visibility and governed client actions only.
- Operator: governed operational authority and Final Truth Review.
- VA: assigned operational support without finance, route-approval or release authority.
- Alliance: scoped partner execution only.
- System-only: backend infrastructure and automated evidence handling.

## 3. Canonical Matter Contract

The Matter is the operational center. No secondary engine may create a conflicting lifecycle or independent transaction state.

Every international Matter can require explicit resolution of document identity, issuing authority, origin jurisdiction, destination country, receiving authority, signer location, notarization requirement, notarial act, execution method, witness requirements, language/translation, apostille/authentication path, competent authority, timeline and delivery.

## 4. State Machine

All lifecycle progression delegates to the canonical Matter state machine. No UI or intelligence layer may jump state independently.

## 5. Event Model

Intake, review, pricing, Wise payment, scheduling, RON/notarial execution, apostille/authentication, custody, courier, delivery, release and completion events must remain Matter-linked and evidence-backed.

## 6. International Routing Model

- **RON** is conditional on signer location, document eligibility, identity/KBA, notarial act, platform eligibility and receiving-authority expectations.
- **Mobile / in-person** execution is used when physical or wet-ink requirements control.
- **Already notarized** documents are reviewed; notarization is never recreated by inference.
- **State-origin** documents route to the competent state authority when an operative Hague route exists.
- **Federal-origin** documents remain on the federal authentication path.
- **Non-Hague / non-operative** routes fail closed to authentication / consular review.
- **Translation** is a separate Matter decision.
- **Receiving authority** controls final acceptance.

The HCCH 1961 Apostille Convention currently has **130 Contracting Parties**. The system treats this as externally verified coverage metadata, not as an automatic per-document apostille conclusion.

## 7. Data Authorities

See `lib/control-plane/systemRegistry.ts`, `lib/control-plane/internationalDocumentExecutionProfile.ts`, and `docs/control-plane/04_CANONICAL_MATTER_EXECUTION_CONTRACT.md`.

## 8. Integrations

- Supabase: database/auth/storage authority.
- Wise: payment settlement authority.
- Vercel: production deployment.
- HCCH / competent public authorities: external treaty and authority evidence.
- RON/notarial platforms: execution evidence where applicable.
- Carrier/provider channels: delivery evidence.
- Notification providers: communication provider evidence; provider acceptance is not delivery proof.

## 9. API Map

Critical intake, health, Wise webhook, operator intelligence and protected Matter mutation routes are governed by existing route and production validators.

## 10. Workspace Map

Public, Client, Operator, VA and Alliance are the only primary user presentation layers. RON, apostille, authority, courier and intelligence subsystems should be nested inside an existing workspace instead of becoming separate products.

## 11. Intelligence Derivation Map

Intelligence reads canonical evidence and emits interpretation, exceptions, reconciliation or recommendations. Intelligence is not a source of operational truth and is read-only by default.

## 12. Security / RLS Matrix

Authorization must enforce client ownership, operator authority, VA scope and Alliance isolation. Anonymous users cannot access protected Matter data.

## 13. Payment Gates

Wise settlement truth is required for payment-dependent progression unless a separately governed canonical complimentary authorization exists.

## 14. Execution / Release Gates

Execution truth, RON/notarial readiness, authority readiness, custody evidence, payment requirements and governed release QA remain independent checks.

## 15. Validators

The Vercel merge gate is the production code gate. System Control Plane validation is additive and enforces the international execution domain profile; it does not replace existing Matter, payment, authority, brand, role or production-certification validators.

## 16. Deployment

Production deploys through Vercel from `main`. Code/deployment success is distinct from live transaction certification.

## 17. Observability

Runtime errors, provider responses, Wise references, RON/notarial evidence, authority decisions, courier events and operator exceptions must remain evidence-backed. No fabricated telemetry is permitted.

## 18. System Registry

`SYSTEM_REGISTRY` is the meta-layer index for capabilities, ownership, authorities, write policy, route placement, validation and readiness status.

## 19. Roadmap

Roadmap items must remain explicitly classified and must not be silently promoted from concept/specification to production.

## 20. Live-Proof Matrix

LIVE_PROVEN requires real production evidence. CERTIFIED requires the controlling acceptance and human truth-review gates. Real RON/KBA, Wise settlement, apostille/authentication completion and carrier delivery are evidence classes, not code assertions.

## 21. Known Technical Debt

Technical debt should be recorded as an explicit registry/roadmap item and may not be hidden inside an intelligence module or unrelated page.

## System Placement Rule

Every new capability must identify parent system, audience, source authority, mutation policy, duplication risk, UX placement, validation and registry entry before merge. Execution logic must additionally declare document-origin, destination, receiving-authority and state/federal/RON dependencies.
