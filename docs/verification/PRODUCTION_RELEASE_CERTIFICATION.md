# The Milano Seal™ — Production Release Certification

**Decision: NO-GO.** Owner-approved Client A/B accounts and live intake Matters now exist. Authenticated desktop/mobile, unpaid locks, cross-client privacy and logout were tested. Client A's indicative $975 preview was not an issued price: the server requires execution review for all non-operator submissions. The live document vault fails because its query requests a column absent from the hosted safe view. Section 30 is the latest evidence; two narrowly scoped source fixes are under validation.

Originally prepared 2026-11-15 UTC from a Claude Code cloud session with limited access. Sections 1–27 preserve that historical evidence. Section 28 records a later independent connected-tool review; its newer observations supersede earlier current-state claims. Source tests are not proof of live transaction certification.

## 1–3. Repository, PR #510 and CI

| Item | Evidence | Status |
|---|---|---|
| `main` | `5a7995a93152e993547cd06666c29e31fdad30f9` (2026-11-15 00:38:17 UTC), merge of PR #510 | PASS |
| PR #510 | Merged 2026-11-15 00:38 UTC. Founder new-Matter alert HTML-escapes client fields; outreach signature domain corrected | PASS |
| CI | Run `43658275241`, job `validate`: success, 00:27:46–00:38:56 UTC. All 47 steps green, including typecheck, lint, tests, production build and final production regression | PASS |
| Codex review | No findings on `db2c6a85` | PASS |
| PR #512 / #513 (Smart Pricing truth) | #512 stopped unpriced Matters showing $0.00. #513 restored invoices for instantly priced Matters via the shared rule `isPriceIssued` (a real `final_total` with no pending review), and ignores portal responses that arrive after a Matter switch. `main` is `7ddd6cc3e61cf610445895e8cdce903951d5f5a7`. | PASS (code) |
| CI on `7ddd6cc3` | Run `43692484074` passed at 08:12 UTC (owner-verified). It completed after the merge at 08:08 UTC. | PASS |
| Codex re-review of `b99dd9a1` | Requested; the outcome is not confirmed in this report | NOT CONFIRMED |

## 4–6. Vercel, domain, TLS, Supabase target

| Item | Status | Blocker |
|---|---|---|
| Vercel production SHA | PASS (owner-verified) | `dpl_4sH1rdAi27kHJeGMMeLMsacBh5g6` is READY at `7ddd6cc3`. |
| Domain | PASS (owner-verified) | `www.themilanoseal.com` resolves to that deployment. TLS was not separately recorded. |
| Supabase target | `ehqdzfopsrbwewtddiwq` (from repository configuration and the P12 snapshot of 2026-11-14 16:13 UTC) | Live identity not re-confirmed: no database access. |

## 7–9. Database preflight and the eight migrations

- **Read-only reconciliation** (`npm run reconcile:production-migrations` against the P12 snapshot of 2026-11-14 16:13 UTC). Status of the eight:
  - **01** `20261114100000_founder_admin_server_identity` — DRIFTED: the helper still trusts `user_metadata`.
  - **02** `20261112090000_revoke_unrestricted_public_rls_policies` — effects present (6/6), no history row.
  - **03** `20261112120000_va_task_ledger` — MISSING (25 of 55 effects).
  - **04** `20261112130000_alliance_operator_identity` — PARTIAL (5 missing; 9 objects whose definitions differ from the repository).
  - **05** `20261112140000_operator_profile_binding` — MISSING (4 of 10).
  - **06** `20261113150000_rejected_referral_not_convertible` — MISSING (0 of 3).
  - **07** `20261114090000_restrict_authenticated_allow_all_policies` — PARTIAL (64 open policies/grants still to remove, 8 missing).
  - **08** `20261114110000_require_operator_unique_indexes` — MISSING (0 of 3 indexes).
