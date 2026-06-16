# The Milano Seal™ — Canonical Route Map

**Repo:** milanoseal-principle/milano-seal-platform
**Site:** themilanoseal.com
**Last updated:** 2026-06-16
**Purpose:** Production route inventory, access matrix, and smoke test source of truth.

---

## 1. Public / Marketing Routes

| Route | File | Access | Purpose | Smoke Test |
|---|---|---|---|---|
| `/` | `app/page.tsx` | public | Landing page | ✅ |
| `/about` | `app/about/page.tsx` | public | About | — |
| `/pricing` | `app/pricing/page.tsx` | public | Pricing | — |
| `/process` | `app/process/page.tsx` | public | How it works | — |
| `/faq` | `app/faq/page.tsx` | public | FAQ | — |
| `/privacy` | `app/privacy/page.tsx` | public | Privacy policy | — |
| `/terms` | `app/terms/page.tsx` | public | Terms | — |
| `/review` | `app/review/page.tsx` | public | Review landing | — |
| `/review/[token]` | `app/review/[token]/page.tsx` | public | Token review | — |
| `/founder` | `app/founder/page.tsx` | public | Founder profile | — |
| `/blog` | `app/blog/page.tsx` | public | Blog index | — |
| `/learn` | `app/learn/page.tsx` | public | Learning hub | — |
| `/services` | `app/services/page.tsx` | public | Services overview | — |
| `/services/apostille` | `app/services/apostille/page.tsx` | public | Apostille service | — |
| `/services/remote-online-notary` | `app/services/remote-online-notary/page.tsx` | public | RON | — |
| `/services/mobile-notary` | `app/services/mobile-notary/page.tsx` | public | Mobile notary | — |
| `/services/international-execution` | `app/services/international-execution/page.tsx` | public | International execution | — |
| `/verify/[verificationId]` | `app/verify/[verificationId]/page.tsx` | public | Document verification | — |

---

## 2. Intake Routes

| Route | File | Access | Purpose | Smoke Test |
|---|---|---|---|---|
| `/intake` | `app/intake/page.tsx` | public | New matter intake | ✅ |
| `/intake/confirmation` | `app/intake/confirmation/page.tsx` | public | Post-intake confirmation | — |
| `/login` | `app/login/page.tsx` | public | Auth gateway | ✅ |
| `/login?error=access_denied` | `app/login/page.tsx` | public | Access denied state | ✅ |
| `/login?next=/dashboard` | `app/login/page.tsx` | public | Redirect hint | ✅ |
| `/notary/join` | `app/notary/join/page.tsx` | public | Notary network application | ✅ |

**Not currently implemented:**
- `/today` — planned operator daily briefing
- `/workspace/release` — planned release QA workspace

---

## 3. Global Intelligence / Map Routes

| Route | File | Access | Purpose | Smoke Test |
|---|---|---|---|---|
| `/map` | `app/map/page.tsx` | public | Global execution map | ✅ |
| `/countries` | `app/countries/page.tsx` | public | Country index | ✅ |
| `/countries/[country]` | `app/countries/[country]/page.tsx` | public | Country detail | — |
| `/apostille-intel` | `app/apostille-intel/page.tsx` | public | Apostille intelligence hub | — |
| `/apostille/[country]` | `app/apostille/[country]/page.tsx` | public | Country apostille | — |

---

## 4. Dashboard Routes (Operator / Founder / Admin)

All `/dashboard/*` routes require authentication. Unauthenticated requests redirect to `/login`.

### Shell Nav Routes

