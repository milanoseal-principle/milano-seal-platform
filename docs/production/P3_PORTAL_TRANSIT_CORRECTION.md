# P3 corrective follow-up: canonical transit in the client portal

Baseline inspected: `a7a3eda3efbf57de4aa5659396e592e140864d17` (merged P3 lifecycle repair).

## Confirmed defect

`resolvePortalLifecycleSummary('in_transit', 'paid', 'not_required')` returned `Intake Received` and `Operator review`. The canonical lifecycle and portal read model use `in_transit`, but the status rail only recognized the legacy `shipped` alias. This could present a domestic or international Matter already in delivery as a newly received Matter.

## Bounded correction

Recognize `in_transit` in the existing Delivery step and next-event lookup. Preserve `shipped` compatibility. Describe review in terms of intended use and delivery in terms of delivery/handoff, so this display does not invent international use or a courier engagement for a domestic Matter.

This is presentation mapping only. It does not change persisted Matter truth, lifecycle transitions, payment verification, pricing, RLS, custody, release or provider authority. No migration or production order mutation is needed.

## Verification

- Five behavior tests call the real summary resolver for domestic, apostille, legalization and unknown authentication applicability, compare the canonical/legacy delivery mapping and preserve delivery-versus-close distinction. Four canonical-transit cases failed before the fix and pass after it.
- The existing P3 rendered fixture now includes canonical transit. At 320, 390, 768 and 1440 pixels it asserts Delivery, Delivery confirmation, no fabricated courier/international/completion statement, unchanged operator review interaction, full-page screenshot width and empty runtime-error arrays.
- Local rendered verification used locked Playwright 1.65.0 with the installed system Chromium 154. The managed Chromium 158 download was explicitly denied by network policy. Only the browser executable selection was overridden outside the checkout; fixture requests/assertions and TLS verification were unchanged.
- Existing P3 database fixture passed conversion/retry, authorization, stale-write rejection, quote progression, all 196 transition pairs plus null, verified-settlement progression, append-only controls and rollback checks. These are separate from the automated test count.

These checks use controlled fixtures and mocked UI transport. They do not establish hosted operator/client access, a real payment, delivery, or statutory execution evidence.

## P3 continuation boundary

The existing lifecycle repair in `P3_LIFECYCLE_RECONCILIATION.md` supersedes the older missing-ledger observation in `P3_STATUS.md`; this correction neither replays historical migrations nor claims P12 certification.

P3 still needs an approved controlled domestic lead/Matter, authenticated operator/client verification, and hosted parity through the governed execution/QC/release/completion paths. Authentication-only signer applicability and local handoff must be verified against that actual approved scenario rather than inferred or manufactured.

Do not label P3 production-complete or begin P4 until that gate is satisfied. P4–P23 remain sequential; existing related modules must be inspected before any later implementation.
