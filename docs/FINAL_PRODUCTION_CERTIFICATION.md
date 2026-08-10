# The Milano Seal™ — Final Production Certification

**Document Reference:** MS-OPS-FINALCERT-2026-V1
**Code baseline:** `main @ 310886b`
**Run from:** An environment with **live** Vercel, Wise, and Supabase production access
**Owner / Executor:** _______________
**Run date:** _______________

---

## Why this runbook exists

Code and CI are certified. The remaining gates — live Vercel, Wise production
E2E, and the Damiani dry run — **cannot** be certified from the build/CI
environment, because that environment cannot reach the live site or production
Wise/Supabase infrastructure. Calling those gates "passed" from there would be
false. This checklist is the manual production certification to be executed
from an environment that *can* reach production, with every result recorded
against a pass/fail field and an evidence ID.

**Permanent SOP rule (non-negotiable):**
No generated legal document, invoice, payment instruction, or release package
may use an AI-reproduced critical identifier when an authoritative structured
value exists.

**Entry status:**

```
CODE + CI CERTIFIED
LIVE VERCEL CERTIFICATION   PENDING
WISE PRODUCTION E2E         PENDING
DAMIANI DRY RUN             PENDING
DAMIANI                     NO-GO
```

Mark each item PASS / FAIL and fill the evidence field. Any FAIL or blank
evidence field = **NO-GO**.

---

## PHASE 1 — VERCEL PRODUCTION

| # | Check | PASS / FAIL | Evidence ID |
|---|-------|:-----------:|-------------|
| 1.1 | Production deployment source = `main @ 310886b` | ☐ / ☐ | deploy id: __________ |
| 1.2 | All production deployments status **Ready** | ☐ / ☐ | screenshot: __________ |
| 1.3 | `/api/health` returns healthy payload | ☐ / ☐ | ts: __________ |
| 1.4 | `/professional/damiani` loads | ☐ / ☐ | screenshot: __________ |
| 1.5 | `/portal/payment` loads | ☐ / ☐ | screenshot: __________ |

**Phase 1 result:** PASS / FAIL — recorded by: _______________

---

## PHASE 2 — TIFFTEST50 LIVE WISE E2E

Use a disposable, eligible test Matter. This phase moves **real** money via
Wise — execute a controlled, minimal payment only.

**Setup**

| # | Check | PASS / FAIL | Evidence ID |
|---|-------|:-----------:|-------------|
| 2.1 | Disposable eligible Matter created | ☐ / ☐ | matter id: __________ |
| 2.2 | Shipping / courier included on the Matter | ☐ / ☐ | — |

**Recorded pricing (from the live quote, not reconstructed):**

| Field | Value |
|-------|-------|
| `eligible_subtotal` | __________ |
| `non_discountable_total` | __________ |
| `discount_amount` | __________ |
| `final_total` | __________ |
| `amount_due` | __________ |
| Wise reference | __________ |

**Payment + reconciliation**

| # | Check | PASS / FAIL | Evidence ID |
|---|-------|:-----------:|-------------|
| 2.3 | Controlled Wise payment made | ☐ / ☐ | wise txn id: __________ |
| 2.4 | Server reconciles **amount** | ☐ / ☐ | — |
| 2.5 | Server reconciles **currency** | ☐ / ☐ | — |
| 2.6 | Server reconciles **reference** | ☐ / ☐ | — |
| 2.7 | Server reconciles **transaction ID** | ☐ / ☐ | — |
| 2.8 | `payment_confirmed` set | ☐ / ☐ | — |
| 2.9 | TIFFTEST50 redeemed exactly **once** | ☐ / ☐ | usage_count: __________ |
| 2.10 | Matter scheduled **only after** confirmation | ☐ / ☐ | status ts: __________ |
| 2.11 | Portal paid / discount state correct | ☐ / ☐ | screenshot: __________ |

**Idempotency — replay the same settlement / webhook**

| # | Check | PASS / FAIL | Evidence ID |
|---|-------|:-----------:|-------------|
| 2.12 | No second payment | ☐ / ☐ | — |
| 2.13 | No second redemption (usage_count unchanged) | ☐ / ☐ | usage_count: __________ |
| 2.14 | No duplicate scheduling transition | ☐ / ☐ | — |

**Phase 2 result:** PASS / FAIL — recorded by: _______________

---

## PHASE 3 — DAMIANI DRY RUN

Runs against **production** but **STOPS BEFORE PAYMENT**. No money moves. No
redemption, no confirmation, no scheduling may occur.

| # | Check | PASS / FAIL | Evidence ID |
|---|-------|:-----------:|-------------|
| 3.1 | `/professional/damiani` opens | ☐ / ☐ | screenshot: __________ |
| 3.2 | Italian is the default language | ☐ / ☐ | — |
| 3.3 | DAMIANI50 auto-carried | ☐ / ☐ | — |
| 3.4 | Representative Matter submitted | ☐ / ☐ | matter id: __________ |
| 3.5 | Eligible subtotal only discounted | ☐ / ☐ | — |
| 3.6 | Shipping / courier untouched | ☐ / ☐ | — |
| 3.7 | Correct final total | ☐ / ☐ | value: __________ |
| 3.8 | Correct Wise amount / reference | ☐ / ☐ | ref: __________ |
| 3.9 | **STOP BEFORE PAYMENT** confirmed | ☐ / ☐ | — |

**Production DB verification (must all hold):**

| # | Check | PASS / FAIL | Evidence ID |
|---|-------|:-----------:|-------------|
| 3.10 | DAMIANI50 `usage_count` = 0 | ☐ / ☐ | value: __________ |
| 3.11 | No redemption row | ☐ / ☐ | — |
| 3.12 | No `payment_confirmed` | ☐ / ☐ | — |
| 3.13 | No `scheduled` status | ☐ / ☐ | — |

**Phase 3 result:** PASS / FAIL — recorded by: _______________

---

## PHASE 4 — FINAL TRUTH REVIEW

Human-verify each identifier **from the authoritative source**. Do not accept
any AI-reproduced value. Enter the source used for each.

| # | Identifier | Verified ☐ | Authoritative source |
|---|-----------|:----------:|----------------------|
| 4.1 | Legal name | ☐ | __________ |
| 4.2 | Codice fiscale | ☐ | __________ |
| 4.3 | Destination | ☐ | __________ |
| 4.4 | Document type | ☐ | __________ |
| 4.5 | Authentication authority | ☐ | __________ |
| 4.6 | Notarization requirement | ☐ | __________ |
| 4.7 | Wise beneficiary details | ☐ | __________ |
| 4.8 | Wise reference | ☐ | __________ |
| 4.9 | Final amount due | ☐ | __________ |

**NO AI-REPRODUCED CRITICAL IDENTIFIERS.**

**Phase 4 result:** PASS / FAIL — recorded by: _______________

---

## PHASE 5 — GO / NO-GO

**GO only if every item in Phases 1–4 is PASS with evidence recorded.**

**Exit status (fill in):**

```
LIVE VERCEL CERTIFICATION   PASS / FAIL
WISE PRODUCTION E2E         PASS / FAIL
DAMIANI DRY RUN             PASS / FAIL
FINAL TRUTH REVIEW          PASS / FAIL
```

**Final decision:** GO / NO-GO
**Signed off by:** _______________
**Date:** _______________

---

*A single FAIL, or any blank evidence field, is a NO-GO. Do not certify any
gate that was not executed against live production infrastructure.*
