# B09 implementation handoff — institutional evidence ledger and operator review

Written 2026-11-13. Facts only; verify against GitHub before relying on SHAs.

## Position
- **Base main:** `b93dddd3` (B08 merged as #494).
- **Working branch:** `claude/cool-darwin-8r9v7p`.
- **PR:** #495, https://github.com/milanoseal-principle/milano-seal-platform/pull/495. Its head commit on GitHub is the final pushed SHA; the description carries the test counts.
- **B08 dependency:** merged. B09 uses `lib/institutional/institutionalDocument.ts` unchanged.

## What B09 adds
| File | Purpose |
|---|---|
| `lib/institutional/evidenceLedger.ts` | Records and derives institutional review state |
| `app/api/dashboard/matters/[id]/institutional/route.ts` | Operator API (GET state, POST review / evidence / approve / reject) |
| `app/dashboard/matters/[matterId]/institutional/page.tsx` | Operator screen |
| `components/dashboard/institutional/InstitutionalReviewPanel.tsx` | Review form, evidence checklist, approval, history |
| `tests/institutional-evidence-ledger.test.ts` | 10 test groups on the replayed schema |

Modified: `app/dashboard/matters/[matterId]/page.tsx` (one link card).

## Storage model
- **No migration and no new table.** Records are events in the existing `public.matter_evidence_ledger` with `domain = 'authority'` and `source = 'institutional-evidence-ledger'`.
- **Event types:** `INSTITUTIONAL_REVIEW_RECORDED`, `INSTITUTIONAL_EVIDENCE_RECORDED`, `INSTITUTIONAL_ROUTE_APPROVED`, `INSTITUTIONAL_ROUTE_REJECTED`.
- **Immutability:** the ledger's existing no-update / no-delete triggers. A correction is a new evidence version that supersedes the old one.
- **Attachments:** existing `document_versions` rows of the same Matter; their `file_hash` (SHA-256) is copied into the event. No storage links are created.
- **State is derived**, never stored: events are replayed through the B08 evaluator on every read.

## Rules enforced
- Approval is refused unless the evaluator would return `VERIFIED_ROUTE` with that approval.
- Evidence recorded after an approval, an expired item, or a new review version voids the approval.
- A rejection blocks the pathway until a new review version is recorded.
- Verified evidence needs a source reference and a real, non-future verification date.
- Recording evidence: any operator role. Approve / reject: `canPerformProtectedMatterTransition` roles only.
- The actor is always the session user.

## Database dependencies
- None new. Requires `matter_evidence_ledger`, `document_versions` and `deals`, all present in the 2026-11-12 07:54 UTC production snapshot.

## Not done
- **Two-person approval is not enforced.** The same person may record evidence and approve it if their role allows both. Enforcing separation needs a founder decision.
- **Intake does not set the institutional origin.** An operator opens the review from the Matter page.
- **The route decision is not yet fed into Matter execution gating.** `deriveInternationalExecutionPath` accepts `institutionalRouteDecision`, but nothing in the live Matter flow calls it with this state.
- **No file upload on the screen.** Evidence files are attached by selecting an existing document version of the Matter.
- **No rendered browser check** of the new screen was run (needs an authenticated operator session and a database).

## Production status (unchanged by B09)
- **Migrations:** six 2026-11-12 migrations are unapplied or partially applied per the 07:54 UTC snapshot (`…090000` to `…140000`). Nothing has been applied by this work. B02 needs a fresh snapshot, a verified recovery point and explicit authorization.
- **Backup / restore verification:** not run.

## 22-block status
- **Merged:** B01 (#492), B03 (#493), B07 (#491), B08 (#494).
- **In review:** B09.
- **Blocked:** B02.
- **Not started:** B04, B05, B06, B10–B22.

## Resume
First command for a fresh session:

```bash
git fetch origin main && git log --oneline -5 origin/main
```

Next block after B09 merges: B10 (receiving-authority requirements), which can reuse this ledger pattern.