- **Order compatibility.** On a clean replay, the reviewed priority order produced a catalog identical to filename order. Re-applying each of the eight changed nothing. Each file is idempotent and guarded.
- **Restored-copy rehearsal.** A drill mode for this existed in closed PR #509 and was never run against the real archive. Rehearsal on real production data: NOT TESTED.
- **History convention.** Production records reviewed migrations as `reviewed_<repo version>_<name>`, with the version set to the time they were actually applied (for example, the 2026-11-13 22:54–22:55 UTC batch). `supabase db push` must not be used, because the hosted history does not match the repository chain.
- **Execution: APPLIED (8/8).** The production owner applied all eight on 2026-11-15, in the approved order, through the Supabase SQL editor. History versions are `20261115020849`, `…020903`, `…020906`, `…020908`, `…020911`, `…020914`, `…020916` and `…020919` (02:08:49–02:09:19 UTC).
- **Post-apply verification (owner-run):**
  - `migration_rehearsal_checks.sql` returned `failures: []`.
  - A fresh P12 snapshot (observed 2026-11-15 02:13:43 UTC) shows all eight in history and all three operator unique indexes present.
  - The Claude Code session did not see that snapshot's full catalog, so this report records the owner's verification and not an independent reconciler run.
- **Advisor follow-up (non-blocking):** five trigger-only `SECURITY DEFINER` functions are executable by `PUBLIC`/`anon` (`certification_preserve_review`, `document_version_custody_event`, `guard_ron_canonical_version`, `guard_ron_evidence_completion`, `invalidate_ron_evidence_projection`).
  - All five use an empty `search_path`, and PostgreSQL rejects direct calls to trigger functions, so they are not callable as RPCs.
  - Revoking that `EXECUTE` is a hygiene item.

## 10–12. Security, RLS, Alliance and VA

- **Clean replay (code tests):** forged founder/admin roles are denied, disabled and banned accounts are denied, allow-all policies are removed, and partner own-row reads are restricted.
- **Production:** migration postconditions PASS (owner-run `migration_rehearsal_checks.sql`, 2026-11-15). Signed-in negative tests on production: NOT TESTED.
- **Post-apply verification:** run `supabase/verification/migration_rehearsal_checks.sql`, which is catalog-only and read-only. Every entry in `failures` must be empty, and `operator_unique_indexes_valid` must be 3.

## 13–21. Synthetic Matter, payment and notifications

- **Live intake:** PASS (owner-verified). Matter `MS-2026-8869` persisted in production Supabase.
- **Founder and client email:** PASS (owner-verified).
  - Resend reports Delivered for the founder alert (`nicholas@themilanoseal.com`), the operator copy and the client acknowledgement.
  - Supabase records `provider_accepted` with provider message IDs and one attempt per recipient and type.
  - The founder inbox receipt was confirmed independently.
- **Pricing display defect found by that test:** the alert showed `$0.00` for an unpriced Matter. It is fixed in #512 and #513 for new Matters; the alert already sent is not re-sent.
- **Signed-in client portal:** NOT TESTED / BLOCKED.
  - `MS-2026-8869` belongs to the `founder_admin` account, which by design is not a client portal session, and the founder role must not be changed.
  - The test needs two separate synthetic client accounts: Client A with an instantly priced Matter, Client B with a review-required Matter.
  - Creating them is a production write. It needs the owner, or a tool with production access and a network route to the site; this Claude Code session has neither.
- **Payment gate (code):** PASS in CI. `evaluatePaymentGate` must return `PAYMENT_CONFIRMED` before the payment-cleared alert or scheduling. Client reports, observations and flag-only states cannot settle a Matter.
- **Wise settlement:** NOT TESTED; it needs approval for one specific transaction.

## 22. SPF / DKIM / DMARC

BLOCKED: DNS is not resolvable from the session.

## 23–25. Mobile, downstream regressions and recovery

| Item | Evidence | Status |
|---|---|---|
| Mobile | Not tested live | NOT TESTED |
| RON, apostille and courier regressions | Source and database regression suites passed in CI `43658275241` (P3/P4/P5, financial custody release, P19–P23) | Code PASS; live NOT TESTED |
| Recovery | Encrypted backup `43637237779`. Isolated restore `43654113448` (`main` at `cb894c7f`, archive `20261114T202511Z`): 128/128 tables, 189,864/189,864 rows, 0 mismatches, 0 managed rows left unrestored, 11 Auth users, 7 Storage objects re-hashed, 19 sensitive tables probed | VERIFIED |
| Custody finding | The 2 "unlinked" custody rows were very likely chain GENESIS rows that an over-broad check counted. A corrected check existed only in closed PR #509 and is not on `main`. | Open, low |

## 26. Remaining blockers, in order

