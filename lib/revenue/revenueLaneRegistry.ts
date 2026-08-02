export type RevenueLaneId =
  | "intake_eligibility_review"
  | "ron_coordination"
  | "mobile_airport_area_execution"
  | "apostille_authentication_coordination"
  | "translation_coordination"
  | "courier_scanback_custody"
  | "founder_executive_review"
  | "attorney_professional_coordinator"
  | "ron_alliance_partner_spread"
  | "repeat_client_family_desk"
  | "airport_area_emergency_execution";

export interface RevenueLane {
  id: RevenueLaneId;
  label: string;
  layer: "Client Experience" | "Execution Engine" | "Operations" | "Trust Network" | "Intelligence" | "Enterprise";
  description: string;
  publicSafe: boolean;
  operatorNextAction: string;
}

export const REVENUE_LANES: RevenueLane[] = [
  { id: "intake_eligibility_review", label: "Intake / eligibility review", layer: "Client Experience", description: "Paid review of signer location, document type, destination, timing, and receiving-authority constraints before quote lock.", publicSafe: true, operatorNextAction: "Confirm signer location and destination country before quoting." },
  { id: "ron_coordination", label: "RON coordination", layer: "Execution Engine", description: "Eligible Florida Remote Online Notarization coordination with payment-gated scheduling and source requirement review.", publicSafe: true, operatorNextAction: "Verify RON eligibility, ID readiness, and receiving-authority acceptance risk." },
  { id: "mobile_airport_area_execution", label: "Mobile / airport-area execution", layer: "Execution Engine", description: "Availability-based field coordination for urgent airport-area or mobile execution needs.", publicSafe: true, operatorNextAction: "Confirm field availability and avoid restricted-area assumptions." },
  { id: "apostille_authentication_coordination", label: "Apostille / authentication coordination", layer: "Execution Engine", description: "Destination-aware apostille or authentication routing coordination for eligible U.S. documents used abroad.", publicSafe: true, operatorNextAction: "Verify origin authority, destination country, and document issue path." },
  { id: "translation_coordination", label: "Translation coordination", layer: "Execution Engine", description: "Coordination lane for certified or professional translation needs when required by the destination or receiving authority.", publicSafe: true, operatorNextAction: "Confirm language pair and receiving authority format expectations." },
  { id: "courier_scanback_custody", label: "Courier / scan-back / custody", layer: "Operations", description: "Payment-Gated Execution and International Courier Release, scan-back, and Chain-of-Custody Visibility for controlled records.", publicSafe: true, operatorNextAction: "Confirm payment gate, release authorization, and courier milestone language." },
  { id: "founder_executive_review", label: "Founder / executive review", layer: "Operations", description: "High-touch executive review lane for complex, urgent, or high-stakes matter coordination.", publicSafe: true, operatorNextAction: "Escalate to founder review when complexity, timing, or risk requires it." },
  { id: "attorney_professional_coordinator", label: "Attorney / professional coordinator lane", layer: "Enterprise", description: "Professional referral and coordinator lane for law firms, advisors, healthcare, financial, and institutional contacts.", publicSafe: true, operatorNextAction: "Attach referral source and professional relationship context to the Matter." },
  { id: "ron_alliance_partner_spread", label: "RON Alliance partner spread", layer: "Trust Network", description: "Internal partner-execution economics for verified RON-enabled execution partners.", publicSafe: false, operatorNextAction: "Verify partner readiness before dispatch and keep internal margin data private." },
  { id: "repeat_client_family_desk", label: "Repeat client / family desk", layer: "Intelligence", description: "Repeat matter lane for families, executives, and private clients with recurring international document needs.", publicSafe: true, operatorNextAction: "Identify reusable country, document, and relationship intelligence from prior matters." },
  { id: "airport_area_emergency_execution", label: "Airport-area emergency execution", layer: "Operations", description: "Urgent traveler, FBO, hotel, attorney, executive, and family support near target airport areas based on availability.", publicSafe: true, operatorNextAction: "Confirm no secure-side claim, no travel clearance claim, and no airline approval claim." },
];
