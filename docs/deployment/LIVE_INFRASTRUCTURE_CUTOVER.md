# Live Infrastructure Cutover — Operator Commands

Run these from an environment that holds the production credentials. **Never
paste secret values into chat or commit them.** Each step lists its verification.

---

## A. Vercel production confirmation
- Confirm the latest **Production** deployment's commit equals current `main`.
- `curl -I https://themilanoseal.com` and `curl -I https://www.themilanoseal.com`
  → expect a valid redirect to the canonical host and a `200`.
- Verify state **Ready**, domains attached, HTTPS/TLS valid, no rollback.
- **Verify:** deployment state Ready + commit match recorded in sign-off §3.

## B. Apply committed Supabase migration 043
- Apply `supabase/migrations/043_complimentary_matter_authorizations.sql` via
  your normal migration path (Supabase CLI `db push` or dashboard SQL runner).
- **Verify:** `complimentary_authorizations` table + indexes + RLS policies exist.
  Record in sign-off §4.

## C. Tiffany dry-run provisioning
```
TIFFANY_OPERATOR_EMAIL=<operator-email> \
TIFFANY_PROVISION_DRY_RUN=true \
node scripts/provision-tiffany.mjs
```
- **Expect:** user found; permissions-to-add count only; revoke = no; "No changes
  applied". No user created, no password changed, no secret/email printed.

## D. Tiffany live provisioning (after dry-run review)
```
TIFFANY_OPERATOR_EMAIL=<operator-email> \
node scripts/provision-tiffany.mjs
```
- Grants only `matter.comp.view`, `matter.comp.authorize`, `matter.comp.audit`.
- Add `TIFFANY_ALLOW_COMP_REVOKE=true` **only if** revoke authority is approved.
- **Verify:** `COMP_PERMISSIONS_PROVISIONED` audit event created; no role/password
  change. Record in sign-off §5.

## E. Wise provider-originated test event
- Confirm Wise env vars + webhook URL are configured (do not print values).
- Trigger a **provider-originated** signed test event (not a self-signed forgery).
- **Verify:** signature verified, event normalized, payment confirmed, scheduling
  unlocked, idempotent on replay, audit evidence. Record in §6.

## F. BlueNotary provider-originated test event
- Confirm credentials + webhook endpoint configured.
- Trigger a provider-originated event (do **not** create a billable session unless
  authorized).
- **Verify:** authentication + signature verification + normalized session state +
  audit, no raw payload leak. Record in §7.

## G. Shippo safe authentication + tracking
- Confirm credentials configured; perform a **rate lookup only** (no label
  purchase) and a tracking-status read.
- **Verify:** authentication, normalized tracking, release-gate enforcement, audit.
  Record in §8.

## H. Controlled paid Matter (staging or production-safe)
- Run one Matter: intake → quote → Wise payment (provider-confirmed) → scheduling
  → execution/safe-sim → QC → apostille readiness → release → courier → delivery.
- **Verify:** verified revenue counted once, no duplicate scheduling/payment, audit
  + Trust Chain complete. Record in §9.

## I. Controlled complimentary Matter
- Run one Matter through complimentary authorization via the canonical endpoint.
- **Verify:** amount due/paid = 0, payment_confirmed = false, Wise IDs null,
  verified revenue = 0, scheduling method = complimentary_authorization, one audit
  event, client sees complimentary (not paid); quote mismatch invalidates; revoke
  relocks scheduling. Record in §10.

## J. Role isolation checks (live)
- With authorized test accounts, confirm: client denied dashboard; VA denied
  protected financial/identity actions; Alliance denied unassigned Matter; operator
  denied comp authorization without permission; disabled/missing/unknown role
  blocked to `/login?error=access_denied`. Record in §11.

## K. Device QA
- Review production across the device/viewport matrix in sign-off §12; confirm no
  overflow/clipping/overlap, safe-area, keyboard, focus, reduced motion, contrast.

---

When every applicable item above is recorded **VERIFIED** in
`FINAL_PRODUCTION_SIGN_OFF.md`, update its Final Status to **PRODUCTION VERIFIED**.
Until then it remains **PRODUCTION CODE VERIFIED — LIVE INFRASTRUCTURE ACTION REQUIRED**.
