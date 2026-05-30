# The Milano Seal™ — P1/P2 Architecture Notes
**Document Reference:** MS-OS-E2E-INTAKE-2026-V1  
**Source:** End-to-End Operational Sovereignty System  
**Status:** ARCHITECTURE ONLY — DO NOT BUILD BEFORE P0 REMOTE CLEARANCE

These modules are documented here for architectural continuity. None are active in production. None should be built until the items in `docs/REMOTE_P0_CLEARANCE.md` are fully signed.

---

## 1. Acquisition Entry Flow (P1)

**Rule:** Unauthenticated prospects must reach the premium routing layer and intake CTA immediately. Do not gate initial conversion behind portal login.

**Intended flow:**
```
Ad / referral / partner post
→ public homepage
→ RoutingIntelligenceSection (corridor cards)
→ GlobalMap (visualizes corridors)
→ country page or service page
→ intake form
```

**Do not build yet:**
- paid ad infrastructure
- fake ad metrics
- "under 72 hours" language unless operationally confirmed

---

## 2. Smart Intake — Unstructured Entry Parser (P1/P2)

**Purpose:** Convert messy client messages into structured matter records.

**Inputs:**
- pasted client notes
- email inquiry text
- WhatsApp message
- voice-to-text transcript
- uploaded document notes

**Outputs:**
- deal record (UUID-gated)
- `target_us_county`
- `target_global_destination`
- `target_protocol`
- `document_type`
- urgency classification
- required follow-up flag
- notification event row
- portal access token prep

**Build gate:** Do not connect until P0 remote clearance passes. Do not parse legal conclusions. Do not provide legal advice. Do not log sensitive identity details.

**WhatsApp:** Do not connect until explicitly approved as a separate activation step.

---

## 3. Secure Client Portal Terminal UX (P1)

**Purpose:** Premium authenticated client experience inside `/portal`.

**Safe labels only:**
- Secure Access Active
- Document Vault Protected
- Matter Review In Progress
- Payment Pending
- Released
- Courier Not Yet Configured

**Do not show:**
- fake encryption statistics
- fake queue latency
- fake carrier status
- fake consulate status
- internal operator notes
- private margins

**Build gate:** Only after:
- `PORTAL_SESSION_SECRET` is live in production
- OTP flow tested end-to-end
- signed URL storage verified
- `documents` bucket confirmed private
- portal auth fails closed on bad token

---

## 4. Health Route Latency Targets

**Target thresholds:**
- `GET /api/health` → 200 in under 500ms
- `GET /api/health/database` → 200, `latency_ms` under 250ms preferred, under 2000ms required
- If latency exceeds threshold: mark as warning, not automatic failure, unless endpoint errors

**Do not promise guaranteed latency publicly.**

Add latency monitoring once the platform is on a paid Supabase plan with PITR active.

---

## 5. Logger Security Interceptor Rules

`lib/logger.ts` must never log:

- plain-text tokens or session values
- OTP values or MFA codes
- environment secrets or API keys
- session headers or auth cookies
- Supabase service role keys
- client identity document contents
- raw uploaded file contents
- payment credentials or Wise transfer IDs

These rules apply to all routes, not just P0-touched files. Any new route that handles sensitive data must import and use `lib/logger.ts` — no raw `console.error` with sensitive payloads.

---

## 6. Shipping 501 Guard (permanent until live carrier)

The shipping label route must return `501 Not Implemented` until a live Shippo or DHL API key is configured in production.

**Do not allow:**
- fake labels or mock tracking numbers
- status mutation to `shipped`
- courier-complete events
- `[TEST MODE]` strings in any response body

This guard is already enforced in `app/api/shipping/create-label/[id]/route.ts`. Do not remove it without a confirmed live carrier integration.

---

## Build Sequence

| Module | Phase | Gate |
|---|---|---|
| Acquisition entry flow | P1 | P0 remote clearance signed |
| Smart Intake parser | P1/P2 | P0 + WhatsApp approval |
| Portal terminal UX | P1 | Portal auth verified in production |
| Full health monitoring | P1 | Paid Supabase plan active |
| Live shipping | P1 | Shippo/DHL API key confirmed |
| Alliance tracking (011) | P1 | P0 remote clearance signed |
| Country registry (012) | P1 | P0 remote clearance signed |
| Partner attribution | P2 | Alliance tables live |
