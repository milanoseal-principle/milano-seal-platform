# BlueNotary RON Smoke Test — RON-01

**Platform:** The Milano Seal™  
**Module:** RON-01 BlueNotary Signing Room  
**Last Updated:** 2026-06-04

---

## Pre-flight Checklist

- [ ] `BLUENOTARY_API_KEY` set in env
- [ ] `BLUENOTARY_WEBHOOK_SECRET` set in env
- [ ] `BLUENOTARY_MODE=test`
- [ ] `BLUENOTARY_BASE_URL` points to test API
- [ ] Supabase migration 018 applied
- [ ] Test matter created with `payment_status=paid` and `amount_paid >= amount_due`

---

## Test Cases

### TC-01: Payment Gate Blocks Session Creation

**Precondition:** Matter with `payment_status=unpaid`  
**Action:** `POST /api/dashboard/ron/sessions` with `matter_id` of unpaid matter  
**Expected:** `403 PAYMENT_NOT_CONFIRMED`  
**Pass Criteria:** No ron_session created, no BlueNotary API call made

---

### TC-02: Session Creation — Happy Path

**Precondition:** Matter with `payment_status=paid`, no existing active RON session  
**Action:** `POST /api/dashboard/ron/sessions` with valid `matter_id` and `signers`  
**Expected:** `200` with `session.id`, `notarization_id`, `milano_ron_status=RON_SESSION_CREATED`  
**Pass Criteria:** ron_session row created, ron_signers rows created, ron_audit_event RON_SESSION_CREATED written. Response contains NO signing URLs, NO raw BN payload.

---

### TC-03: Duplicate Active Session Blocked

**Precondition:** Matter with an existing active RON session (`RON_SESSION_CREATED`)  
**Action:** `POST /api/dashboard/ron/sessions` with same `matter_id`  
**Expected:** `403 ACTIVE_SESSION_EXISTS`  
**Pass Criteria:** No second session created

---

### TC-04: Webhook Idempotency (Duplicate Event)

**Precondition:** Valid active RON session  
**Action:** `POST /api/webhooks/bluenotary` twice with identical payload  
**Expected:** First call `200 {ok:true}`, second call `200 {ok:true, duplicate:true}`  
**Pass Criteria:** Only one ron_webhook_events row for the event_hash

---

### TC-05: Webhook Auth Rejection

**Precondition:** Any  
**Action:** `POST /api/webhooks/bluenotary` with invalid Authorization header  
**Expected:** `401 Unauthorized`  
**Pass Criteria:** No webhook event stored

---

### TC-06: Webhook kba_succeeded Maps to KBA_PASSED

**Precondition:** Active RON session  
**Action:** `POST /api/webhooks/bluenotary` with `event_type=kba_succeeded`  
**Expected:** `200`, ron_session.milano_ron_status updated to `KBA_PASSED`, kba_status updated to `PASSED`  
**Pass Criteria:** Audit event written, signer record updated if email matched

---

### TC-07: Webhook kba_failed Maps to KBA_FAILED

**Precondition:** Active RON session  
**Action:** `POST /api/webhooks/bluenotary` with `event_type=kba_failed`  
**Expected:** `200`, ron_session.milano_ron_status = `KBA_FAILED`, kba_status = `FAILED`  
**Pass Criteria:** Red badge visible in Identity Verification Panel. No session auto-expired.

---

### TC-08: session_completed Triggers Signed Doc Retrieval

**Precondition:** Active RON session with BlueNotary session in completed state  
**Action:** `POST /api/webhooks/bluenotary` with `event_type=session_completed`  
**Expected:** `200`, signed documents retrieved from BN, stored in Supabase storage at `ron/{matter_id}/{session_id}/`, milan_ron_status = `SIGNED_DOCS_RETRIEVED`, next_action = `APOSTILLE_QA_REVIEW`  
**Pass Criteria:** base64 NOT in audit logs, NOT in response, NOT in ron_documents table. No auto-courier dispatch.

