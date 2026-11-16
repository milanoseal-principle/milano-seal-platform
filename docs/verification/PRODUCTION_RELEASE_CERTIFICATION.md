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

## 31. Post-release reconciliation: PR #515 and PR #516 — 2026-11-15 17:40 UTC

This section supersedes earlier current-state claims about intake quote display, the owned document vault, password recovery and the production SHA. Sections 1–30 are kept unchanged as historical evidence. The final transaction decision remains **NO-GO**.

### Releases

| Item | Evidence | Source | Result |
|---|---|---|---|
| PR #515: review-only public intake and owned document vault | Merged 15:47:16 UTC as `94ebd50a`. PR head `2fa091df`. [CI 43730378165](https://github.com/milanoseal-principle/milano-seal-platform/actions/runs/43730378165) passed. Codex review completed with no findings on the PR head. | GitHub (checked in this session) | PASS |
| PR #515 post-release check | Production at `94ebd50a`, deployment `dpl_BwLr1gB6p3eWn25E77WLWS4evKNM`. [Smoke test 43732441573](https://github.com/milanoseal-principle/milano-seal-platform/actions/runs/43732441573) passed on that exact commit. Both clients signed in again:<br>• their own vault returned 200 with `files=[]`; another client's vault returned 404;<br>• intake shows review submission with no pro forma issued;<br>• invoices stay `pending_review`/null and scheduling stays locked.<br>Trigger function MD5 unchanged (`f1c0e77d6cc0c98b17e649464b99f558`, 15:55:53 UTC). | Post-release record on PR #515 (owner session); smoke test result checked in this session | PASS (scoped) |
| PR #516: password recovery and client lifecycle email | Merged 17:17:12 UTC as `366da0e0`. PR head `0c510d7c`. [CI 43740158501](https://github.com/milanoseal-principle/milano-seal-platform/actions/runs/43740158501) passed on that head. Codex's account-enumeration finding (P2) on the first head was fixed in `0c510d7c`, and the owner accepted the trade-off by merging. | GitHub (checked in this session) | PASS |
| Production deployment | `www.themilanoseal.com` and `dpl_E1vAB27eHhYpSezd9VXSWRBe8XT5` are READY on `366da0e0`. | Owner-verified (this session has no network access to Vercel) | PASS |

### Effect on Section 30 findings

- **Instant-price preview/issuance mismatch:** fixed in #515. Public intake now matches the server's mandatory execution review, so no pro forma is shown before an operator issues a quote. Client A's Matter MS-2026-4578 stays in review-required status; it was not repriced.
- **Owned document vault returning 500:** fixed in #515 and verified post-release. A client's own vault returns 200 and a foreign vault returns 404. Retrieving an actual private file is still NOT TESTED, because neither Matter has a file.
- **Password recovery (2026-11-15 production Auth log):** Client B's recovery request was rate limited (429 `over_email_send_rate_limit`), but the route still answered `ok:true`. As changed in #516:
  - Errors that depend on whether an account exists (mail cooldown, send cap, SMTP failure) return the same response as an accepted request. This prevents account enumeration. The error code is logged on the server only.
  - Refusals that apply to every address are reported to the caller: the per-client request limit (429) and the provider being unreachable (503).
  - The success copy tells the client what to do if no email arrives.
  - The root cause is still open: Supabase Auth's built-in email limit. It needs custom SMTP set up in the Supabase dashboard (owner action).
- **Client lifecycle emails:** emails generated from the canonical notification queue now include the Matter reference and an HTML-escaped link to the secure portal. Already-accepted notifications were not resent, and no live email has been sent with the new template yet.

### Current status

