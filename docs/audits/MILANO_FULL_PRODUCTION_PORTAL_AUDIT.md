# Milano Seal — Full Production Portal Audit

**Date:** 2026-06-26
**Branch:** claude/funny-maxwell-hlxQN
**Auditor:** Claude Code production pass

---

## Route Inventory

### Public Routes
- `/` — Homepage with hero, pricing lanes, routing preview, SEO content
- `/pricing` — Redirects to `/#pricing`
- `/intake` — Matter intake form (SmartMatterIntake)
- `/intake/confirmation` — Intake confirmation page
- `/map` — Intelligence Atlas (global map)
- `/login` — Role-aware secure access (4 workspace tabs)
- `/about`, `/founder`, `/process`, `/review` — Brand/authority pages
- `/services/*` — Service authority pages (RON, apostille, mobile notary, etc.)
- `/apostille/*` — Country/document apostille authority pages
- `/apostille-intel/*` — Apostille intelligence pages
- `/countries/*` — Country authority pages
- `/documents/*` — Document authority pages
- `/guides/*` — Educational guide pages (10 articles)
- `/partners/*` — Partner segment pages
- `/professionals/*` — Professional segment pages
- `/verticals/*` — Vertical authority pages
- `/verify/[verificationId]` — Document verification
- `/not-found`, `/error` — Error handling pages

### Protected Portal Routes (client — token-gated)
- `/portal` — Portal home / matter overview
- `/portal/invoice` — Invoice & payment authorization
- `/portal/payment` — Payment instructions
- `/portal/matter-room` — Matter room / status
- `/portal/documents` — Document portal
- `/portal/tracking` — Shipment tracking
- `/portal/messages` — Client messages

### Protected Dashboard Routes (operator — auth required)
- `/dashboard` — Main operator dashboard
- `/dashboard/deals/[id]` — Matter detail page (full operator actions)
- `/dashboard/payments` — Payment management
- `/dashboard/invoices` — Invoice management
- `/dashboard/needs-review` — Review queue
- `/dashboard/shipping` — Shipping/courier management
- `/dashboard/discounts` — Discount code manager
- `/dashboard/founder-pricing` — Founder pricing override
- `/dashboard/[module]` — Dynamic module routing (analytics, apostille, etc.)

### Protected VA Routes
- `/va/dashboard` — VA workspace
- `/va/checklists`, `/va/courier`, `/va/documents`, `/va/ron` — VA modules

### Protected Alliance Routes
- `/alliance/dashboard`, `/alliance/matters`, `/alliance/referrals/*` — Alliance workspace
- `/alliance/commissions`, `/alliance/documents`, `/alliance/messages`, etc.

### API Routes
- `POST /api/auth/login` — Role-aware login with tab routing
- `GET/POST /api/deals` — Deal list/create
- `GET/PATCH /api/deals/[id]` — Deal read/update
- `POST /api/deals/[id]/payment` — Payment status update
- `POST /api/deals/[id]/apply-discount` — **NEW** Server-side discount application
- `DELETE /api/deals/[id]/apply-discount` — **NEW** Discount removal
- `POST /api/deals/[id]/release` — Release coordination
- `GET/POST/PATCH /api/dashboard/discounts` — Discount code management (operator only)
- `POST /api/webhook/wise` — Wise webhook (signature-verified)
- `GET /api/portal/me` — Safe portal matter data (client-safe fields only)
- `POST /api/admin/override` — Payment/status operator override
- `GET /api/admin/founder-pricing-override` — Founder pricing override

---

## Payment Flow Status

### Wise Integration: ✅ PRESENT
- `app/api/webhook/wise/route.ts` — Signature-verified Wise webhook
- `lib/payments/wiseUrl.ts` — Wise payment URL builder
- Portal invoice shows Wise payment card
- Wise reference generated from matter ID

### Manual Payment Confirmation: ✅ PRESENT
- `app/dashboard/deals/[id]/page.tsx` — Operator payment confirmation UI
- `app/api/deals/[id]/payment/route.ts` — Payment update API

### Payment Gate: ✅ PRESENT
- `payment_status !== "paid"` check in deals PATCH API (line 321)
- Override API requires authenticated operator
- Release route checks payment_status

### Stripe References: 🔴 WAS PRESENT — NOW FIXED
- `VALID_METHODS = ["wise", "stripe"]` → Changed to `["wise", "wire", "manual"]`

---

## Discount Code Status

