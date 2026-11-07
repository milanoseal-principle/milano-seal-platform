# P3 domestic execution — implementation and release status

Source standard: attached P3–P23 directive, preserved verbatim in `P3-P23-directive.txt`; existing canonical Matter, pricing, Wise, state-machine and evidence modules.
Baseline: `e3408ad469c7d2eea4d4b4c84bc0019b13595913`.

## Implementation

- Optional execution preference on Get Pricing, stored with the existing sales lead.
- Authenticated operator conversion locks the lead and creates/links exactly one canonical `deals` Matter with one evidence event. A failed evidence insert rolls the transaction back.
- Public execution input is retained as a separate preference. A submitted source label cannot establish operator authority or fabricate completed identity/execution evidence.
- Operator document, signer/location, witness and eligibility review persists normalized execution truth plus append-only review evidence.
- Reviewed domestic no-authentication Matters use the existing governed private pricing composer. Destination alone cannot clear authentication review.
- Reviewed quote approval locks the Matter, rejects stale or paid/observed records, advances the existing lifecycle in order and commits quote evidence atomically. No payment or scheduling authority is created by review/quote approval.
- Portal authentication applicability is a safe scalar projection. Non-applicable authentication is explicitly labelled and excluded from completed preflight checks.
- Existing Wise verified-settlement scheduling gate remains unchanged.

## Validation scope

Automated unit/source regression and the isolated PostgreSQL RPC fixture are code checks, not hosted transactions. The PostgreSQL fixture uses the canonical transition predicate and controlled test tables; it does not certify the full historical migration chain.

Rendered acceptance is wired into PR CI at 320, 390, 768 and 1440 pixels. It uses the actual changed components with explicitly mocked quote/review transport. The temporary app route is created and removed by the test; it is not deployed. Screenshots/results are uploaded as CI artifacts.

## Release gates still required

- Authoritative PR CI including rendered acceptance must pass.
- Apply and verify `20261107215959_p3_domestic_execution.sql` before enabling code requiring its column/RPCs.
- Hosted schema provenance needs review: read-only inspection found `public.matter_state_events`, `public.is_valid_matter_transition(text,text)` and the canonical transition trigger absent, despite repository migration 046 defining them. Do not replay historical migrations blindly. This is not fixed or certified by a green source validator.
- Exact merged SHA, Vercel READY, www/apex behavior, protected surfaces and runtime-error scan must be verified after a governed release.
- No live Wise payment, RON execution, government submission, courier handoff or customer notification was performed by this work.

## Phase disposition

P3 implementation is prepared for review; P3 production completion remains blocked until its release gates are evidenced.
P4–P18 are not implemented by this PR. P19–P23 require the controlled live evidence specified in the directive. No later phase is labelled complete or started ahead of P3's gate.