```
MAIN / PRODUCTION SHA: 366da0e0 (dpl_E1vAB27eHhYpSezd9VXSWRBe8XT5, owner-verified)
CI: PASS (#515 43730378165; #516 43740158501)   SMOKE: PASS on 94ebd50a (43732441573); not re-run on 366da0e0
CLIENT A/B AUTHENTICATION: PASS (live, section 30; re-verified after #515)
CROSS-CLIENT ISOLATION: PASS (scoped live tests)   OWNED VAULT: PASS (empty list; file retrieval NOT TESTED)
PUBLIC INTAKE REVIEW-ONLY: PASS (live after #515)
PASSWORD RECOVERY: code PASS (#516); live delivery BLOCKED on Supabase Auth custom SMTP
OPERATOR-ISSUED QUOTE / PRO FORMA PDF: NOT TESTED
WISE SETTLEMENT: NOT TESTED      PAYMENT GATE: live locked state PASS; unlock NOT TESTED
SCHEDULING / RON / APOSTILLE / COURIER EXECUTION: locks PASS; execution NOT TESTED
FINAL TRANSACTION CERTIFICATION: NO-GO
```

### Remaining actions, in order

1. Owner sets up custom SMTP for Supabase Auth and the permitted Auth email rate limit (Supabase dashboard). Then do a single recovery test; do not repeat it.
2. Final authenticated client acceptance: the operator issues a quote for one QA Matter through the governed flow, then the client views the itemized invoice, pro forma PDF and Wise instructions while the Matter stays unpaid and scheduling stays locked.
3. One explicitly authorized Wise transaction, with settlement checked independently. A submitted payment is not a settlement, and no payment status may be set manually.
4. Certify the downstream scheduling and release gates from the evidence those steps actually produce.
5. Replace the placeholder outreach phone number `+1 (305) 000-0000` (Section 26, item 7).

## 32. PR #518 and #519: unpriced display and operator prefill — 2026-11-15 23:50 UTC

Sections 1–31 are kept unchanged as historical evidence. The final transaction decision remains **NO-GO**.

| Item | Evidence | Source | Result |
|---|---|---|---|
| PR #518: unpriced Matters show "Review required" / "Pricing pending review" instead of $0.00 on the operator page, pro forma and payment card | Merged as `6dc81828`. [CI 43764574747](https://github.com/milanoseal-principle/milano-seal-platform/actions/runs/43764574747) passed on head `f7abe23`. Codex found nothing. | GitHub (checked in this session) | PASS |
| PR #518 deployment | Vercel production deployment `EwgcmRiv7` is READY and Current on `6dc8182`, serving `www.themilanoseal.com`. | Owner screenshot | PASS |
| PR #519: Smart Intake → operator review prefill and provenance | Merged as `e707c331`. [CI 43775378743](https://github.com/milanoseal-principle/milano-seal-platform/actions/runs/43775378743) passed on head `d3fbf5e`. Codex raised three P2 findings, all fixed and resolved; its final review on `d3fbf5e` found no issues. | GitHub (checked in this session) | PASS |
| PR #519 deployment | Deployment `dpl_7wTYRHRKGjT9pNff7yXAxVTZFTKU` is READY on `e707c331`, and the production domain `www.themilanoseal.com` is assigned to it. (It was BUILDING at an earlier check, while the domain still served `6dc81828`.) | Owner-verified | PASS |
| Supabase Auth custom SMTP | Custom SMTP is configured and password-reset delivery is confirmed. This closes the Section 31 recovery-delivery blocker. | Owner-reported | PASS (owner-verified) |

### What #519 changed (application-only)

- **Route facts:** document category, issuing authority, federal agency and receiving authority are read back from the latest governed quote attempt in the evidence ledger. The read goes through a new operator-only, single-Matter `GET /api/deals/[id]/quote` that returns sanitized fields and performs no writes. These facts previously reset to blank or "unknown".
- **Matter base:** the builder no longer sends a default of "authentication" that overrode the engine's derivation. A stored `matter_pricing_type` is used if one exists; otherwise the existing engine derives the base.
- **Execution method:** an unresolved method shows as "Review required" instead of "No new execution". The legacy `mobile` flag and the client's intake requests are labelled hints and are never filled in as values. An already-notarized truth round-trips together with its supporting facts.
- **Provenance labels:** each field shows Confirmed / From intake / Suggested / Conflict / Missing, and shows Edited when the operator changes it. Edits are never overwritten, and the builder is keyed per Matter.
- **Unchanged:** quote composition and pricing formulas, `isPriceIssued`, the `approve_reviewed_matter_quote` RPC, execution-review checks, mutation locks, Wise, and the payment and scheduling gates. No schema, RLS or data changes. Client B's Matter was not touched.
- **Domestic route:** unchanged. A US destination enters domestic execution only after an operator confirms Authentication: Not required.

