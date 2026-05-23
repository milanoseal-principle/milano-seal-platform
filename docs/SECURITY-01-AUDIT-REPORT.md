# SECURITY FOUNDATION AUDIT REPORT
**Milano Seal Platform — SECURITY-01**  
**Branch:** `claude/security-foundation-audit`  
**Date:** 2026-05-23  
**Status:** Read-only inspection. No code patched.

---

## 1. FILES INSPECTED

**Core Configuration**
- `middleware.ts`
- `next.config.mjs`
- `app/robots.ts`
- `app/sitemap.ts`
- `.env.example`

**Supabase Integration**
- `lib/supabaseClient.ts`
- `lib/supabaseServer.ts`
- `lib/supabase/admin.ts`
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`

**Auth & Authorization**
- `app/login/page.tsx`
- `app/auth/callback/route.ts`
- `app/admin/login/page.tsx`
- `app/operator/login/page.tsx`
- `lib/rbac.ts`
- `lib/portalAuth.ts`

**Dashboard & Portal**
- `app/dashboard/layout.tsx`
- `app/portal/layout.tsx`
- `app/portal/page.tsx`
- `app/portal/[token]/page.tsx`
- `components/dashboard/milano-shell.tsx`
- `components/portal/portal-client.tsx`
- `components/portal/portal-context.tsx`

**API Routes (20+ sampled)**
- `app/api/deals/route.ts`
- `app/api/deals/[id]/route.ts`
- `app/api/deals/[id]/pay/route.ts`
- `app/api/admin/move/route.ts`
- `app/api/admin/pipeline/route.ts`
- `app/api/portal/me/route.ts`
- `app/api/portal/verify/route.ts`
- `app/api/portal/confirm/route.ts`
- `app/api/portal/files/route.ts`
- `app/api/portal/me/messages/route.ts`
- `app/api/upload/route.ts`
- `app/api/webhook/stripe/route.ts`
- `app/api/webhook/wise/route.ts`
- `app/api/public/payment-status/route.ts`
- `app/api/ai/generate/route.ts`

**Business Logic**
- `lib/pipelineEngine.ts`
- `lib/stateMachine.ts`
- `lib/gate.ts`
- `lib/activity.ts`
- `lib/audit.ts`
- `lib/compliance.ts`

---

## 2. CURRENT SECURITY MODEL SUMMARY

**Authentication**
- Supabase Auth (magic link / OTP for portal clients; password for operators/admins)
- Session managed via Supabase cookies
- Anon key in browser, service role key on server

**Authorization**
- Middleware guards `/dashboard`, `/portal`, `/api/admin/*`, `/api/dashboard/*` with auth-existence check only
- RBAC stub exists (`lib/rbac.ts`) with `roleFromEmail()` using env vars (`ADMIN_EMAILS`, `OPERATOR_EMAILS`) — **not enforced in API routes**
- Portal access via static `access_token` UUID + email/OTP verification

**Payment & State Machine**
- Wise webhook signature verification (`verifyWiseSignature`) implemented
- State machine enforces valid transitions: `new→reviewing→quoted→awaiting_payment→scheduled→in_execution→apostille→shipped→completed`
- Payment status checked before advancing to scheduled or later stages

**Storage & Documents**
- Supabase Storage used (`storage.documents` bucket)
- Public URLs issued via `.getPublicUrl()` — security depends entirely on bucket policy
- File upload: 20MB limit, type validation on Content-Type header only

**Audit Logging**
- `activity_logs` tracks deal stage changes, payments, notes
- `audit_logs` stub exists in `lib/audit.ts` — not actively used
- `webhook_events` stores Wise payloads
- `deal_events` logs payment received events

**Crawl Boundaries**
- `robots.ts` disallows `/dashboard`, `/portal`, `/admin`, `/operator`, `/api`, `/auth`, `/login` — correct
- `sitemap.ts` includes public routes only — correct

---

## 3. CRITICAL RISKS

### HIGH SEVERITY

**3.1 — No Role Enforcement in Operator API Routes**
- `app/api/admin/move/route.ts:18`, `app/api/admin/pipeline/route.ts:8`, and 10+ additional admin routes
- Middleware checks auth existence only, not role membership. Any authenticated Supabase user can: move deals, view full pipeline, trigger payment state changes, view activity logs
- **Impact:** Portal client who registers a Supabase account can access full operator dashboard

**3.2 — Static Portal Access Token, No Rotation or Expiry**
- `app/portal/[token]/page.tsx:27`, `app/api/portal/verify/route.ts:19`
- Token is a static UUID in `deals.access_token`. Passed in plaintext URL. No rotation, no TTL, no rate limiting on verification
- **Impact:** Token leaked via browser history, logs, or email grants permanent matter access

**3.3 — Portal Session Token is Unsigned Base64 JSON**
- `app/api/portal/confirm/route.ts:54–56`
- `Buffer.from(JSON.stringify({ deal_id, ts })).toString("base64")` — trivially decoded and forged
- **Impact:** Attacker decodes token to extract deal_id; no server-side signature validation

**3.4 — AI Endpoint Has No Authentication**
- `app/api/ai/generate/route.ts:17`
- `POST /api/ai/generate` not in middleware protected list; accepts arbitrary prompts with zero auth check
- **Impact:** Unmetered Anthropic API abuse vector; cost/quota attack

**3.5 — Public Payment Status Endpoint Leaks Deal Data Unauthenticated**
- `app/api/public/payment-status/route.ts:4`
- `GET /api/public/payment-status?deal_id=X` returns payment and deal status with no auth; deal IDs follow `MS-*` pattern
- **Impact:** Full deal enumeration without credentials

**3.6 — No RLS Policies on Any Supabase Table**
- No `/supabase/migrations/` directory; no policy definitions found anywhere
- All table security depends on service role key. No row-level isolation between matters
- **Impact:** If service role key is compromised, full database read/write. If anon key misconfigured, same result

---

### MEDIUM SEVERITY

**3.7 — Dashboard Accessible to Any Authenticated User**
- `app/dashboard/layout.tsx` — auth-only middleware, no role check
- Any user with a Supabase session can navigate to `/dashboard` and view all deals, pipeline, revenue, analytics
- **Impact:** Portal client navigates to `/dashboard` manually and sees complete operator data

**3.8 — No CSRF Protection on State-Changing Routes**
- `app/api/admin/move/route.ts`, `app/api/deals/[id]/pay/route.ts`
- No CSRF token or SameSite enforcement documented
- **Impact:** Cross-site form submission can trigger deal stage changes against authenticated operator session

**3.9 — Wise Webhook Payload Stored Unencrypted**
- `app/api/webhook/wise/route.ts:41–46`
- Full payload (payer info, amounts, transfer IDs) stored in `webhook_events.payload` as plaintext JSON
- **Impact:** Database breach exposes customer payment details

**3.10 — Portal OTP Has No Account Confirmation Step**
- `app/api/portal/verify/route.ts:34`
- Email match check only; OTP sent to provided address but no proof the requester owns that address at account creation
- **Impact:** Attacker with knowledge of client email can attempt OTP interception

---

### LOW SEVERITY

**3.11 — No Security Headers in next.config.mjs**
- No `headers()` export; no CSP, X-Frame-Options, HSTS, X-Content-Type-Options
- **Impact:** No clickjacking protection, no XSS mitigation

**3.12 — MIME Type Validation on Content-Type Header Only**
- `app/api/upload/route.ts:28–32`
- No magic byte / file signature validation; attacker can forge Content-Type
- **Impact:** Malicious file upload with forged MIME type

**3.13 — Portal Session Stored in sessionStorage**
- `components/portal/portal-client.tsx:130`
- `sessionStorage.setItem(...)` — no httpOnly cookie flag
- **Impact:** XSS can exfiltrate portal session token

---

## 4. MISSING ACCESS-CONTROL LAYERS

1. No role-based authorization in any API route — auth existence ≠ role permission
2. No resource-level access check — no verification that an operator is assigned to the deal they're modifying
3. No API key tier for external integrations
4. No rate limiting on `/api/ai/generate`, `/api/upload`, `/api/public/payment-status`, `/api/portal/verify`
5. No CSRF token validation on state-changing POST routes
6. No `client.getUser()` role enrichment in dashboard/admin API routes

---

## 5. MISSING AUDIT LOGS

1. Failed login attempts
2. API endpoint access (who called what, when)
3. Document downloads from storage
4. Configuration changes (payment amounts, stage overrides) with actor identity
5. Permission/role assignments
6. PII field access (email, phone, address reads)
7. Supabase Storage access events

---

## 6. MISSING TENANT/TEAM/MATTER/DOCUMENT ISOLATION

1. No multi-tenancy model — single operator entity only
2. No team delegation — cannot assign matter ownership to sub-operators
3. No document-level access rules — files in Supabase Storage have no RLS
4. No matter ownership enforcement — `deals.assignee` exists but not enforced in queries
5. Messages, activity logs, and files have no access-control matrix

---

## 7. MISSING RLS / STORAGE POLICIES

**RLS Status:** OFF — no migrations folder, no policy definitions anywhere in codebase

**Required Policies:**

| Table | Required Policy |
|---|---|
| `deals` | Operator sees assigned deals only; client match by email |
| `files` | Participants of the deal only |
| `messages` | Participants of the deal only |
| `activity_logs` | Participants of the deal only |
| `payments` | Participants of the deal only |
| `portal_otps` | Deal-specific; not enumerable |
| `storage.documents` | Bucket policy: only deal participants |

---

## 8. PRIVATE ROUTE INDEXING RISK

**Status: PASS** — `robots.ts` correctly disallows all private areas.

**Note:** `/alliance` is currently allow-listed (future feature). Must be restricted before alliance launch or when private alliance routes are added.

---

## 9. DASHBOARD / PORTAL / ALLIANCE / VA EXPOSURE RISK

| Workspace | Protection | Risk Level |
|---|---|---|
| `/dashboard` | Auth-only middleware, no role check | HIGH — accessible to any authenticated user |
| `/portal` | Token + OTP, but static token, no rotation | HIGH — permanent access if token leaked |
| `/alliance` | Not implemented yet | HIGH — must have separate auth/role model before launch |
| `/api/ai/generate` | None | HIGH — open to unauthenticated abuse |

---

## 10. RECOMMENDED DATABASE TABLES

```sql
-- Role definitions
roles (id, name, permissions JSONB, created_at)

-- User-to-role mapping
user_roles (user_id FK auth.users, role_id FK roles, deal_id FK deals NULLABLE, assigned_at)

-- Fine-grained permissions
permissions (id, role_id, resource TEXT, action TEXT, conditions JSONB)

-- External API keys
api_keys (id, name, key_hash, created_by, scope TEXT, last_used, expires_at)

-- Server-side session tracking
sessions (id, user_id, session_token_hash, issued_at, expires_at, ip_address, user_agent)

-- Comprehensive audit log
audit_events (id, actor_id, resource_type, resource_id, action, old_value JSONB, new_value JSONB, ip_address, created_at)

-- Security incident log
security_events (id, event_type, user_id, severity, details JSONB, ip_address, remediation_status, created_at)

-- Rate limiting
rate_limit_counters (key, endpoint, request_count, window_start, window_end)
```

---

## 11. RECOMMENDED RLS POLICIES

```sql
-- deals: operator sees assigned deals, client sees own by email
CREATE POLICY "operator_access" ON deals
  FOR ALL USING (auth.uid() = assignee_id OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "client_read_own" ON deals
  FOR SELECT USING (email = auth.jwt() ->> 'email');

-- files, messages, activity_logs: deal participants only
CREATE POLICY "deal_participants" ON files
  FOR ALL USING (deal_id IN (
    SELECT id FROM deals WHERE assignee_id = auth.uid()
    OR email = auth.jwt() ->> 'email'
  ));

-- storage.documents bucket policy
CREATE POLICY "documents_participants" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM deals
      WHERE assignee_id = auth.uid() OR email = auth.jwt() ->> 'email'
    )
  );
```

---

## 12. RECOMMENDED AUDIT / SECURITY / CUSTODY EVENT SCHEMAS

```sql
CREATE TABLE audit_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID NOT NULL REFERENCES auth.users(id),
  actor_email TEXT NOT NULL,
  resource_type TEXT NOT NULL, -- deals | files | payments | users
  resource_id UUID,
  action      TEXT NOT NULL,   -- create | read | update | delete | execute
  old_value   JSONB,
  new_value   JSONB,
  ip_address  INET,
  user_agent  TEXT,
  status      TEXT NOT NULL DEFAULT 'success', -- success | failure
  error_msg   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_actor   ON audit_events(actor_id, created_at DESC);
CREATE INDEX idx_audit_resource ON audit_events(resource_type, resource_id, created_at DESC);

CREATE TABLE security_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type       TEXT NOT NULL, -- login_failed | unauthorized_access | rate_limit | token_reuse
  user_id          UUID REFERENCES auth.users(id),
  severity         TEXT NOT NULL, -- low | medium | high | critical
  details          JSONB,
  ip_address       INET,
  remediation      TEXT DEFAULT 'open', -- open | in_progress | resolved
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 13. RECOMMENDED IMPLEMENTATION PR SEQUENCE

### SECURITY-02 — Role Enforcement in All API Routes (BLOCKING)
**Before:** Any authenticated user can call any admin/operator API  
**After:** All `/api/admin/*` and `/api/dashboard/*` routes verify role via `authorizeRole()` utility  
**Scope:** New `lib/auth-guards.ts` + 12+ API route patches  
**Depends on:** Nothing — can start immediately

### SECURITY-03 — Portal Token Rotation & Cryptographic Session (BLOCKING)
**Before:** Static UUID `access_token`, unsigned Base64 session token  
**After:** HMAC-SHA256 signed token with 30-day TTL, rotation on each OTP verification  
**Scope:** New `portal_sessions` table, `/api/portal/confirm`, `/api/portal/verify`, `/app/portal/[token]/page.tsx`  
**Depends on:** Nothing — can run parallel to SECURITY-02

### SECURITY-04 — Rate Limiting & Input Validation (HIGH PRIORITY)
**Before:** No rate limits on AI, upload, public payment status, or OTP endpoints  
**After:** Per-user and per-IP rate limits; input validation on all form endpoints; CSRF tokens on state-changing routes  
**Scope:** New `lib/rate-limit.ts` + 5+ API route patches  
**Depends on:** Nothing

### SECURITY-05 — RLS Policies & Storage Security (HIGH PRIORITY)
**Before:** RLS off; storage documents world-readable via public URL  
**After:** RLS enabled on all tables; storage bucket policy restricts to deal participants  
**Scope:** `/supabase/migrations/001_enable_rls.sql`, storage bucket config  
**Depends on:** SECURITY-02 (role model needed to write correct policies)

### SECURITY-06 — Comprehensive Audit Logging (MEDIUM)
**Before:** Only activity_logs for stage changes; no security event log  
**After:** `audit_events` and `security_events` tables populated on all sensitive actions  
**Scope:** `lib/audit-log.ts` (new), extend `lib/activity.ts`, 10+ API routes  
**Depends on:** SECURITY-05 (tables need RLS before logging to them)

### SECURITY-07 — Security Headers & CSP (LOW)
**Before:** No headers in `next.config.mjs`  
**After:** CSP, X-Frame-Options, HSTS, X-Content-Type-Options, Referrer-Policy  
**Scope:** `next.config.mjs` only — no other files  
**Depends on:** Nothing — can run parallel to any other PR

---

## SUMMARY TABLE

| Area | Status | Risk |
|---|---|---|
| Auth model | Supabase + cookies | Medium |
| Role model | Stub only, not enforced in routes | **HIGH** |
| Supabase / RLS | No RLS policies defined | **HIGH** |
| Dashboard exposure | Auth-only, no role check | **HIGH** |
| Portal exposure | Static token, no rotation | **HIGH** |
| Storage / documents | Public URLs, no bucket policy | **HIGH** |
| AI endpoint | Unprotected | **HIGH** |
| Public payment-status | No auth, enumerable | **HIGH** |
| Audit logging | Partial (activity only) | Medium |
| Payment gating | State machine correct | Low |
| State transitions | Server-side enforced | Low |
| Robots / noindex | Correctly configured | PASS |
| Sitemap | Public routes only | PASS |
| Input validation | Basic type/size only | Medium |
| CSRF protection | Not implemented | Medium |
| Security headers | None | Low |

---

## IMMEDIATE BLOCKERS BEFORE DASHBOARD EXPANSION

The following must be resolved before any dashboard, portal, alliance, or VA work proceeds:

1. **SECURITY-02** — Role enforcement (any auth user = full operator access today)
2. **SECURITY-03** — Portal token rotation (permanent access via static token)
3. **SECURITY-04** — Rate limiting + `/api/ai/generate` auth gate (open cost vector)
4. **SECURITY-05** — RLS policies (no row isolation in database)

SECURITY-06 and SECURITY-07 can follow as the workspace expands.