| Route | File | Access | Purpose | Smoke Test |
|---|---|---|---|---|
| `/dashboard` | `app/dashboard/page.tsx` | operator | Main dashboard | ✅ |
| `/dashboard/admin` | `app/dashboard/admin/page.tsx` | founder | Admin panel | ✅ |
| `/dashboard/admin/payments` | `app/dashboard/admin/payments/page.tsx` | founder | Admin payments | — |
| `/dashboard/admin/reconciliation` | `app/dashboard/admin/reconciliation/page.tsx` | founder | Reconciliation | — |
| `/dashboard/intake` | `app/dashboard/intake/page.tsx` | operator | New matter intake | — |
| `/dashboard/deals` | `app/dashboard/deals/page.tsx` | operator | Matter pipeline | — |
| `/dashboard/deals/[id]` | `app/dashboard/deals/[id]/page.tsx` | operator | Matter detail | — |
| `/dashboard/pipeline` | `app/dashboard/pipeline/page.tsx` | operator | Pipeline view | — |
| `/dashboard/compliance` | `app/dashboard/compliance/page.tsx` | operator | Compliance | — |
| `/dashboard/invoices` | `app/dashboard/invoices/page.tsx` | operator | Invoices | — |
| `/dashboard/follow-ups` | `app/dashboard/follow-ups/page.tsx` | operator | Follow-ups | — |
| `/dashboard/terminal` | `app/dashboard/terminal/page.tsx` | founder | Terminal | — |
| `/dashboard/intelligence/acquisition` | `app/dashboard/intelligence/acquisition/page.tsx` | operator | Acquisition intel | — |
| `/dashboard/intelligence/revenue` | `app/dashboard/intelligence/revenue/page.tsx` | operator | Revenue intel | — |
| `/dashboard/intelligence/autopilot` | `app/dashboard/intelligence/autopilot/page.tsx` | operator | Autopilot intel | — |
| `/dashboard/intelligence/compliance` | `app/dashboard/intelligence/compliance/page.tsx` | operator | Compliance intel | — |
| `/dashboard/va` | `app/dashboard/va/page.tsx` | operator | VA management | — |
| `/dashboard/courier` | `app/dashboard/courier/page.tsx` | operator | Courier management | — |
| `/dashboard/tools` | `app/dashboard/tools/page.tsx` | operator | Tools | — |
| `/dashboard/sops` | `app/dashboard/sops/page.tsx` | operator | SOPs | — |
| `/dashboard/docs/human-touch-trust-engine` | `app/dashboard/docs/human-touch-trust-engine/page.tsx` | operator | Docs | — |
| `/dashboard/matter-intelligence` | `app/dashboard/matter-intelligence/page.tsx` | operator | Matter intelligence | — |
| `/dashboard/build-center` | `app/dashboard/build-center/page.tsx` | founder | Build center | — |
| `/dashboard/monitoring` | `app/dashboard/monitoring/page.tsx` | operator | System monitoring | — |
| `/dashboard/execution-jobs` | `app/dashboard/execution-jobs/page.tsx` | operator | Execution jobs | — |
| `/dashboard/needs-review` | `app/dashboard/needs-review/page.tsx` | operator | Needs review queue | — |
| `/dashboard/ledger` | `app/dashboard/ledger/page.tsx` | operator | Financial ledger | — |

### Module Registry — Admin / Core / Pipeline

| Route | File | Module Name | Smoke Test |
|---|---|---|---|
| `/dashboard/command` | `app/dashboard/command/page.tsx` | Command Center | — |
| `/dashboard/copilot` | `app/dashboard/copilot/page.tsx` | Copilot | — |
| `/dashboard/pipeline` | `app/dashboard/pipeline/page.tsx` | Pipeline | — |
| `/dashboard/follow-ups` | `app/dashboard/follow-ups/page.tsx` | Follow-ups | — |
| `/dashboard/compliance` | `app/dashboard/compliance/page.tsx` | Compliance | — |
| `/dashboard/leads` | `app/dashboard/leads/page.tsx` | Leads | — |
| `/dashboard/prospects` | `app/dashboard/prospects/page.tsx` | Prospects | — |
| `/dashboard/forecast` | `app/dashboard/forecast/page.tsx` | Forecast | — |
| `/dashboard/financials` | `app/dashboard/financials/page.tsx` | Financials | — |
| `/dashboard/apostille` | `app/dashboard/apostille/page.tsx` | Apostille | — |
| `/dashboard/pricing` | `app/dashboard/pricing/page.tsx` | Pricing | — |
| `/dashboard/intelligence` | `app/dashboard/intelligence/` | Intelligence hub | — |
| `/dashboard/runbook` | `app/dashboard/runbook/page.tsx` | Runbook | — |

### Module Registry — Outreach / Growth