1. ~~Production-write approval and the eight migrations~~: done 2026-11-15, 8/8 applied, 0 post-apply failures.
2. ~~Preflight refresh~~: done.
3. ~~Vercel production SHA~~: done (`7ddd6cc3`, READY).
4. ~~Live synthetic Matter and email delivery~~: done (`MS-2026-8869`, delivered to founder, operator copy and client).
5. ~~Sender domain authentication~~: Resend reports the domain verified (owner-verified). The SPF, DKIM and DMARC records were not separately captured.
5a. **Signed-in client portal**, with two separate synthetic client accounts:
    - Client A (instant price): itemized invoice, Wise instructions, still unpaid, scheduling blocked.
    - Client B (review required): "Pricing pending review", no payment offered.
    - Both: cross-client access denied; quick switching between Matters shows the right state.
6. **Live Wise settlement** with approval for that specific transaction.
7. The outreach template still contains a placeholder phone number, `+1 (305) 000-0000`.

## 27. Final status

```
PR #510-#513: PASS (merged)     CI: PASS (43692484074 on 7ddd6cc3)
MAIN SHA: 7ddd6cc3e61cf610445895e8cdce903951d5f5a7
VERCEL PRODUCTION SHA: PASS (owner-verified, dpl_4sH1rdAi27kHJeGMMeLMsacBh5g6)   DOMAIN: PASS (owner-verified)
DATABASE: PASS (owner-verified 2026-11-15 02:13 UTC)
MIGRATION 1-8: PASS (applied 02:08:49-02:09:19 UTC; failures=[])
FOUNDER SECURITY: PASS (schema)   RLS: PASS (schema)   ALLIANCE: PASS (schema)   VA: PASS (schema)
  (schema-level postconditions; signed-in live tests NOT TESTED)
INTAKE / PERSISTENCE: PASS (MS-2026-8869)   UPLOAD: NOT TESTED
FOUNDER EMAIL: PASS   CLIENT EMAIL: PASS   (Resend Delivered; inbox confirmed)
PRICING / PRO FORMA / WISE INSTRUCTIONS: code PASS; signed-in live NOT TESTED
PAYMENT GATE: code PASS; live NOT TESTED     WISE SETTLEMENT: NOT TESTED
PORTAL (signed-in client): BLOCKED (needs two synthetic client accounts)
RON / APOSTILLE / COURIER REGRESSION: code PASS (CI); live NOT TESTED
MOBILE: NOT TESTED   MONITORING: NOT TESTED   RECOVERY: VERIFIED
FINAL TRANSACTION CERTIFICATION: NO-GO
```

## 28. Independent six-phase certification — 2026-11-15 15:11–15:13 UTC

This section supersedes earlier current-state claims above; earlier entries remain historical evidence. Assessed source `883f9e434c15e4daad11fb88eb4c0c06dc646abf`. Final transaction decision remains **NO-GO**.

| Phase / gate | Environment and evidence | Result |
|---|---|---|
| 1 — Test-data trigger preservation | Hosted Supabase `ehqdzfopsrbwewtddiwq`, 15:11:52.892043 UTC. `public.deals.trg_block_test_matter_data_in_production` is enabled (`tgenabled=O`), BEFORE INSERT OR UPDATE, FOR EACH ROW, calling `public.block_test_matter_data_in_production()`. Function-definition MD5 `f1c0e77d6cc0c98b17e649464b99f558`. No DDL or data writes performed. | PASS (preserved); approved fixture procedure BLOCKED |
| 2 — Client A and B | Owner proposed themilanoseal+clienta@gmail.com and themilanoseal+clientb@gmail.com conditionally on control of the base Gmail inbox. Inbox control is unconfirmed; production-write authorization is explicitly withheld. No verified browser sessions. Founder unchanged. Reviewed `lib/portalAuth.ts`, `lib/auth/server-role.ts`, `lib/auth/roleRedirect.ts`: confirmed email, client route permission, normalized exact email ownership and server-controlled roles are required. | BLOCKED |
| 3 — Two live intake Matters | Depends on phase2 and a governed QA procedure compatible with the preserved trigger. No direct insertion, synthetic-data disguise, intake POST or notification performed. No new Matter references exist from this run. | BLOCKED |
| 4 — Authenticated portal | No authorized Client A/B sessions or two owned Matters. Cross-client invoice/document/message/custody tests, logout, delayed-response switching and desktop/mobile signed-in screenshots were not executed live. | BLOCKED |
| 5 — Actual invoices and execution locks | No Client A/B invoice/PDF or transaction evidence available. No Wise transactions or provider execution initiated. Local regressions described below pass; live financial certification is not established. | BLOCKED |
| 6 — Final certification | Mandatory authenticated transaction gates remain unverified. Records and audit trails preserved; no cleanup deletion authorized or performed. | NO-GO |

