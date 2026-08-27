# The Milano Seal™ — System Registry

## Purpose

The System Registry is the canonical meta-layer for explaining where a capability belongs. It does not replace the Matter, payment, RON/notarial execution, apostille/authentication, authority, Alliance, custody or delivery sources of truth.

The registry is specialized for an international document execution firm. A generic module description is insufficient when the capability affects document origin, destination, receiving authority, notarial execution, apostille/authentication or international release.

## Required Registry Fields

Every governed capability must declare:

- ID and name.
- Parent system.
- Category.
- Purpose.
- Audience.
- Authority references.
- Authority mode.
- Mutation policy.
- Route/UX placement when applicable.
- Source paths.
- Dependencies.
- Validation gates.
- Delivery status.
- Owner.
- Duplicate key.

Execution-sensitive capabilities must additionally identify any dependency on:

- document origin / issuing authority
- destination country
- HCCH Apostille Convention status
- receiving authority
- signer location
- RON / mobile / in-person execution
- notarial act
- state versus federal competent authority
- translation or witness requirements
- custody / courier / release evidence

## Allowed Parent Systems

1. Demand.
2. Matter Control.
3. Execution Network.
4. Intelligence & Control.
5. Governance & Platform.

## Allowed Categories

- Core Engine.
- Workspace.
- Public Surface.
- Intelligence Surface.
- Integration.
- Data Authority.
- SOP.
- Validator / Gate.
- Report / Export.
- Future / Dormant.

## Delivery Status Standard

CONCEPT → SPECIFIED → BUILT → WIRED → GATED → DEPLOYED → LIVE_PROVEN → CERTIFIED.

These statuses are monotonic descriptions of evidence, not marketing labels. GATED does not mean deployed. DEPLOYED does not mean live-proven. LIVE_PROVEN does not mean certified unless all certification requirements are complete.

## Authority Rule

A registry entry may be canonical, derived, externally verified or procedural. Derived intelligence must identify the canonical evidence it reads and must not become an independent source of truth.

For Convention-country status, competent authority, receiving-authority requirements and similar external legal-execution facts, source-backed external verification is required. The platform currently recognizes the HCCH 1961 Apostille Convention as having **130 Contracting Parties**, while preserving Matter-specific routing review.

## Mutation Rule

Allowed mutation policies are read-only, governed write, system write or none. Intelligence surfaces under Intelligence & Control are read-only unless functionality is deliberately promoted into an explicitly governed canonical engine.

No intelligence surface may silently select RON, choose a notarial act, convert a non-Hague route into an apostille route, alter Wise settlement truth or authorize release.

## Duplication Rule

Before a new module is built, search `SYSTEM_REGISTRY`, the legacy internal module registry, institutional expansion registry and the international execution domain model. Equivalent capability must be extended in its existing owner surface rather than duplicated.

## Registry Adapters

The Control Plane imports and surfaces all entries from:

- `lib/internal/moduleRegistry.ts`.
- `lib/expansion/institutionalExpansion.ts`.

Those adapters preserve legacy readiness language without silently upgrading it.

The international execution domain specialization is defined in:

- `lib/control-plane/internationalDocumentExecutionProfile.ts`.

Matter 360 hardening capabilities are defined and surfaced through:

- `lib/control-plane/hardeningRegistry.ts`.
- `docs/control-plane/09_MATTER_360_PROJECTION_GOVERNANCE.md`.

## Canonical Implementation

- Registry: `lib/control-plane/systemRegistry.ts`.
- Hardening registry: `lib/control-plane/hardeningRegistry.ts`.
- International execution profile: `lib/control-plane/internationalDocumentExecutionProfile.ts`.
- Placement gate: `lib/control-plane/placementGate.ts`.
- Operator view: `/dashboard/control-plane`.
- Production validator: `scripts/validate-system-control-plane.mjs`.
- Unit tests: `lib/control-plane/__tests__/systemControlPlane.test.ts`, `lib/control-plane/__tests__/internationalDocumentExecutionProfile.test.ts`, and `tests/matter-360-governance.test.ts`.
