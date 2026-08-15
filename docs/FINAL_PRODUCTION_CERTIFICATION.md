# The Milano Seal™ — Final Production Certification

**Document Reference:** MS-OPS-FINALCERT-2026-V1
**CERTIFIED PRODUCTION SHA:** `________________________`
**Run from:** An environment with **live** Vercel, Wise, and Supabase production access
**Owner / Executor:** _______________
**Run date:** _______________

---

## Why this runbook exists

Repository validation is certified only when the **Vercel external merge gate**
passes for the exact SHA entered above. GitHub-hosted Actions are not a launch
dependency. The remaining gates — live production, Wise production E2E, and the
Damiani dry run — **cannot** be certified from the build environment, because
that environment cannot prove live Wise/Supabase transaction truth. Calling those gates "passed" from there would be
false. This checklist is the manual production certification to be executed
from an environment that *can* reach production, with every result recorded
against a pass/fail field and an evidence ID.

**Permanent SOP rule (non-negotiable):**
No generated legal document, invoice, payment instruction, or release package
may use an AI-reproduced critical identifier when an authoritative structured
value exists.

**Entry status:**

```
CODE + VERCEL MERGE GATE   PASS / FAIL
LIVE VERCEL CERTIFICATION   PENDING
WISE PRODUCTION E2E         PENDING
DAMIANI DRY RUN             PENDING
DAMIANI                     NO-GO
```

Mark each item PASS / FAIL and fill the evidence field. Any FAIL or blank
evidence field = **NO-GO**.

---

## CONTROLLING CERTIFICATION ORDER

This document is the current release authority. Gates are certified in order:

```
A. Existing infrastructure / security prerequisites   (MS-OPS-GOLIVE-2026-V1, legacy)
B. Current production code + external merge gate       (exact CERTIFIED PRODUCTION SHA — PASS required)
C. Live Vercel certification                           (Phase 1)
D. TIFFTEST50 Wise E2E                                 (Phase 2)
E. Damiani dry run                                     (Phase 3)
F. Final Truth Review                                  (Phase 4)
G. GO / NO-GO                                          (Phase 5)
```

**Precedence:** If an older checklist conflicts with the current production
architecture, the current locked architecture **and this document
(MS-OPS-FINALCERT-2026-V1) control.** The legacy go-live checklist
([MS-OPS-GOLIVE-2026-V1](./go-live-checklist.md)) governs the original
infrastructure clearance only (order item A).

---

## BILLING-INDEPENDENT MERGE GATE

The repository does **not** depend on GitHub-hosted Actions for launch certification.
Every Vercel preview/production deployment executes `node scripts/run-vercel-merge-gate.mjs` before `next build`.
That command runs the canonical validators, typecheck, lint, test suite, production-governance,
Damiani wiring, and TIFF certification checks. A failed gate prevents the Vercel deployment
from reaching a successful status.

For protected `main`, require the external status check:

`Vercel – milano-seal-platform`

The GitHub Actions workflow remains manual-only as a recovery/future secondary runner.
Its billing availability does not control GO / NO-GO.

**Source-validation PASS is not live transaction proof.** TIFF and Damiani live gates remain mandatory.

---

## PHASE 1 — VERCEL PRODUCTION