### Fresh independent infrastructure and security evidence

- Vercel deployment `dpl_FBdEv7YYNL54pXfWj1ScxtXazW4N` is READY at `883f9e434c15e4daad11fb88eb4c0c06dc646abf`; `www.themilanoseal.com` alias independently points to it.
- [PR514 CI43721269209](https://github.com/milanoseal-principle/milano-seal-platform/actions/runs/43721269209) passed, including validate and GitGuardian. It tests PR head `782d91f505dc186e05f25fe55b15e6aac497cca6`; do not represent it as a distinct post-merge CI run. No post-merge workflow run was listed for the baseline before this session dispatched smoke.
- [Fresh production smoke43728593136](https://github.com/milanoseal-principle/milano-seal-platform/actions/runs/43728593136) passed on exact source `883f9e43`: health,8 public routes,6 protected pages,7 protected APIs. Anonymous checks do not establish client access.
- Runtime error/fatal query for this deployment,14:42:38–15:12:38 UTC: no matching logs. Alert/notification delivery is not established by that bounded observation.
- Executed existing `supabase/verification/migration_rehearsal_checks.sql` directly against hosted production: `failures=[]`, all3 operator unique indexes valid; VA tables/RLS/RPC and binding RPCs present; sensitive RPCs not executable by client roles; no unrestricted policies among the five restricted tables; founder helper reads server-controlled app metadata and not user metadata.
- Additional read-only authenticated-role probe with a synthetic UUID and `user_metadata.role=admin` returned `is_founder_or_admin()=false` at15:12:58.938049 UTC. No user account/JWT session was fabricated, and no customer rows were queried. This is a database-helper probe, not a full live identity/CRUD certification.
- [Backup43637237779](https://github.com/milanoseal-principle/milano-seal-platform/actions/runs/43637237779) and [restore43654113448](https://github.com/milanoseal-principle/milano-seal-platform/actions/runs/43654113448) independently show workflow success. The detailed restored-data claims above remain attributed to their recorded drill/owner evidence; this session did not repeat the restore.

### Focused local regression evidence

At exact source `883f9e43`,52/52 tests passed across portal email ownership, portal payment truth, commerce continuity, confirmation entry, payment authority, Wise amount integrity, attempt authority, provider settlement recovery, postpayment RON progression and release certificate eligibility.

Coverage includes observed-but-unsettled attempts remaining locked, wrong amount/currency/reference and stale/mismatched attempt rejection, canonical amount-due derivation, protection against generic paid/state mutations, release eligibility, and source wiring of invoice/payment/scheduling guards. Some checks inspect source; others execute synthetic functions. They are not live Client A/B results. The entire requested nine-case production payment matrix (including partial settlement, stale quote and unauthorized complimentary pricing) remains NOT TESTED live.

### Trigger SQL evidence

```sql
CREATE TRIGGER trg_block_test_matter_data_in_production
BEFORE INSERT OR UPDATE ON public.deals
FOR EACH ROW EXECUTE FUNCTION block_test_matter_data_in_production();
```

Its inspected function rejects the existing test-address/name/reference/seed patterns and raises `TEST_MATTER_DATA_BLOCKED_IN_PRODUCTION`. The trigger and function were not modified. No existing targeted trigger regression was located in the repository search; enabled-state/definition inspection is not an insertion test. No production insertion was attempted merely to test rejection.

### Outstanding actions, in dependency order

1. Owner identifies the approved governed QA-data procedure and retention/cleanup policy compatible with the unchanged trigger. Do not evade its checks.
2. Owner confirms control of themilanoseal@gmail.com, approves the proposed Client A/B aliases, and explicitly authorizes supported Auth account creation and the two live intake submissions. Never supply passwords, service keys or sign-in tokens in the report/chat.
3. Complete real email verification/sign-in in separate browser sessions; if inbox access is unavailable, owner performs the emailed-link sign-in through an approved browser handoff.
4. Execute phases3–5 with those exact accounts and canonical Matter IDs; capture actual response codes, invoice/PDF artifacts, ownership denials, desktop/mobile screenshots and payment locks. Preserve unpaid state; no real financial/provider execution is authorized.
5. Record fixture retention/cleanup authorization and append results. GO remains prohibited until all mandatory evidence exists.

## 29. Owner-approved account provisioning — 2026-11-15 15:18 UTC

Owner confirmed control of themilanoseal@gmail.com and explicitly approved the two client accounts and one governed intake Matter each. No new approval for these same actions is needed. No payments, provider execution, trigger changes or evidence deletion authorized.

The existing production QA procedure was located in docs/FINAL_PRODUCTION_CERTIFICATION.md, Phase2A: use a disposable Matter clearly marked production QA, normal live intake, no direct database edits or fabricated payment/revenue, retain the Matter/evidence under production retention policy. The production test-data guard remains mandatory; stop if it rejects a submission.

| Identity | Supported signup route | Authoritative Auth evidence | Email evidence | Result |
|---|---|---|---|---|
| Client A — themilanoseal+clienta@gmail.com | POST /api/auth/signup HTTP200, ok=true | UUID e1e71835-5667-433f-a227-6ee4ca25ac42; app_metadata.role=client; email_confirmed_at=NULL | Gmail message1a1dfca3580eba49, Confirm Your Signup,15:18:52 UTC | Provisioned; confirmation BLOCKED |
| Client B — themilanoseal+clientb@gmail.com | POST /api/auth/signup HTTP200, ok=true | UUID84e9ced8-e3ad-4df9-8067-fb7a5003af15; app_metadata.role=client; email_confirmed_at=NULL | Gmail message1a1dfca38bdc3034, Confirm Your Signup,15:18:54 UTC | Provisioned; confirmation BLOCKED |

Both accounts were absent before signup. Signup used the public application's supported Supabase Auth flow, with server role stamping and actual email verification enforced. Neither role nor verification flag was manually set via SQL. Founder identity was not changed. Separate private browser state was retained for each signup, including its PKCE verifier; credentials and verification URLs are excluded from this report and git.

Browser navigation to the real emailed Supabase confirmation link failed with ERR_TUNNEL_CONNECTION_FAILED. A token-free health request independently confirmed proxy HTTP403. Environment status identifies an enforced restricted network policy allowing the Milano website and GitHub, but not ehqdzfopsrbwewtddiwq.supabase.co. A network-permission request was granted for the turn; retest still failed at the same proxy restriction. This is an environment-access blocker, not evidence that Supabase signup failed.

No Matter submission, payment or provider action was attempted. Phases3–5 remain BLOCKED in the requested sequential execution. No live authenticated browser PASS is claimed.

Exact next action: add ehqdzfopsrbwewtddiwq.supabase.co to this cloud environment's network allowed hosts, preserving website access. Then resume the saved separate signup contexts, follow each real emailed link and perform normal client login. If links have expired, use supported resend without duplicate account creation. Do not bypass verification or generate replacement privileged sessions. Proceed to one QA-labelled live intake submission per approved identity and stop on any production-policy rejection.

## 30. Actual owner-authorized production QA — 2026-11-15 15:18–15:29 UTC

This supersedes the blocked-account and no-Matter status in sections28–29. The owner confirmed inbox control and approved the two accounts and one Matter each. Both were created via the site's /api/auth/signup route; real emails arrived, Auth later recorded actual email confirmation, and each account then signed in through the rendered /login form in a separate browser context. No generated JWT, manual email-confirmation flag or founder-role change was used. The initial Auth-host network error did not establish failed verification: fresh hosted evidence subsequently showed both accounts confirmed, and normal website login succeeded.

| Gate | Actual evidence | Result |
|---|---|---|
| Client A authentication | client role; confirmation2026-11-15 15:19:07.859695 UTC; rendered login HTTP200; /portal Matter Control | PASS |
| Client B authentication | client role; confirmation2026-11-15 15:19:57.672362 UTC; rendered login HTTP200; /portal Matter Control | PASS |
| Client A live intake | HTTP200, MS-2026-4578, UUID6e365b8f-4d33-4403-a1af-392a1deb0dbc, created15:22:56.272842 UTC; exactly one owned Matter | PASS persistence; instant-price scenario FAIL |
| Client B live intake | HTTP200, MS-2026-8329, UUIDc751c57f-07a4-4a2f-b8c0-34a4e63fe98f; exactly one owned Matter | PASS persistence/review-required |
| Production guard | Neither Matter used blocked test-name/email/seed patterns; both explicitly labelled Controlled production QA. No trigger modification, direct insertion or policy bypass. No retry-created duplicates. | PASS preservation |
| Instant pricing | Client A's normal intake displayed a $975 Priority pro forma and Complete My Order; server returned quote_state=review_required, final_total=NULL, Wise reference=NULL. | FAIL preview/issued-price consistency |
| Canonical unpaid truth | Both Matter rows payment_status=unpaid, payment_confirmed=false; portal payment gate settlementVerified=false, submissionObserved=false, schedulingUnlocked=false, courierUnlocked=false, paidAndReleased=false. | PASS for these two Matters |
| Portal invoices | Both own invoice GETs HTTP200, pricingStatus=pending_review, invoice=null. Signed-in /portal/invoice shows Pricing pending review; no $0.00 shown. | PASS review-required behavior; instant invoice BLOCKED |
| Financial artifacts | Both own unpriced PRO_FORMA POSTs HTTP409; both foreign Matter artifact requests HTTP403. No payable PDF issued. | PASS rejection; PDF integrity NOT TESTED |
| Cross-client invoice/documents | A→B and B→A GETs return404. No foreign document or invoice disclosed. | PASS |
| Cross-client messages | Foreign selectors return200 with empty messages, not foreign rows. No message POST performed. | PASS nondisclosure |
| Matter/custody/intelligence selectors | Main and intelligence endpoints fall back to the caller's own Matter for a foreign selector;200 responses contain no foreign UUID/data. Certificate responses remain null/not released. | PASS nondisclosure; selector rejection semantics not claimed |
| Owned document vault | Both own /api/portal/me/documents return500; Vercel runtime records VAULT_READ_UNAVAILABLE. Hosted client_safe_documents_view has no storage_path column, while lib/vault.ts selects it. | FAIL |
| Desktop/mobile | Both real authenticated sessions rendered /portal and /portal/invoice at1440px and390px, no horizontal overflow, no pageerror, pending-review invoice copy and no fictitious zero total. Chromium viewport emulation, not physical-device certification. | PASS scoped rendered QA |
| Client intake email | Gmail received Matter received for A, message1a1dfce299e29cbf at15:23:11 UTC; B, message1a1dfcf136e294ac at15:24:11 UTC. | PASS inbox receipt |
| Session logout | Both client sessions used the supported signout endpoint; protected /api/portal/me returned401 afterwards. | PASS |
| Rapid switching/delayed own-Matter responses | Each client owns exactly one Matter. No additional Matter created to manufacture the multiple-own-Matter scenario. Existing regression evidence remains synthetic. | NOT TESTED live |
| Negative settlement matrix | Actual unpriced/unpaid and cross-client artifact rejection tested. Wrong amount/currency/reference, partial settlement, stale quote, fake paid flag and complimentary mutation were not injected into production data. | NOT TESTED live; source regressions only |
| RON/apostille/courier | Live intelligence keeps execution/payment downstream gates locked. No provider session, authority dispatch, shipment or payment initiated. | PASS observed locks; execution NOT TESTED |

### Proven defects and minimal corrections

1. Public intake preview/issuance mismatch: core.ts sets executionReviewRequired for every non-operator request and replaces execution truth with provisional values. The browser only requested review when form.executionType was nonempty, so a fully classified RON request could display a pro forma and Complete My Order while the server correctly withheld issuance. The fix aligns browser quote readiness with mandatory public execution review. It does not alter pricing, issued-invoice rules or backend authority and does not turn the existing QA Matter into a priced Matter.
2. Hosted vault view mismatch: remove storage_path from safe-view selects; read it server-side from files only after visible-document and Matter ownership checks, scoped by file ID and Matter ID. The single-document signing helper also verifies actor ownership. Raw paths remain excluded from portal output. The database view and RLS remain unchanged.

Four focused vault regressions pass, exercising the actual hosted projection contract, server-side scoped signing, cross-client denial and failure propagation. A local desktop/mobile browser regression reproduces an approved indicative preview and requires review-only submission without a pro forma. Full-gate and rendered results will be appended after completion. These source corrections are not yet a live production fix.

Private screenshots, test responses and browser state are under ignored artifacts/controlled-qa. Credentials, confirmation URLs and session state must not be committed or published. Both QA accounts and Matters remain retained under the existing production QA procedure; no deletion or cleanup is authorized. Final decision remains NO-GO. The next product decision is whether instant public quoting is intended before operator review: current production policy forbids it. Do not bypass that policy merely to satisfy Client A's planned scenario.
