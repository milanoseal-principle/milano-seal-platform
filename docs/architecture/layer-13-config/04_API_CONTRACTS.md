# API Contracts

Layer-specific API ownership is defined in `../../LAYER_MANIFEST.json`.

Rules:
- Prefer existing endpoints/functions over new routes.
- Mutations authenticate server-side and validate Matter ownership/role.
- Idempotency is required for retries and provider events.
- Stable server errors map to client-safe copy.
- New endpoints must call the existing authority instead of reimplementing business logic.
- Sensitive provider payloads and secrets stay server-side.
