# P20–P23 source certification

Scope: current main `42e80d938f08ac3ca915a541a7ccb128188bece0`, preserving the Claude branch and the independent intake candidate. The Claude branch tree matched main at inspection. Commit `15be07d1` could not be recovered; the user explicitly directed P19 to be skipped, not recreated. No P19 end-to-end pass is claimed.

## Implemented deltas

- P20: real RSA verification with generated in-memory test keys, fixed production trust unchanged; actual reconciliation statement matching and fully migrated SQL attempt/settlement/scheduling gates. Seventeen payment scenarios plus signature and reconciliation checks.
- P21: actual RON lifecycle and statutory append/reopen RPCs. The older append RPC no longer manufactures completion; corrections retain immutable audit ancestry and prior timestamps, while review status blocks execution. The existing evidence gate validates executed version Matter/hash/stage/supersession. Twenty checks cover required evidence, roles, correction, idempotency and completion.
- P22: existing version capture, founder review and release owners bind source → submitted → returned → final artifacts. Authority evidence is an immutable metadata snapshot, derived by a database trigger from canonical Matter/packet facts. The existing operator capture form accepts the authority submission reference. Eighteen scenarios include byte mismatch incident creation, cross-Matter denial, supersession, changed destination, QC, custody and exact release retry. Country registries remain unchanged.
- P23: nineteen isolated failure/recovery scenarios, fresh P21/P22 archives and physical restores. Every public-table record is hashed and compared, with nonempty policy, attribution, notification, payment, version, custody, RON and retention histories. These tests establish local recovery behavior; they do not establish real provider availability or production backup readiness.
- P12: reproducible full local migration replay compared against read-only hosted metadata hashes, including columns, enums, functions, indexes, triggers, RLS, grants and storage. Production preflight requirements are compared explicitly. Hosted historical versions differ from repository filenames; unmatched history is not a safe pending-migration list.

## Review and execution

Run `npm run certify:source` for available-phase simulations, controlled-live refusal checks, P12 provenance and `artifacts/certification/source-manifest.json`. Individual commands are `certify:p20`, `certify:p21`, `certify:p22`, `certify:p23`, and `certify:p12`. All artifacts identify their source SHA and set `live_certification=false`. A failure exits nonzero; refusals cannot overwrite successful simulation artifacts. The local release gate now includes these harnesses.

Two forward migrations are supplied, not applied to hosted databases:

1. `20261109110000_ron_statutory_lifecycle_boundary.sql`
2. `20261109120000_authority_return_release_evidence.sql`

Existing artifacts lacking the new authority snapshot remain stored and fail closed at release. Operators must capture and review a new complete chain; no fabricated evidence or destructive backfill is provided. The new metadata is immutable, including on retries. Production rollout requires a reviewed hosted baseline and data-aware rehearsal. The PGlite fixture substitutes managed auth/storage primitives; hosted-only differences require review. Local serialized SQL execution does not substitute for a hosted multi-connection concurrency trial.

## Unresolved release conditions

P19 is skipped by explicit user instruction. Hosted schema alignment is blocked by observed drift. GitHub CI was last blocked by account billing/spending limits; no successful hosted CI is claimed. The last observed production deployment used an older SHA. Provider certification, authenticated hosted positive tests, production backup/restore, legal acceptance and live money are unverified. No deployments, hosted migrations, customer messages, merges or agent activations were performed. The user handles GitHub merges. Independent review is required.

The locked payment sequence remains: **Private Quote → Wise Submission → Settlement Verification → Payment Verified → Scheduling Unlocked**. Submission or intake data grants no scheduling or execution authority.
