# Milano Seal OS — Final Build Survey

Branch: `milano-os-final-production-build`
Base: `main` @ `d922bf4` (post Execution-Support / Alliance rebrand)
Date: 2026-06-29

## Headline finding

The Milano Seal platform is **already a largely-complete production system**, not a
greenfield build. A four-track parallel survey of the codebase (state-machine +
payment/release, identifiers + apostille + shipping, portal + dashboard +
notifications, alliance + support + RON + public site) found that **the 12 modules
in the buildout brief substantially already exist**. The correct work is therefore
**finishing verified real gaps and fixing real bugs**, not rebuilding shipped
modules (which the standing project rule explicitly forbids: "do not redesign/
rebuild if already built").

This document is the implementation map. The one critical bug it surfaced is fixed
in this same branch (migration `040`, see below).

---

## Module-by-module reality

| # | Module | State | Notes |
|---|--------|-------|-------|
| 1 | Matter OS Core (state machine) | **Exists, dual-track** | `lib/stateMachine.ts` = production 11-state `DealStatus` on `deals.deal_status` (CHECK-constrained) with `canTransition()`. `src/features/milano/types.ts` = newer 20-state `MilanoStatus`, **not yet wired to the DB**. Unifying them is a real but risky refactor (touches the CHECK constraint + every transition site) — NOT done blind. |
| 2 | Identifier Lock | **Exists, strong** | `data/identifier-schemas.ts` (55+ immutable identifier types incl. codice fiscale, tax IDs, passport, vessel/equine/asset). `src/features/quality/identifierLockService.ts` compare/lock. Migration `038` tables + SHA-256 normalization + `ms_assert_matter_identifiers_ready()`. Release gate enforces Italy codice-fiscale exact-match. Gaps: OCR auto-extraction, approval-cycle enforcement, supersession trigger. |
| 3 | Client Portal | **Exists, strong** | `app/portal/**` — timeline, payment, document vault, identifier confirmation, invoice, final-packet status, live Shippo tracking, real-time messages. Email-based ownership scoping via `getCurrentClientDeal()`; `portalProjection.ts` blocks internal fields. Gap: correction-status panel. |
| 4 | Operator Dashboard | **Exists, very large** | `lib/dashboard-modules.ts` enumerates **80+ modules** across admin/core/pipeline/execution/operations/intelligence/alliance/system. Releases, apostille, shipping, QA, exceptions, needs-review all present. Auth via `requireDashboardAccess()`. Gaps: a few are split/unlabeled (no single "identifier-lock panel" or "activity-ledger page"). |
| 5 | Alliance Network | **Exists, ~60%** | Public `/alliance/apply` + `app/alliance/**` partner dashboard (19 sub-pages: commissions, payouts, credentials, compliance, jobs, referrals, onboarding…). Gaps: structured approval queue UI, quality-score, assignment-readiness/history surfacing. Partner data isolation assumed at RLS — **not verified**. |
| 6 | Execution Support (VA) | **Exists, ~70%** | Public `/va/apply` (rebranded). `app/va/dashboard` full (task queue, pipeline, escalations, SOP). `lib/messageEngine.ts` template+approval model (VA can only send `requires_approval === false`). `/va/portal` is **demo data only**. |
| 7 | RON / Mobile / Witness | **Exists, ~80%** | `lib/compliance/ronEligibility.ts` matrix; `data/ron-acceptance-compatibility.ts` risk eval + auto-scheduling block; `lib/intake/executionPath.ts` pathway selection. Gaps: dedicated mobile-notary + witness queues (listed as services, no workflow UI); scan-back QA detail. |
| 8 | Apostille / Authentication | **Exists, partial** | `src/features/apostille/*` packet checklist + submit/receive state; `src/features/compliance/countryRules.ts` Hague vs non-Hague matrix; Italy QA gate blocks submission. Gaps: auto packet assembly, state-office routing, non-Hague auth-chain builder. |
| 9 | Shipping / Chain-of-Custody | **Exists, strong** | Full Shippo: `lib/shippo.ts`, webhook `/api/webhooks/shippo` (idempotent), cron polling w/ 5-day stuck escalation, status→custody-event mapping. Hard rule enforced: **DELIVERED ≠ release**. Operator-only label URLs (RLS). |
| 10 | Revenue / Pricing / Invoice | **Exists, strong** | `lib/config/pricing.ts` — Signature $750 / Priority $975 / Executive $1,850 + RON/mobile/apostille/courier add-ons. Migrations `016` (Wise), `027` (founder discount/override), `039` (settlement clearance). |
| 11 | Notifications | **Exists, partial** | `lib/email.ts` (Resend): intake / scheduled / shipped / completed. Real-time portal messages via Supabase. **Gaps**: dispatch is manual via `/api/admin/move`; no auto-email for quote-ready, payment-cleared, correction-required, apostille status, final-payment-due, delivered. Wise webhook logs activity but does not email the client. |
| 12 | Public Site Alignment | **Done / green** | Header nav clean (`Begin Secure Intake`), no `Start Controlled Intake` / `Notarize From Anywhere` / VA / cheap-notary / preview URLs. Alliance = public funnel; Execution Support = footer/direct-link only. Enforced by `validate-brand-language` + `validate-service-positioning`. |

## Validators (already present — 19)

`project, country-intelligence, execution-intelligence, public-intelligence-safety,
sales-engine, revenue-copy, brand-language, service-positioning, operating-spines,
global-compliance-atlas, receiving-authority-rules, identifier-schemas,
data-integrity, ron-compatibility, payment-release-gates, shipping-tracking,
apostille-packet, seo-client-profiles, compliance-registry`.

The buildout asked to "add validators for" payment-release-gates, identifier-locks,
data-integrity, apostille-packet, shipping-tracking, brand-language,
service-positioning — **all already exist**. No new validator was needed for those.

---

## Critical bug found and FIXED in this branch

### custody_ledger hash-chain columns missing → every ledger write silently failed

`lib/custodyLedger.ts → appendLedger()` builds a SHA-256 hash-linked chain and
inserts `actor_id, method, status, prev_hash, hash`. The `custody_ledger` table
(migration `001`, never altered) has only `id, deal_id, event, actor_type,
actor_name, location, notes, metadata, created_at`. PostgREST rejects inserts
referencing non-existent columns, so **`appendLedger()` returned `null` on every
call** and the chain-of-custody record was never persisted — the failure was
swallowed by the function's non-fatal `.catch`. This defeats the buildout's own
hard gate ("every critical action writes an event/ledger record") and the release
override / payment-confirmed ledger events.

**Fix:** migration `040_custody_ledger_hash_chain.sql` — additive, idempotent
(`add column if not exists`) columns `actor_id, method, status, prev_hash, hash`
plus a hash-head index and a `(deal_id, created_at desc)` index for the chain-head
lookup. No code change needed; `appendLedger()` already expects these columns.

---

## Real gaps NOT yet addressed (candidates for follow-up, each its own scoped change)

- **Matter status unification** (Module 1) — reconcile `DealStatus` ↔ `MilanoStatus`. Risky (DB CHECK + every transition site); needs its own branch + review.
- **Notification orchestration** (Module 11) — event→email dispatch for the missing transitions; Wise-webhook client email. Medium, additive.
- **Alliance partner-data isolation** — verify/enforce RLS so partners can't read others' matters. Security-sensitive; verify before asserting.
- **Mobile-notary & witness operator queues** (Module 7) — currently services-only.
- **Apostille auto packet assembly + non-Hague auth-chain builder** (Module 8).
- ~~`payment_gate_audit` table~~ — checked: the table **is** created in migration `016`, so `lib/payments/paymentGate.ts` writes succeed. Not a bug (false alarm during survey).

These are listed honestly rather than half-built. The custody-ledger fix is shipped
in this branch because it was verified, isolated, additive, and safety-critical.
