# P3 lifecycle reconciliation

Source standard: `P3-P23-directive.txt`, the locked deployment runbook, existing `lib/stateMachine.ts`, and migration 089's verified Wise settlement gate. This is a forward repair of the P3 blocker, not a claim of P12 certification.

## Confirmed drift

Read-only hosted inspection on 2026-11-07 found no `matter_state_events`, `is_valid_matter_transition(text,text)`, or canonical transition trigger. Existing Wise payment triggers are present and include `payment_confirmed`. Both existing Matter status values are canonical; no Matter rows need rewriting.

Migration 046 cannot be replayed: its transition predicate skips the newer payment-confirmed stage, and its BEFORE INSERT audit insert references the Matter before its row exists.

## Forward repair

`20261107234218_p3_canonical_lifecycle_reconciliation.sql` installs the existing canonical ledger model and transition predicate matching current TypeScript. The AFTER INSERT/UPDATE trigger validates final status after Wise BEFORE triggers and writes the audit record atomically. Failure rolls back the Matter write. Unchanged metadata does not create a transition. RLS and explicit grants deny client reads/writes; service role can read, while trigger ownership writes evidence. Update/delete of transition evidence is denied.

The existing payment triggers, private quote composer, service-role-only P3 RPCs, Matter rows and historical migration files remain intact. Existing historical transitions are not reconstructed or represented as observed.

## Verification

The P3 PostgreSQL fixture now applies the actual forward repair and actual migration 089 rather than a substitute audit trigger. It tests lead conversion/retry, operator authorization, execution review, stale writes, ordered quote progression, all 196 SQL/TypeScript transition pairs, null state rejection, settlement-triggered stage recording, underpayment/scheduling denial, skipped-state denial, append-only evidence, client grants, metadata no-op, and rollback on state/evidence ledger failure.

Local fixture: PASS. Migration contract: PASS across 97 files. Existing 20 P3 unit/source tests: PASS. Authoritative PR CI must pass before release. Hosted schema verification and advisor classification follow migration application.

## Remaining live gate

The shared browser redirects `/dashboard` to operator sign-in. No authenticated operator/client workflow has been observed. No existing user's password/session was read or changed; no fake production transaction, Wise payment, notarial execution, provider notification, government submission or courier action was performed.

P3 remains `P3 DEPLOYED — CONTROLLED LIVE VERIFICATION REMAINS` until hosted transaction evidence is obtained. P4–P23 retain their sequential gates. Green fixture/CI results do not constitute production certification.
