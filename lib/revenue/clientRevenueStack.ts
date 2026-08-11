import type { RevenueLaneId } from "./revenueLaneRegistry";

export interface ClientRevenueStack {
  id: string;
  clientType: string;
  primaryNeed: string;
  lanes: RevenueLaneId[];
  riskControls: string[];
  nextAction: string;
}

export const CLIENT_REVENUE_STACKS: ClientRevenueStack[] = [
  { id: "us-citizen-abroad", clientType: "U.S. citizen abroad", primaryNeed: "U.S. document execution for international use", lanes: ["intake_eligibility_review", "ron_coordination", "apostille_authentication_coordination", "courier_scanback_custody"], riskControls: ["Foreign acceptance is receiving-authority dependent", "No legal or immigration advice"], nextAction: "Confirm signer location, destination country, document type, and receiving authority." },
  { id: "italian-citizenship-client", clientType: "Italian citizenship client", primaryNeed: "Multi-document Italy packet readiness", lanes: ["intake_eligibility_review", "ron_coordination", "apostille_authentication_coordination", "translation_coordination", "courier_scanback_custody"], riskControls: ["Consulate and comune practices vary", "No guaranteed acceptance"], nextAction: "Map each document to origin authority, notarization need, apostille path, and translation status." },
  { id: "airport-emergency-traveler", clientType: "Airport emergency traveler", primaryNeed: "Urgent airport-area document execution", lanes: ["mobile_airport_area_execution", "airport_area_emergency_execution", "founder_executive_review"], riskControls: ["No TSA clearance claim", "No airline approval claim", "Restricted-area access is not assumed"], nextAction: "Confirm availability, location, timing, identity documents, and whether wet ink is required." },
  { id: "attorney-referral", clientType: "Attorney referral", primaryNeed: "Professional coordinator support", lanes: ["attorney_professional_coordinator", "founder_executive_review", "apostille_authentication_coordination"], riskControls: ["Attorney retains legal advice role", "Milano Seal provides coordination only"], nextAction: "Attach referral source, matter objective, and document list to the Matter." },
  { id: "executive-private-client", clientType: "Executive / private client", primaryNeed: "Discreet high-touch execution", lanes: ["founder_executive_review", "ron_coordination", "courier_scanback_custody", "repeat_client_family_desk"], riskControls: ["No public case detail without approval", "Payment-Gated Execution before release"], nextAction: "Confirm privacy expectations, quote path, and release timing." },
];
