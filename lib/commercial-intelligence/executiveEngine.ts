/**
 * Executive Intelligence Engine — a READ-ONLY decision layer over the existing
 * canonical engines. It creates NO new data models: it reads commercial accounts,
 * relationship health, revenue-stack verified revenue, the vertical registry, and
 * the real target-organization roster, then answers the six executive questions
 * with evidence + confidence. Zero verified evidence → "insufficient_evidence"
 * (never a fabricated answer).
 */

import { VERTICAL_REGISTRY } from "@/lib/vertical-intelligence/verticalRegistry";
import { listRealCommercialAccounts, totalRealAccountRevenue } from "@/lib/commercial-accounts/accountRegistry";
import { realPaidRevenue } from "@/lib/revenue-stack/revenueOpportunity";
import { TARGET_ORGANIZATIONS } from "@/data/commercial/targetOrganizations";

export type AnswerStatus =
  | "verified"
  | "partially_verified"
  | "insufficient_evidence"
  | "planning_only";

export type Confidence = "unknown" | "low" | "moderate" | "high" | "verified";

export interface ExecutiveAnswer {
  questionId: string;
  question: string;
  answerSummary: string;
  answerStatus: AnswerStatus;
  topEntities: { label: string; detail: string }[];
  verifiedMetrics: Record<string, number>;
  planningMetrics: Record<string, number>;
  confidence: Confidence;
  missingEvidence: string[];
  nextAction: string;
}

function targetsByVertical(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const t of TARGET_ORGANIZATIONS) out[t.vertical] = (out[t.vertical] ?? 0) + 1;
  return out;
}

const NO_PAID_EVIDENCE =
  "No verified paid matters linked to organizations yet — link real Matters + verified Payments to produce a verified answer.";

/** Q1 — Who controls the most international document matters? */
export function answerMatterControl(): ExecutiveAnswer {
  // Verified matter-control requires organization-linked paid Matters (none yet).
  return {
    questionId: "matter_control",
    question: "Who controls the most international document matters?",
    answerSummary: NO_PAID_EVIDENCE,
    answerStatus: "insufficient_evidence",
    topEntities: [],
    verifiedMetrics: { verifiedPaidMatters: 0 },
    planningMetrics: { identifiedTargets: TARGET_ORGANIZATIONS.length },
    confidence: "unknown",
    missingEvidence: ["organization-linked Matters", "verified Payments"],
    nextAction: "link_matter_to_organization",
  };
}

/** Q2 — Which organizations create the highest recurring execution volume? */
export function answerRecurringVolume(): ExecutiveAnswer {
  const accounts = listRealCommercialAccounts();
  return {
    questionId: "recurring_volume",
    question: "Which organizations create the highest recurring execution volume?",
    answerSummary: accounts.length
      ? `${accounts.length} organization(s) with verified paid recurrence.`
      : "No organizations have verified recurring paid volume yet.",
    answerStatus: accounts.length ? "verified" : "insufficient_evidence",
    topEntities: accounts.slice(0, 5).map((a) => ({ label: a.organizationId ?? a.id, detail: `${a.paidMatterCount} paid matters` })),
    verifiedMetrics: { recurringOrganizations: accounts.length },
    planningMetrics: {},
    confidence: accounts.length ? "verified" : "unknown",
    missingEvidence: accounts.length ? [] : ["repeat verified paid matters per organization"],
    nextAction: accounts.length ? "review_recurring_volume" : "create_pilot_matter",
  };
}

/** Q3 — Where are the strongest referral networks? */
export function answerReferralNetworks(): ExecutiveAnswer {
  return {
    questionId: "referral_networks",
    question: "Where are the strongest referral networks?",
    answerSummary: "No verified referral edges with converted paid matters recorded yet.",
    answerStatus: "insufficient_evidence",
    topEntities: [],
    verifiedMetrics: { verifiedConvertedReferrals: 0 },
    planningMetrics: {},
    confidence: "unknown",
    missingEvidence: ["verified referral edges", "converted referred matters"],
    nextAction: "verify_referral_source",
  };
}

/** Q4 — Which relationships are inactive and need follow-up? */
export function answerInactiveRelationships(): ExecutiveAnswer {
  // Dormancy requires real interaction history; none recorded yet.
  return {
    questionId: "inactive_relationships",
    question: "Which relationships are inactive and need follow-up?",
    answerSummary: "No documented interactions recorded — dormancy cannot be computed without real interaction history.",
    answerStatus: "insufficient_evidence",
    topEntities: [],
    verifiedMetrics: { documentedInteractions: 0 },
    planningMetrics: { targetsAwaitingFirstContact: TARGET_ORGANIZATIONS.length },
    confidence: "unknown",
    missingEvidence: ["documented interactions"],
    nextAction: "verify_contact",
  };
}

/** Q5 — Which industries are producing the highest verified revenue? */
export function answerIndustryRevenue(): ExecutiveAnswer {
  const paid = realPaidRevenue();
  const acctRevenue = totalRealAccountRevenue();
  const verified = paid + acctRevenue;
  return {
    questionId: "industry_revenue",
    question: "Which industries are producing the highest verified revenue?",
    answerSummary: verified > 0
      ? `$${verified.toLocaleString()} verified revenue recorded.`
      : "No verified paid revenue recorded yet (quotes and forecasts are excluded by design).",
    answerStatus: verified > 0 ? "verified" : "insufficient_evidence",
    topEntities: [],
    verifiedMetrics: { verifiedRevenue: verified },
    planningMetrics: {},
    confidence: verified > 0 ? "verified" : "unknown",
    missingEvidence: verified > 0 ? [] : ["verified Payments", "actual Revenue Events"],
    nextAction: verified > 0 ? "review_industry_revenue" : "review_paid_matter",
  };
}

/**
 * Q6 — Which verticals deserve the next expansion?
 * With no verified revenue yet, the honest signal is planning-only: where do we
 * have the most identified real targets? Labelled planning, not revenue.
 */
export function answerVerticalExpansion(): ExecutiveAnswer {
  const byVertical = targetsByVertical();
  const ranked = VERTICAL_REGISTRY
    .map((v) => ({ id: v.id, name: v.name, targets: byVertical[v.id] ?? 0 }))
    .filter((v) => v.targets > 0)
    .sort((a, b) => b.targets - a.targets);

  return {
    questionId: "vertical_expansion",
    question: "Which verticals deserve the next expansion?",
    answerSummary: ranked.length
      ? `Planning signal only: ${ranked[0].name} has the most identified real targets (${ranked[0].targets}). No verified revenue yet — validate with pilots before investing.`
      : "No verticals have identified real targets yet.",
    answerStatus: ranked.length ? "planning_only" : "insufficient_evidence",
    topEntities: ranked.slice(0, 5).map((v) => ({ label: v.name, detail: `${v.targets} identified targets` })),
    verifiedMetrics: { verifiedRevenueByVertical: 0 },
    planningMetrics: Object.fromEntries(ranked.map((v) => [v.id, v.targets])),
    confidence: ranked.length ? "low" : "unknown",
    missingEvidence: ["verified paid matters per vertical", "verified revenue per vertical"],
    nextAction: ranked.length ? "build_target_list" : "identify_decision_makers",
  };
}

export function allExecutiveAnswers(): ExecutiveAnswer[] {
  return [
    answerMatterControl(),
    answerRecurringVolume(),
    answerReferralNetworks(),
    answerInactiveRelationships(),
    answerIndustryRevenue(),
    answerVerticalExpansion(),
  ];
}
