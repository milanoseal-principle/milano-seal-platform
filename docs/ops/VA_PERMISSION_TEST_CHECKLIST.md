# VA Portal Permission Test Checklist

**The Milano Seal™ — Operator-Facing Document**
**Version:** 1.0
**Scope:** Manual permission verification for the VA role. All items must be tested with a real VA-role user session before launch.

Do not use an admin session to test VA permissions. Log in with a real account that has only the VA role assigned. Test each item directly and record the result.

---

## Section 1 — WHAT VA CAN DO

Confirm the following actions work correctly for a VA-role user.

- [ ] VA can log in with VA-role credentials via the standard login flow
- [ ] VA sees `/va/dashboard` with their assigned tasks visible
- [ ] VA can mark a task complete
- [ ] VA can escalate a task with a reason attached
- [ ] VA can view their assigned matter summaries (limited fields — no sensitive financial or document data)
- [ ] VA can view checklist tasks on assigned matters
- [ ] VA can draft a message (status = `draft`; message is not sent until operator approval)
- [ ] VA can view courier prep tasks (shipping costs are not visible in this view)
- [ ] VA can view RON reminder tasks (signing URLs are not visible in this view)

---

## Section 2 — WHAT VA CANNOT DO

Confirm the following are blocked for a VA-role user. Each item should return a redirect or 403 where noted.

- [ ] VA cannot access `/dashboard` — should redirect to login or return 403
- [ ] VA cannot access `/portal` — should redirect or return 403
- [ ] VA API routes return 403 when called with an admin-role token (reverse role check)
- [ ] VA cannot see `label_url` in any API response — verify in browser Network tab
- [ ] VA cannot see `actual_shippo_cost` in any API response
- [ ] VA cannot see `wise_payload` in any API response
- [ ] VA cannot see `full_signing_url` or `bn_signing_url` in any response
- [ ] VA cannot see `internal_notes` or `operator_notes` in any response
- [ ] VA cannot see matters not assigned to them — verify `/api/va/matters` returns only their assigned matters
- [ ] VA cannot `PATCH` a message draft status to `sent` or `approved`
- [ ] VA cannot see `source_vault` or `storage_path` fields in any response
- [ ] VA cannot call `/api/dashboard/*` routes — should return 403
- [ ] VA cannot call `/api/portal/*` routes for any client data — should return 403

---

## Section 3 — RELEASE GATE CONFIRMATION

The following release actions must be confirmed as blocked for VA-role users. These are the most critical permission checks. Verify each in both the UI and via direct API call.

- [ ] VA cannot trigger document release — release button must not be present or must return 403
- [ ] VA cannot mark a matter as `paid_and_released`
- [ ] VA cannot approve apostille readiness
- [ ] VA cannot approve compliance route

---

*All items in this checklist must be marked complete and signed off by the operator before the VA role is granted to any active user. Re-run this checklist after any change to role-based access control policies.*
