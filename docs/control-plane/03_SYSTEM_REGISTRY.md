# The Milano Seal™ — System Registry

## Purpose

The System Registry is the canonical meta-layer for explaining where a capability belongs. It does not replace the Matter, payment, execution, authority, Alliance, custody or delivery sources of truth.

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

## Mutation Rule

Allowed mutation policies are read-only, governed write, system write or none. Intelligence surfaces under Intelligence & Control are read-only unless functionality is deliberately promoted into an explicitly governed canonical engine.

## Duplication Rule

Before a new module is built, search `SYSTEM_REGISTRY`, the legacy internal module registry and institutional expansion registry. Equivalent capability must be extended in its existing owner surface rather than duplicated.

## Registry Adapters

The Control Plane imports and surfaces all entries from:

- `lib/internal/moduleRegistry.ts`.
- `lib/expansion/institutionalExpansion.ts`.

Those adapters preserve legacy readiness language without silently upgrading it.

## Canonical Implementation

- Registry: `lib/control-plane/systemRegistry.ts`.
- Placement gate: `lib/control-plane/placementGate.ts`.
- Operator view: `/dashboard/control-plane`.
- Production validator: `scripts/validate-system-control-plane.mjs`.
- Unit tests: `lib/control-plane/__tests__/systemControlPlane.test.ts`.