| # | Check | PASS / FAIL | Evidence ID |
|---|-------|:-----------:|-------------|
| 1.1 | Production deployment SHA exactly equals **CERTIFIED PRODUCTION SHA** above | ☐ / ☐ | deploy id + sha: __________ |
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
| 2.3 | Beneficiary / account configuration retrieved from approved production configuration — **not** manually typed or AI-generated | ☐ / ☐ | config source: __________ |
| 2.4 | Amount displayed in the client portal **exactly equals** the server-side reconciled `amount_due` | ☐ / ☐ | portal / server values: __________ |

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
| 2.5 | Controlled Wise payment made | ☐ / ☐ | wise txn id: __________ |
| 2.6 | Server reconciles **amount** | ☐ / ☐ | — |
| 2.7 | Server reconciles **currency** | ☐ / ☐ | — |
| 2.8 | Server reconciles **reference** | ☐ / ☐ | — |
| 2.9 | Server reconciles **transaction ID** | ☐ / ☐ | — |
| 2.10 | `payment_confirmed` set | ☐ / ☐ | — |
| 2.11 | TIFFTEST50 redeemed exactly **once** | ☐ / ☐ | usage_count: __________ |
| 2.12 | Matter scheduled **only after** confirmation | ☐ / ☐ | status ts: __________ |
| 2.13 | Portal paid / discount state correct | ☐ / ☐ | screenshot: __________ |

**Negative test — deliberate mismatch is rejected**

| # | Check | PASS / FAIL | Evidence ID |
|---|-------|:-----------:|-------------|
| 2.14 | A deliberately wrong amount / reference / currency is **rejected** and does **NOT** produce `payment_confirmed` or `scheduled` | ☐ / ☐ | rejection evidence: __________ |

**Idempotency — replay the same settlement / webhook**

| # | Check | PASS / FAIL | Evidence ID |
|---|-------|:-----------:|-------------|
| 2.15 | No second payment | ☐ / ☐ | — |
| 2.16 | No second redemption (usage_count unchanged) | ☐ / ☐ | usage_count: __________ |
| 2.17 | No duplicate scheduling transition | ☐ / ☐ | — |

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

**Rendered-document release gate (Damiani-specific):**

| # | Check | PASS / FAIL | Evidence ID |
|---|-------|:-----------:|-------------|
| 4.10 | Rendered final legal document compared **character-for-character** against the verified critical identity fields before release | ☐ / ☐ | reviewer + ts: __________ |

Fields compared character-for-character:

```
legal name
codice fiscale
document identity
destination
notarial certificate data
authentication routing
```

**Any mismatch = RELEASE BLOCKED.** This control directly prevents the prior
relationship-damaging failure class.

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

---

## PHASE 2A — TIFF REAL CLIENT-TO-CLOSE ACCEPTANCE

This controlling acceptance is run at `https://www.themilanoseal.com` after Phase 2. Use one disposable Matter clearly marked production QA, never Damiani or sensitive client material. Do not use direct database edits, manual payment confirmation, manual redemption, or fabricated revenue. Retain the Matter and evidence under production retention policy.

**Evidence contract:** Every step requires a **PASS / FAIL**, **Timestamp**, **Matter ID**, **Evidence ID**, **Screen / route**, and **Authoritative backend source** where applicable. A blank field is a FAIL. “Implemented,” “code looks correct,” and “should work” are not evidence. **Live PASS remains manual production evidence only**; repository validators never execute or claim these results.

### STEP 1 — MOBILE FRESH LOAD
Open production fresh/incognito on a physical mobile browser. Verify the production hostname, first load without cached auth/session state, no broken UI or horizontal clipping, and no console-visible false-success state.

### STEP 2 — NORMAL INTAKE NAVIGATION
Navigate normally to **Secure Records Intake** through the public navigation/CTA; a manually typed route is not primary proof. Verify the CTA, destination, and load are functional with no dead link.

### STEP 3 — MATTER SUBMISSION
Submit one realistic international QA Matter with clearly marked test identity/data. Verify one intake, no duplicate Matter, no fake payment, and no premature scheduling.

### STEP 4 — DOCUMENT UPLOAD
Upload approved nonsensitive test documents. Verify upload, persisted metadata, association to this Matter, and later retrieval through the portal.

### STEP 5 — SINGLE MATTER PERSISTENCE
Verify exactly one record and capture public `deal_id`, internal UUID, `created_at`, and `source_channel`.

### STEP 6 — QUOTE / MATTER PARITY
Compare the server record and UI: `original_total`, `eligible_subtotal`, `non_discountable_total`, `discount_amount`, `final_total`, `invoice_retainer`, `invoice_balance`, `amount_due`, and `currency`. Exact logical and numeric parity is required.

