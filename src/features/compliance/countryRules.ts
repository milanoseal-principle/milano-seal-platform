export type HagueStatus = "hague" | "non_hague" | "review";
export type RiskLevel = "low" | "medium" | "high" | "review";

export interface CountryRule {
  country: string;
  hague_status: HagueStatus;
  apostille_required: boolean;
  authentication_chain_required: boolean;
  translation_likely: boolean;
  recommended_lane: "signature" | "priority" | "executive" | "custom_review";
  estimated_risk_level: RiskLevel;
  common_documents: string[];
  courier_preference: "DHL Express" | "FedEx International Priority" | "UPS Worldwide Express" | "Operator review";
  operator_notes: string;
}

export const countryRules: Record<string, CountryRule> = {
  italy: { country: "Italy", hague_status: "hague", apostille_required: true, authentication_chain_required: false, translation_likely: true, recommended_lane: "priority", estimated_risk_level: "medium", common_documents: ["Power of attorney", "Citizenship records", "Affidavit"], courier_preference: "DHL Express", operator_notes: "Italian translation may be requested by receiving authority." },
  brazil: { country: "Brazil", hague_status: "hague", apostille_required: true, authentication_chain_required: false, translation_likely: true, recommended_lane: "priority", estimated_risk_level: "medium", common_documents: ["Power of attorney", "Corporate authorization", "Affidavit"], courier_preference: "DHL Express", operator_notes: "Portuguese translation review is commonly needed for attorney-directed matters." },
  portugal: { country: "Portugal", hague_status: "hague", apostille_required: true, authentication_chain_required: false, translation_likely: true, recommended_lane: "priority", estimated_risk_level: "medium", common_documents: ["Power of attorney", "Real estate documents", "Vital records"], courier_preference: "DHL Express", operator_notes: "Portuguese translation review may be needed." },
  germany: { country: "Germany", hague_status: "hague", apostille_required: true, authentication_chain_required: false, translation_likely: true, recommended_lane: "priority", estimated_risk_level: "medium", common_documents: ["Corporate records", "Affidavit", "Vital records"], courier_preference: "FedEx International Priority", operator_notes: "German translation review may be requested by the receiving party." },
  spain: { country: "Spain", hague_status: "hague", apostille_required: true, authentication_chain_required: false, translation_likely: true, recommended_lane: "priority", estimated_risk_level: "medium", common_documents: ["Power of attorney", "Real estate documents", "Affidavit"], courier_preference: "DHL Express", operator_notes: "Spanish translation may be needed depending on recipient." },
  france: { country: "France", hague_status: "hague", apostille_required: true, authentication_chain_required: false, translation_likely: true, recommended_lane: "priority", estimated_risk_level: "medium", common_documents: ["Corporate records", "Affidavit", "Civil records"], courier_preference: "FedEx International Priority", operator_notes: "French translation review may be needed." },
  greece: { country: "Greece", hague_status: "hague", apostille_required: true, authentication_chain_required: false, translation_likely: true, recommended_lane: "priority", estimated_risk_level: "medium", common_documents: ["Power of attorney", "Inheritance records", "Affidavit"], courier_preference: "DHL Express", operator_notes: "Greek translation review may be needed." },
  uae: { country: "UAE", hague_status: "non_hague", apostille_required: false, authentication_chain_required: true, translation_likely: true, recommended_lane: "executive", estimated_risk_level: "high", common_documents: ["Power of attorney", "Corporate authorization", "Affidavit"], courier_preference: "DHL Express", operator_notes: "Non-Hague route requires full authentication-chain review before client commitment." },
  mexico: { country: "Mexico", hague_status: "hague", apostille_required: true, authentication_chain_required: false, translation_likely: true, recommended_lane: "priority", estimated_risk_level: "medium", common_documents: ["Power of attorney", "Real estate documents", "Affidavit"], courier_preference: "DHL Express", operator_notes: "Spanish translation review may be needed." },
  canada: { country: "Canada", hague_status: "hague", apostille_required: true, authentication_chain_required: false, translation_likely: false, recommended_lane: "signature", estimated_risk_level: "low", common_documents: ["Affidavit", "Corporate records", "Consent forms"], courier_preference: "FedEx International Priority", operator_notes: "Province-specific recipient instructions should be checked." },
  "united kingdom": { country: "United Kingdom", hague_status: "hague", apostille_required: true, authentication_chain_required: false, translation_likely: false, recommended_lane: "signature", estimated_risk_level: "low", common_documents: ["Affidavit", "Corporate records", "Power of attorney"], courier_preference: "UPS Worldwide Express", operator_notes: "Confirm recipient wording before execution." },
  other: { country: "Other / Not Sure", hague_status: "review", apostille_required: false, authentication_chain_required: false, translation_likely: false, recommended_lane: "custom_review", estimated_risk_level: "review", common_documents: ["Document review required"], courier_preference: "Operator review", operator_notes: "Operator must classify destination before quote finalization." },
};

export function getCountryRule(country?: string | null): CountryRule {
  const key = String(country ?? "other").toLowerCase().trim();
  return countryRules[key] ?? countryRules.other;
}