### Tests

- New `tests/unit/operatorQuotePrefill.test.ts` (10 tests) uses a deterministic fixture mirroring MS-2026-8329.
- `npm test`: 1530 pass. Typecheck, lint and the production build (including the intake pricing-privacy bundle scan) pass.
- The intake, pricing, execution, routing, payment and release validators pass.
- No signed-in operator browser evidence was captured.

### Remaining live acceptance gates, in order

1. Read-only (deployment confirmed above): open MS-2026-8329 in the operator view and check the labels:
   - Execution method: "Review required" with "From intake: in person".
   - Matter base: "Derived by pricing engine".
   - Authentication: "Review required".
2. The operator completes execution review and issues the quote for the QA Matter through the governed flow. This needs separate explicit approval.
3. Client B checks the itemized invoice, pro forma PDF and Wise instructions while the Matter stays unpaid and scheduling stays locked.
4. Run one authorized Wise transaction and verify settlement independently.
5. Certify the downstream scheduling and release gates from the evidence those steps produce.

## 33. Financial transaction and execution finalization audit, and PR #523 — 2026-11-16 20:40 UTC

Sections 1–32 are kept unchanged as historical evidence. This section records engineering and source evidence only. No live Wise transfer, provider session, government submission, shipment or production data change was made. The final transaction decision remains **NO-GO**.

### Releases since Section 32

| Item | Evidence | Source | Result |
|---|---|---|---|
| PR #521: post-intake client clarification and revalidation | Merged as `f950b78a`. | GitHub | PASS |
| PR #522: clarification follow-up (no signer question without a new signing; card state scoped to one Matter) | Merged as `6f5a85dc`. [CI 43802239685](https://github.com/milanoseal-principle/milano-seal-platform/actions/runs/43802239685) passed. Codex found nothing on the final commit. | GitHub | PASS |
| PR #523: a late Wise pending event never downgrades a confirmed payment | Merged as `afb0f2b6` (head `6967cae3`). [CI 43948742321](https://github.com/milanoseal-principle/milano-seal-platform/actions/runs/43948742321) passed. Codex found nothing on the final commit. | GitHub | PASS |
| Production deployment of `afb0f2b6` | Not yet verified. This session has no network access to Vercel. | Owner to confirm | PENDING |

### Confirmed defect and fix (PR #523)

- **Defect:** on the legacy webhook path (a Matter with no `payment_attempt_id`), an exact-match transfer "processing" event delivered after `confirm_wise_payment_for_deal` wrote `payment_status='unpaid'` onto a Matter that was `payment_confirmed`, `paid` and `cleared`.
- **Impact:** this fails closed and cannot create a false "paid". It does corrupt payment truth: the portal shows unpaid and later stages stall.
- **Fix:** a pure guard, `lib/wise/outOfOrderGuard.ts`, ignores late pending events for confirmed or paid payments, as it already did for failed or refunded ones.
- **Unchanged:**
  - Refund, failure and reversal handling, still bound to the recorded provider resource.
  - The attempt path, signature verification, and exact amount, currency and reference matching.
  - `confirm_wise_payment_for_deal`, settlement authority, complimentary governance and Smart Pricing.
- **Governance:** the two new paths were added to `GAP_CLOSURE_PROTECTED_CHANGES` with explicit owner approval, limited to this fix. No validator logic changed.

