/**
 * ALLIANCE-03 — Operator Routing Eligibility Gate
 * Hard gate: all conditions must pass before any dispatch assignment.
 * Mirrors evaluate_operator_eligibility() SQL function.
 */

import { createAdminClient } from "@/lib/supabase/admin";

export interface OperatorEligibilityInput {
  operator_id: string;
  onboarding_status: string;
  identity_verified: boolean;
  admin_approved: boolean;
  state: string | null;
  compliance_ready: boolean;
  toolbelt_completion_pct: number;
  availability: string;
}

export interface EligibilityGateResult {
  eligible: boolean;
  blockers: string[];
  toolbelt_score: number;
}

const ROUTING_ELIGIBLE_AVAILABILITY = new Set([
  "AVAILABLE",
  "AFTER_HOURS",
  "RUSH_ONLY",
]);

export function evaluateEligibilityGate(
  input: OperatorEligibilityInput,
): EligibilityGateResult {
  const blockers: string[] = [];

  if (input.onboarding_status !== "approved") {
    blockers.push("Onboarding not complete");
  }
  if (!input.identity_verified) {
    blockers.push("Identity not verified");
  }
  if (!input.compliance_ready) {
    blockers.push("Compliance review incomplete");
  }
  if (input.toolbelt_completion_pct < 80) {
    blockers.push(`Tool Belt at ${input.toolbelt_completion_pct}% — 80% required`);
  }
  if (!input.state || input.state.trim() === "") {
    blockers.push("Territory / state not defined");
  }
  if (!input.admin_approved) {
    blockers.push("Admin approval pending");
  }
  if (!ROUTING_ELIGIBLE_AVAILABILITY.has(input.availability)) {
    blockers.push(`Availability state: ${input.availability}`);
  }

  return {
    eligible: blockers.length === 0,
    blockers,
    toolbelt_score: input.toolbelt_completion_pct,
  };
}

/**
 * Evaluate and persist eligibility for an operator via DB.
 * Calls the SQL function evaluate_operator_eligibility().
 */
export async function persistEligibilityCheck(
  operatorId: string,
): Promise<EligibilityGateResult> {
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("evaluate_operator_eligibility", {
    p_operator_id: operatorId,
  });

  if (error) {
    throw new Error(`Eligibility evaluation failed: ${error.message}`);
  }

  const { data: row } = await admin
    .from("operator_routing_eligibility")
    .select("eligible, toolbelt_score, blockers")
    .eq("operator_id", operatorId)
    .single();

  return {
    eligible: row?.eligible ?? false,
    blockers: row?.blockers ?? [],
    toolbelt_score: row?.toolbelt_score ?? 0,
  };
}

/**
 * Lightweight in-process gate check used by dispatch routes before assignment.
 * Returns false immediately if any gate condition fails.
 */
export async function canOperatorReceiveAssignment(
  operatorId: string,
): Promise<EligibilityGateResult> {
  const admin = createAdminClient();

  const { data: eligibility } = await admin
    .from("operator_routing_eligibility")
    .select("eligible, toolbelt_score, blockers, last_evaluated_at")
    .eq("operator_id", operatorId)
    .single();

  if (!eligibility) {
    return {
      eligible: false,
      blockers: ["Eligibility not yet evaluated — admin must run gate check"],
      toolbelt_score: 0,
    };
  }

  // Re-evaluate if stale (> 30 minutes)
  const ageMs = Date.now() - new Date(eligibility.last_evaluated_at).getTime();
  if (ageMs > 30 * 60 * 1000) {
    return persistEligibilityCheck(operatorId);
  }

  return {
    eligible: eligibility.eligible,
    blockers: eligibility.blockers ?? [],
    toolbelt_score: eligibility.toolbelt_score ?? 0,
  };
}
