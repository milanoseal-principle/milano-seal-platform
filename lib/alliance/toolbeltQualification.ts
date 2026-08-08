export type ToolbeltSignupStatus = "not_started" | "in_progress" | "complete" | "not_required";

export interface AllianceToolbeltItem {
  toolName: string;
  required: boolean;
  signupStatus: ToolbeltSignupStatus;
  complianceGate?: boolean;
}

export interface AllianceToolbeltQualificationInput {
  tools: AllianceToolbeltItem[];
  complianceReady: boolean;
  accountState?: "SAFE" | "CAUTION" | "COOL_DOWN" | "LOCKED";
}

export interface AllianceToolbeltQualification {
  completionPercent: number;
  activeToolsCount: number;
  requiredToolsComplete: boolean;
  complianceReady: boolean;
  accountState: "SAFE" | "CAUTION" | "COOL_DOWN" | "LOCKED";
  stackLevel: "Foundation" | "Developing" | "Qualified" | "Complete";
  eligibleForDeals: boolean;
  blockers: string[];
}

const isComplete = (status: ToolbeltSignupStatus) => status === "complete" || status === "not_required";

/**
 * Tool Belt is a partner-qualification layer only. It does not modify Matter,
 * pricing, payment, or execution logic. 80%+ completion plus compliance-ready
 * and all required tools complete makes a partner eligible for routing
 * consideration; it never guarantees an assignment.
 */
export function evaluateToolbeltQualification(
  input: AllianceToolbeltQualificationInput,
): AllianceToolbeltQualification {
  const tools = input.tools ?? [];
  const completed = tools.filter((tool) => isComplete(tool.signupStatus)).length;
  const completionPercent = tools.length === 0 ? 0 : Math.round((completed / tools.length) * 100);
  const activeToolsCount = tools.filter((tool) => tool.signupStatus === "complete").length;
  const requiredToolsComplete = tools.filter((tool) => tool.required).every((tool) => isComplete(tool.signupStatus));
  const accountState = input.accountState ?? "SAFE";

  const blockers: string[] = [];
  if (completionPercent < 80) blockers.push("Tool Belt completion is below 80%.");
  if (!requiredToolsComplete) blockers.push("One or more required Tool Belt items are incomplete.");
  if (!input.complianceReady) blockers.push("Alliance compliance readiness is not confirmed.");
  if (accountState !== "SAFE") blockers.push(`Account state ${accountState} is not eligible for routed matters.`);

  const stackLevel: AllianceToolbeltQualification["stackLevel"] =
    completionPercent >= 100
      ? "Complete"
      : completionPercent >= 80
        ? "Qualified"
        : completionPercent >= 50
          ? "Developing"
          : "Foundation";

  return {
    completionPercent,
    activeToolsCount,
    requiredToolsComplete,
    complianceReady: input.complianceReady,
    accountState,
    stackLevel,
    eligibleForDeals: blockers.length === 0,
    blockers,
  };
}
