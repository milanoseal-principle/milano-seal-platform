# Residual production execution evidence — 2026-11-08

Repository: `milanoseal-principle/milano-seal-platform`. Base main `7f6f511fb805598a5f485f3b1133ea9d3549fa4d` includes merged #452 and #453. Implementation branch: `codex/residual-production-verification`. The open directive PR #454 at `6f87eb151a66c01505fe3d4d76c4b37ede030eb2` was read completely; it is not an implementation or release. No merged branch was pushed again.

## Confirmed source correction

The latest user directive makes `docs/FINAL_PRODUCTION_CERTIFICATION.md` controlling and explicitly supersedes the earlier settlement-only scheduling instruction. Actual main still contained that older rule in its evaluator, schedule predecessor, SQL trigger, UI copy and source validators. This is a concrete source conflict, not a hosted-access inference.

The correction stays in the existing canonical modules: `lib/scheduling/complimentarySchedulingGate.ts`, `lib/stateMachine.ts`, `lib/platform/matterStateAdapters.ts`, schedule/execute routes, stricter generic founder progression and `lib/pipelineEngine.ts`. Existing RON provider guards remain. Invoice/payment/readiness/notification copy now distinguishes the authorities. Tests and source validators were updated to the controlling contract and backed by actual PostgreSQL negative cases, not disabled. Existing pipeline reads now include observation-integrity fields and use canonical `destination_country`/`total_price` aliases. The existing public rendered harness additionally records navigation timing measurements; these are lab measurements, not field Core Web Vitals or an authenticated performance certificate.

| Canonical evidence | Scheduling | Execution / signer link | Paid receipt / final release |
|---|---|---|---|
| Quote, discount or pending status alone | BLOCKED | BLOCKED | BLOCKED |
| Complete observed snapshot matching current positive amount, currency and Matter reference; unpaid, amount_paid=0 | Eligible subject to operational review | BLOCKED without server-side Wise provider evidence | BLOCKED |
| Same observation plus canonical Wise provider transaction/funding evidence | Eligible | Eligible subject to signer, statutory, jurisdiction and execution controls | BLOCKED until settlement |
| Exact verified/cleared Wise settlement | Eligible | Eligible subject to execution controls | Receipt eligible; final release still requires full balance, holds, reviewed versions/lineage, identifiers and release evidence |
| Missing/null/stale snapshot, mismatched amount/currency/reference, failed/refunded/partial payment | BLOCKED | BLOCKED | BLOCKED |

No observed branch sets `payment_confirmed`, `payment_status=paid` or `amount_paid`. The twelve canonical state names remain unchanged. A guarded `awaiting_payment → scheduled` edge avoids manufacturing a `payment_confirmed` stage. Settlement still advances an awaiting-payment Matter once and never regresses an already progressed Matter. Existing zero-value/courtesy flags were not introduced as scheduling authority. Fifty/fifty financial calculations, Wise-only controls, external notarial fee exclusion, TIFFTEST99/Gate37, separate synthetic TIFFTEST50 and unredeemed DAMIANI50 remain intact.

## Migration and provenance

New forward migration: `supabase/migrations/20261108220000_wise_authority_separation.sql`. It replaces only the existing transition/payment-gate functions; no historical migration or customer row is rewritten, no new Matter engine is created. The existing AFTER lifecycle audit and payment triggers stay bound. Final-release/courier full-balance functions are unchanged. Local replay contains123 real migrations; isolated upgrade restores the111-migration baseline then applies12 forward migrations, including the11 from #452 and this correction. Physical archive restore and reapplication preserve every original canonical field.

Hosted application of the11 existing additions is UNKNOWN; do not assume all are pending or already applied. This new correction has not been applied by the agent. Review the hosted ledger before selecting any pending files. The existing read-only provenance SQL now also hashes both lifecycle transition functions. `verify-hosted-schema` exited2 BLOCKED for absent secure bindings. No migration, backfill, production reset or hosted restore was performed.

## Fresh hosted observations

Non-destructive requests to production returned health200 and Damiani200; governance/invoice401; empty synthetic UUID export/evidence/custody307. Their Location paths were independently verified as `/login`. Thus the old unauthenticated responses are no longer observed at those synthetic endpoints; this does not certify existing-record authorization, roles, signed-URL expiry or production data persistence. No customer record was requested.

Health did not expose a verifiable commit SHA. GitHub reports Vercel “Deployment has completed” on base main at `https://vercel.com/themilanoseal-7008s-projects/milano-seal-platform/2JtqE6frNHDspXzASQV3sCqD7eqj`; this is not direct READY/alias/runtime certification. GitHub deployments-list access returned403 `Resource not accessible by integration`. No Vercel authenticated API or browser binding is available.

## Phase evidence matrix

