# Requirements

This file is part of the Milano Seal 15-layer architecture control plane.

Layer-specific ownership, scope, implementation anchors, and acceptance criteria are defined in `../../LAYER_MANIFEST.json` under this directory's layer key.

Rules:
- Reuse current production modules; do not create parallel authorities.
- Preserve one Matter schema, lifecycle, payment gate, event naming, and execution order.
- Unknown/review-required states remain explicit and fail closed.
- Every protected state change must be durable, attributable, and testable.
- The governing operating spine is MATTER → EXECUTION → CORRIDOR.
