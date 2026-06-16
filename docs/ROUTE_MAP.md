# The Milano Seal™ — Canonical Route Map

**Repo:** milanoseal-principle/milano-seal-platform  
**Last updated:** 2026-06-16  
**Purpose:** Production route inventory, access matrix, and smoke test source of truth.

---

## 1. Public / Marketing Routes

| Route | File | Access | Purpose | Expected Behavior | Smoke Test |
|---|---|---|---|---|---|
| `/` | `app/page.tsx` | public | Landing page | 200, ritual entry lock, hero | ✅ |
| `/about` | `app/about/page.tsx` | public | About page | 200 | — |
| `/pricing` | `app/pricing/page.tsx` | public | Pricing | 200 | — |
| `/process` | `app/process/page.tsx` | public | How it works | 200 | — |
| `/faq` | `app/faq/page.tsx` | public | FAQ | 200 | — |
| `/privacy` | `app/privacy/page.tsx` | public | Privacy policy | 200 | — |
| `/terms` | `app/terms/page.tsx` | public | Terms | 200 | — |
| `/review` | `app/review/page.tsx` | public | Review request landing | 200 | — |
| `/review/[token]` | `app/review/[token]/page.tsx` | public | Token-gated review | 200 | — |
| `/founder` | `app/founder/page.tsx` | public | Founder profile | 200 | — |
| `/blog` | `app/blog/page.tsx` | public | Blog index | 200 | — |
| `/learn` | `app/learn/page.tsx` | public | Learning hub | 200 | — |
| `/services` | `app/services/page.tsx` | public | Services overview | 200 | — |
| `/services/apostille` | `app/services/apostille/page.tsx` | public | Apostille service | 200 | — |
| `/services/remote-online-notary` | `app/services/remote-online-notary/page.tsx` | public | RON service | 200 | — |
| `/services/mobile-notary` | `app/services/mobile-notary/page.tsx` | public | Mobile notary | 200 | — |
| `/services/international-execution` | `app/services/international-execution/page.tsx` | public | International execution | 200 | — |
| `/verify/[verificationId]` | `app/verify/[verificationId]/page.tsx` | public | Document verification | 200 or redirect | — |

---

## 2. Intake Routes

| Route | File | Access | Purpose | Expected Behavior | Smoke Test |
|---|---|---|---|---|---|
| `/intake` | `app/intake/page.tsx` | public | New matter intake form | 200 | ✅ |
| `/intake/confirmation` | `app/intake/confirmation/page.tsx` | public | Post-intake confirmation | 200 | — |
| `/login` | `app/login/page.tsx` | public | Auth gateway | 200 | ✅ |
| `/login?error=access_denied` | `app/login/page.tsx` | public | Access denied error state | 200 with error message | ✅ |
| `/login?next=/dashboard` | `app/login/page.tsx` | public | Redirect hint | 200 | ✅ |
| `/notary/join` | `app/notary/join/page.tsx` | public | Notary network application | 200 | ✅ |

**Not currently implemented:**
- `/today` — planned operator briefing page, not yet built
- `/workspace/release` — planned release workspace, not yet built

---

## 3. Global Intelligence / Map Routes

| Route | File | Access | Purpose | Expected Behavior | Smoke Test |
|---|---|---|---|---|---|
| `/map` | `app/map/page.tsx` | public | Global execution map | 200 | ✅ |
| `/countries` | `app/countries/page.tsx` | public | Country index | 200 | ✅ |
| `/countries/[country]` | `app/countries/[country]/page.tsx` | public | Country detail | 200 | — |
| `/apostille-intel` | `app/apostille-intel/page.tsx` | public | Apostille intelligence hub | 200 | — |
| `/apostille-intel/[country]/[document]` | `app/apostille-intel/[country]/[document]/page.tsx` | public | Per-document intel | 200 | — |
| `/apostille/[country]` | `app/apostille/[country]/page.tsx` | public | Country apostille page | 200 | — |

---

## 4. Dashboard Routes (Operator / Founder / Admin)

