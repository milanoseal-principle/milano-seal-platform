// Deterministic trust score for independent partners.
// The trust score informs which partners are OFFERED work first. It never
// guarantees assignments or income.

import type { TrustBand } from "./types";

export interface TrustScoreInput {
  verifiedCheckCount: number; // 0-5 cleared verification checks
  completedAssignments: number;
  onTimeRate: number; // 0-1
  qaAverage: number; // 0-100
  cancellations: number;
  monthsActive: number;
}

export function bandForScore(score: number): TrustBand {
  if (score >= 85) return "elite";
  if (score >= 65) return "trusted";
  if (score >= 40) return "provisional";
  return "unrated";
}

// Deterministic — same input always yields the same score/band/reasons.
export function computeTrustScore(input: TrustScoreInput): {
  score: number;
  band: string;
  reasons: string[];
} {
  const reasons: string[] = [];
  let score = 0;

  const verification = Math.min(input.verifiedCheckCount, 5) * 6; // up to 30
  score += verification;
  reasons.push(`Verification: +${verification} (${Math.min(input.verifiedCheckCount, 5)}/5 checks)`);

  const experience = Math.min(input.completedAssignments, 20) * 1; // up to 20
  score += experience;
  reasons.push(`Completed assignments: +${experience}`);

  const onTime = Math.round(Math.max(0, Math.min(1, input.onTimeRate)) * 20); // up to 20
  score += onTime;
  reasons.push(`On-time rate: +${onTime}`);

  const qa = Math.round(Math.max(0, Math.min(100, input.qaAverage)) / 100 * 20); // up to 20
  score += qa;
  reasons.push(`QA average: +${qa}`);

  const tenure = Math.min(input.monthsActive, 10) * 1; // up to 10
  score += tenure;
  reasons.push(`Tenure: +${tenure}`);

  const penalty = Math.min(input.cancellations, 10) * 4; // up to -40
  score -= penalty;
  if (penalty > 0) reasons.push(`Cancellations: -${penalty}`);

  score = Math.max(0, Math.min(100, Math.round(score)));
  const band = bandForScore(score);
  reasons.push(`Band: ${band}`);

  return { score, band, reasons };
}
