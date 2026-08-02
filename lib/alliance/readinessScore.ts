import type { AllianceScoreCategory } from "./types";

export const ALLIANCE_SCORE_CATEGORIES: AllianceScoreCategory[] = [
  { id: "identity", label: "Identity Verification", weight: 10, description: "Verified identity and authorized contact data." },
  { id: "licensing", label: "Licensing Status", weight: 10, description: "Notary, RON, or role-specific license review when applicable." },
  { id: "ron", label: "RON Status", weight: 8, description: "Remote Online Notarization readiness and platform capability." },
  { id: "insurance", label: "Insurance", weight: 8, description: "Insurance status captured when applicable to the role." },
  { id: "response", label: "Response Time", weight: 10, description: "Speed and consistency of communication and assignment response." },
  { id: "communication", label: "Communication", weight: 10, description: "Clear, professional, documented updates." },
  { id: "qa", label: "QA Accuracy", weight: 14, description: "Execution checklist completion and preventable error reduction." },
  { id: "feedback", label: "Client Feedback", weight: 8, description: "Quality signals from clients, agencies, or internal operators." },
  { id: "completion", label: "Matter Completion", weight: 10, description: "Successful closeout, release, and documentation completion." },
  { id: "international", label: "International Experience", weight: 4, description: "Cross-border, apostille, embassy, or courier experience." },
  { id: "healthcare", label: "Healthcare Experience", weight: 4, description: "Facility, directive, hospice, skilled nursing, or sensitive environment readiness." },
  { id: "government", label: "Government Readiness", weight: 4, description: "Procurement, vendor registration, capability statement, and public-sector readiness." }
];

export function calculateAllianceReadinessScore(scores: Record<string, number>): number {
  const weighted = ALLIANCE_SCORE_CATEGORIES.reduce((sum, category) => {
    const raw = Math.max(0, Math.min(100, scores[category.id] ?? 0));
    return sum + raw * category.weight;
  }, 0);
  const totalWeight = ALLIANCE_SCORE_CATEGORIES.reduce((sum, category) => sum + category.weight, 0);
  return Math.round(weighted / totalWeight);
}

export function allianceStanding(score: number): string {
  if (score >= 90) return "Excellent Standing";
  if (score >= 80) return "Strong Standing";
  if (score >= 70) return "Developing Standing";
  return "Readiness Review Required";
}
