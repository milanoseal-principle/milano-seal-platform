# Bid / No-Bid SOP

Use the existing `lib/government/bidNoBidScoring.ts` engine — do not create a second scorer.

- Score service fit, capability, relationship, deadline feasibility, and readiness (insurance, references, registration).
- Output one of: bid, bid_with_conditions, monitor, no_bid, founder_review.
- A recommendation is **never** an award prediction.
- Record blocking requirements and missing documents; route each to an operator action.
