export interface MobileFieldNetworkEntry {
  id: string;
  label: string;
  coverage: string;
  publicSummary: string;
  requiresOperatorReview: boolean;
}

export const mobileFieldNetworkRegistry: MobileFieldNetworkEntry[] = [
  {
    id: "florida-mobile-coordination",
    label: "Florida Mobile Coordination",
    coverage: "Florida Mobile Coordination",
    publicSummary: "By-appointment mobile coordination across Florida service areas.",
    requiresOperatorReview: true,
  },
  {
    id: "partner-provider-referral",
    label: "Partner Provider Referral",
    coverage: "Partner Provider Referral",
    publicSummary: "Referral to vetted partner providers for field-based services.",
    requiresOperatorReview: true,
  },
  {
    id: "remote-intake",
    label: "Remote Intake",
    coverage: "Remote Intake",
    publicSummary: "Remote document intake and coordination.",
    requiresOperatorReview: false,
  },
];

export function getMobileFieldNetwork(
  id: string
): MobileFieldNetworkEntry | undefined {
  return mobileFieldNetworkRegistry.find((entry) => entry.id === id);
}