### Lifecycle audit on `main` `6f5a85dc` (before the fix)

| Area | Evidence | Result |
|---|---|---|
| Financial artifacts | `issue_financial_artifact` requires an approved canonical quote whose totals reconcile exactly to the line items. Each artifact is versioned and SHA-256 snapshotted. An identical snapshot returns the existing artifact. RECEIPT and PAID_AND_RELEASED require verified settlement. Access is limited to the Matter's client (exact email) or an operator. | PASS (engineering) |
| Wise webhook authenticity and matching | RSA signature verification. Underpayment, overpayment, currency mismatch, missing reference and environment mismatch go to review. Provider-attempt mismatches are rejected. 241 PostgreSQL attempt checks pass. | PASS (engineering); out-of-order downgrade FIXED in #523 |
| Payment to scheduling | `20261109090000_verified_settlement_before_scheduling` makes verified settlement the only payment prerequisite for scheduling and later stages. An observed payment is display-only. The settlement-before-scheduling suite (15/15) and 40 behavioural tests pass. | PASS (engineering) |
| RON, apostille, courier, custody, release | P3, P4 (59), P5 (31) and gap-closure (85) database suites pass. RON, apostille, custody, courier and cross-system validators pass. BlueNotary and Shippo callbacks are authenticated. | PASS (engineering) |
| Complimentary path | `compClearMatter` is an existing path gated by owner/operator approval and an audited 100% comp redemption. Not changed. | Existing governance, unchanged |
| Certification suites | `certify:p20` through `certify:p23` pass, all with `live_certification=false`. | PASS (simulation only) |

### Tests on the final tree

- `npm test`: 1543 pass.
- Typecheck, lint, build and `git diff --check` pass.
- Governance validators pass: final-production-regression, canonical-foundation, smart-intake-pricing-engine, final-intelligence-operator-os, production-governance, full-system-hardening and ai-governance.
- Wise and payment validators pass: payment-release-gates, the Wise recovery, reconciliation and schema-drift checks, settlement-before-scheduling and production-transaction-10of10.
- Database suites pass: Wise attempt, gap-closure, P3 and P4.
- `certify:p20`, migration-chain and the rendered browser test pass.

### Current status

```
MAIN SHA: afb0f2b6   CI: PASS (43948742321)   VERCEL ON afb0f2b6: PENDING owner confirmation
QUOTE ISSUANCE / PRO FORMA / INVOICE INTEGRITY: PASS (engineering); live issued quote for a QA Matter NOT TESTED
FINANCIAL PDF AUTHORIZATION / CROSS-CLIENT ISOLATION: PASS (engineering)
WISE INSTRUCTIONS: PASS (engineering)   OBSERVED PAYMENT: NOT TESTED live   VERIFIED WISE SETTLEMENT: NOT TESTED
OUT-OF-ORDER WEBHOOK SAFETY: PASS (fixed in #523)   PARTIAL/DEPOSIT HANDLING: PASS (engineering)
SCHEDULING GATE: PASS (engineering)   RON / APOSTILLE / COURIER / CUSTODY / RELEASE: PASS (engineering); live NOT TESTED
DELIVERY EVIDENCE: NOT TESTED   LIVE TRANSACTION ACCEPTANCE: NOT TESTED
FINAL TRANSACTION CERTIFICATION: NO-GO
```

### Remaining live gates (owner or provider action)

1. Owner confirms Vercel production is READY on `afb0f2b6`.
2. Operator execution review and quote issuance for a QA Matter. This needs explicit approval.
3. Client invoice, pro forma and Wise instructions are verified while the Matter is unpaid.
4. One explicitly authorized Wise payment, with settlement verified independently from provider evidence.
5. Live RON or in-person execution, then apostille (when required), courier, custody, release and delivery evidence.

## 34. Final live transaction acceptance readiness — 2026-11-16