| Route | File | Access | Purpose | Expected Behavior | Smoke Test |
|---|---|---|---|---|---|
| `/dashboard` | `app/dashboard/page.tsx` | operator | Main dashboard | 200 or redirect to /login | ✅ |
| `/dashboard/deliveries` | `app/dashboard/deliveries/page.tsx` | operator | Delivery tracking | 200 or redirect | ✅ |
| `/dashboard/discounts` | `app/dashboard/discounts/page.tsx` | operator | Discount code manager | 200 or redirect | ✅ |
| `/dashboard/incidents` | `app/dashboard/incidents/page.tsx` | operator | Compliance incidents | 200 or redirect | ✅ |
| `/dashboard/notary-network` | `app/dashboard/notary-network/page.tsx` | operator | Notary network panel | 200 or redirect | ✅ |
| `/dashboard/truth` | `app/dashboard/truth/page.tsx` | founder | Ground truth / audit | 200 or redirect | ✅ |
| `/dashboard/deals` | `app/dashboard/deals/page.tsx` | operator | Matter pipeline | 200 or redirect | — |
| `/dashboard/deals/[id]` | `app/dashboard/deals/[id]/page.tsx` | operator | Matter detail | 200 or redirect | — |
| `/dashboard/payments` | `app/dashboard/payments/page.tsx` | operator | Payment review | 200 or redirect | — |
| `/dashboard/pipeline` | `app/dashboard/pipeline/page.tsx` | operator | Pipeline view | 200 or redirect | — |
| `/dashboard/courier` | `app/dashboard/courier/page.tsx` | operator | Courier management | 200 or redirect | — |
| `/dashboard/shipping` | `app/dashboard/shipping/page.tsx` | operator | Shipping labels | 200 or redirect | — |
| `/dashboard/releases` | `app/dashboard/releases/page.tsx` | operator | Release queue | 200 or redirect | — |
| `/dashboard/releases/certificates` | `app/dashboard/releases/certificates/page.tsx` | operator | Release certificates | 200 or redirect | — |
| `/dashboard/ron` | `app/dashboard/ron/page.tsx` | operator | RON session manager | 200 or redirect | — |
| `/dashboard/ron/[session_id]` | `app/dashboard/ron/[session_id]/page.tsx` | operator | RON session detail | 200 or redirect | — |
| `/dashboard/intelligence` | `app/dashboard/intelligence/` | operator | Intelligence hub | 200 or redirect | — |
| `/dashboard/sops` | `app/dashboard/sops/page.tsx` | operator | SOPs | 200 or redirect | — |
| `/dashboard/compliance` | `app/dashboard/compliance/page.tsx` | operator | Compliance | 200 or redirect | — |
| `/dashboard/execution-qa` | `app/dashboard/execution-qa/page.tsx` | operator | Execution QA | 200 or redirect | — |
| `/dashboard/financials` | `app/dashboard/financials/page.tsx` | operator | Financials | 200 or redirect | — |
| `/dashboard/revenue` | `app/dashboard/revenue/page.tsx` | operator | Revenue view | 200 or redirect | — |
| `/dashboard/va` | `app/dashboard/va/page.tsx` | operator | VA management | 200 or redirect | — |
| `/dashboard/alliance` | `app/dashboard/alliance/page.tsx` | operator | Alliance management | 200 or redirect | — |
| `/dashboard/admin` | `app/dashboard/admin/page.tsx` | founder | Admin panel | 200 or redirect | — |
| `/dashboard/admin/payments` | `app/dashboard/admin/payments/page.tsx` | founder | Admin payments | 200 or redirect | — |
| `/dashboard/matter-intelligence` | `app/dashboard/matter-intelligence/page.tsx` | operator | Matter intelligence | 200 or redirect | — |
| `/dashboard/security` | `app/dashboard/security/page.tsx` | founder | Security audit | 200 or redirect | — |
| `/dashboard/follow-ups` | `app/dashboard/follow-ups/page.tsx` | operator | Follow-ups | 200 or redirect | — |
| `/dashboard/exceptions` | `app/dashboard/exceptions/page.tsx` | operator | Exceptions | 200 or redirect | — |

---

## 5. Client Portal Routes

| Route | File | Access | Purpose | Expected Behavior | Smoke Test |
|---|---|---|---|---|---|
| `/portal` | `app/portal/page.tsx` | client | Portal entry | 200 or redirect to /login | ✅ |
| `/portal/tracking` | `app/portal/tracking/page.tsx` | client | Matter tracking | 200 or redirect | ✅ |
| `/portal/trackingNow` | `app/portal/trackingNow/page.tsx` | client | Live tracking view | 200 or redirect | ✅ |
| `/portal/invoice` | `app/portal/invoice/page.tsx` | client | Invoice view | 200 or redirect | ✅ |
| `/portal/documents` | `app/portal/documents/page.tsx` | client | Document access | 200 or redirect | ✅ |
| `/portal/release` | `app/portal/release/page.tsx` | client | Release coordination | 200 or redirect | ✅ |
| `/portal/messages` | `app/portal/messages/page.tsx` | client | Client messages | 200 or redirect | — |
| `/portal/matter-room` | `app/portal/matter-room/page.tsx` | client | Matter room | 200 or redirect | — |
| `/portal/ron` | `app/portal/ron/page.tsx` | client | RON session portal | 200 or redirect | — |
| `/portal/[token]` | `app/portal/[token]/page.tsx` | token | Token-gated portal | 200 | — |