### STEP 7 — TIFFTEST50
Apply TIFFTEST50 and capture `usage_count` before payment. Verify 50% applies only to canonical `eligible_subtotal`, non-discountable value is untouched, totals and the 50/50 invoice regenerate, payment remains unpaid, `payment_confirmed` remains false, and scheduling/execution remain locked. TIFFTEST50 is not a public reusable client discount.

### STEP 8 — WISE PAYMENT
Use only approved production Wise configuration. Verify the Matter reference, amount, and currency exactly; never invent beneficiary/account details.

### STEP 9 — WISE RECONCILIATION / IDEMPOTENCY
Verify the same UUID/`deal_id` updates once, `payment_confirmed` is true, `amount_paid` is exact, the Wise transaction ID is preserved, there is no duplicate payment, and **TIFFTEST50 redeemed exactly once**. Replay the settlement/webhook and prove replay does not create a second redemption, payment, or state transition.

### STEP 10 — PAYMENT → SCHEDULING GATE
**Before verified payment: scheduling is blocked**. After verified payment it becomes eligible. Prove there is no client unlock, manual bypass, or generic-admin bypass.

### STEP 11 — CLIENT PORTAL ENTRY
Enter the **Matter Control Portal through the actual client path**, not an operator route. Verify client authentication, the correct Matter/payment state, and rejection of cross-client Matter access.

### STEP 12 — NOTIFICATION DELIVERY
For each applicable intake, payment, scheduling/update, execution, and release/delivery communication, distinguish notification generated from **notification actually delivered**. Record channel, provider delivery state where available, timestamp, and Matter ID/reference. An application function returning success is not delivery evidence.

### STEP 13 — PORTAL ↔ SUPABASE PARITY
Perform a read-only comparison of canonical Matter truth and client projection for `deal_id`, `deal_status`, `payment_status`, `payment_confirmed`, `original_total`, `eligible_subtotal`, `discount_amount`, `final_total`, `invoice_retainer`, `invoice_balance`, `amount_due`, `amount_paid`, `currency`, documents, and timeline milestones. Also compare scheduling and execution state. No stale projection is permitted; the portal cannot report paid before canonical backend truth.

### STEP 14 — GOVERNED EXECUTION → CLOSE
Use canonical controls and dedicated governed endpoints, never the generic founder status route when a dedicated endpoint exists. Follow the complete canonical chain without skipping: verified payment → `scheduled → in_execution` → execution QA → `apostille_processing` → apostille received/final payment/release controls → label/courier release → `in_transit → delivered → completed`. At every transition verify the predecessor, execution/payment truth, timestamp, activity/audit event, and portal update. The regression locks are explicit: apostille cannot skip execution; delivery cannot skip canonical release and transit stages.

### STEP 15 — MOBILE UX / DEAD-ACTION SWEEP
Repeat intake, payment, portal, documents, timeline, status, navigation, buttons, forms, modals, and download/open actions on mobile. Fail for clipping, overflow, dead/invisible controls, unclear next step, wrong status, stale amount, false-success UI/toast, inert active-looking controls, or operator controls leaking to a client.

### Step evidence ledger