Source: VE=verified existing source; FIX=actual source correction above; PARTIAL=incomplete comprehensive proof/human decisions. Local PASS is limited to cited suites. CI=B means required hosted CI is billing-startup blocked, never relabeled PASS. Hosted U means schema/runtime provenance UNVERIFIED; Auth B means isolated authenticated browser BLOCKED. Provider NR means real provider actions NOT_RUN; N/A means no provider action required for that phase. Browser LOCAL means controlled/unauthenticated local proof, never hosted auth.

| Phase | Source | Local | CI | Hosted | Auth | Browser | Real provider | Evidence / limits |
|---|---|---|---|---|---|---|---|---|
| G1 | VE | PASS | B | U | B | NOT_RUN | N/A | governance registry/contracts; role/tool and injection negatives |
| G2 | VE | PASS | B | U | B | NOT_RUN | N/A | governance reporting/immutable sources; source/SQL only |
| G3 | VE | PASS | B | U | B | NOT_RUN | N/A | governance claim/finish, budgets/leases/unknown outcomes; SQL81 |
| G4 | VE | PASS | B | U | B | LOCAL | N/A | existing Board Room controlled fixture at ten widths; no real approval session |
| G5 | VE | PASS | B | U | B | LOCAL | NR | eight safe suites; original15-step live contract retained unrun |
| P6 | VE | PASS | B | U | B | NOT_RUN | NR | provider-fee boundary and canonical financial SQL |
| P7 | PARTIAL | PARTIAL | B | U | B | NOT_RUN | N/A | existing retention classes/holds; durations/publication require human decisions |
| P8 | VE | PARTIAL | B | U | B | NOT_RUN | N/A | existing exact-policy acceptance gate; owner-approved hosted byte proof remains |
| P9 | VE | PASS | B | U | B | LOCAL | NR | immutable versions/custody/release lineage; private hosted downloads unobserved |
| P10 | VE | PASS | B | U | B | LOCAL | NR | immutable financial snapshots; observed submission cannot issue RECEIPT |
| P11 | PARTIAL | PARTIAL | B | U | B | NOT_RUN | N/A | local SQL authorization and public login redirects; full hosted role/RLS/storage matrix remains |
| P12 | FIX | PASS | B | U | B | NOT_RUN | N/A | forward authority migration,123 replay,111+12 upgrade/restore; hosted ledger unknown |
| P13 | FIX | PASS | B | U | B | NOT_RUN | N/A | pipeline projection; canonical pager1017 rows/cap17 and isolated EXPLAIN; hosted plans unrun |
| P14 | FIX | PASS | B | U | B | LOCAL | NR | actual SQL authority/replay and196 transition-pair parity; full authenticated operator E2E remains |
| P15 | FIX | PARTIAL | B | U | B | LOCAL | NR | stage-specific blockers/copy, existing safe retries; private payment screen not hosted-rendered |
| P16 | VE | PASS | B | U | B | NOT_RUN | NR | canonical notification queue/send claims/signed callbacks; no real mailbox delivery |
| P17 | VE | PARTIAL | B | U | B | NOT_RUN | NR | attribution and settled-only actual revenue; real same-Matter continuity remains |
| P18 | FIX | PARTIAL | B | U | B | LOCAL | N/A |70 public profile/route checks, map/reduced motion and measured navigation timings; full authenticated/accessibility/field performance remains |
| P19 | PARTIAL | PARTIAL | B | U | B | LOCAL | NR | existing isolated source harness/manual evidence contract; hosted synthetic E2E unrun |
| P20 | VE | PASS | B | U | B | NOT_RUN | NR | existing Wise signature/mismatch/replay suites; actual transfer requires owner approval |
| P21 | PARTIAL | PARTIAL | B | U | B | NOT_RUN | NR | statutory source/SQL evidence; actual identity/session/QC unrun |
| P22 | PARTIAL | PARTIAL | B | U | B | NOT_RUN | NR | authority/courier source gates and version links; actual filing/acceptance unrun |
| P23 | PARTIAL | PARTIAL | B | U | B | LOCAL | NR | isolated restore/health and manual closeout; hosted alerts/outages/rollback/aliases unrun |

## Blockers, owners and next executable actions

| Owner | Blocker | Next executable action |
|---|---|---|
| GitHub account/repository owner | Actual job-startup annotation reports failed payments or spending-limit block | Inspect owner billing settings and resolve according to budget; preserve required checks. No paid plan or budget change was made. |
| Authorized Supabase owner | No approved project or secure management binding | Bind `SUPABASE_ACCESS_TOKEN`, `SUPABASE_QA_PROJECT_REF` and permitted API host; run existing read-only provenance checker and review drift before any write. |
| Vercel/QA owner | No approved isolated Preview database, CLI/API binding or authenticated browser state | Configure existing Preview environment securely; retain merge-gated build and cost-saving predicate; use approved preview opt-in only after isolation. Verify READY/SHA/alias and test auth. |
| Founder/legal policy owner | Exact terms publication/retention durations and activation decisions | Record approved policy decisions through existing governed controls. No invented legal duration or agent activation. |
| Founder and approved transaction participants | Controlled transfer/RON/filing/shipment/mailbox proof absent | Separately authorize each real action, then execute existing same-Matter certification checklist; no real customer Matter is requested here. |