Sections 1–33 are kept unchanged.
- **Scope:** this section separates (A) engineering, (B) automated integration tests, (C) non-mutating production checks and (D) live provider-backed certification. Nothing below presents A–C as D.
- **What was done:** no production data, payment record, quote, provider session, government submission, shipment or release was created or changed.
- **Network limits:** this session's network reaches GitHub only. The production site, Supabase, Vercel and the Wise API refused connections (HTTP 000). Every C and D check below is therefore owner-verified or BLOCKED.
- **Final decision:** **NO-GO.**

### Status

| # | Item | Status | Evidence reference | Observed result | Next required action |
|---|---|---|---|---|---|
| 1 | Repository and CI | PASS | `main` `213f8b2515b7a0c27c4462c871c5c9b09c493c2e`. [CI 43951739050](https://github.com/milanoseal-principle/milano-seal-platform/actions/runs/43951739050) (#524) and [CI 43948742321](https://github.com/milanoseal-principle/milano-seal-platform/actions/runs/43948742321) (#523). No open PRs. | #521–#524 merged. The #523 guard is present on `main` (`lib/wise/outOfOrderGuard.ts`, wired once in the Wise webhook). | None |
| 2 | Vercel production and domains | PASS (owner-verified) | `dpl_afQgNwBFJs126g68s6xTpWNuf1pv`, READY, source `213f8b25`. `www.themilanoseal.com` and `themilanoseal.com` are assigned. | Confirmed by the owner. Not independently reachable from this session. | None; do not redeploy |
| 3 | Automated gates on `213f8b25` | PASS (A/B) | Run in this session. | `npm test` 1543/1543. Typecheck, lint and build pass. Wise attempt database suite 241 checks. Gap-closure (financial, custody, release, authorization) 85. P3, P4 59, P5 31, retention 35, operational evidence 14. P20 25, P21 21, P22 18, P23 19, all with `live_certification=false`. Settlement-before-scheduling 15/15. Wise recovery 12/12. Reconciliation orchestrator 17/17. Production governance 27/27. Final production regression 17/17. Pricing, intake-privacy, RON corridor, apostille rules, custody schema, courier, cross-system, migration chain and the rendered browser test all pass. | None |
| 4 | Production configuration: Wise, Supabase, RON, courier, email | BLOCKED (C) | No network path from this session. | Not inspected. Having environment variables set would not count as PASS. | Owner runs the configuration checks below |
| 5 | Live Matter inventory: MS-2026-4578 and MS-2026-8329 | BLOCKED (C) | Last recorded state (§30, owner-verified 2026-11-16): both unpaid and pending review, with no issued quote and no verified settlement. | No newer evidence is available to this session. | Owner runs the read-only inventory query below |
| 6 | Quote issuance and financial documents | PASS (A/B); NOT TESTED (D) | `issue_financial_artifact`, gap-closure database suite, `tests/unit/priceIssued.test.ts`. | The engineering rules hold: approved quote required, totals reconcile, SHA-256 versioning, settlement required for a receipt, owner-only access. No live issued QA quote exists. | Owner authorizes operator execution review and quote issuance for one QA Matter |
| 7 | Wise payment instructions | PASS (A/B); NOT TESTED (D) | Portal payment card, invoice route. | Instructions appear only for an issued price, never while pricing is pending. | Verify after the quote in #6 is issued |
| 8 | Wise webhook authenticity, matching and out-of-order safety | PASS (A/B) | `verifyWiseSignature`, exact amount/currency/reference matching, attempt correlation, the #523 guard, Wise attempt database suite. | No defect found beyond #523, which is fixed and deployed. | None |
| 9 | Verified Wise settlement | NOT TESTED / BLOCKED (D) | No authorized live transfer exists. No access to Wise provider evidence. | Settlement must not be inferred from an invoice, email, screenshot or a received webhook alone. | Owner authorizes one specific payment, then verifies provider evidence (below) |
| 10 | Payment to scheduling | PASS (A/B); NOT TESTED (D) | `20261109090000_verified_settlement_before_scheduling`, settlement-before-scheduling suite. | Scheduling and later stages require verified settlement. An observed or submitted payment is display-only. | Re-check after #9 |
| 11 | RON or in-person execution | PASS (A/B); NOT TESTED (D) | P4 and P5 database suites, BlueNotary webhook authentication, postpayment RON corridor. | A completed provider session, verified statutory evidence and completed canonical execution remain distinct states. | Live execution after #9 (owner-authorized) |
| 12 | Apostille or authentication | PASS (A/B); NOT TESTED (D) | Apostille rules and packet validators, authority routing. | Domestic routes do not force an apostille. A required apostille needs real government evidence. | Only if the chosen QA route requires it |
| 13 | Courier and custody | PASS (A/B); NOT TESTED (D) | Custody ledger schema, Shippo HMAC callback, courier continuity. | A label or an in-transit event is not proof of delivery. | Only if the chosen QA route requires shipping |
| 14 | Final release and delivery | PASS (A/B); NOT TESTED (D) | Gap-closure release checks, `performFinalRelease`, release-integrity tests. | Release fails closed without settlement, execution, required authentication, custody or a valid recipient. | After #11–#13 |
| 15 | Client and operator consistency | PASS (A/B) | #518, #519, #521, #522 regressions. | No unpriced Matter shows an approved $0, and operator and client use the same issued-price rule. | Live confirmation with #6 |
| 16 | Live observability: runtime errors, webhook failures, notification queue | BLOCKED (C) | No Vercel or Supabase access. | Not inspected. | Owner reviews the Vercel runtime logs and the Wise exception queue (Finance, Wise Recovery) |

### Net-new defects in this pass
None. The only defect found in the lifecycle audit (§33) was fixed by #523 and is deployed.

### Owner checks (read-only; run from an authorized session)

1. **Configuration presence.** In Vercel, open Project Settings, then Environment Variables (Production). Confirm the Wise, Supabase, BlueNotary, Shippo, Resend and SMTP variables exist without opening their values. In Supabase, open Authentication, then SMTP, and confirm it is enabled.
2. **QA Matter inventory** (read-only SQL, Supabase SQL editor):
   ```sql
   select deal_id, status, deal_status, quote_approved_at, quote_review_required, final_total, amount_due,
          amount_paid, currency, payment_status, payment_confirmed, payment_settlement_status,
          payment_observed_at, execution_truth->>'review_confirmed_at' as review_confirmed_at,
          is_paid_and_released,
          (select count(*) from matter_financial_artifacts a where a.matter_id = d.id) as artifacts,
          (select count(*) from matter_evidence_ledger l where l.matter_id = d.id) as evidence_rows
   from deals d where deal_id in ('MS-2026-4578','MS-2026-8329');
   ```
3. **Wise exception queue.** Open the operator dashboard, then Finance, then Wise Recovery. Note any open exceptions. Do not resolve them by editing records directly.

### Live acceptance sequence. Each step needs its own explicit authorization.
1. Choose one QA Matter. Operator completes the execution review and issues the quote through the governed builder.
2. Client portal: verify the itemized invoice, the pro forma PDF (SHA-256 recorded) and the Wise instructions while the Matter is unpaid and scheduling is locked.
3. One authorized Wise payment of the exact amount, currency and reference. Verify settlement from Wise provider evidence: transfer ID, state, amount, currency and reference. Then confirm the Matter shows `payment_confirmed`, `paid` and `cleared` through the governed path only, and that scheduling unlocks.
4. Execution (RON or in person), then authentication and courier only where the route requires them, then custody, release and delivery evidence.
5. Append the evidence as §35. GO is allowed only when every mandatory item has live evidence.

### Final decision
```
ENGINEERING (A/B): PASS on 213f8b25        DEPLOYMENT: PASS (owner-verified)
LIVE QUOTE / SETTLEMENT / EXECUTION / RELEASE (D): NOT TESTED
FINAL TRANSACTION CERTIFICATION: NO-GO
```
