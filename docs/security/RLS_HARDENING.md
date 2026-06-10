# Security & RLS Hardening

**Module:** Row-Level Security  
**Status:** Spec + existing enforcement — review on each new table  
**Applies to:** All Supabase tables, portal API routes, admin routes

---

## Purpose

True authority requires absolute isolation. Our Row-Level Security protocols ensure that matter data is siloed by design. No client sees another client's shadow. Access is granted only by verified identity. The system is hardened so legal logistics remain private, controlled, and protected.

---

## Role Matrix

| Role | Access |
|---|---|
| `founder_admin` | Full access — all tables, all operations, pricing overrides |
| `admin_operator` | Operational access — no founder pricing unless explicitly granted |
| `virtual_assistant` | Read/flag/note only — no payment confirm, no release, no pricing |
| `portal_client` | Own portal only — token-gated, projection-safe |
| `anonymous` | Public routes only — no authenticated data |

---

## Portal Projection Blocklist

These fields must **never** appear in portal-facing API responses.  
Enforced in `lib/portalProjection.ts` → `PORTAL_BLOCKED_FIELDS`.

```
wise_transfer_id          wise_account_id        wise_payload
stripe_payment_intent_id  stripe_customer_id
internal_notes            operator_notes         admin_notes
compliance_notes          risk_notes
total_revenue             base_cost              shipping_cost
net_margin                margin                 operator_fee
runner_fee                markup
assignee                  assignee_user_id       runner_id
operator_id               dispatch_id
risk_score                compliance_flag        compliance_override
review_reason
storage_path              file_path              evidence_path
label_url                 evidence_url
full_signing_url          bn_signing_url
audit_logs                admin_actions          admin_overrides
event_log
email                     phone                  ship_to
discount_note             discount_reason
founder_override_price    founder_price_override
raw_webhook               raw_event
```

---

## Service Role Key Rules

Run this scan before every deployment:

```bash
rg -n "SUPABASE_SERVICE_ROLE_KEY|service_role" app components lib
```

**Allowed locations only:**
- `lib/supabase/admin.ts`
- Server-only API routes (`app/api/`)
- Server-only lib helpers

**Never in:**
- `"use client"` components
- Browser-accessible bundles
- Portal client routes
- Public pages

---

## Internal Data Exposure Scan

Run before each deploy:

```bash
rg -n "internal_notes|operator_notes|discount_note|discount_reason|raw_webhook|raw_event|margin|net_margin|shipping_spread" \
  app/portal components/portal app/api/portal
```

Any hit that is not inside a `PORTAL_BLOCKED_FIELDS` filter or a comment documenting that it is blocked = **critical bug, fix before deploy.**

---

## VA Permission Escalation Prevention

Virtual assistants must never be able to:
- Confirm payment
- Release documents
- Override pricing
- Access `audit_trail` raw records
- Access `founder_pricing` routes

VA role is enforced at API route level, not just UI level.

---

## Portal Token Gate

Every portal route is gated by `access_token` (UUID v4).  
Token is issued at intake and tied to `deals.access_token`.  
OTP adds a second verification layer for sensitive operations.  
No portal route returns data for any token other than the authenticated one.
