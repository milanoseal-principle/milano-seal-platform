# B10 implementation handoff — receiving-authority requirements

Written 2026-11-13. Facts only; verify against GitHub before relying on SHAs.

## Position
- **Base main:** `f3c2859d` (B09 merged as #495).
- **Working branch:** `claude/cool-darwin-8r9v7p`, open as #496. The branch carries two changes: the B09 execution gate and B10. This is the only branch the session may push to, so B10 could not be opened as its own PR while #496 is unmerged.
- **#496 is not authorized to merge.** It needs the owner's explicit request.

## What B10 adds
| File | Purpose |
|---|---|
| `supabase/migrations/20261113090000_receiving_authority_requirements.sql` | Append-only child table of `receiving_authorities`. **Not applied to production.** |
| `lib/receiving-authority/requirements.ts` | Pure evaluator: per-requirement state and whether the final route may be confirmed |
| `lib/receiving-authority/requirementsStore.ts` | Server reads, record and supersede |
| `app/api/dashboard/receiving-authorities/[id]/requirements/route.ts` | Operator API (GET evaluation, POST record / supersede) |
| `app/dashboard/authorities/[id]/requirements/page.tsx` | Operator screen |
| `components/dashboard/authorities/ReceivingRequirementsPanel.tsx` | Findings, current statements, record form |
| `tests/receiving-authority-requirements.test.ts` | 10 test groups, six on logic and four on the replayed schema and store |

Modified:
- `app/dashboard/authorities/verify/page.tsx`: one link per authority card.
- `app/api/dashboard/receiving-authorities/[id]/route.ts`: the suspend action wrote `routing_status = 'SUSPENDED'`, which the table's check constraint rejects, so it always failed. It now writes `INACTIVE` and sets `manual_review_required`.
- `scripts/governed-production-scope.mjs`, `scripts/reconcile-production-migrations.mjs`: the new migration is registered and is a seventh reconciliation target.

## Rules enforced
- Ten requirements per authority: original document, certified copy, notarial act, RON acceptance, witnesses, translation, recency, electronic format, physical delivery, destination formalities.
- A statement is `REQUIRED`, `NOT_REQUIRED` or `CONDITIONAL` only with an https source typed as the receiving authority or official guidance, the verifying operator, and a review date at most 365 days ahead. The database enforces the same by constraint.
- Anything else is `UNKNOWN`: no statement, no source, a past review date, a future verification date, an undescribed condition.
- Two current statements that disagree are a `CONFLICT`. A stale statement is not outvoted by a fresh one.
- A statement for a document category replaces the authority-wide statement for that category.
- Any unknown or conflict gives `REVIEW_REQUIRED` and `finalRouteAllowed: false`. So does an authority record that is not `ACTIVE` or still needs manual review.
- The legacy booleans on `receiving_authorities` (`translation_required`, `ron_accepted`, ...) default to false with no source and are not consulted.
- Statements are never edited or deleted. One is superseded once, with a reason, and a new one recorded.
- Read: any operator role. Write: `founder_admin` and `admin_operator`, the same roles that edit authority records. The verifier and time come from the session, not the request.
- If the table is not deployed the API answers `503 REQUIREMENTS_STORAGE_NOT_DEPLOYED`. It never answers as if there were no statements.

## Not done
- **No Matter is blocked by this yet.** `deals` has no link to a receiving authority; Matters reach authorities only by destination country on the verify screen. Wiring `finalRouteAllowed` into route confirmation needs a decision on how a Matter names its receiving authority.
- **No requirement data is seeded.** Every authority starts fully unknown until an operator records sourced statements. Nothing was researched or invented here.
- **The source type is the operator's attestation.** The code checks for https and a declared type; it cannot tell an official page from a commercial one.
- **No rendered browser check** of the new screen was run (needs an authenticated operator session and a database).

## Production status
- **Seven migrations are now unapplied in production**: the six from 2026-11-12 (`…090000` to `…140000`) per the 07:54 UTC snapshot, plus `20261113090000`. Nothing has been applied by this work.
- The B10 screen will show the "not deployed" message in production until its migration is applied. `20261112110000` must be applied first: the store reads `routing_status` and `manual_review_required`, which that migration adds on the hosted table.
- B02 still needs a fresh snapshot, a verified recovery point and explicit authorization.

## Also on this branch (B06, partial)
- The BlueNotary webhook compared its secret with a plain string comparison. It now uses `verifyBNWebhookAuth`, which compares fixed-length digests with `timingSafeEqual`. Protocol, status codes, replay protection and idempotency are unchanged. Test: `tests/ron-provider-callback-auth.test.ts`.
- Still open in B06: review of the ten unmatched policies, the partner documents / messages / intake-links product contract, and the commission policy (not approved; stays disabled).

## 22-block status
- **Merged:** B01 (#492), B03 (#493), B07 (#491), B08 (#494), B09 (#495).
- **In review (#496):** B09 execution gating; B10; B06 webhook secret comparison.
- **Blocked:** B02.
- **Partly done:** B06.
- **Not started:** B04, B05, B11–B22.

## Resume
```bash
git fetch origin main && git log --oneline -5 origin/main
```

Next in the owner's stated order: remaining B04–B06, then B11–B22, then B02 readiness.
