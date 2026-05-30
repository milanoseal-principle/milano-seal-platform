# The Milano Seal™ — Final Launch Report
**Document Reference:** MS-OPS-LAUNCH-REPORT-2026-V1  
**Complete after:** All go-live checklist items are signed  
**Owner:** Platform Operator

Fill in every field. Do not leave blanks. Use YES / NO / PASS / FAIL only where indicated.

---

```
THE MILANO SEAL™ FINAL LAUNCH REPORT

Date:
Operator:
Vercel Deployment ID:
Supabase Project Ref:

────────────────────────────────────────────────────────────
1. DATABASE STATUS
────────────────────────────────────────────────────────────

009 applied:
010 applied:
011 applied:
012 applied:
public.notifications exists:
public.notifications RLS enabled:
notifications_deal_id_idx exists:
notifications_status_idx exists:
deals.assignee_user_id exists:
alliance tables absent (011 not applied):
country registry tables absent (012 not applied):

────────────────────────────────────────────────────────────
2. STORAGE STATUS
────────────────────────────────────────────────────────────

documents bucket private:
raw public URLs blocked:
signed URL access working:

────────────────────────────────────────────────────────────
3. ENVIRONMENT STATUS
────────────────────────────────────────────────────────────

PORTAL_SESSION_SECRET set:
NEXT_PUBLIC_APP_URL set:
NEXT_PUBLIC_ENVIRONMENT=production:
NEXT_PUBLIC_VERSION set:
LOG_LEVEL=info set:
NEXT_PUBLIC_SUPABASE_URL set:
NEXT_PUBLIC_SUPABASE_ANON_KEY set:
SUPABASE_SERVICE_ROLE_KEY set:
RESEND_API_KEY set:
RESEND_FROM set:
OPERATOR_EMAILS set:
No placeholder values in any variable:

────────────────────────────────────────────────────────────
4. BUILD STATUS
────────────────────────────────────────────────────────────

Vercel build:
TypeScript errors in build log:
Deployment URL resolves correctly:
Build error details (if any):

────────────────────────────────────────────────────────────
5. SMOKE TEST STATUS
────────────────────────────────────────────────────────────

scripts/smoke-test.sh result:
GET / (200):
GET /intake (200):
GET /api/health (200 + status/environment/version/timestamp):
GET /api/health/database (200 + latency < 2000ms):
GET /api/public/payment-status without access_token (400):
GET /api/public/payment-status without deal_id (400):
POST /api/shipping/create-label/{id} test_mode (501):
GET /api/health/storage (200):
GET /api/health/webhooks (200):
GET /api/health/payment (200):
GET /api/health/dispatch (200):
No example.com in any response:
No TEST MODE in any response:
Failing routes (list any):

────────────────────────────────────────────────────────────
6. INTAKE STATUS
────────────────────────────────────────────────────────────

Test email used:
Deal created:
Deal ID returned:
Notification row inserted:
Confirmation page loaded:
Confirmation email received:
Dashboard shows new deal:
Test deal cleaned up:

────────────────────────────────────────────────────────────
7. PORTAL STATUS
────────────────────────────────────────────────────────────

OTP validated:
OTP nulled after use (portal_otps.otp = null):
OTP marked used (portal_otps.used = true):
HMAC session token issued (not plain base64):
Second OTP submission rejected:
Expired OTP returns 410:
Wrong OTP returns 403:
Missing PORTAL_SESSION_SECRET would return 503:

────────────────────────────────────────────────────────────
8. FINAL DECISION
────────────────────────────────────────────────────────────

PRODUCTION READY / STILL BLOCKED

Blocking issues (if any):

────────────────────────────────────────────────────────────
SIGN-OFF
────────────────────────────────────────────────────────────

Signed off by:
Date:
Vercel Deployment ID:
```
