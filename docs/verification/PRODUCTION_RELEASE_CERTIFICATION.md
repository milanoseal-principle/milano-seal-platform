# The Milano Seal™ — Production Release Certification

**Decision: NO-GO.** Recovery, the eight migrations, the production deployment and live email delivery are verified (owner evidence, 2026-11-15). Signed-in client portal tests and Wise settlement are not yet tested.

Prepared 2026-11-15 UTC from a Claude Code cloud session. That session had GitHub access but **no network route** to `themilanoseal.com`, its DNS, the Vercel API or the production database, and no production credentials. Every item below is labelled by the evidence that actually exists. Nothing is marked PASS on source code alone where a live check is required.

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
