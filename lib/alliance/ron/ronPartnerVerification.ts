import type { RonPartnerAssessment, RonPartnerRecord } from "./types";

function isFutureDate(value: string | null) {
  if (!value) return false;
  const time = new Date(value).getTime();
  return Number.isFinite(time) && time > Date.now();
}

export function assessRonPartner(partner: RonPartnerRecord): RonPartnerAssessment {
  const blockers: string[] = [];
  const strengths: string[] = [];

  const commissionCurrent = isFutureDate(partner.commissionExpiration);
  if (!partner.commissionNumber) blockers.push("Commission number missing");
  if (!commissionCurrent) blockers.push("Commission expiration missing, invalid, or expired");
  if (!partner.eoProvider) blockers.push("E&O provider not recorded");

  if (partner.mobileAvailable) strengths.push("Mobile / wet-ink fallback available");
  if (partner.languages.length > 1) strengths.push("Multilingual capability recorded");
  if (partner.apostilleExperience) strengths.push("Apostille experience recorded");
  if (partner.internationalDocumentExperience) strengths.push("International-document experience recorded");
  if (partner.shippingDropoffAccess) strengths.push("Shipping / scan-back support recorded");

  if (blockers.length > 0) {
    return { level: "LISTED", readiness: "BLOCKED", blockers, strengths };
  }

  if (!partner.ronAuthorized) {
    return {
      level: "VERIFIED_NOTARY",
      readiness: partner.mobileAvailable ? "REVIEW_REQUIRED" : "BLOCKED",
      blockers: ["RON authorization/registration not verified"],
      strengths,
    };
  }

  if (partner.ronPlatforms.length === 0) {
    return {
      level: "VERIFIED_NOTARY",
      readiness: "REVIEW_REQUIRED",
      blockers: ["RON platform not recorded"],
      strengths,
    };
  }

  const backgroundCleared = /clear|complete|approved/i.test(partner.backgroundCheckStatus ?? "");
  if (!backgroundCleared) {
    return {
      level: "RON_READY",
      readiness: "REVIEW_REQUIRED",
      blockers: ["Background-check evidence requires operator review"],
      strengths,
    };
  }

  const approved = /approved|active/i.test(partner.status);
  if (!approved) {
    return {
      level: "RON_READY",
      readiness: "REVIEW_REQUIRED",
      blockers: ["Operator approval / SOP readiness not complete"],
      strengths,
    };
  }

  const priority = partner.mobileAvailable && partner.internationalDocumentExperience;
  return {
    level: priority ? "PRIORITY_DISPATCH_PARTNER" : "EXECUTION_PARTNER",
    readiness: priority ? "READY_PRIORITY" : "READY_STANDARD",
    blockers: [],
    strengths,
  };
}
