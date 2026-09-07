# Security

Layer-specific security boundaries are defined in `../../LAYER_MANIFEST.json`.

Rules:
- Least privilege and server-side authorization.
- RLS and service-role boundaries remain authoritative where applicable.
- Sensitive data, provider secrets, signing URLs, and raw payloads never leak to client projections or logs.
- Protected mutations require durable audit/decision evidence.
- Unauthorized, ambiguous, or incomplete protected requests fail closed.
