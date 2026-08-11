# Bid / No-Bid Scoring SOP

A deterministic, repeatable way to decide whether to pursue a public-sector
solicitation. Implemented in `lib/government/bidNoBidScoring.ts` and surfaced in
the dashboard's Bid/No-Bid panel.

## Inputs
- **fit** (0–100): strategic fit of the opportunity.
- **capabilityMatch** (0–100): how well our capabilities cover the scope.
- **relationshipScore** (0–100): CRM relationship strength with the agency.
- **deadlineFeasibilityDays**: days until the deadline.
- **incumbentPresent** (bool): is there an entrenched incumbent vendor.

## Weights
| Factor           | Weight |
|------------------|--------|
| fit              | 0.30   |
| capabilityMatch  | 0.30   |
| relationship     | 0.20   |
| deadline         | 0.15   |
| incumbent        | 0.05   |

Deadline is scored by band (≥21d = 100, ≥14d = 80, ≥7d = 60, ≥3d = 35, else 15).
Incumbent present scores 30; absent scores 100.

## Thresholds
- **score ≥ 65 → bid**
- **45 ≤ score < 65 → review** (needs human judgment)
- **score < 45 → no_bid**

## Procedure
1. Pull the solicitation into the CRM and populate the five inputs honestly.
2. Run the scoring panel.
3. If **review**, escalate for a manual decision; document the rationale.
4. Record the decision and reasons against the CRM record.

## Guardrails
A "bid" recommendation is an internal prioritization signal only. It is not a
prediction of award and never a guarantee of a contract, procurement outcome, or
acceptance. Final acceptance remains subject to the receiving authority.
