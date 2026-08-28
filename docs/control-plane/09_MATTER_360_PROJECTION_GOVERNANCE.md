# The Milano Seal™ — Matter 360 Projection Governance

## Controlling rule

External architecture patterns may inform Milano-specific implementation, but Milano Seal business logic, data, providers, events and domain code remain isolated inside `milano-seal-platform`.

The transfer direction is:

`external architecture pattern → Milano-specific implementation`

Never:

`foreign domain data/code → Milano runtime`

## Matter 360 authority firewall

Matter 360 is a read model over separate authorities. These authorities may be joined for operator intelligence but are never blended into one synthetic source of truth.

- Canonical Matter ≠ Pricing Authority
- Pricing Authority ≠ Wise Settlement
- Wise Settlement ≠ Execution Evidence
- Execution Evidence ≠ RON Evidence
- RON Evidence ≠ Authority Routing
- Authority Routing ≠ Receiving-Authority Acceptance
- Translation ≠ Custody
- Custody ≠ Courier
- Courier ≠ Delivery
- Delivery ≠ Release

Missing evidence remains `UNKNOWN`, `REVIEW_REQUIRED`, `STALE` or absent as appropriate. It must never be converted to false success, zero, `NO`, paid, delivered, accepted or complete.

## Accepted Matter Truth Archive

Matter Truth history uses append-only snapshots.

Only snapshots with explicit `ACCEPTED` status, `accepted_at` and `accepted_by` may act as deterministic baselines.

Comparison semantics are locked to:

- `CHANGED` — accepted evidence differs between two accepted baselines.
- `UNCHANGED` — accepted evidence is deterministically equivalent.
- `UNKNOWN` — one side is missing, unaccepted, unresolved or otherwise insufficient for deterministic comparison.

A missing side never produces a manufactured delta.

## Matter Output Envelope

Client, Operator, VA, Alliance, Finance, Authority Review, Delivery and Control Plane surfaces are outputs of Matter Control. They are not independent Matter engines.

Every formal projection may carry:

- `matterId`
- `sourceEngine = MATTER_CONTROL`
- `projectionId`
- `audience`
- `buildVersion`
- authority-version metadata
- payload
- mutation policy
- invariants

Required invariants:

- `NO_SECOND_MATTER_ENGINE`
- `NO_SECOND_PAYMENT_ENGINE`
- `NO_STATE_MUTATION_BY_PROJECTION`
- `UNKNOWN_IS_NOT_FALSE`

## Universal Matter Evidence Ingestion

Evidence from Wise, RON providers, receiving-authority instructions, translation certificates, Shippo/courier events, Alliance submissions, operator uploads and governed imports is reconciled before it can influence operator action.

Pipeline:

`capture → hash/source/timestamp → Matter reconciliation → evidence ledger → owning authority action`

Reconciliation states:

- `EXACT_MATCH`
- `REVIEW_REQUIRED`
- `CONFLICT_REVIEW`
- `UNMATCHED`

Reconciliation itself never authorizes canonical mutation. Owning domain logic must separately validate and apply any allowed state change.

## Source / version / provenance matrix

Matter 360 tracks each domain independently with:

- source authority
- authority mode
- source reference
- authority version
- evidence references
- verified timestamp
- review cadence
- provenance state

Provenance states are:

- `CURRENT`
- `DUE_SOON`
- `STALE`
- `UNKNOWN`

No weighted trust score, ranking score or synthetic confidence percentage is permitted.

## Cost-controlled validation

Ordinary Vercel preview builds remain suppressed to control spend. A deliberate commit whose message contains `[validate-preview]` is the explicit opt-in path for running the billing-independent Vercel merge gate on a branch before merge. Production builds always run the gate.

GitHub-hosted Actions remain manual recovery only while runner billing is unavailable.

## Production lifecycle

Code presence does not certify live operation.

The lifecycle remains:

`BUILT → WIRED → GATED → DEPLOYED → LIVE_PROVEN → CERTIFIED`

The snapshot migration, provider evidence adapters and live archive acceptance remain unproven until deployed and verified against real Matter evidence.
