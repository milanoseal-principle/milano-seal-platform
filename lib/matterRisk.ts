export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "EXECUTIVE";

export interface MatterRiskFactors {
  country_id: string;
  authority_confidence: string | null;
  translation_required: boolean;
  payment_status: string | null;
  matter_status: string | null;
  days_since_update: number;
  missing_items_count: number;
  is_high_value: boolean; // amount > 1500
}

export interface MatterRiskResult {
  level: RiskLevel;
  score: number; // 0–100
  factors: string[];
  operator_note: string;
}

export function computeMatterRisk(factors: MatterRiskFactors): MatterRiskResult {
  let score = 0;
  const riskFactors: string[] = [];

  if (
    factors.authority_confidence === "UNVERIFIED" ||
    factors.authority_confidence === "VERIFICATION_REQUIRED"
  ) {
    score += 30;
    riskFactors.push("Authority not verified — destination authority confidence is unconfirmed");
  }

  if (
    factors.authority_confidence === "AUTHORITY_VERIFIED" ||
    factors.authority_confidence === "MULTI_SOURCE_CONFIRMED"
  ) {
    score -= 20;
  }

  if (factors.payment_status === "pending" || factors.payment_status == null) {
    score += 20;
    riskFactors.push("Payment not confirmed — matter cannot proceed until cleared");
  }

  const BEYOND_SCHEDULED = [
    "in_execution", "apostille", "apostille_processing",
    "courier_ready", "shipped", "delivered", "completed",
  ];
  if (
    factors.translation_required &&
    BEYOND_SCHEDULED.includes(factors.matter_status ?? "")
  ) {
    score += 15;
    riskFactors.push("Translation required but matter is past scheduled stage — verify translation status");
  }

  if (factors.days_since_update > 7) {
    score += 20;
    riskFactors.push(`Matter stale for ${factors.days_since_update} days — no update in over a week`);
  } else if (factors.days_since_update > 3) {
    score += 10;
    riskFactors.push(`Matter has not been updated in ${factors.days_since_update} days`);
  }

  if (factors.missing_items_count > 0) {
    score += 15;
    riskFactors.push(`${factors.missing_items_count} missing item(s) on record — checklist incomplete`);
  }

  if (factors.is_high_value) {
    score += 10;
    riskFactors.push("High-value matter — enhanced scrutiny applies");
  }

  score = Math.max(0, Math.min(100, score));

  let level: RiskLevel;
  if (score >= 71) level = "EXECUTIVE";
  else if (score >= 46) level = "HIGH";
  else if (score >= 21) level = "MODERATE";
  else level = "LOW";

  const notes: Record<RiskLevel, string> = {
    LOW: "No immediate concerns. Monitor per standard cadence.",
    MODERATE: "Operator review recommended before next stage transition.",
    HIGH: "Flag for operator attention. Do not advance without review.",
    EXECUTIVE: "Escalate immediately. Matter requires executive oversight.",
  };

  return {
    level,
    score,
    factors: riskFactors,
    operator_note: notes[level],
  };
}