**Not currently implemented:**
- `/portal/payment` — not currently built; payment handled via Wise off-platform

---

## 6. Tracking / Courier / Custody Routes

| Route | File | Access | Purpose | Expected Behavior | Smoke Test |
|---|---|---|---|---|---|
| `/portal/tracking` | `app/portal/tracking/page.tsx` | client | Shipment tracking | 200 or redirect | ✅ |
| `/portal/trackingNow` | `app/portal/trackingNow/page.tsx` | client | Live tracking | 200 or redirect | ✅ |
| `/portal/release` | `app/portal/release/page.tsx` | client | Release coordination | 200 or redirect | — |
| `/api/courier/tracking/[matterId]` | `app/api/courier/tracking/[matterId]/route.ts` | operator | Courier tracking API | 200 or 401 | — |
| `/api/dashboard/custody/[matterId]` | `app/api/dashboard/custody/[matterId]/route.ts` | operator | Custody chain API | 200 or 401 | — |
| `/api/dashboard/shippo/*` | `app/api/dashboard/shippo/` | operator | Shippo integration | 200 or 401 | — |

---

## 7. VA Operations Routes

| Route | File | Access | Purpose | Expected Behavior | Smoke Test |
|---|---|---|---|---|---|
| `/va/dashboard` | `app/va/dashboard/page.tsx` | va | VA dashboard | 200 or redirect to /login | ✅ |
| `/va/portal` | `app/va/portal/page.tsx` | va | VA portal | 200 or redirect | ✅ |
| `/va/tasks` | `app/va/tasks/page.tsx` | va | Task queue | 200 or redirect | — |
| `/va/matters` | `app/va/matters/page.tsx` | va | VA matter list | 200 or redirect | — |
| `/va/messages` | `app/va/messages/page.tsx` | va | VA messages | 200 or redirect | — |
| `/va/documents` | `app/va/documents/page.tsx` | va | VA document access | 200 or redirect | — |
| `/va/checklists` | `app/va/checklists/page.tsx` | va | VA checklists | 200 or redirect | — |
| `/va/courier` | `app/va/courier/page.tsx` | va | VA courier tasks | 200 or redirect | — |
| `/va/ron` | `app/va/ron/page.tsx` | va | VA RON tasks | 200 or redirect | — |
| `/va/uploads` | `app/va/uploads/page.tsx` | va | VA file uploads | 200 or redirect | — |
| `/va/escalations` | `app/va/escalations/page.tsx` | va | VA escalations | 200 or redirect | — |
| `/va/follow-ups` | `app/va/follow-ups/page.tsx` | va | VA follow-ups | 200 or redirect | — |

---

## 8. Alliance Partner Routes

| Route | File | Access | Purpose | Expected Behavior | Smoke Test |
|---|---|---|---|---|---|
| `/alliance/dashboard` | `app/alliance/dashboard/page.tsx` | alliance | Alliance dashboard | 200 or redirect to /login | — |
| `/alliance/referrals` | `app/alliance/referrals/page.tsx` | alliance | Referral management | 200 or redirect | — |
| `/alliance/commissions` | `app/alliance/commissions/page.tsx` | alliance | Commission view | 200 or redirect | — |
| `/alliance/matters` | `app/alliance/matters/page.tsx` | alliance | Alliance matters | 200 or redirect | — |
| `/alliance/jobs` | `app/alliance/jobs/page.tsx` | alliance | Alliance jobs | 200 or redirect | — |
| `/alliance/onboarding` | `app/alliance/onboarding/page.tsx` | alliance | Alliance onboarding | 200 or redirect | — |
| `/alliance/login` | `app/alliance/login/page.tsx` | public | Alliance login | 200 | — |

---

## 9. Workspace / Release Routes