| Step | PASS / FAIL | Timestamp | Matter ID | Evidence ID | Screen / route | Authoritative backend source |
|---:|:---:|---|---|---|---|---|
| 1 | ☐ / ☐ | ___ | ___ | ___ | ___ | n/a |
| 2 | ☐ / ☐ | ___ | ___ | ___ | ___ | n/a |
| 3 | ☐ / ☐ | ___ | ___ | ___ | ___ | ___ |
| 4 | ☐ / ☐ | ___ | ___ | ___ | ___ | ___ |
| 5 | ☐ / ☐ | ___ | ___ | ___ | ___ | ___ |
| 6 | ☐ / ☐ | ___ | ___ | ___ | ___ | ___ |
| 7 | ☐ / ☐ | ___ | ___ | ___ | ___ | ___ |
| 8 | ☐ / ☐ | ___ | ___ | ___ | ___ | Wise + ___ |
| 9 | ☐ / ☐ | ___ | ___ | ___ | ___ | Wise + Supabase |
| 10 | ☐ / ☐ | ___ | ___ | ___ | ___ | ___ |
| 11 | ☐ / ☐ | ___ | ___ | ___ | ___ | ___ |
| 12 | ☐ / ☐ | ___ | ___ | ___ | ___ | provider: ___ |
| 13 | ☐ / ☐ | ___ | ___ | ___ | ___ | Supabase |
| 14 | ☐ / ☐ | ___ | ___ | ___ | ___ | Supabase audit/activity |
| 15 | ☐ / ☐ | ___ | ___ | ___ | ___ | n/a |

### Read-only parity procedure

Use the production Supabase read-only console/role and inspect the single captured UUID. Select only the Step 13 fields from the canonical Matter/deal source and related authorized document/timeline projections; compare the returned values to the authenticated client UI. Do not paste credentials into evidence, run writes, infer absent values, or bypass row-level access. Capture query ID/time and redacted results as evidence.

### Dead-action regression lock

Audit Secure Records Intake, Matter cockpit, SecurePaymentCard, Matter Control Portal, Command Center, Dispatch, execution timeline, and shipping/courier actions. Each rendered operational control must be classified **LIVE**, **ACTIONABLE**, **CONTROLLED EMPTY**, or **READ-ONLY**. Actionable controls require real destinations/handlers and failed mutations must not emit false-success UI.

### QA code governance lock

TIFFTEST50 remains governed: eligibility uses canonical subtotal, application changes the Matter obligation but not payment truth, redemption occurs only through verified Wise settlement, and single redemption survives replay. Do not remove usage controls for convenience. For future testing, use an approved reset/reissue lifecycle.

`NICKTEST50`: **DO NOT CREATE**, alter, activate, or migrate it unless a canonical production record or explicit founder-approved specification is first verified.

### TIFF acceptance output

```text
MILANO SEAL — TIFF REAL 15-STEP CERTIFICATION
1 MOBILE FRESH LOAD                         PASS / FAIL
2 NORMAL INTAKE NAVIGATION                 PASS / FAIL
3 MATTER SUBMISSION                        PASS / FAIL
4 DOCUMENT UPLOAD                          PASS / FAIL
5 SINGLE MATTER PERSISTENCE                PASS / FAIL   MATTER ID: ___
6 QUOTE / MATTER PARITY                    PASS / FAIL
7 TIFFTEST50                               PASS / FAIL   USAGE BEFORE PAYMENT: ___
8 WISE PAYMENT                             PASS / FAIL
9 WISE RECONCILIATION / IDEMPOTENCY        PASS / FAIL   USAGE AFTER PAYMENT: ___
10 PAYMENT → SCHEDULING GATE               PASS / FAIL
11 CLIENT PORTAL ENTRY                     PASS / FAIL
12 NOTIFICATION DELIVERY                   PASS / FAIL
13 PORTAL ↔ SUPABASE PARITY                PASS / FAIL
14 GOVERNED EXECUTION → CLOSE              PASS / FAIL
15 MOBILE UX / DEAD-ACTION SWEEP           PASS / FAIL
APPLICATION DEFECTS: ___   UX DEFECTS: ___
DEAD CONTROLS: ___         FALSE-SUCCESS STATES: ___
PAYMENT DUPLICATES: ___ (0 REQUIRED)
DISCOUNT REDEMPTIONS: ___ (1 REQUIRED)
FINAL: GO / NO-GO
```

A GO requires all 15 PASS results with evidence. Do not certify delivery from generation, portal state without Supabase parity, closeout without the state machine, or mobile UX from desktop review.
