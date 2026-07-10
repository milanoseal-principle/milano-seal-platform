// Partner passport model + helpers.
// The passport is the partner-facing summary of their own standing. It never
// exposes internal notes, margins, or unrelated matters.

import type {
  PartnerApplication,
  PartnerPassport,
  PartnerVerification,
  TrustScore,
} from "./types";
import { clearedChecks } from "./partnerVerification";

// Build a partner-facing passport from vetted internal records.
export function buildPassport(
  app: PartnerApplication,
  verification: PartnerVerification,
  trust: TrustScore,
  completedAssignments: number,
  regions: string[],
  issuedAt: string | null,
): PartnerPassport {
  return {
    partnerId: app.id,
    displayName: app.displayName,
    status: app.status,
    capabilities: app.capabilities,
    regions,
    verifiedChecks: clearedChecks(verification),
    trustBand: trust.band,
    completedAssignments,
    issuedAt,
  };
}

// A passport is only "issued" once the partner is active and dated.
export function isPassportIssued(p: PartnerPassport): boolean {
  return p.status === "active" && p.issuedAt !== null;
}
