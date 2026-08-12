# PR #212 — Canonical Audit & Remediation

**Status: AUDIT COMPLETE — NO-GO for PR #212 as merged. Canonical main restored.**
**Auditor mandate:** Operator Governance Doctrine — "PR #212 must be audited against this doctrine; current main is authoritative; nothing canonical may be removed; broad branch volume is not evidence that the branch should win."

---

## 0. Headline finding

PR #212 (`codex/build-government-intelligence-platform-1z3fip`) was **merged** into the
`#204→#211` lineage as squash commit `c39f5e2`. That merge is a **corrupt
"keep-both-sides" conflict resolution**: `+1291 insertions / 0 deletions` across 12
files, in which the branch content was pasted **on top of** the existing canonical
content in every file, deleting nothing. The result **does not compile**.

Proof:

```
$ npx tsc --noEmit        # on main + #212 (c39f5e2)
app/api/dashboard/discounts/route.ts(176,1): error TS1005: '}' expected.
app/api/intake/route.ts(1225,1):            error TS1005: '}' expected.
lib/pricing/matterQuoteSnapshot.ts(64,1):   error TS1128: Declaration or statement expected.
lib/pricing/matterQuoteSnapshot.ts(129,5):  error TS1005: ')' expected.
src/features/discounts/discountService.ts(360,15): error TS1109: Expression expected.
...
exit=2
```

Because the tree does not compile, **every quality gate the doctrine requires
(typecheck, lint, tests, build, validators) is failing on the merged result.** The
PR body's claim that `npm run typecheck`, `npx eslint .`, `npm test`, and
`npm run build` "completed successfully" is not reproducible against the merged code.

A second red flag: the **PR description does not match the diff.** The body advertises
dozens of new public pages, multiple command centers, webhook processors, and auth-gate
rewrites. The **actual merged footprint is 12 files** of duplicated code. Per doctrine
§36, historical PR metadata never overrides the current production truth — and here the
metadata materially overstates what landed.

---

## 1. Per-file classification (KEEP / REWORK / DROP)

Every hunk in #212 is a duplicate of pre-existing canonical content (net-zero or
regressive), so all 12 files classify **DROP**. Detail:

