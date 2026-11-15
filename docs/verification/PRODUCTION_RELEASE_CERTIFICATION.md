# The Milano Seal™ — Production Release Certification

**Decision: NO-GO.** Recovery is verified. The eight security migrations are not yet applied, and no live transaction has been tested.

Prepared 2026-11-15 UTC from a Claude Code cloud session. That session had GitHub access but **no network route** to `themilanoseal.com`, its DNS, the Vercel API or the production database, and no production credentials. Every item below is labelled by the evidence that actually exists. Nothing is marked PASS on source code alone where a live check is required.

## 1–3. Repository, PR #510 and CI

| Item | Evidence | Status |
|---|---|---|
| `main` | `5a7995a93152e993547cd06666c29e31fdad30f9` (2026-11-15 00:38:17 UTC), merge of PR #510 | PASS |
| PR #510 | Merged 2026-11-15 00:38 UTC. Founder new-Matter alert HTML-escapes client fields; outreach signature domain corrected | PASS |
| CI | Run `43658275241`, job `validate`: success, 00:27:46–00:38:56 UTC. All 47 steps green, including typecheck, lint, tests, production build and final production regression | PASS |
| Codex review | No findings on `db2c6a85` | PASS |

## 4–6. Vercel, domain, TLS, Supabase target

| Item | Status | Blocker |
|---|---|---|
| Vercel production SHA | BLOCKED | No Vercel API access from the session. Check Vercel → Deployments → Production and confirm the commit is `5a7995a9`. |
| Domain / TLS / routes | BLOCKED | `themilanoseal.com` is unreachable and unresolvable from the session (egress policy). |
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
- **Execution:** BLOCKED for all eight. No explicit production-write approval has been given in the execution context, and the session has no database connectivity.

## 10–12. Security, RLS, Alliance and VA

- **Clean replay (code tests):** forged founder/admin roles are denied, disabled and banned accounts are denied, allow-all policies are removed, and partner own-row reads are restricted.
- **Production:** BLOCKED until the migrations are applied.
- **Post-apply verification:** run `supabase/verification/migration_rehearsal_checks.sql`, which is catalog-only and read-only. Every entry in `failures` must be empty, and `operator_unique_indexes_valid` must be 3.

## 13–21. Synthetic Matter, payment and notifications

- **Synthetic Matter:** NOT TESTED. A live Matter writes to production and needs the owner, on a device that can reach the site.
- **Payment gate (code):** `/api/portal/me/payment-observation` sends the payment-cleared alert only when `evaluatePaymentGate` returns `PAYMENT_CONFIRMED`. A client's own report records an observation and cannot settle the Matter.
- **Wise:** instructions are NOT TESTED live. Live settlement is NOT TESTED and needs approval for that specific transaction.
- **Founder email:**
  - New-Matter alerts are sent by `/api/cron/notification-reconcile` (every minute, per `vercel.json`). Each send claims a unique key first, so retries cannot send twice.
  - Recipients are `nicholas@themilanoseal.com` and `themilanoseal@gmail.com`, plus any addresses in `OPERATOR_NOTIFICATION_EMAILS`.
  - Delivery is NOT independently verified.
- **Client email:** NOT independently verified.

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

1. **Production-write approval** for the exact batch: "Approved: apply the eight migrations to ehqdzfopsrbwewtddiwq". Then apply the files one at a time in the Supabase SQL editor (or a connection the owner provides), verifying after each one.
2. **Preflight refresh:** run `p12_hosted_snapshot.sql` and `b01_operator_binding_audit.sql` (read-only) immediately before applying.
3. **Vercel production SHA** from the Vercel dashboard.
4. **One live synthetic Matter** submitted by the owner on a phone. Record its reference, then confirm in the inbox that the founder alert and the client acknowledgement arrived.
5. **SPF, DKIM and DMARC records** for `themilanoseal.com` (Resend sender).
6. **Live Wise settlement** with approval for that specific transaction.
7. The outreach template still contains a placeholder phone number, `+1 (305) 000-0000`.

## 27. Final status

```
PR #510: PASS (merged)          CI: PASS (43658275241)
MAIN SHA: 5a7995a93152e993547cd06666c29e31fdad30f9
VERCEL PRODUCTION SHA: BLOCKED  DOMAIN: BLOCKED  TLS: BLOCKED
DATABASE: BLOCKED (no approval, no connectivity)
MIGRATION 1-8: BLOCKED (not applied; preflight status above)
FOUNDER SECURITY: BLOCKED   RLS: BLOCKED   ALLIANCE: BLOCKED   VA: BLOCKED
SYNTHETIC MATTER / AUTH / INTAKE / UPLOAD / PERSISTENCE: NOT TESTED
PRICING / PRO FORMA / WISE INSTRUCTIONS: NOT TESTED
PAYMENT GATE: code PASS; live NOT TESTED     WISE SETTLEMENT: NOT TESTED
PORTAL: NOT TESTED   FOUNDER EMAIL: NOT TESTED   CLIENT EMAIL: NOT TESTED
DNS: BLOCKED
RON / APOSTILLE / COURIER REGRESSION: code PASS (CI); live NOT TESTED
MOBILE: NOT TESTED   MONITORING: NOT TESTED   RECOVERY: VERIFIED
FINAL TRANSACTION CERTIFICATION: NO-GO
```
