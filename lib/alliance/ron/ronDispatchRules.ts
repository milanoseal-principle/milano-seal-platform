import { getRonStateEntry } from "./ronStateRegistry";
import { assessRonPartner } from "./ronPartnerVerification";
import type { RonPartnerRecord } from "./types";

export interface RonDispatchDecision {
  eligible: boolean;
  status: "READY" | "REVIEW_REQUIRED" | "BLOCKED";
  reasons: string[];
}

export function evaluateRonDispatch(input: {
  partner: RonPartnerRecord;
  signerState: string | null;
  receivingAuthorityRonAccepted: boolean | null;
  wetInkRequired: boolean;
}): RonDispatchDecision {
  const reasons: string[] = [];
  const assessment = assessRonPartner(input.partner);
  const state = getRonStateEntry(input.signerState);

  if (!state || state.coverageStatus !== "VERIFIED_AVAILABLE") {
    reasons.push("Current signer-state RON authority is not verified for dispatch");
  }

  if (input.receivingAuthorityRonAccepted !== true) {
    reasons.push("Receiving-authority RON acceptance is not affirmatively verified");
  }

  if (input.wetInkRequired) {
    reasons.push("Matter requires wet-ink execution");
  }

  if (!input.partner.ronAuthorized) {
    reasons.push("Partner RON authorization/registration is not verified");
  }

  if (assessment.readiness === "BLOCKED") {
    reasons.push(...assessment.blockers);
  }

  if (reasons.length > 0) {
    return {
      eligible: false,
      status: assessment.readiness === "BLOCKED" ? "BLOCKED" : "REVIEW_REQUIRED",
      reasons: Array.from(new Set(reasons)),
    };
  }

  return { eligible: true, status: "READY", reasons: [] };
}