| Route | File | Module Name | Smoke Test |
|---|---|---|---|
| `/dashboard/scripts` | `app/dashboard/scripts/page.tsx` | Scripts | — |
| `/dashboard/emails` | `app/dashboard/emails/page.tsx` | Emails | — |
| `/dashboard/referral` | `app/dashboard/referral/page.tsx` | Referral | — |
| `/dashboard/reviews` | `app/dashboard/reviews/page.tsx` | Reviews | — |
| `/dashboard/content` | `app/dashboard/content/page.tsx` | Content | — |
| `/dashboard/ads` | `app/dashboard/ads/page.tsx` | Ads | — |
| `/dashboard/seo` | `app/dashboard/seo/page.tsx` | SEO | — |
| `/dashboard/automation` | `app/dashboard/automation/page.tsx` | Automation | — |

### Module Registry — Intelligence

| Route | File | Module Name | Smoke Test |
|---|---|---|---|
| `/dashboard/executive` | `app/dashboard/executive/page.tsx` | Executive | — |
| `/dashboard/relationships` | `app/dashboard/relationships/page.tsx` | Relationships | — |
| `/dashboard/intelligence/autopilot` | `app/dashboard/intelligence/autopilot/page.tsx` | Autopilot | — |
| `/dashboard/countries` | `app/dashboard/countries/page.tsx` | Countries | — |
| `/dashboard/documents` | `app/dashboard/documents/page.tsx` | Documents | — |
| `/dashboard/lanes` | `app/dashboard/lanes/page.tsx` | Lanes | — |
| `/dashboard/dna` | `app/dashboard/dna/page.tsx` | Execution DNA | — |
| `/dashboard/corridors` | `app/dashboard/corridors/page.tsx` | Corridors | — |
| `/dashboard/trust` | `app/dashboard/trust/page.tsx` | Trust Engine | — |
| `/dashboard/authorities/verify` | `app/dashboard/authorities/verify/page.tsx` | Authority Verify | — |
| `/dashboard/truth` | `app/dashboard/truth/page.tsx` | System Truth | ✅ |
| `/dashboard/memory` | `app/dashboard/memory/page.tsx` | Memory Engine | — |
| `/dashboard/authority-acquisition` | `app/dashboard/authority-acquisition/page.tsx` | Authority Acquisition | — |
| `/dashboard/authority-research` | `app/dashboard/authority-research/page.tsx` | Auth Research Queue | — |
| `/dashboard/observations` | `app/dashboard/observations/page.tsx` | Observations | — |
| `/dashboard/demand` | `app/dashboard/demand/page.tsx` | Document Demand | — |
| `/dashboard/corridors/certification` | `app/dashboard/corridors/certification/page.tsx` | Corridor Certification | — |

### Module Registry — Operations / System

| Route | File | Module Name | Smoke Test |
|---|---|---|---|
| `/dashboard/execution-control` | `app/dashboard/execution-control/page.tsx` | Execution Control | — |
| `/dashboard/releases` | `app/dashboard/releases/page.tsx` | Releases | — |
| `/dashboard/releases/certificates` | `app/dashboard/releases/certificates/page.tsx` | Release Certificates | — |
| `/dashboard/rejections` | `app/dashboard/rejections/page.tsx` | Rejections | — |
| `/dashboard/legal` | `app/dashboard/legal/page.tsx` | Legal | — |
| `/dashboard/credentials` | `app/dashboard/credentials/page.tsx` | Credentials | — |
| `/dashboard/ideas` | `app/dashboard/ideas/page.tsx` | Ideas | — |
| `/dashboard/analytics` | `app/dashboard/analytics/page.tsx` | Analytics | — |
| `/dashboard/assets` | `app/dashboard/assets/page.tsx` | Assets | — |
| `/dashboard/deployment` | `app/dashboard/deployment/page.tsx` | Deployment | — |
| `/dashboard/opportunities` | `app/dashboard/opportunities/page.tsx` | Opportunities | — |
| `/dashboard/outreach` | `app/dashboard/outreach/page.tsx` | Outreach | — |

### Smoke-Tested Dashboard Routes (protected — 200 or redirect to /login)

| Route | Smoke Test |
|---|---|
| `/dashboard` | ✅ |
| `/dashboard/admin` | ✅ |
| `/dashboard/deliveries` | ✅ |
| `/dashboard/discounts` | ✅ |
| `/dashboard/incidents` | ✅ |
| `/dashboard/notary-network` | ✅ |
| `/dashboard/truth` | ✅ |

