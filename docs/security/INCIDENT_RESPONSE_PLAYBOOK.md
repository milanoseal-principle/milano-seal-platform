# Milano Seal — Incident Response Playbook

Practical response playbooks for the failure modes that actually matter.
Owner: Nicholas Milano (Founder).

---

## Playbook 1 — Wrong Client Portal Access

**Scenario**: A client can see another client's matter, documents, or portal data.

| Step | Action |
|------|--------|
| Triage owner | Founder |
| Immediate containment | Revoke session tokens for both affected clients. Disable affected portal route if needed. |
| Client-safe communication | "We identified a technical issue with your account access and have corrected it. Your matter and documents were not affected." |
| Internal correction | Audit RLS policies on `deals` table. Verify `assertClientOwnsMatter()` is enforced on all portal API routes. |
| Evidence preserved | Capture Supabase auth logs and portal API request logs before resetting. |
| Post-incident fix | Add `assertClientOwnsMatter()` check to every `/api/portal/*` route. Add `findForbiddenClientFields()` test to CI. |
| Prevention rule | Every portal API response must pass `projectMatterForClient()` before returning. |

---

## Playbook 2 — Payment Confirmation Error

**Scenario**: Payment is confirmed for the wrong matter, wrong amount, or without founder approval.

| Step | Action |
|------|--------|
| Triage owner | Founder |
| Immediate containment | Mark affected matter `payment_confirmed = false`. Notify client scheduling may be temporarily paused. |
| Client-safe communication | "We are performing a brief verification on your payment confirmation. We will update you within 24 hours." |
| Internal correction | Review Wise webhook payload. Confirm matter_id mapping. Manually re-confirm via `PAYMENT_CONFIRMED_MANUAL` event with founder. |
| Evidence preserved | Save raw Wise webhook from Supabase logs before any correction. |
| Post-incident fix | Add `validatePaymentRecord()` check to webhook handler. Add idempotency guard. |
| Prevention rule | `PAYMENT_CONFIRMED_MANUAL` requires `founder_admin` role at every call site. |

---

## Playbook 3 — Apostille / Final Document Error

**Scenario**: A document is released with missing, altered, or incorrect content.

| Step | Action |
|------|--------|
| Triage owner | Founder |
| Immediate containment | Contact courier if in transit. Freeze Vault access for affected matter. |
| Client-safe communication | "We identified an issue with your document package and are correcting it as a priority. We will provide an update within [X] hours." |
| Internal correction | Run `validateIdentifierExactMatch()` against source and released values. Identify which Final Seal Review check was not completed. |
| Evidence preserved | Export original PDF, apostille packet, and delivery log before correction. |
| Post-incident fix | Require `FINAL_SEAL_REVIEW_PASSED` event before any future release for this matter type. |
| Prevention rule | No apostille release without all critical checks = `clear` in `FinalSealReviewPanel`. |

---

## Playbook 4 — Identifier Mismatch (Codice Fiscale / Tax ID)

**Scenario**: A foreign identifier (codice fiscale, passport number, tax ID) differs between source client value and final document.

| Step | Action |
|------|--------|
| Triage owner | Founder |
| Immediate containment | Block release immediately. Set `IDENTIFIER_MISMATCH_BLOCKED` event. Do not courier until corrected. |
| Client-safe communication | "A document identifier requires final verification before international release. We are reviewing now and will update you shortly." |
| Internal correction | Compare source_value vs final_value character by character. Correct the final document. Re-lock via `validateIdentifierExactMatch()`. |
| Evidence preserved | Keep original source value, altered value, and correction log in `identifier_locks` table. |
| Post-incident fix | Add codice fiscale lock check to all Italian matter final release checklist. |
| Prevention rule | `requiresCodiceFiscaleLock()` must return true for all Italy destination matters and block release until matched. |

---

## Playbook 5 — Wrong Tracking / Courier Exposure

**Scenario**: A client receives tracking information for another client's shipment, or tracking is shown before confirmation.

| Step | Action |
|------|--------|
| Triage owner | Founder |
| Immediate containment | Remove tracking display from affected portal. Audit `courier_tracking_id` projection. |
| Client-safe communication | "Your tracking information will be available once your shipment is confirmed." |
| Internal correction | Verify `assertClientOwnsMatter()` before any tracking data is served. Confirm `label_url` is in CLIENT_FORBIDDEN_FIELDS. |
| Evidence preserved | Log which matter_id and client_email saw incorrect tracking. |
| Post-incident fix | Add tracking projection test to portal API response. `label_url` must never reach client. |
| Prevention rule | `projectMatterForClient()` must be used on every portal API route without exception. |

---

## Playbook 6 — Service Role Key Exposure

**Scenario**: `SUPABASE_SERVICE_ROLE_KEY` appears in client bundle, logs, or error output.

| Step | Action |
|------|--------|
| Triage owner | Founder |
| Immediate containment | Rotate service role key in Supabase immediately. Redeploy. |
| Client-safe communication | No client communication needed unless data was accessed. |
| Internal correction | Audit all files for `SUPABASE_SERVICE_ROLE_KEY` in client-side code. Confirm it is server-only. Run security scan. |
| Evidence preserved | Document when and where the key appeared before rotation. |
| Post-incident fix | Add `rg "SUPABASE_SERVICE_ROLE_KEY" app components` to CI pre-deploy check. |
| Prevention rule | Service role key must only exist in `/lib/supabase/server.ts` and server-side API routes. |

---

## Playbook 7 — VA Permission Misuse

**Scenario**: A VA-role user performs a founder-only action (e.g., confirms payment, releases documents).

| Step | Action |
|------|--------|
| Triage owner | Founder |
| Immediate containment | Revert the unauthorized action. Suspend VA session. |
| Client-safe communication | No client communication unless the action affected a live matter. |
| Internal correction | Review `assertVAAllowed()` coverage on all affected routes. Add `VA_ACTION_DENIED` event log. |
| Evidence preserved | Export Supabase auth logs for the VA session. |
| Post-incident fix | Add `assertVAAllowed()` check to every action that VA_FORBIDDEN_ACTIONS covers. |
| Prevention rule | Every `/api/admin/*` route must check role from server-side auth before executing any action. |

---

## Playbook 8 — Internal Data Accidentally Exposed on Public Page

**Scenario**: `operator_notes`, `internal_reason`, `margin`, or `raw_webhook` appears on a public or client-facing page.

| Step | Action |
|------|--------|
| Triage owner | Founder |
| Immediate containment | Redeploy with corrected projection. Clear CDN cache if applicable. |
| Client-safe communication | No communication needed unless a specific client saw their own sensitive internal note. |
| Internal correction | Run `assertNoForbiddenClientFields()` against the affected route response. Add field to CLIENT_FORBIDDEN_FIELDS if missing. |
| Evidence preserved | Screenshot the exposed output and the route that produced it before fixing. |
| Post-incident fix | Add `findForbiddenClientFields()` assertion to the affected API route's test suite. |
| Prevention rule | Every client-facing API response must pass `projectMatterForClient()` before returning. |
