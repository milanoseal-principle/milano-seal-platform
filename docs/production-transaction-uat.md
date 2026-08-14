# Milano Seal Production Transaction Acceptance

## Test control

This harness records one real-world end-to-end Matter test. It does not replace the canonical Matter record, payment reconciliation, Authentication Event Log, or Operational Ledger.

Complete every field. Use `BLOCKED` when the next step cannot safely continue. Do not mark a step `PASS` without the evidence named in that step.

| Field | Value |
| --- | --- |
| Tester | Tiff |
| Test start (UTC) | |
| Test end (UTC) | |
| Production URL | `https://themilanoseal.com` |
| Matter ID | |
| Device | |
| Operating system | |
| Browser and version | |
| Viewport or screen size | |
| Network type | |
| Test email inbox | |
| Test destination country | |
| Test document type | |
| Final result | `PASS / FAIL / BLOCKED` |

## Evidence rules

- Record timestamps in UTC.
- Store screenshots in the approved internal evidence location and paste only the evidence reference here. Do not place identity documents, payment credentials, private client information, access tokens, or secret values in this file.
- Record the visible error message exactly. Do not copy provider secrets, request headers, cookies, or raw private payloads.
- For state-changing steps, compare the UI with the authoritative Supabase Matter state. Record only the relevant field names and safe values.
- For notifications, confirm actual inbox receipt. A UI success message is not delivery evidence.
- For payment, Wise reconciliation is authoritative. Do not manually mark a Matter paid.
- Stop immediately if the test could affect a non-test Matter, consume an unintended promotion, expose private records, or release a real document.

## Transaction checklist

Use one result per step: `PASS`, `FAIL`, or `BLOCKED`.

| # | Step attempted | Expected result | Actual result | Result | Evidence reference | UTC timestamp | Error message | Supabase/UI match | Notification received |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Open production in a fresh private or incognito mobile session. | The public site opens without cached authentication, broken layout, or blocking errors. | | | | | | `N/A` | `N/A` |
| 2 | Navigate normally to Secure Records Intake without using a direct developer URL. | Navigation is understandable and reaches the canonical intake flow without a dead link. | | | | | | `N/A` | `N/A` |
| 3 | Submit a realistic international Matter. | Required facts can be entered, review-required facts remain explicit, and submission produces one Matter. | | | | | | | |
| 4 | Upload approved test documents. | Each test document uploads once, remains associated with the correct Matter, and appears as a Controlled Record. | | | | | | | `N/A` |
| 5 | Confirm intake persistence. | The Matter ID is visible; refreshed UI values match the authoritative Supabase Matter record; no duplicate Matter exists. | | | | | | | `N/A` |
| 6 | Review quote and pricing. | The displayed quote matches the canonical pricing result and unresolved scope does not receive fabricated pricing. | | | | | | | `N/A` |
| 7 | Exercise only the approved promo or discount behavior for this test. | Eligibility, amount, limits, and adjusted totals are correct; no unauthorized redemption or mutation occurs. | | | | | | | `N/A` |
| 8 | Complete the Wise payment path. | The payment instructions and amount are correct, and payment remains owned by Wise reconciliation. | | | | | | | |
| 9 | Verify payment reconciliation. | The authoritative payment event updates the correct Matter exactly once; UI payment state matches Supabase. | | | | | | | |
| 10 | Verify Payment-Gated Execution. | Scheduling is blocked before verified payment or active Complimentary Authorization and becomes available only after the canonical gate is satisfied. | | | | | | | `N/A` |
| 11 | Enter the Matter Control Portal using the client path. | Authentication resolves the correct client and Matter without exposing another Matter or an administrative surface. | | | | | | | |
| 12 | Verify emails and notifications. | Each expected message actually arrives once with the correct safe Matter context and working link. | | | | | | `N/A` | |
| 13 | Verify portal records and status. | Execution Chain Visibility, Controlled Records, invoice/payment information, and Matter status agree with authoritative state. | | | | | | | `N/A` |
| 14 | Run the governed operator chain through execution, apostille, International Courier Release, delivery, and close. | Each predecessor gate is enforced, each transition occurs once, and the Authentication Event Log and chain-of-custody evidence remain consistent. | | | | | | | |
| 15 | Repeat critical client actions on mobile and inspect recovery paths. | No clipped content, overflow, dead button, dead link, hidden action, ambiguous next step, or fabricated success state is observed. | | | | | | `N/A` | `N/A` |

## Gate evidence

Complete this section after the checklist. These are acceptance gates, not feature requests.

| Gate | Before state | Action | Expected after state | Actual after state | Result | Evidence reference |
| --- | --- | --- | --- | --- | --- | --- |
| Intake idempotency | No test Matter | Submit once; refresh; do not resubmit | Exactly one Matter | | | |
| Payment authority | Unpaid | Complete Wise path | Payment changes only after reconciliation | | | |
| Scheduling lock | Unpaid or unresolved | Attempt scheduling | Controlled rejection; no scheduled state | | | |
| Scheduling release | Payment verified and execution truth resolved | Schedule through governed action | Scheduled once with `scheduled_at` | | | |
| Execution predecessor | Not scheduled | Attempt execution | Controlled rejection; no execution state | | | |
| Execution transition | Scheduled and gates satisfied | Begin execution | In execution once with `executed_at` | | | |
| Portal isolation | Authenticated test client | Open Matter Control Portal | Only the authorized Matter is visible | | | |
| Notification delivery | Expected event created | Wait for configured delivery window | One expected message received | | | |
| Release control | Execution chain incomplete | Attempt release | Controlled rejection; no release state | | | |
| Completion | Delivery/release evidence complete | Close Matter | Completed once with consistent ledger events | | | |

## Defect record

Create one record per verified failure or material UX obstruction. Do not combine unrelated failures.

| Field | Value |
| --- | --- |
| Defect ID | |
| Related checklist step | |
| Severity | `P0 / P1 / P2 / P3` |
| Reproducible | `YES / NO / INTERMITTENT` |
| Preconditions | |
| Exact actions | |
| Expected result | |
| Actual result | |
| Visible error message | |
| Matter ID | |
| UTC timestamp | |
| Device/browser | |
| Evidence reference | |
| Relevant Supabase fields and safe values | |
| Notification delivery evidence | |
| Safe recovery attempted | |
| Transaction impact | |
| Recommended disposition | `PATCH / COPY FIX / OPERATIONS FIX / PROVIDER INVESTIGATION / NO DEFECT` |

## Acceptance decision

Select exactly one.

- [ ] `PASS` - All 15 steps passed, authoritative state matched the UI, notifications arrived, and the Matter completed without an unauthorized bypass or duplicate mutation.
- [ ] `FAIL` - At least one verified product defect or material UX obstruction requires a targeted patch.
- [ ] `BLOCKED` - The test could not safely continue because required access, provider availability, test data, or authoritative evidence was unavailable.

### Open defects or blockers

| Defect ID | Step | Severity | Owner | Next action | Retest required |
| --- | ---: | --- | --- | --- | --- |
| | | | | | |

### Sign-off

| Role | Name | Decision | UTC timestamp |
| --- | --- | --- | --- |
| Tester | Tiff | | |
| Operator reviewer | | | |
| Release owner | | | |
