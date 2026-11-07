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

## Observed deployment evidence

- PR #431 was merged externally during verification. Main/deployed SHA: `75257f687ccc41d207fbba0e3716a0b484957114`.
- Vercel production deployment `dpl_5eTohqMZPGF9Fp7wUUrCoTNFh9yB` is READY with that exact SHA.
- P3 migration applied after detecting the deployed-code/database mismatch. Hosted migration version/name: `20261107223527 / p3_domestic_execution`; repository source: `20261107215959_p3_domestic_execution.sql`. Preserve this mapping for provenance reconciliation; neither history was rewritten.
- Hosted preference column and all three RPCs verified present. RPC execute privilege: anon false, authenticated false, service_role true; empty search paths verified.
- Main PR CI run `42420735265` passed, including controlled rendered acceptance at all four viewport widths and reduced-motion mode. Public rendered CI run `42420735260` passed.
- Public domestic execution and pricing routes returned HTTP 200; apex returned a 308 redirect to www. A scoped five-minute production error/fatal log query returned no log groups; this is a bounded observation, not a global health certification.
- The map runner's obsolete browser installation was repaired. Its country-button selector also requires the follow-up test fix: match the exact country-label descendant inside the button containing the flag, preserving selected-state and rendering assertions.

## Release gates still required

- Follow-up map rendered proof must pass with the corrected selector.
- Record and reconcile the repository/hosted migration-version mapping above in the provenance work.
- Hosted schema provenance needs review: read-only inspection found `public.matter_state_events`, `public.is_valid_matter_transition(text,text)` and the canonical transition trigger absent, despite repository migration 046 defining them. Do not replay historical migrations blindly. This is not fixed or certified by a green source validator.
- Complete authenticated operator/client hosted verification. Public-route and exact-SHA checks above do not prove an authenticated transaction.
- No live Wise payment, RON execution, government submission, courier handoff or customer notification was performed by this work.

## Phase disposition

P3 code is deployed and its additive migration is applied. Production completion remains unclaimed until the remaining gates and schema-provenance finding are resolved.
P4–P18 are not implemented by this PR. P19–P23 require the controlled live evidence specified in the directive. No later phase is labelled complete or started ahead of P3's gate.
