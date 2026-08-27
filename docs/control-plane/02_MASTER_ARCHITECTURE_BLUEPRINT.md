# The Milano Seal™ — Master Architecture Blueprint

## 1. Business Architecture

The platform is organized into five parent systems: Demand, Matter Control, Execution Network, Intelligence & Control, and Governance & Platform.

## 2. User Roles

- Public: acquisition and secure intake entry only.
- Client: owned Matter visibility and governed client actions only.
- Operator: governed operational authority.
- VA: assigned operational support without finance/release authority.
- Alliance: scoped partner execution only.
- System-only: backend infrastructure and automated evidence handling.

## 3. Canonical Matter Contract

The Matter is the operational center. No secondary engine may create a conflicting lifecycle or independent transaction state.

## 4. State Machine

All lifecycle progression delegates to the canonical Matter state machine. No UI or intelligence layer may jump state independently.

## 5. Event Model

Payment, scheduling, execution, apostille/authentication, courier, delivery, release and completion events must remain Matter-linked and evidence-backed.

## 6. Data Authorities

See `lib/control-plane/systemRegistry.ts` and `docs/control-plane/04_CANONICAL_MATTER_EXECUTION_CONTRACT.md`.

## 7. Integrations

- Supabase: database/auth/storage authority.
- Wise: payment settlement authority.
- Vercel: production deployment.
- Carrier/provider channels: delivery evidence.
- Notification providers: communication provider evidence; provider acceptance is not delivery proof.

## 8. API Map

Critical intake, health, Wise webhook, operator intelligence and protected Matter mutation routes are governed by existing route and production validators.

## 9. Workspace Map

Public, Client, Operator, VA and Alliance are the only primary user presentation layers. Subsystems should be nested inside an existing workspace instead of becoming separate products.

## 10. Intelligence Derivation Map

Intelligence reads canonical evidence and emits interpretation, exceptions, reconciliation or recommendations. Intelligence is not a source of operational truth and is read-only by default.

## 11. Security / RLS Matrix

Authorization must enforce client ownership, operator authority, VA scope and Alliance isolation. Anonymous users cannot access protected Matter data.

## 12. Payment Gates

Wise settlement truth is required for payment-dependent progression unless a separately governed canonical complimentary authorization exists.

## 13. Execution / Release Gates

Execution truth, authority readiness, custody evidence, payment requirements and governed release QA remain independent checks.

## 14. Validators

The Vercel merge gate is the production code gate. System Control Plane validation is additive and does not replace existing Matter, payment, authority, brand, role or production-certification validators.

## 15. Deployment

Production deploys through Vercel from `main`. Code/deployment success is distinct from live transaction certification.

## 16. Observability

Runtime errors, provider responses, transaction references and operator exceptions must remain evidence-backed. No fabricated telemetry is permitted.

## 17. System Registry

`SYSTEM_REGISTRY` is the meta-layer index for capabilities, ownership, authorities, write policy, route placement, validation and readiness status.

## 18. Roadmap

Roadmap items must remain explicitly classified and must not be silently promoted from concept/specification to production.

## 19. Live-Proof Matrix

LIVE_PROVEN requires real production evidence. CERTIFIED requires the controlling acceptance and human truth-review gates.

## 20. Known Technical Debt

Technical debt should be recorded as an explicit registry/roadmap item and may not be hidden inside an intelligence module or unrelated page.

## System Placement Rule

Every new capability must identify parent system, audience, source authority, mutation policy, duplication risk, UX placement, validation and registry entry before merge.
