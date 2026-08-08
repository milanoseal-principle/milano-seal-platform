import type { DispatchStage } from "./types";
import {
  evaluateToolbeltQualification,
  type AllianceToolbeltQualificationInput,
} from "./toolbeltQualification";

export const ALLIANCE_DISPATCH_STAGES: DispatchStage[] = [
  { order: 1, label: "Smart Intake", owner: "system", output: "Matter facts captured." },
  { order: 2, label: "Matter Classification", owner: "system", output: "Matter categorized by document type, urgency, and lane." },
  { order: 3, label: "Jurisdiction Analysis", owner: "system", output: "Origin, signer location, and destination reviewed." },
  { order: 4, label: "Three-Tier Pricing Engine", owner: "system", output: "Signature, Priority, or Executive lane recommendation." },
  { order: 5, label: "Capability Match", owner: "system", output: "Required skills and service category matched." },
  { order: 6, label: "Partner Match", owner: "operator", output: "Eligible partner shortlist created." },
  { order: 7, label: "Availability Check", owner: "operator", output: "Partner timing and capacity verified." },
  { order: 8, label: "Dispatch Recommendation", owner: "operator", output: "Assignment recommendation prepared." },
  { order: 9, label: "Executive Approval", owner: "executive", output: "Optional approval for high-value or sensitive matters." },
  { order: 10, label: "Matter Assigned", owner: "operator", output: "Matter routed with QA requirements and reporting expectations." }
];

export const DISPATCH_SAFETY_RULES = [
  "Routing eligibility does not guarantee assignments.",
  "Tool Belt qualification is a partner-readiness gate only and never changes Matter, pricing, payment, or execution truth.",
  "Assignment depends on capability, availability, score, jurisdiction, Tool Belt readiness, compliance, and matter fit.",
  "Executive approval may be required for high-value, international, healthcare, government, or urgent matters.",
  "Every routed matter remains subject to applicable law and receiving-authority requirements."
] as const;

export interface AllianceDispatchEligibilityInput {
  toolbelt: AllianceToolbeltQualificationInput;
  capabilityMatch: boolean;
  availabilityConfirmed: boolean;
  jurisdictionMatch: boolean;
}

export interface AllianceDispatchEligibility {
  eligibleForRoutingConsideration: boolean;
  blockers: string[];
  toolbeltCompletionPercent: number;
}

/**
 * Canonical dispatch prefilter. This returns routing consideration only; it does
 * not assign a matter and does not guarantee work to an Alliance member.
 */
export function evaluateAllianceDispatchEligibility(
  input: AllianceDispatchEligibilityInput,
): AllianceDispatchEligibility {
  const toolbelt = evaluateToolbeltQualification(input.toolbelt);
  const blockers = [...toolbelt.blockers];

  if (!input.capabilityMatch) blockers.push("Required capability is not confirmed.");
  if (!input.availabilityConfirmed) blockers.push("Partner availability is not confirmed.");
  if (!input.jurisdictionMatch) blockers.push("Partner jurisdiction is not eligible for this matter.");

  return {
    eligibleForRoutingConsideration: blockers.length === 0,
    blockers,
    toolbeltCompletionPercent: toolbelt.completionPercent,
  };
}
