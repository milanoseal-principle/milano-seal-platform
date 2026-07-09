import type { TrustNetworkPartnerProfile } from "./trustNetworkRegistry";

export interface PartnerPassportSummary {
  partnerId: string;
  identity: boolean;
  commission: boolean;
  ron: boolean;
  insurance: boolean;
  coverage: string[];
  languages: string[];
  specialties: string[];
  governmentReady: boolean;
  healthcareReady: boolean;
  internationalReady: boolean;
  trustScore: number;
  dispatchReady: boolean;
  nextAction: string;
}

export function buildPartnerPassport(profile: TrustNetworkPartnerProfile): PartnerPassportSummary {
  const signals = new Set(profile.readinessSignals);
  const dispatchReady = signals.has("identity") && signals.has("commission") && signals.has("insurance") && signals.has("availability") && profile.trustScore >= 75;

  return {
    partnerId: profile.id,
    identity: signals.has("identity"),
    commission: signals.has("commission"),
    ron: signals.has("ron"),
    insurance: signals.has("insurance"),
    coverage: profile.coverageStates,
    languages: profile.languages,
    specialties: profile.specialties,
    governmentReady: signals.has("government"),
    healthcareReady: signals.has("healthcare"),
    internationalReady: signals.has("international"),
    trustScore: profile.trustScore,
    dispatchReady,
    nextAction: profile.nextAction,
  };
}
