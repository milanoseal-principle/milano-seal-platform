# Partner & Referral Backend — Schema Design

> Status: Design Only. No migrations. No tables. No RLS yet.
> Last Updated: 2026-05-31

---

## 1. Objective

The partner/referral system must support:
- Verified partner registry (attorneys, notaries, translators, courier liaisons)
- International partner directory linked to corridors
- Referral source tracking per matter
- Alliance revenue attribution
- Payout / credit eligibility (operator-approved only)
- Corridor-linked partner specialization
- Full audit-backed referral chain

---

## 2. Core Entities

| Entity | Purpose |
|---|---|
| `partners` | Core partner record — identity, type, vetting status |
| `partner_contacts` | Contact details (email, phone, jurisdiction) |
| `partner_specialties` | Document types this partner handles |
| `partner_corridors` | Countries/corridors this partner operates in |
| `referral_sources` | One record per referral attribution on a matter |
| `referral_ledger` | Timestamped referral lifecycle events |
| `partner_payouts` | Payout/credit records (operator-approved) |
| `partner_notes` | Internal operator notes on a partner |
| `partner_documents` | Vetting documents (stored in private vault) |
| `partner_audit_events` | All attribution changes, status changes, approvals |

---

## 3. Partner Types

```
attorney
law_firm
notary
translator
courier
embassy_liaison
real_estate
medical_provider
corporate_service
private_client_referral
alliance_partner
```

---

## 4. Vetting Status

```
prospect → contacted → reviewing → verified → active
                                             → restricted
                                             → archived
```

---

## 5. Referral Status Lifecycle

```
received
→ attached_to_matter
→ converted
→ payment_pending
→ paid
→ eligible
→ approved
→ paid_out

(terminal states)
→ rejected
→ archived
```

---

## 6. Payout / Credit Eligibility Rule

No payout or credit becomes eligible unless ALL of the following are true:

1. `matter.payment_status = 'paid'`
2. `matter.deal_status` is `'delivered'` or `'paid_and_released'` or `'completed'`
3. A `referral_source` record exists and is `attached_to_matter`
4. Operator has explicitly approved the payout
5. A `PAYOUT_APPROVED` audit event has been written

No system action can trigger payout eligibility automatically. Operator approval is always required.

---

## 7. Attribution Locking Rule

> This prevents the #1 failure mode in referral systems: retroactive revenue disputes.

**Rule:** Attribution must be immutably timestamped at the moment of intake or matter attachment.

- The original `referral_source` record is never overwritten
- Later partner changes write a new `partner_audit_events` record
- No silent reassignment is permitted
- No retroactive payout manipulation is permitted
- If attribution changes, both the previous and current `partner_id` are preserved in the audit event
- An operator-supplied reason is required for any attribution change

---

## 8. Access Model

| Role | Access |
|---|---|
| Operator / Admin | Full partner registry, full referral ledger, payout approval, attribution adjustment with audit reason |
| Alliance Partner | Own referrals only, client-safe status only, approved payout/credit status only |
| VA | No partner revenue, no payout access, assigned admin tasks only if explicitly scoped |
| Client | No partner or referral visibility |

---

## 9. Security Blocklist

The following fields must **never** be exposed to Alliance, VA, or Client surfaces:

- `internal_notes`
- `operator_notes`
- `margin`
- `base_cost`
- Partner payout calculation details
- Raw payment records
- Unrelated client matter data
- Document vault contents
- Security audit events

---

## 10. Required Audit Events

```
PARTNER_CREATED
PARTNER_VERIFIED
PARTNER_RESTRICTED
REFERRAL_CREATED
REFERRAL_ATTACHED_TO_MATTER
REFERRAL_CONVERTED
REFERRAL_ELIGIBLE
PAYOUT_APPROVED
PAYOUT_PAID
PAYOUT_REJECTED
ALLIANCE_STATUS_UPDATED
REFERRAL_ATTRIBUTION_CHANGED
```

All events must record: `actor_id`, `actor_type`, `timestamp`, `reason` (required for ATTRIBUTION_CHANGED).

---

## 11. Open Questions (Resolve Before Migration)

| Question | Status |
|---|---|
| Is payout percentage fixed or per-partner negotiated? | Open |
| Are referral credits cash, service credit, or manual payout via Wise? | Open |
| Can one matter have multiple referral sources? | Open |
| Can one referral split between multiple partners? | Open |
| Should attribution lock at intake or after payment confirmation? | Open |
| Should partner directory ever be public-facing? | Open |
| Should partner documents be stored in Supabase Storage (private bucket)? | Open |
| Should partner access be org/account level or individual login? | Open |
| Should referral attribution survive partner archival? | Open |
| Should payout be blocked if the matter is later refunded? | Open |
| Should payout eligibility require `paid_and_released` or only `delivered`? | Open |

---

## 12. Proposed Migration Sequence (After Design Review)

Do not execute until all open questions are resolved and schema is reviewed.

1. Create migration: `partners`, `partner_contacts`, `partner_specialties`, `partner_corridors`
2. Create migration: `referral_sources`, `referral_ledger`
3. Create migration: `partner_payouts`, `partner_audit_events`
4. Write RLS policies (operator full access, alliance own-referrals only)
5. Create operator API routes
6. Create alliance-safe projection views
7. Create dashboard widgets (no fake data)
8. Add audit event writes to all state transitions
9. Run role-based access tests before any live use

---

## 13. Notes

- Do NOT create these tables until all open questions are resolved and this doc is reviewed and approved
- Do NOT expose any partner revenue, margin, or payout data to non-operator surfaces
- Wise payout integration must go through operator reconciliation — no auto-confirm
- Partner documents must use the same private Supabase vault pattern as client documents (signed URLs only, no raw paths)