Config names only: observer requires `GOVERNANCE_QA_APPROVED_URL`, `GOVERNANCE_QA_APPROVED_RUN_ID`, `GOVERNANCE_QA_APPROVED_MATTER_ID`, `GOVERNANCE_QA_APPROVED_SHA`, `GOVERNANCE_QA_STORAGE_STATE_PATH`. Runtime requires `GOVERNANCE_AI_ENABLED`, `ANTHROPIC_API_KEY`, `GOVERNANCE_AI_MODEL`, `GOVERNANCE_AI_INPUT_MICROUSD_PER_MILLION`, `GOVERNANCE_AI_OUTPUT_MICROUSD_PER_MILLION`; alert opt-in is `GOVERNANCE_ALERTS_ENABLED`; scheduler authorization uses `CRON_SECRET`. The selected execution environment reports no secrets/runtime/identity bindings and enforced network policy excluding management hosts. Local SQL confirms default DISABLED/paused configuration; actual hosted agent/runtime flags are UNKNOWN. No activation or model operation was performed.

## Release and rollback handoff

1. Review this payment-contract correction and obtain green exact-head independent required checks. Local logs do not overwrite hosted CI status.
2. Inspect approved target migration/function/grant/RLS/trigger/index/storage provenance; confirm backups and isolated project identity. Apply only genuinely pending forward migrations in approved isolation.
3. Certify the exact isolated preview SHA, auth/role negatives, same-Matter persistence, scheduling/provider/settlement negatives and mobile behavior. Preview simulations never credit production settlement.
4. Obtain distinct founder approval for production migration-first release, merge/deployment and any shadow activation. None is implied by this report.
5. Verify actual Vercel READY/production aliases, redirects, health and SHA, then conduct only explicitly approved shadow/provider operations. Record independent final human GO/NO-GO.

Rollback retains additive schema and immutable evidence; pause governance independently of customer intake/portal/Wise, use the compatible prior application and forward repair. A prior settlement-only app may conservatively withhold observed scheduling; reconcile affected pending sessions through governed controls. Never reset the database, rewrite history or perform destructive production restore.

SOURCE_READY applies only to the implemented correction after final local checks below. PREVIEW_CERTIFIED=NO; HOSTED_DEPLOYED=NOT_RUN for this branch; BOARD_SHADOW_VERIFIED=NO; AGENTS_OPERATIONAL=NOT_ESTABLISHED; PROVIDER_LIVE_CERTIFIED=NO; FINAL_GO=NO. Broader phase limitations remain explicit in the matrix. No merge, hosted write, deploy, real payment/session/filing/shipment/notification, commercial redemption or activation was performed.

## Final validation and verdict

Exact tested source: `49a659778aeb1450c25cc6a4d070d9e00126fc98`; source tree `dd42b06830826966a32a83a545105e2383363c4b`. `CHROMIUM_PATH=/usr/bin/chromium npm_config_cache=/workspace/.npm-cache npm run check:local` exited0; all14 steps PASS. Typecheck/lint and1,273/1,273 unit tests pass; complete existing merge gate and production build pass; governance SQL81, gap SQL79, replay123, upgrade111+12 and physical restore pass; six source-certification and eight G5 suites pass; production audit0 vulnerabilities. All138 direct source validators and ten advisory validators passed. Browser proof: governance/closure ten widths, P3 four widths, map five profiles including reduced motion, public70/70. No failure was skipped. Earlier full-gate runs correctly failed stale settlement-only source assertions; those were corrected to the controlling contract and retested.

[Sanitized exact-source evidence and log hashes](evidence/RESIDUAL_PRODUCTION_2026-11-08.json). Full logs/screenshots remain ignored under `artifacts/`; the subsequent evidence-only commit does not change tested source. Working tree was clean at validation completion, including temporary proof-route cleanup.

Local lab timings (70 route/profile samples; milliseconds; no field/hosted SLA asserted):

| Measurement | Median | p95 | Maximum |
|---|---:|---:|---:|
| ttfb_ms | 16.45 | 47.8 | 74.2 |
| dom_content_loaded_ms | 188.4 | 271.4 | 286.8 |
| load_event_ms | 202.6 | 272 | 287.5 |

SOURCE_READY=YES for this implemented correction. CI_BLOCKED=YES pending exact-head remote observations in the PR. PREVIEW_CERTIFIED=NO; HOSTED_DEPLOYED=NOT_RUN for this branch; BOARD_SHADOW_VERIFIED=NO; AGENTS_OPERATIONAL=NOT_ESTABLISHED; PROVIDER_LIVE_CERTIFIED=NO; FINAL_GO=NO. Hosted/live gaps are not classified as missing source merely because credentials are absent.
