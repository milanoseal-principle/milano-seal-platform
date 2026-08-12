export const ctaMapping = {
  apostille_authentication_coordination: "Check Apostille Path",
  ron_coordination: "Schedule RON Review",
  airport_area_emergency_execution: "Start Airport Emergency Review",
  attorney_referral_coordination: "Request Attorney Referral Packet",
  international_document_execution: "Start International Review",
};

export function getRecommendedCta(revenueLane: keyof typeof ctaMapping) {
  return ctaMapping[revenueLane];
}