---

## 5. Client Portal Routes

| Route | File | Access | Purpose | Smoke Test |
|---|---|---|---|---|
| `/portal` | `app/portal/page.tsx` | client | Portal entry | ✅ |
| `/portal/tracking` | `app/portal/tracking/page.tsx` | client | Matter tracking | ✅ |
| `/portal/trackingNow` | `app/portal/trackingNow/page.tsx` | client | Live tracking | ✅ |
| `/portal/invoice` | `app/portal/invoice/page.tsx` | client | Invoice view | ✅ |
| `/portal/documents` | `app/portal/documents/page.tsx` | client | Document access | ✅ |
| `/portal/release` | `app/portal/release/page.tsx` | client | Release coordination | ✅ |
| `/portal/messages` | `app/portal/messages/page.tsx` | client | Client messages | — |
| `/portal/matter-room` | `app/portal/matter-room/page.tsx` | client | Matter room | — |
| `/portal/ron` | `app/portal/ron/page.tsx` | client | RON session | — |
| `/portal/[token]` | `app/portal/[token]/page.tsx` | token | Token-gated access | — |

**Not currently implemented:**
- `/portal/payment` — payment handled via Wise off-platform

---

## 6. Tracking / Courier / Custody Routes

| Route | File | Access | Purpose | Smoke Test |
|---|---|---|---|---|
| `/portal/tracking` | `app/portal/tracking/page.tsx` | client | Shipment tracking | ✅ |
| `/portal/trackingNow` | `app/portal/trackingNow/page.tsx` | client | Live tracking | ✅ |
| `/portal/release` | `app/portal/release/page.tsx` | client | Release coordination | — |
| `/dashboard/courier` | `app/dashboard/courier/page.tsx` | operator | Courier management | — |
| `/dashboard/deliveries` | `app/dashboard/deliveries/page.tsx` | operator | Delivery tracking | ✅ |
| `/dashboard/shipping` | `app/dashboard/shipping/page.tsx` | operator | Shipping labels | — |
| `/api/courier/tracking/[matterId]` | `app/api/courier/tracking/[matterId]/route.ts` | operator | Courier tracking API | — |

---

## 7. VA Operations Routes

| Route | File | Access | Purpose | Smoke Test |
|---|---|---|---|---|
| `/va/dashboard` | `app/va/dashboard/page.tsx` | va | VA dashboard | ✅ |
| `/va/portal` | `app/va/portal/page.tsx` | va | VA portal | ✅ |
| `/va/tasks` | `app/va/tasks/page.tsx` | va | Task queue | — |
| `/va/matters` | `app/va/matters/page.tsx` | va | VA matters | — |
| `/va/messages` | `app/va/messages/page.tsx` | va | VA messages | — |
| `/va/documents` | `app/va/documents/page.tsx` | va | VA documents | — |
| `/va/checklists` | `app/va/checklists/page.tsx` | va | VA checklists | — |
| `/va/courier` | `app/va/courier/page.tsx` | va | VA courier tasks | — |
| `/va/ron` | `app/va/ron/page.tsx` | va | VA RON tasks | — |
| `/va/uploads` | `app/va/uploads/page.tsx` | va | VA uploads | — |
| `/va/escalations` | `app/va/escalations/page.tsx` | va | VA escalations | — |
| `/va/follow-ups` | `app/va/follow-ups/page.tsx` | va | VA follow-ups | — |

---

## 8. Alliance Partner Routes

| Route | File | Access | Purpose | Smoke Test |
|---|---|---|---|---|
| `/alliance/dashboard` | `app/alliance/dashboard/page.tsx` | alliance | Alliance dashboard | — |
| `/alliance/referrals` | `app/alliance/referrals/page.tsx` | alliance | Referrals | — |
| `/alliance/commissions` | `app/alliance/commissions/page.tsx` | alliance | Commissions | — |
| `/alliance/matters` | `app/alliance/matters/page.tsx` | alliance | Alliance matters | — |
| `/alliance/jobs` | `app/alliance/jobs/page.tsx` | alliance | Alliance jobs | — |
| `/alliance/onboarding` | `app/alliance/onboarding/page.tsx` | alliance | Onboarding | — |
| `/alliance/login` | `app/alliance/login/page.tsx` | public | Alliance login | — |