---

### TC-09: Signed Documents NOT Auto-Released

**Precondition:** session_completed webhook processed  
**Action:** Check portal `/api/portal/me/ron`  
**Expected:** `signing_url` is null in portal response  
**Pass Criteria:** Operator must manually release — no auto-release logic anywhere in codebase

---

### TC-10: Portal Projection — No Raw BN Fields

**Precondition:** Active RON session, portal user logged in  
**Action:** `GET /api/portal/me/ron`  
**Expected:** `200` with `ron_session` containing only `session_id`, `milano_ron_status`, `client_label`, `payment_confirmed`, `session_active`, `signing_url` (null), `coordinator_message`  
**Pass Criteria:** Response does NOT contain `blue_notary_status`, `notarization_id`, `bn_session_id`, `raw_session`, `storage_path`, `signing_url_encrypted`, or base64 content.

---

### TC-11: Signing URL Released to Correct Signer Only

**Precondition:** RON session with `signing_url_released=true` on signer A, portal user logged in as signer A  
**Action:** `GET /api/portal/me/ron`  
**Expected:** `signing_url` is populated in portal response  
**Pass Criteria:** If logged in as signer B (different email), signing_url is null

---

### TC-12: Expired Session Blocks Signing URL

**Precondition:** RON session with `milano_ron_status=RON_EXPIRED`  
**Action:** `GET /api/portal/me/ron`  
**Expected:** `signing_url` is null, `session_active=false`  
**Pass Criteria:** Even if `signing_url_released=true` on signer, URL not exposed when expired

---

### TC-13: Reschedule Updates session_timing

**Precondition:** Active RON session (not expired/completed)  
**Action:** `PUT /api/dashboard/ron/sessions/{id}/reschedule` with `session_timing` (future ISO 8601) and `reason`  
**Expected:** `200`, ron_session.session_timing updated, audit event RON_SESSION_RESCHEDULED written  
**Pass Criteria:** Missing `reason` returns 400. Past timestamp handled gracefully.

---

### TC-14: Expire Session Blocks All Signing URLs

**Precondition:** Active RON session with signing_url_released=true on signers  
**Action:** `PUT /api/dashboard/ron/sessions/{id}/expire` with `reason`  
**Expected:** `200`, milan_ron_status = `RON_EXPIRED`, all ron_signers.signing_url_released set to false, session_url_status = BLOCKED  
**Pass Criteria:** Portal immediately shows no signing URL. Audit event RON_SESSION_EXPIRED written.

---

### TC-15: Authorization Header Never Logged

**Precondition:** Any BlueNotary API call  
**Action:** Trigger a BlueNotary API error (e.g., invalid session id)  
**Expected:** Error message does NOT contain `Authorization`, `Bearer`, or API key value  
**Pass Criteria:** Check server logs / error output — redactBNPayload applied before any logging

---

### TC-16: Unknown Webhook Session Stored as Review Required

**Precondition:** Valid webhook auth  
**Action:** `POST /api/webhooks/bluenotary` with `notarization_id` not matching any ron_session  
**Expected:** `200 {ok:true, status:"review_required"}`, ron_webhook_events row created with `processed=false`  
**Pass Criteria:** No 500 error, no ron_session created, event stored for operator triage

---

### TC-17: RON Dashboard Queue Displays All 8 Queues

**Precondition:** Dashboard operator logged in  
**Action:** Navigate to `/dashboard/ron`  
**Expected:** All 8 queue columns displayed: Ready for RON, Sessions Created, Identity Verification, In Session, Processing, Completed/Apostille, Failed/Review, Expired  
**Pass Criteria:** Each queue shows matter cards with Matter ID, Client name, Document Type, Payment Status, RON Status, Identity Status, KBA Status. Action buttons disabled when payment not confirmed or session expired. Gold/black Milano Seal aesthetic.
