export const TRUST_NETWORK_PROGRESSIONS = ["Professional License", "Verified Alliance", "Strategic Alliance", "Enterprise Alliance"] as const;

export interface PartnerPassport {
  identityVerified: boolean;
  commissionVerified: boolean;
  ronVerified: boolean;
  insuranceVerified: boolean;
  coverage: string[];
  languages: string[];
  specialties: string[];
  availability: "Available" | "Limited" | "Unavailable" | "Unverified";
  governmentReady: boolean;
  healthcareReady: boolean;
  internationalReady: boolean;
  trustScore: number;
  responseTime?: string;
  completedMatters: number;
  qaAccuracy?: number;
}
