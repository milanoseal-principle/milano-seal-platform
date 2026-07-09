// Deterministic bid / no-bid scoring from weighted factors. No randomness.

export interface BidNoBidInput {
  fit: number; // 0-100 — strategic fit of the opportunity
  capabilityMatch: number; // 0-100 — how well our capabilities cover the scope
  relationshipScore: number; // 0-100 — CRM relationship strength
  deadlineFeasibilityDays: number; // days until deadline
  incumbentPresent: boolean; // is there an entrenched incumbent vendor
}

export interface BidNoBidResult {
  score: number; // 0-100
  recommendation: "bid" | "no_bid" | "review";
  reasons: string[];
}

const WEIGHTS = {
  fit: 0.3,
  capabilityMatch: 0.3,
  relationship: 0.2,
  deadline: 0.15,
  incumbent: 0.05,
};

function clamp(n: number, lo = 0, hi = 100): number {
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}

function deadlineScore(days: number): number {
  if (!Number.isFinite(days) || days <= 0) return 0;
  if (days >= 21) return 100;
  if (days >= 14) return 80;
  if (days >= 7) return 60;
  if (days >= 3) return 35;
  return 15;
}

export function scoreBidNoBid(input: BidNoBidInput): BidNoBidResult {
  const fit = clamp(input.fit);
  const capabilityMatch = clamp(input.capabilityMatch);
  const relationship = clamp(input.relationshipScore);
  const deadline = deadlineScore(input.deadlineFeasibilityDays);
  const incumbent = input.incumbentPresent ? 30 : 100;

  const raw =
    fit * WEIGHTS.fit +
    capabilityMatch * WEIGHTS.capabilityMatch +
    relationship * WEIGHTS.relationship +
    deadline * WEIGHTS.deadline +
    incumbent * WEIGHTS.incumbent;

  const score = Math.round(clamp(raw));

  const reasons: string[] = [];
  if (fit >= 60) reasons.push("Strong strategic fit.");
  else reasons.push("Weak strategic fit.");
  if (capabilityMatch >= 60) reasons.push("Capabilities cover the scope.");
  else reasons.push("Capability gaps against the scope.");
  if (relationship >= 60) reasons.push("Established agency relationship.");
  else reasons.push("Limited or no prior relationship.");
  if (deadline >= 60) reasons.push("Deadline is feasible.");
  else reasons.push("Deadline is tight — response feasibility at risk.");
  if (input.incumbentPresent) reasons.push("Incumbent vendor present — displacement risk.");

  let recommendation: BidNoBidResult["recommendation"];
  if (score >= 65) recommendation = "bid";
  else if (score >= 45) recommendation = "review";
  else recommendation = "no_bid";

  return { score, recommendation, reasons };
}
