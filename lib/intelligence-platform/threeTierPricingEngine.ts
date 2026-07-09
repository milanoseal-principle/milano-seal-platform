import type { ExecutionLane } from "./types";

export const THREE_TIER_EXECUTION_LANES: ExecutionLane[] = [
  {
    id: "signature",
    name: "Signature Execution Lane",
    price: 750,
    timeline: "24–72 Hours",
    bestFor: ["Standard notarizations", "Single signer matters", "Standard apostille coordination", "Hague Convention countries", "Personal documents", "Business documents"],
    includes: ["Smart Intake Engine", "Compliance Review", "Identity Verification", "Document Execution", "Standard Coordination", "Status Updates"],
    caveats: ["Timeline depends on document readiness, signer availability, identity verification, scheduling, and applicable law."]
  },
  {
    id: "priority",
    name: "Priority Execution Lane",
    price: 975,
    timeline: "Same Day–48 Hours when documentation, signer availability, identity verification, and scheduling requirements are satisfied.",
    bestFor: ["Urgent business matters", "Multiple signers", "Estate documents", "Real estate transactions", "Time-sensitive international matters", "Corporate filings"],
    includes: ["Priority Smart Intake", "Expedited Compliance Review", "Priority Scheduling", "RON coordination when applicable", "Priority Courier Coordination", "Enhanced Status Updates"],
    caveats: ["Same-day coordination is conditional and not guaranteed."]
  },
  {
    id: "executive",
    name: "Executive Execution Lane",
    price: 1850,
    timeline: "Immediate Project Coordination; same-day coordination may be available for eligible matters. Overall completion depends on government authorities, embassies, consulates, courier transit, and third-party agencies.",
    bestFor: ["Embassy legalization", "Non-Hague countries", "Multi-country matters", "Law firms", "Corporate legal departments", "High-value transactions", "Private wealth offices", "International real estate"],
    includes: ["Dedicated Project Manager", "Executive Communication", "White-Glove Coordination", "Translation Coordination", "Embassy Coordination", "International Courier Coordination", "Complex Multi-Jurisdiction Routing"],
    caveats: ["Downstream government processing remains outside Milano Seal control."]
  }
];

export const EXECUTION_LANE_ADD_ONS = [
  { label: "Apostille Coordination Add-On", price: 250 },
  { label: "Rush Processing Add-On", price: 400 },
  { label: "Additional Signer", price: 150 },
  { label: "Mobile Deployment", price: "Quoted by location and scope" },
  { label: "Remote Online Notarization", price: "Included when applicable to selected lane" },
  { label: "International Document Review", price: "Included during intake" },
  { label: "Compliance Review", price: "Included during intake" }
] as const;

export const EXPEDITED_EXECUTION_PROTOCOL = {
  summary: "For eligible matters, Milano Seal may coordinate same-day execution when the administrative, identity, participant, platform, and legal requirements are satisfied.",
  requirements: ["Documents have completed administrative review", "Identity verification requirements have been satisfied", "All required signers are available", "Required witnesses are available if applicable", "A Remote Online Notarization session can be scheduled", "Platform availability permits", "Applicable legal requirements are met"],
  caveat: "This expedited protocol applies to document execution coordination only. Government processing times for apostilles, authentications, embassy legalizations, and third-party agencies remain outside Milano Seal’s control."
} as const;
