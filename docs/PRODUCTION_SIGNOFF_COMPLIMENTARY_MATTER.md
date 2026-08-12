# Final Production Sign-Off — Complimentary (Comp) Matter Flow

Scope: the authorized 100%-off ("Tiffany") complimentary Matter workflow, its
scheduling gate, and its operator permission provisioning. Everything below is
verifiable from this repository or the operator's own Supabase + Vercel infra.
Nothing in this checklist runs, mutates, or touches production — it is a gate
the operator executes deliberately.

Status legend: `[x]` verified in-repo (CI/build/tests) · `[ ]` operator action
on live infra (cannot be performed from the build sandbox).

---

## 1. Code correctness (verified in-repo)

- [x] Comp flow present on `main`: authorization, policy, safety, server,
      disposition, scheduling gate, revenue reporting, notifications, and API
      routes under `app/api/matters/[matterId]/complimentary/*` (#131).
- [x] `main` builds clean (`npm run build`) after the #132 hotfix.
- [x] Schedule action routes through the canonical server-side gate
      `evaluateSchedulingGate` — payment OR complimentary authorization — not
      `payment_status` alone (#133). Returns `402 PAYMENT_REQUIRED` when neither
      holds; never sets `payment_confirmed`; emits one audit event.
- [x] Provisioning script (`scripts/provision-tiffany.mjs`) grants ONLY
      `matter.comp.view`, `matter.comp.authorize`, `matter.comp.audit`
      (+ `matter.comp.revoke` only when `TIFFANY_ALLOW_COMP_REVOKE=true`).
      No discount code, no `founder_admin`, no password reset, no user creation,
      no secrets/email printed. Idempotent, audited, dry-run capable.
- [x] Full test suite green (`npm test`) — includes comp-flow, schedule-wiring,
      and provisioning contract/behavior tests.
- [x] `npm run validate:complimentary-matter-flow` passes.
- [x] `npm run lint` clean; `npm run typecheck` clean for all comp/schedule/
      provisioning files (only pre-existing, build-ignored `lib/dashboard-modules.ts`
      duplicate-key errors remain, unrelated to this flow).

## 2. Deploy (operator action — live infra)

- [ ] Confirm Vercel production deploy of current `main` is green.
- [ ] Apply migration `043_complimentary_matter_authorizations.sql` to the
      production Supabase database (creates `complimentary_authorizations` +
      `deals` comp columns the flow writes).
- [ ] Confirm required env is set in the production environment:
      `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

## 3. Provision the operator (operator action — live infra)

Run the fixed script where production env vars exist. Do NOT hardcode or print
the email / password / user ID / service-role key anywhere.

- [ ] Ensure the operator's Supabase Auth user already exists (create/invite via
      the approved auth flow first — the script will safe-stop if it does not).
- [ ] Set `TIFFANY_OPERATOR_EMAIL` in the server env only.
- [ ] Dry run: `TIFFANY_PROVISION_DRY_RUN=true node scripts/provision-tiffany.mjs`
      — confirm output shows: user found = yes; required present = yes/no;
      permissions-to-add count; revoke requested = no; "No changes applied".
- [ ] Live run: `node scripts/provision-tiffany.mjs` — confirm: permissions
      assigned; audit event created; no password changed; no discount code
      created; no role escalation.
- [ ] (Optional) Only if revocation authority is intended for this operator:
      re-run with `TIFFANY_ALLOW_COMP_REVOKE=true`.
- [ ] Idempotency check: re-run once more — confirm a clean no-op.

## 4. One controlled live verification (operator action — live infra)

- [ ] Create one real Matter, then authorize it as complimentary via the
      operator UI/endpoint (`AUTHORIZE COMPLIMENTARY MATTER` confirmation).
- [ ] Confirm on the deal record: `payment_disposition = "complimentary"`,
      `amount_due = 0`, `verified_revenue = 0`, no `wise_payment_id` /
      `wise_transfer_id` set, `comp_authorized = true`.
- [ ] Confirm the Matter can be moved to `scheduled` (gate passes on
      complimentary authorization, not payment).
- [ ] Confirm the immutable audit trail contains
      `COMPLIMENTARY_AUTHORIZATION_APPROVED` and the schedule audit event.
- [ ] Confirm revenue reporting counts this Matter at $0 verified revenue and
      does NOT emit a Wise/payment-confirmation event.

## 5. Guardrails re-confirmed (must remain true)

- [ ] Wise, payment confirmation, scheduling internals, release, custody, and
      revenue logic were not modified by the provisioning fix.
- [ ] Comp ≠ paid: a complimentary Matter never produces verified revenue and
      never a payment/settlement event.
- [ ] Operator holds only the scoped `matter.comp.*` permissions — no
      `founder_admin`, no discount-code capability.

---

Sign-off: this flow is production-ready in code. Sections 2–4 are the operator's
live cut-over steps; complete them in order and check each box against the real
system before declaring the complimentary Matter flow live.