---

## 9. API Routes

### Health (public — safe to hit unauthenticated)

| Route | File | Smoke Test |
|---|---|---|
| `/api/health` | `app/api/health/route.ts` | ✅ |
| `/api/health/database` | `app/api/health/database/route.ts` | — |
| `/api/health/assistant` | `app/api/health/assistant/route.ts` | — |
| `/api/health/payment` | `app/api/health/payment/route.ts` | — |
| `/api/health/webhooks` | `app/api/health/webhooks/route.ts` | — |

### Auth

| Route | File | Method |
|---|---|---|
| `/api/auth/login` | `app/api/auth/login/route.ts` | POST |
| `/api/auth/signout` | `app/api/auth/signout/route.ts` | POST |

### Protected Dashboard APIs (expect 401/403 unauthenticated)

| Route | File | Smoke Test |
|---|---|---|
| `/api/dashboard/discounts` | `app/api/dashboard/discounts/route.ts` | ✅ |
| `/api/dashboard/incidents` | `app/api/dashboard/incidents/route.ts` | ✅ |
| `/api/dashboard/matters` | `app/api/dashboard/matters/route.ts` | — |
| `/api/dashboard/pipeline` | `app/api/dashboard/pipeline/route.ts` | — |
| `/api/dashboard/payments` | `app/api/dashboard/payments/route.ts` | — |
| `/api/dashboard/releases` | `app/api/dashboard/releases/route.ts` | — |
| `/api/notary/credentials` | `app/api/notary/credentials/route.ts` | ✅ |
| `/api/notary/apply` | `app/api/notary/apply/route.ts` | POST only |

### Webhooks (never hit in CI)

- `/api/webhooks/bluenotary`
- `/api/webhooks/shippo`
- `/api/webhooks/wise`
- `/api/webhook/stripe`

---

## 10. Protected vs Public Route Matrix

| Access Level | Pattern | Unauthenticated Behavior |
|---|---|---|
| public | `/`, `/login`, `/intake`, `/map`, `/countries`, `/notary/join`, `/services/*`, `/learn/*`, `/guides/*`, `/verify/*`, city pages | 200 |
| client | `/portal/*` | Redirect → `/login` |
| operator | `/dashboard/*` | Redirect → `/login` |
| va | `/va/*` | Redirect → `/login` |
| alliance | `/alliance/dashboard`, `/alliance/referrals`, etc. | Redirect → `/login` |
| founder | `/dashboard/admin`, `/dashboard/truth`, `/dashboard/security`, `/dashboard/terminal` | Redirect → `/login` |

---

## 11. Not Currently Implemented (Planned)

| Route | Notes |
|---|---|
| `/today` | Planned operator daily briefing — not yet built |
| `/workspace/release` | Planned release QA workspace — not yet built |
| `/portal/payment` | Payment handled via Wise off-platform |

---

## 12. Production Smoke Test Summary

**PASS criteria:**
- Public: `200`
- Protected: `200` or redirect to `/login` (301/302/307/308) or `401`/`403`
- Protected API: `401` or `403`
- Public API: `200`
- FAIL always: `500`, page containing `404: This page could not be found`, `NOT_FOUND`, `Page Not Found`

| Group | Routes | Count |
|---|---|---|
| Public | `/` `/login` `/login?error=access_denied` `/login?next=/dashboard` `/intake` `/map` `/countries` `/notary/join` | 8 |
| Dashboard (protected) | `/dashboard` `/dashboard/admin` `/dashboard/deliveries` `/dashboard/discounts` `/dashboard/incidents` `/dashboard/notary-network` `/dashboard/truth` | 7 |
| Portal (protected) | `/portal` `/portal/tracking` `/portal/trackingNow` `/portal/invoice` `/portal/documents` `/portal/release` | 6 |
| VA (protected) | `/va/dashboard` `/va/portal` | 2 |
| Protected API | `/api/dashboard/discounts` `/api/dashboard/incidents` `/api/notary/credentials` | 3 |
| Public API | `/api/health` | 1 |
| **Total** | | **27** |
