export type AllianceMaturityStage = "Professional License" | "Verified Alliance" | "Strategic Alliance" | "Enterprise Alliance";
export type AllianceReadinessSignal = "identity" | "commission" | "ron" | "insurance" | "coverage" | "languages" | "specialties" | "availability" | "government" | "healthcare" | "international" | "qa";

export interface TrustNetworkPartnerProfile {
  id: string;
  displayName: string;
  stage: AllianceMaturityStage;
  coverageStates: string[];
  specialties: string[];
  languages: string[];
  readinessSignals: AllianceReadinessSignal[];
  trustScore: number;
  responseTime: string;
  completedMatters: number;
  qaAccuracy: number;
  nextAction: string;
  safetyNotes: string[];
}

export const TRUST_NETWORK_STAGES: AllianceMaturityStage[] = ["Professional License", "Verified Alliance", "Strategic Alliance", "Enterprise Alliance"];

export const TRUST_NETWORK_PARTNER_PROFILES: TrustNetworkPartnerProfile[] = [
  {
    id: "fl-ron-founder-profile",
    displayName: "Florida RON founder profile",
    stage: "Verified Alliance",
    coverageStates: ["FL"],
    specialties: ["Remote Online Notarization", "International execution", "Apostille-ready packets"],
    languages: ["English"],
    readinessSignals: ["identity", "commission", "ron", "insurance", "availability", "international", "qa"],
    trustScore: 86,
    responseTime: "Same business day when available",
    completedMatters: 0,
    qaAccuracy: 0,
    nextAction: "Verify current commission, RON authorization, insurance, and availability before dispatch.",
    safetyNotes: ["No guaranteed assignments", "No guaranteed income", "No exclusive territory"],
  },
  {
    id: "tx-ron-expansion-profile",
    displayName: "Texas RON expansion profile",
    stage: "Professional License",
    coverageStates: ["TX"],
    specialties: ["State-authorized RON", "Attorney referral support"],
    languages: ["English", "Spanish"],
    readinessSignals: ["identity", "commission", "availability"],
    trustScore: 48,
    responseTime: "Unverified",
    completedMatters: 0,
    qaAccuracy: 0,
    nextAction: "Collect commission, RON, insurance, coverage, and QA readiness evidence.",
    safetyNotes: ["Not listed as dispatch-ready until verification is complete"],
  },
];
