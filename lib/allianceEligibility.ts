export type OnboardingStatus =
  | "not_started"
  | "profile_started"
  | "credentials_pending"
  | "credentials_submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "paused";

export type AccountState = "SAFE" | "CAUTION" | "COOL_DOWN" | "LOCKED";

export type JobStatus =
  | "queued"
  | "offered"
  | "accepted"
  | "declined"
  | "reassigned"
  | "in_progress"
  | "completed"
  | "rejected"
  | "unassigned"
  | "escalated";

export interface PartnerProfile {
  id: string;
  firm_name: string;
  onboarding_status: OnboardingStatus;
  account_state: AccountState;
  credentials_verified: boolean;
  toolbelt_completion_percent: number;
  compliance_ready: boolean;
  availability: "active" | "limited" | "offline";
}

export interface EligibilityResult {
  eligible: boolean;
  blockers: string[];
}

export function evaluateRoutingEligibility(
  partner: Pick<
    PartnerProfile,
    | "credentials_verified"
    | "toolbelt_completion_percent"
    | "compliance_ready"
    | "account_state"
    | "availability"
  >,
): EligibilityResult {
  const blockers: string[] = [];

  if (!partner.credentials_verified)
    blockers.push("Credentials not yet verified");
  if (partner.toolbelt_completion_percent < 80)
    blockers.push(
      `Tool Belt at ${partner.toolbelt_completion_percent}% — 80% required`,
    );
  if (!partner.compliance_ready) blockers.push("Compliance review incomplete");
  if (partner.account_state !== "SAFE")
    blockers.push(`Account state: ${partner.account_state}`);
  if (!["active", "limited"].includes(partner.availability))
    blockers.push(`Availability set to ${partner.availability}`);

  return { eligible: blockers.length === 0, blockers };
}
