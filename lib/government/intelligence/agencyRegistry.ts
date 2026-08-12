export type AgencyType = "Federal" | "State" | "County" | "City" | "Airport Authority" | "Housing Authority" | "School District" | "College" | "University" | "Transit Authority" | "Hospital District" | "Utility" | "Emergency Management" | "Sheriff" | "Clerk of Court" | "Property Appraiser" | "Tax Collector" | "Constitutional Office";

export interface AgencyProfile {
  id: string;
  agency: string;
  type: AgencyType;
  county?: string;
  state: string;
  department?: string;
  mission: string;
  website?: string;
  procurementPortal?: string;
  procurementSoftware?: string;
  primaryBuyer?: string;
  secondaryBuyer?: string;
  procurementContacts: string[];
  leadership: string[];
  legalCounsel?: string;
  riskManager?: string;
  currentVendors: string[];
  contractVehicles: string[];
  naicsUsed: string[];
  commodityCodes: string[];
  typicalContractSize: string;
  renewalCycle: string;
  knownPainPoints: string[];
  relationshipScore: number;
  relationshipStage: "Uncontacted" | "Research" | "Registration" | "Capability Sent" | "Active Relationship" | "Opportunity" | "Contract";
  intelligenceNotes: string[];
}

export const AGENCY_REGISTRY: AgencyProfile[] = [
  {
    id: "pinellas-county",
    agency: "Pinellas County",
    type: "County",
    county: "Pinellas",
    state: "FL",
    department: "Procurement and Risk Management watchlist",
    mission: "County public services, records, emergency, and administrative operations.",
    procurementPortal: "Official county procurement portal to verify before outreach",
    procurementSoftware: "To be confirmed from official source",
    procurementContacts: [],
    leadership: [],
    currentVendors: [],
    contractVehicles: ["Vendor registration", "Informal quotes", "Formal solicitations"],
    naicsUsed: ["541199", "561110", "561410"],
    commodityCodes: ["Administrative support", "Document preparation", "Professional services support"],
    typicalContractSize: "Unknown until sourced from published solicitations",
    renewalCycle: "Monitor annual budget and expiring service agreements",
    knownPainPoints: ["High-volume public records workflows", "vendor documentation", "time-sensitive administrative support"],
    relationshipScore: 12,
    relationshipStage: "Research",
    intelligenceNotes: ["Do not infer awards or revenue. Verify buyer contacts through official county pages."],
  },
  {
    id: "hillsborough-county",
    agency: "Hillsborough County",
    type: "County",
    county: "Hillsborough",
    state: "FL",
    mission: "Regional county administration and public service delivery.",
    procurementPortal: "Official county procurement portal to verify before registration",
    procurementSoftware: "To be confirmed from official source",
    procurementContacts: [],
    leadership: [],
    currentVendors: [],
    contractVehicles: ["Vendor registration", "County solicitations"],
    naicsUsed: ["541199", "561110", "561410"],
    commodityCodes: ["Administrative support", "records support", "notary-adjacent operational support"],
    typicalContractSize: "Unknown until official solicitation review",
    renewalCycle: "Monitor fiscal-year procurement calendar",
    knownPainPoints: ["distributed departments", "supplier onboarding", "deadline-driven document execution support"],
    relationshipScore: 8,
    relationshipStage: "Research",
    intelligenceNotes: ["Priority expansion county. No claims of registration until confirmed."],
  },
  {
    id: "tampa-international-airport",
    agency: "Tampa International Airport / Aviation Authority",
    type: "Airport Authority",
    county: "Hillsborough",
    state: "FL",
    mission: "Airport authority operations, vendor management, and capital project support.",
    procurementPortal: "Official airport authority procurement portal to verify",
    procurementSoftware: "To be confirmed from official source",
    procurementContacts: [],
    leadership: [],
    currentVendors: [],
    contractVehicles: ["Airport vendor registration", "professional services opportunities"],
    naicsUsed: ["541199", "561110", "488119"],
    commodityCodes: ["Administrative support", "international document routing support", "records coordination"],
    typicalContractSize: "Unknown until sourced",
    renewalCycle: "Monitor authority board agenda, vendor days, and budget cycle",
    knownPainPoints: ["international stakeholders", "regulated documentation", "vendor insurance and compliance packets"],
    relationshipScore: 10,
    relationshipStage: "Research",
    intelligenceNotes: ["Airport vertical fit should be positioned as Procurement Alignment, not government endorsement."],
  },
];

export function listAgenciesByRelationshipGap(agencies = AGENCY_REGISTRY): AgencyProfile[] {
  return [...agencies].sort((a, b) => a.relationshipScore - b.relationshipScore);
}