| File | Corruption introduced | Class |
|---|---|---|
| `app/api/dashboard/discounts/route.ts` | Doubled `if (discount_value…)` guard (unbalanced braces) + duplicate object keys `internal_reason`/`client_label`/`matter_id`/`client_id` (`?? null` vs `.trim()`). | DROP |
| `app/api/intake/route.ts` | ~1090 lines of Design-A logic **inlined**, bypassing the canonical `core.ts`, then the base 125-line wrapper concatenated on top (duplicate imports at L33 & L1103; duplicate `buildMatterQuoteSnapshot`/`persistedMatterHasQuote` call sites). | DROP |
| `lib/pricing/matterQuoteSnapshot.ts` | Interface, `buildMatterQuoteSnapshot`, and `persistedMatterHasQuote` each doubled with an **incompatible** design (snake-case + payment fields vs canonical camelCase `MatterQuoteSnapshotInput` + `currency`). Stray top-level property declarations. | DROP |
| `src/features/discounts/discountService.ts` | Unclosed `if (…) { throw` block; duplicate `writeEventLedger` calls; a second, differently-signed `redeemDiscountAfterWiseReconciliation` body concatenated onto the canonical one. | DROP |
| `components/dispatch/AllianceDispatchCommandCenter.tsx` | `export function AllianceDispatchCommandCenter` declared **twice** (duplicate identifier); the #212 copy replaces actionable `<Link>` routing with **static dead cards** — a §22 dispatch-hardening regression. | DROP |
| `components/dashboard/OperatorShell.tsx` | Adds a **second** nav item labelled "Payments" (`/dashboard/discounts`) beside the existing `/dashboard/payments` — duplicate label, §21/§25 nav defect. | DROP |
| `scripts/validate-damiani-production-wiring.mjs` | `const intake` **declared twice** (hard `SyntaxError`). Note: the *intent* of the added line (aggregate `route.ts` + `core.ts`) is correct per §28 and is already present in canonical base as the surviving declaration. | DROP |
| `tests/unit/dashboardExecutionTruthContract.test.ts` | Duplicate `const intake`/`intakeRoute` + doubled assertions. | DROP |
| `tests/unit/dashboardIntakePersistenceContract.test.ts` | Doubled assertion blocks referencing both `intakeRoute` and `intake`. | DROP |
| `tests/unit/intakeReviewRequiredCapture.test.ts` | Duplicate `const intake`/`intakeRoute`. | DROP |
| `tests/unit/paymentAuthorityRegression.test.ts` | Duplicate `reviewPayload` slice referencing both variables. | DROP |
| `tests/unit/matterQuoteSnapshot.test.ts` (added) | Encodes the **Design-A** snapshot API, which conflicts with the pre-existing canonical regression `tests/live-quote-matter-carryover.test.ts` (Design B, part of protected #206 quote→Matter integrity). Cannot coexist. | DROP |

**No hunk qualified as KEEP or REWORK.** There is no cleanly-separable additive
increment in the merge; the additive value the branch may have intended must be
re-introduced later as a fresh narrow increment from clean main (doctrine §37), not
salvaged from this corruption.

---

## 2. Subsystem audit matrix (§45)

"as-merged" = state of `c39f5e2`. FAIL means the merged code violates the invariant
(non-compiling counts as FAIL for every touched subsystem).

| Subsystem | Verdict | Exact file · invariant |
|---|---|---|
| PAYMENTS | **FAIL** | `discountService.ts` — Wise redemption path corrupted (unclosed block, duplicate `redeemDiscountAfterWiseReconciliation`). Wise-only architecture itself untouched. |
| PRICING | **FAIL** | `matterQuoteSnapshot.ts` — duplicated, incompatible snapshot engine; `lib/pricing.ts` untouched (canonical values intact). |
| DISCOUNTS | **FAIL** | `discounts/route.ts` + `discountService.ts` corrupted; eligibility/fail-closed logic itself unchanged in canonical base. |
| COMPLIMENTARY | **PASS** | No complimentary files touched; app_metadata authority preserved. |
| MATTER SCHEMA | **PASS** | No migration touched. |
| STATE MACHINE | **PASS** | No state-machine migration touched. |
| EXECUTION TRUTH | **FAIL** | `intake/route.ts` inlined, bypassing canonical `core.ts`; execution-truth persistence duplicated. |
| PORTAL | **PASS** | Untouched; client-safe projection intact. |
| OPERATOR UX | **FAIL** | `OperatorShell.tsx` duplicate "Payments" nav (§21/§25). |
| DISPATCH | **FAIL** | `AllianceDispatchCommandCenter.tsx` regressed to static dead cards + duplicate identifier (§22). |
| ALLIANCE | **PASS** | Alliance dashboards untouched. |
| GOVERNMENT INTELLIGENCE | **PASS (N/A)** | Despite the PR title, no government-intelligence files were in the diff. |
| MOTION / ACCESSIBILITY | **PASS (N/A)** | Motion system untouched. |
| SECURITY | **PASS** | No secrets, no `user_metadata` fallback, no Stripe restoration in the diff. |
| VALIDATORS | **FAIL** | `validate-damiani-production-wiring.mjs` broken (`const intake` redeclared). Separately, `validate-production-governance.mjs` had a latent §28 false-failure (reads only `route.ts` while intake logic lives in `core.ts`). |
| TEST RUNNER | **FAIL** | 5 unit tests corrupted; 1 added test conflicts with canonical Design B. |

**Release decision (§46): NO-GO for PR #212 as merged.**

---

## 3. Remediation applied on this branch

Doctrine resolution: current main is authoritative, nothing canonical is removed, and a
corrupt broad branch does not win. The 12 corrupted files are restored to their last
green canonical state (`bc8b1d1`, tip of #211); the conflicting added test is removed.
One validator is corrected per the Validator Doctrine (§28) — not weakened.

1. **Revert `c39f5e2`** — restores all 12 files to canonical `bc8b1d1`. The resulting
   tree is byte-identical to pre-#212 main (`git diff bc8b1d1` is empty), which
   re-establishes: the `route.ts`→`core.ts` intake split, canonical Design-B
   `matterQuoteSnapshot`, the intact discount service and dispatch/nav surfaces, and the
   green pre-existing test suite. The added `tests/unit/matterQuoteSnapshot.test.ts`
   (Design A) is removed with the revert.

2. **`scripts/validate-production-governance.mjs` — §28 source aggregation fix.**
   The validator read only `app/api/intake/route.ts`; all six asserted intake invariants
   (`estimated_value: effectiveTotal`, `original_total: pricing.total`,
   `const invoice = generateInvoice(effectiveTotal)`, `redemption_status: "not_redeemed"`,
   `deal_status: "awaiting_payment"`, `status: "intake_received"`, …) live in
   `app/api/intake/core.ts`. The read is now aggregated over `route.ts` + `core.ts`
   (the same pattern the damiani validator already uses), proving the **same** invariants
   against the real canonical implementation. This is aggregation, not assertion-weakening.

### Verification after remediation

```
npx tsc --noEmit                                     → exit 0
node --import tsx --test (5 previously-corrupt tests) → 27 pass / 0 fail
scripts/validate-production-governance.mjs           → 27/27 PASS
scripts/validate-damiani-production-wiring.mjs       → PASS
scripts/validate-live-quote-matter-carryover.mjs     → PASS
```

### Known pre-existing (NOT caused by this remediation)

`validate-canonical-foundation` and `validate-smart-intake-pricing-engine` fail
**identically on pristine `c39f5e2` and on the remediated tree**. They compute a
protected-file delta via `git diff --name-only origin/main HEAD`, and in this checkout
`origin/main` = `7a7e71b` (**PR #153**) — the #204–#212 lineage is not a descendant of
it. The delta therefore lists every protected file accumulated across #204–#211
(migrations 045–050, `lib/wise/*`, the retired stripe/wise webhook tombstones). This is
an environment/branch-baseline artifact, not a code defect, and is left untouched — the
doctrine forbids weakening validators to make them pass.