### DB Schema: ✅ PRESENT (migration 035)
- `discount_codes` table — code, type, value, status, expiration, usage limits
- `discount_redemptions` table — original/discount/final amounts
- `discount_audit_log` table — full audit trail

### Discount Code Lib: ✅ PRESENT
- `lib/discountCodes.ts` — validation logic (active, expiry, usage)

### Apply-Discount API: 🔴 WAS MISSING — NOW IMPLEMENTED
- `app/api/deals/[id]/apply-discount/route.ts` — POST (apply) + DELETE (remove)
- Server-side validation, amount calculation, redemption recording, event logging

### Portal Invoice Discount UI: 🔴 WAS MISSING — NOW IMPLEMENTED
- Discount code input field on portal invoice (unpaid matters only)
- Applied discount summary shows original/discount/final amounts
- Calls server-side API — no client-side discount math

### Matter Fields for Discount:
- `discount_code_id` — FK to discount_codes (present in schema)
- `payment_amount_due` — Updated to final amount after discount applied

---

## Client Portal Status

### Safe Field Filtering: ✅ PRESENT
- `app/api/portal/me/route.ts` — `PORTAL_SAFE_FIELDS` whitelist
- Internal fields (cost, margin, operator_notes) not exposed
- `PortalClientMatter` interface matches safe fields

### Portal Token Scoping: ✅ PRESENT
- Portal context loads single matter scoped to authenticated user
- `portal-context.tsx` fetches only the user's own matter

### Status Tracker: ✅ PRESENT
- `portal-status-rail.tsx` — multi-stage status display
- `client_facing_status` field used for human-readable copy

---

## Operator Dashboard Status

### Matter Detail Page: ✅ PRESENT
- `app/dashboard/deals/[id]/page.tsx` — full operator actions
- Payment confirmation, status updates, event ledger, tracking

### Operator Actions: ✅ MOSTLY PRESENT
- Mark payment status, add payment reference, amount received
- Status advancement (new → reviewing → scheduled → etc.)
- Apostille, shipping, completion tracking

### Event Ledger: ✅ PRESENT
- `lib/activity.ts` — `logActivity` writes to activity log
- Used throughout payment, discount, and status flows

---

## Security Status

### Route Auth Guards: ✅ PRESENT
- `app/portal/layout.tsx` — FOUNDER_PREVIEW_ROLES + client redirect
- `lib/vaAuth.ts` — VA role guard
- `lib/dashboardAuth.ts` — Dashboard access guard
- `lib/auth/requireRole.ts` — Generic role requirement helper

### Middleware: ⚠️ NOT PRESENT (middleware.ts missing)
- No global middleware — protection is layout-level
- This is acceptable but global middleware would be more robust

### Service Role Key Exposure: ✅ SAFE
- `lib/supabase/admin.ts` uses `SUPABASE_SERVICE_ROLE_KEY` server-side only
- No client bundle exposure found

### noindex on Private Routes: ✅ PRESENT
- Portal layout: `robots: { index: false, follow: false }`
- Dashboard layout: `robots: { index: false, follow: false }`

---

## SEO Pages Status

### Present and Structured: ✅
- `/apostille/[country]/[document]/[use-case]` — country/document/use-case authority pages
- `/services/*` — 14+ service pages with CTAs
- `/guides/*` — 10 educational guide articles
- `/partners/*`, `/professionals/*`, `/verticals/*` — segment pages

### Issues: None blocking found in structure.

---

## Missing / Deferred Items

1. **Global middleware.ts** — No global Next.js middleware. Layout-level guards present but middleware would add defense-in-depth. *Deferred — not blocking.*
2. **Discount code UI on portal/payment page** — Payment page also shows Wise instructions but lacks discount code field. *Lower priority — invoice page is primary.*
3. **`discount_code` text field on matter** — Schema has `discount_code_id` (FK) but the client-facing display of the code string requires joining. Applied discount is stored in redemptions table. *Schema is correct — no change needed.*

---

## Pricing Lock Verification

| Lane | Config Value | Status |
|---|---|---|
| Signature Lane | $750 | ✅ Locked |
| Priority Lane | $975 | ✅ Locked |
| Executive Lane | $1,850 | ✅ Locked (updated this session) |
| Custom Matter | Review path only | ✅ Not a 4th public lane |
| Apostille | $275 first doc | ✅ Canonical |
| Rush | $175 | ✅ Canonical |
| Additional Signer | $75 | ✅ Canonical |

---

## Build Status

- TypeScript: ✅ 0 errors
- Build: ✅ Passing