| Route | File | Access | Purpose | Expected Behavior | Smoke Test |
|---|---|---|---|---|---|
| `/dashboard/releases` | `app/dashboard/releases/page.tsx` | operator | Release queue | 200 or redirect | — |
| `/dashboard/releases/certificates` | `app/dashboard/releases/certificates/page.tsx` | operator | Release certificates | 200 or redirect | — |

**Not currently implemented:**
- `/today` — planned operator daily briefing
- `/workspace/release` — planned release QA workspace

---

## 10. API Routes

### Auth
| Route | File | Method | Access | Purpose |
|---|---|---|---|---|
| `/api/auth/login` | `app/api/auth/login/route.ts` | POST | public | Credential auth |
| `/api/auth/signout` | `app/api/auth/signout/route.ts` | POST | authenticated | Sign out |
| `/api/public/payment-status` | `app/api/public/payment-status/route.ts` | GET | public | Payment status check |

### Health (safe to hit unauthenticated)
| Route | File | Method | Access | Purpose |
|---|---|---|---|---|
| `/api/health` | `app/api/health/route.ts` | GET | public | System health |
| `/api/health/database` | `app/api/health/database/route.ts` | GET | public | DB health |
| `/api/health/assistant` | `app/api/health/assistant/route.ts` | GET | public | Assistant health |
| `/api/health/payment` | `app/api/health/payment/route.ts` | GET | public | Payment health |
| `/api/health/webhooks` | `app/api/health/webhooks/route.ts` | GET | public | Webhook health |

### Protected Dashboard APIs (expect 401/403 unauthenticated)
| Route | File | Method | Access |
|---|---|---|---|
| `/api/dashboard/discounts` | `app/api/dashboard/discounts/route.ts` | GET/POST | operator |
| `/api/dashboard/incidents` | `app/api/dashboard/incidents/route.ts` | GET/POST | operator |
| `/api/dashboard/matters` | `app/api/dashboard/matters/route.ts` | GET | operator |
| `/api/dashboard/pipeline` | `app/api/dashboard/pipeline/route.ts` | GET | operator |
| `/api/dashboard/payments` | `app/api/dashboard/payments/route.ts` | GET | operator |
| `/api/dashboard/releases` | `app/api/dashboard/releases/route.ts` | GET | operator |

### Protected Notary APIs
| Route | File | Method | Access |
|---|---|---|---|
| `/api/notary/apply` | `app/api/notary/apply/route.ts` | POST | public |
| `/api/notary/credentials` | `app/api/notary/credentials/route.ts` | GET/POST | operator |

### Webhooks (never in smoke test — do not hit in CI)
- `/api/webhooks/bluenotary`
- `/api/webhooks/shippo`
- `/api/webhooks/wise`
- `/api/webhook/stripe`

---

## 11. Protected vs Public Route Matrix

| Access Level | Routes | Unauthenticated Behavior |
|---|---|---|
| **public** | `/`, `/login`, `/intake`, `/map`, `/countries`, `/notary/join`, all `/services/*`, all `/learn/*`, all `/guides/*`, `/verify/*`, city pages | 200 |
| **client** | `/portal/*` | Redirect to `/login` |
| **operator** | `/dashboard/*` | Redirect to `/login` |
| **va** | `/va/*` | Redirect to `/login` |
| **alliance** | `/alliance/dashboard`, `/alliance/referrals`, etc. | Redirect to `/login` |
| **founder** | `/dashboard/admin`, `/dashboard/truth`, `/dashboard/security` | Redirect to `/login` |

---

## 12. Production Smoke Test List

**PASS criteria:**
- Public routes: `200`
- Protected routes: `200` (if already authed) OR redirect to `/login` (301/302/307/308) OR `401`/`403`
- API protected: `401` or `403`
- API public health: `200`
- FAIL always: `500`, page containing `404: This page could not be found`, `NOT_FOUND`, `Page Not Found`

### Public (must 200)
`/` `/login` `/login?error=access_denied` `/login?next=/dashboard` `/intake` `/map` `/countries` `/notary/join`

### Protected pages (200 or redirect — must not 404/500)
`/dashboard` `/dashboard/deliveries` `/dashboard/discounts` `/dashboard/incidents` `/dashboard/notary-network` `/dashboard/truth` `/portal` `/portal/tracking` `/portal/trackingNow` `/portal/invoice` `/portal/documents` `/portal/release` `/va/dashboard` `/va/portal`

### Protected API (must 401/403 — must not 404/500)
`/api/dashboard/discounts` `/api/dashboard/incidents` `/api/notary/credentials`

### Public API health (must 200)
`/api/health`
