# The Milano Seal™ — Production Deploy & Transaction Certification Checklist

**Document Reference:** MS-OPS-DEPLOY-2026-V3  
**Status:** ACTIVE PRODUCTION STANDARD  
**Repository:** `milanoseal-principle/milano-seal-platform`  
**Production Domain:** `https://themilanoseal.com`  
**Payment Architecture:** Wise Business only  
**Canonical Database:** Supabase  
**Deployment Gate:** Vercel production build gate

---

## 1. Canonical source order

Production truth is controlled in this order:

1. Current application code.
2. `data/matter-state-machine.ts`.
3. `lib/matter/executionTruth.ts`.
4. Canonical Matter/payment read models.
5. `app/api/webhooks/wise/route.ts` and `lib/wise.ts`.
6. Current Supabase migration chain.
7. `docs/FINAL_PRODUCTION_CERTIFICATION.md`.
8. Generated `docs/ROUTE_MAP.md`.
9. This checklist.

Do not create a second Matter engine, payment engine, scheduling gate, execution state machine, or release state machine.

---

## 2. Billing-safe deployment path

Feature-branch pushes must not trigger Vercel preview builds.

`vercel.json` must retain a production-only `ignoreCommand`.

GitHub-hosted Actions remain manual only. Do not run them for routine deployment.

Production sequence:

```text
branch commit
→ review diff
→ merge to main
→ one Vercel production build
→ production health verification
```

---

## 3. Route truth

`docs/ROUTE_MAP.md` is generated from current application code.

Never hand-edit it.

Generate:

```bash
node scripts/generate-route-map.mjs
```

Validate:

```bash
node scripts/generate-route-map.mjs --check
```

Required production surfaces include:

- `/today`
- `/workspace/release`
- `/portal/payment`
- `/professional/damiani`
- `/api/health`
- `/api/intake`
- `/api/webhooks/wise`
- `/api/dashboard/operator-intelligence`

---

## 4. Supabase

Supabase is the canonical transactional source of truth.

Required:

- current migrations applied;
- RLS active;
- service-role access server-side only;
- `execution_truth` available where migration 050 is applied;
- `due_at` remains the generated compatibility projection of `sla_deadline`;
- payment confirmation is never written from a client-controlled request;
- scheduling state is never manually advanced around the canonical gate;
- production QA never edits the database to fabricate acceptance.

Run:

```bash
npm run validate:migration-chain
npm run validate:production-governance
```

---

## 5. Vercel production environment

Required production variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL=https://themilanoseal.com
NEXT_PUBLIC_APP_URL=https://themilanoseal.com
PORTAL_SESSION_SECRET
RESEND_API_KEY
RESEND_FROM
WISE_ENV=production
WISE_API_TOKEN
WISE_PROFILE_ID
WISE_WEBHOOK_ALLOWED_TEST=false
PAYMENT_BASE_URL=https://themilanoseal.com
OPERATOR_EMAILS
ADMIN_EMAILS
```

`WISE_WEBHOOK_TEST_BYPASS` must remain unset in production.

Wise webhook verification uses RSA-SHA256 against the Wise production public key in code. A shared `WISE_WEBHOOK_SECRET` is not the canonical verification mechanism.

Never commit real secrets.

---

## 6. Wise-only payment architecture

Canonical provider:

```text
Wise Business
```

Canonical webhook:

```text
POST https://themilanoseal.com/api/webhooks/wise
```

Payment confirmation requires:

- valid Wise signature;
- matching canonical Matter/reference;
- exact amount;
- exact currency;
- idempotent reconciliation;
- same Matter updated once.

Never confirm payment from inferred amount, inferred currency, unmatched reference, browser navigation, manual operator assertion, or direct database edit.

Verified payment is the gate for scheduling eligibility.

---

## 7. Canonical Matter execution order

The canonical state machine remains authoritative.

Primary governed chain:

```text
intake_received
→ under_review
→ quoted
→ awaiting_deposit
→ deposit_pending_review
→ deposit_confirmed
→ scheduling_unlocked
→ scheduled
→ in_execution
→ ron_completed
→ execution_qa
→ apostille_packet_ready
→ apostille_submitted
→ apostille_processing
→ apostille_received
→ final_balance_due
→ final_payment_pending_review
→ final_payment_confirmed
→ ready_for_release
→ final_packet_assembled
→ label_created
→ in_transit
→ delivered
→ completed
```

All correction, review, customs, dormant, lost and cancelled states defined by the canonical state machine remain valid.

---

## 8. Milano Operator Intelligence

`/today` is a read-only contextual command layer above canonical Matter truth.

Exact action classes:

```text
Payment Blocked
Document Blocked
Authority Review
Scheduling Due
Apostille Pending
Courier Exception
Release Ready
Overdue Follow-Up
```

The layer may derive and display operator actions.

It must never mutate Matter state, payment state, discount redemption, scheduling, execution, apostille, custody, release, delivery, or completion.

If rich canonical columns are unavailable, the surface must show degraded status. A degraded read must never display a false all-clear state.

---

## 9. Production merge gate

Required checks:

```bash
node scripts/generate-route-map.mjs --check
node scripts/validate-wise-only-active-ops-docs.mjs
node scripts/validate-milano-operator-intelligence.mjs
node scripts/run-vercel-merge-gate.mjs
```

Validator failure blocks production.

A successful build does not transaction-certify production.

---

## 10. TIFFTEST50 live acceptance

The real 15-step TIFF client-to-close test remains mandatory.

Core proof chain:

```text
public navigation
→ secure intake
→ one persisted QA Matter
→ document upload persistence
→ quote parity
→ TIFFTEST50 exactly 50% of eligible subtotal
→ non-discountable courier/shipping unchanged
→ scheduling locked
→ one controlled real Wise payment
→ exact reconciliation
→ idempotency replay
→ scheduling unlock
→ client portal parity
→ actual notification delivery
→ governed execution/apostille/release/courier chain
→ delivered
→ completed
→ mobile regression sweep
```

Capture evidence at every step.

No code test, Vercel build, validator, mock transaction, or manual database edit substitutes for this test.

---

## 11. Damiani production dry-run

Run only after TIFF certification passes.

Use `/professional/damiani`.

Stop before payment.

Verify:

- Italian default;
- English optional;
- `DAMIANI50` carried into intake;
- eligible subtotal discounted correctly;
- courier/non-discountable amounts unchanged;
- correct final amount and Wise reference prepared.

Then stop.

Database truth must remain:

```text
DAMIANI50 usage_count = 0
no redemption
payment_confirmed != true
Matter not scheduled
```

---

## 12. Final Truth Review

Human-verify from authoritative source material:

```text
legal name
codice fiscale
destination
document type
authentication authority
notarization requirement
Wise beneficiary details
Wise reference
final amount
```

For rendered Damiani legal documents, compare character-for-character:

```text
legal name
codice fiscale
document identity
destination
notarial certificate data
authentication routing
```

Any mismatch = `RELEASE BLOCKED`.

---

## 13. GO / NO-GO

GO requires complete evidence for:

```text
production baseline
TIFF real 15-step client-to-close acceptance
Wise reconciliation + idempotency
Damiani no-payment dry-run
Final Truth Review
```

Any failure or blank evidence field = `NO-GO`.

Infrastructure READY does not equal transaction-certified.

Only completed live acceptance permits:

```text
TRANSACTION-CERTIFIED — GO
```
