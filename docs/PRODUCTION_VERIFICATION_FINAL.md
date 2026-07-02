# Milano Seal — Production Verification (FINAL)

- **Date/time:** 2026-06-28 (UTC)
- **Branch:** `claude/funny-maxwell-hlxQN`
- **Commit (HEAD):** `7494342` (descends from canonical `main`)
- **Production source of truth:** `main @ bacd9423d4c0cbded407b2bc45f3ea343964badd` (confirmed ancestor of working branch)
- **Canonical domain (preferred):** `https://themilanoseal.com` (apex)

## Standing rule applied
This sandbox's **egress proxy denies outbound HTTPS to the Milano Seal domains by
organization network policy** (gateway `403 to CONNECT` for `themilanoseal.com:443`
and `www.themilanoseal.com:443`; control host `github.com` returns 200). Per the
proxy README, blocked hosts are reported, not routed around. Therefore **no live
HTTP claim can be made from here**. DNS (UDP/53) is *not* gated, so DNS findings
below are real.

---

## Results

| # | Check | Result | Evidence |
|---|---|---|---|
| — | Git state / source of truth | ✅ GREEN | `main` contains `bacd942`; HEAD `7494342` descends from it |
| — | Open PRs | ✅ SAFE | Only PR #87 open (docs-only, 2 prompt files, +48 lines). PR #83 untouched. |
| — | Local validators (16/16) | ✅ GREEN | all `validate:*` pass incl. intelligence-safety, payment-release-gates |
| — | Typecheck | ✅ GREEN | `tsc --noEmit` exit 0 |
| 15 | Vercel production build | ✅ GREEN | `next build` → `✓ Compiled successfully`, 3047/3047 pages, exit 0 |
| 4 | `/intake` | ✅ CODE GREEN | `app/intake/page.tsx` present, in static build |
| 5 | `/countries` | ✅ CODE GREEN | `app/countries/page.tsx` present, in static build |
| 6 | `/map` | ✅ CODE GREEN | `app/map/page.tsx` present, in static build |
| 7 | `/portal/[token]` safe behavior | ✅ CODE GREEN | token→email-bound OTP via admin client; 403 on email mismatch |
| 8 | Wise webhook health | ✅ CODE GREEN | `GET /api/webhooks/wise` → `{ok:true}`; POST verifies RSA-SHA256 first |
| 9 | Shippo webhook | ✅ CODE GREEN | POST secret-guarded + idempotent; no GET health (GET→405, no leak) |
| 10 | Public route safety (no leak) | ✅ GREEN | `validate:intelligence-safety` pass; no public import of private engine |
| 11 | Scheduling blocked w/o payment | ✅ CODE GREEN | `schedule` → `assertPaymentConfirmed` → 402 if unpaid |
| 12 | Release blocked w/o final payment | ✅ CODE GREEN | `release` → 401→403(founder)→402→403(Codice Fiscale lock) |
| 13 | Supabase migrations through 037 (files) | ✅ PRESENT / ⏳ LIVE-UNVERIFIED | `037_identifier_lock_document_versions.sql` present; live apply unverifiable |
| 2 | Apex domain loads | ⏳ NOT VERIFIED (egress 403) | DNS A `216.150.1.1` (Vercel anycast) — points at Vercel |
| 3 | www domain loads/redirects | ⏳ NOT VERIFIED (egress 403) | DNS CNAME `6aab63d743838dfb.vercel-dns-017.com` + A `216.150.1.129/216.150.16.129` (Vercel) |
| 1 | Prod deploy assigned to green main | ⏳ NOT VERIFIED | no Vercel CLI/API reachable from sandbox |
| 14 | Live env vars present | ⏳ NOT VERIFIED | Vercel env not reachable from sandbox |

---

## DNS records found (real — port 53 not gated)

```
themilanoseal.com.        A      216.150.1.1
www.themilanoseal.com.    CNAME  6aab63d743838dfb.vercel-dns-017.com
www.themilanoseal.com.    A      216.150.1.129, 216.150.16.129
```

Both records resolve to **Vercel** infrastructure (216.150.1.x is Vercel's current
anycast range; `*.vercel-dns-017.com` is a Vercel-managed CNAME target). This is
strong evidence both apex and www are configured on Vercel. **The HTTP-level
response (200 / 308 redirect / SSL validity / which Vercel project) could not be
confirmed because egress is blocked.**

## Domain canonicalization

DNS is correctly pointed for **both** domains. Canonical reporting domain chosen:
**`https://themilanoseal.com`** (apex preferred). The redirect direction
(apex↔www) cannot be confirmed from here — that requires a live `curl -I`.

## Code-verified invariants (detail)

- **Payment gate** (`lib/payments/paymentGate.ts`): `PAYMENT_CONFIRMED` requires
  `status=paid AND amount_paid >= amount_due`. No client/query/localStorage path
  can mark paid; `validate:payment-release-gates` asserts against bypass patterns.
- **Wise webhook**: signature-first, dedup by `X-Delivery-Id`, strict
  reference+amount+currency+env match, confirms payment but **never auto-advances**
  past scheduling unlock; mismatches → `PAYMENT_REVIEW_REQUIRED`.
- **Shippo webhook**: `// DELIVERED: do not auto-complete — release gates must pass
  independently`. Exceptions/returns surfaced to operator.
- **Release**: founder_admin only (role from server token), payment-confirmed, and
  Italy Codice Fiscale identifier lock `confirmed/exact_match` — three independent
  gates, each writing a security event on block.

---

## Remaining blockers (to reach LIVE GREEN)

1. **Egress policy** blocks this sandbox from `themilanoseal.com` / `www.themilanoseal.com`
   (403 CONNECT). Either allowlist both hosts for the session, or run the smoke
   from an unrestricted machine: `BASE=https://themilanoseal.com npm run verify:production`.
2. **No Vercel CLI/API access** → production deployment→commit mapping, domain
   project assignment, and env-var presence unverified.
3. **No live Supabase connection** → migration-applied-through-037 unverified on the
   live DB (files are present and correct in repo).

## Final status

🟢 **CODE / BUILD / VALIDATORS / TYPECHECK = GREEN**
🟡 **LIVE INFRA = NOT VERIFIED** (egress-blocked; DNS for both domains correctly on Vercel)

**Overall: NOT GREEN (LIVE) — CODE GREEN.** No live-verified claim is made.
Promotion on live grounds is not authorized until items 1–3 above are run against
production with appropriate access.
</content>
