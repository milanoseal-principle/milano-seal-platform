# B09 implementation handoff — institutional evidence ledger and operator review

Written 2026-11-13. Facts only; verify against GitHub before relying on SHAs.

## Position
- **Base main:** `f3c2859d` (B09 merged as #495).
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
| `tests/institutional-evidence-ledger.test.ts` | 15 test groups on the replayed schema |
| `lib/institutional/executionGate.ts` | Blocks scheduling, execution start and authority-packet steps while the route is unverified (added after #495) |

Modified: `app/dashboard/matters/[matterId]/page.tsx` (one link card).

## Storage model
- **No new evidence table.** Forward migration `20261113120000_institutional_transition_integrity.sql` adds a service-only integrity proof and transaction-time guards; it has not been applied by this review. Records are events in the existing `public.matter_evidence_ledger` with `domain = 'authority'` and `source = 'institutional-evidence-ledger'`.
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
- The transition integrity migration is now required before deploying this candidate. Historical snapshots do not establish its hosted presence. Fresh hosted reconciliation remains required.

## Not done
- **Two-person approval is not enforced.** The same person may record evidence and approve it if their role allows both. Enforcing separation needs a founder decision.
- **Intake does not set the institutional origin.** An operator opens the review from the Matter page.
- **Execution gating is wired** (#496): once a Matter has an institutional review, scheduling, execution start (including the BlueNotary automatic advance, `runStep`, the pipeline engine and the admin status route) and authority-packet assemble / QA / dispatch are refused unless the route is currently `VERIFIED_ROUTE`. The shared RON QA guard now checks the institutional route before either RON session route advances to `apostille_processing`. The legacy step endpoint delegates execution start to the canonical handler and refuses later steps that lack evidence workflows.
- **No file upload on the screen.** Evidence files are attached by selecting an existing document version of the Matter.
- **No rendered browser check** of the new screen was run (needs an authenticated operator session and a database).

## Production status (unchanged by B09)
- **Migrations:** Current hosted application status is UNVERIFIED. The historical snapshot cannot classify the six 2026-11-12 effects today. Nothing has been applied by this review. The founder authorized reviewed in-scope application only after fresh reconciliation and verified backup/isolated recovery; these prerequisites remain unmet.
- **Backup / restore verification:** not run.

## 22-block status
- **Merged:** B01 (#492), B03 (#493), B07 (#491), B08 (#494), B09 (#495).
- **In review:** B09 execution gating (follow-up PR).
- **Blocked:** B02.
- **Not started:** B04, B05, B06, B10–B22.

## Resume
First command for a fresh session:

```bash
git fetch origin main && git log --oneline -5 origin/main
```

B10 is implemented; see `B10_IMPLEMENTATION_HANDOFF.md` for the current position and block status.

## Controlled review follow-up (2026-11-13)
Ledger reads use complete keyset pagination through an empty page. Review/evidence versions, rather than occurrence timestamps, determine current evidence. Any rejection of a review blocks it. Approval requires the exact same-Matter hashed document version. The database guard serializes institutional evidence writes with Matter transitions, checks exact covered evidence IDs and current approver authority, and refuses stale approvals at mutation time. The B08 evaluator remains the route authority; this SQL proof does not independently reproduce treaty policy. No production migration or deployment was performed.
