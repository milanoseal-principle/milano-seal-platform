// Deterministic lead scoring from weighted signals. Pure — no I/O, no randomness.
// Scores are an internal prioritization aid only; they are not a promise of any
// outcome, acceptance, or approval.

import type {
  ClientVertical,
  DocumentComplexity,
  LeadScore,
  LeadScoringInput,
  LeadSource,
  UrgencyLevel,
} from "./types";

const VERTICAL_WEIGHTS: Record<ClientVertical, number> = {
  attorney: 26,
  immigration_professional: 24,
  university: 20,
  healthcare: 20,
  airport_emergency: 22,
  general: 10,
};

const URGENCY_WEIGHTS: Record<UrgencyLevel, number> = {
  standard: 4,
  priority: 14,
  emergency: 24,
};

const COMPLEXITY_WEIGHTS: Record<DocumentComplexity, number> = {
  simple: 6,
  moderate: 14,
  complex: 22,
};

const SOURCE_WEIGHTS: Record<LeadSource, number> = {
  referral: 20,
  attorney_network: 20,
  immigration_professional: 18,
  university_partner: 16,
  healthcare_partner: 16,
  airport_emergency: 18,
  organic_search: 10,
  direct: 8,
  paid: 6,
  unknown: 2,
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/**
 * Deterministic lead score. Same input always yields the same output.
 */
export function scoreLead(input: LeadScoringInput): LeadScore {
  const reasons: string[] = [];

  const verticalPts = VERTICAL_WEIGHTS[input.vertical] ?? 0;
  reasons.push(`Vertical (${input.vertical.replace(/_/g, " ")}): +${verticalPts}`);

  const urgencyPts = URGENCY_WEIGHTS[input.urgency] ?? 0;
  reasons.push(`Urgency (${input.urgency}): +${urgencyPts}`);

  const complexityPts = COMPLEXITY_WEIGHTS[input.documentComplexity] ?? 0;
  reasons.push(`Document complexity (${input.documentComplexity}): +${complexityPts}`);

  const sourcePts = SOURCE_WEIGHTS[input.source] ?? 0;
  reasons.push(`Source (${input.source.replace(/_/g, " ")}): +${sourcePts}`);

  let referralPts = 0;
  if (input.hasReferralCode) {
    referralPts = 8;
    reasons.push(`Referral code present: +${referralPts}`);
  }

  let destinationPts = 0;
  if (input.destinationCountry && input.destinationCountry.trim().length > 0) {
    destinationPts = 4;
    reasons.push(`Destination country provided: +${destinationPts}`);
  }

  const raw =
    verticalPts +
    urgencyPts +
    complexityPts +
    sourcePts +
    referralPts +
    destinationPts;

  const score = clamp(Math.round(raw), 0, 100);

  const band: LeadScore["band"] = score >= 65 ? "hot" : score >= 40 ? "warm" : "cold";

  return { score, band, reasons };
}
