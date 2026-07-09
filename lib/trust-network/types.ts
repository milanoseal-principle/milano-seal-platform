export type BillingCadence = "monthly" | "annual" | "application";

export type TrustNetworkTierId = "seal_start" | "seal_pro" | "seal_elite";

export interface TrustNetworkTier {
  id: TrustNetworkTierId;
  name: string;
  tagline: string;
  purpose: string;
  monthlyPrice?: number;
  annualPrice?: number;
  applicationFee?: number;
  applicationRequired: boolean;
  audience: string[];
  includes: string[];
  valuePosition: string[];
  safetyNotes: string[];
}

export interface PlatformSpace {
  id: string;
  name: string;
  purpose: string;
  audience: string[];
  outcomes: string[];
}

export interface ValueStackItem {
  name: string;
  estimatedValue: string;
  description: string;
  includedIn: TrustNetworkTierId[];
}

export interface TrustNetworkRevenueLine {
  id: string;
  label: string;
  model: "license" | "application" | "service" | "margin" | "sponsorship" | "enterprise";
  description: string;
  publicClaimSafe: boolean;
}
