import type { AIOperatorPlan } from "./types";

const DEFAULT_SUGGESTIONS = ["Prioritize stalled matters", "Follow up on unpaid quotes", "Review urgent apostille packets", "Confirm courier delivery", "Draft client updates", "Prepare authority content", "Review alliance readiness"] as const;
export function buildAIOperatorPlan(input: Partial<AIOperatorPlan> = {}): AIOperatorPlan { return { id: input.id ?? "ai-operator-plan-draft", planningWindow: input.planningWindow ?? "This week", priorities: input.priorities ?? [], blockers: input.blockers ?? [], suggestedActions: input.suggestedActions ?? getAIOperatorSuggestions(input), followUps: input.followUps ?? [], sourceStatus: input.sourceStatus ?? "not_connected", operatorReviewRequired: true }; }
export function getAIOperatorSuggestions(_input: Partial<AIOperatorPlan> = {}) { return DEFAULT_SUGGESTIONS; }
export function requireOperatorReview(plan: AIOperatorPlan) { return plan.operatorReviewRequired || true; }
export function getAIPlannerEmptyState() { return "AI planner is staged for operator-reviewed suggestions only. It never auto-sends, auto-schedules, auto-pays, or auto-releases."; }
