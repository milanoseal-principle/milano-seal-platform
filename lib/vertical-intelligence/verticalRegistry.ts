/**
 * verticalRegistry — one configuration-driven Vertical Intelligence Framework.
 * Every vertical reuses the same canonical engines (Matter/Organization/Contact/
 * Pricing/Trust Chain/Operator Actions/Revenue) and existing verticals. No
 * per-vertical operating systems, no duplicate registries.
 */

export type VerticalId =
  | "maritime"
  | "aviation"
  | "exotic_automotive"
  | "energy_infrastructure"
  | "healthcare"
  | "university_education"
  | "government_public_sector"
  | "legal_professional"
  | "international_trade"
  | "logistics_freight"
  | "corporate_international"
  | "airport_aviation_services"
  | "family_office"
  | "private_wealth"
  | "executive_concierge";

export interface VerticalConfig {
  id: VerticalId;
  name: string;
  organizationTypes: string[];
  decisionMakerRoles: string[];
  /** Existing engine/vertical this configuration reuses (never duplicates). */
  reuses: string | null;
}

export const VERTICAL_REGISTRY: VerticalConfig[] = [
  { id: "maritime", name: "Maritime & Logistics", organizationTypes: ["yacht_brokerage", "marina", "customs_broker", "freight_forwarder"], decisionMakerRoles: ["broker", "operations", "counsel"], reuses: "lib/maritime + high-value-assets" },
  { id: "aviation", name: "Aviation", organizationTypes: ["aircraft_broker", "fbo", "operator"], decisionMakerRoles: ["broker", "operations"], reuses: "lib/high-value-assets (aviation)" },
  { id: "exotic_automotive", name: "Exotic & Collector Automotive", organizationTypes: ["exotic_dealer", "auction_house"], decisionMakerRoles: ["dealer", "title_professional"], reuses: "lib/high-value-assets" },
  { id: "energy_infrastructure", name: "Energy & Infrastructure", organizationTypes: ["solar_developer", "oil_gas", "contractor"], decisionMakerRoles: ["corporate_legal", "operations"], reuses: null },
  { id: "healthcare", name: "Healthcare", organizationTypes: ["hospital", "staffing", "physician_group"], decisionMakerRoles: ["credentialing", "legal"], reuses: "revenue-stack healthcare_medical" },
  { id: "university_education", name: "Universities & Education", organizationTypes: ["university", "registrar", "evaluator"], decisionMakerRoles: ["registrar", "admissions"], reuses: "revenue-stack university_education" },
  { id: "government_public_sector", name: "Government & Public Sector", organizationTypes: ["agency", "county", "municipality"], decisionMakerRoles: ["procurement_officer", "program_contact"], reuses: "procurement engine" },
  { id: "legal_professional", name: "Legal & Professional", organizationTypes: ["law_firm", "attorney"], decisionMakerRoles: ["partner", "paralegal"], reuses: "revenue-stack legal_professional" },
  { id: "international_trade", name: "International Trade", organizationTypes: ["importer_exporter", "trade_consultant"], decisionMakerRoles: ["operations", "compliance"], reuses: "maritime" },
  { id: "logistics_freight", name: "Logistics & Freight", organizationTypes: ["logistics_company", "freight_forwarder"], decisionMakerRoles: ["operations"], reuses: "maritime" },
  { id: "corporate_international", name: "Corporate International", organizationTypes: ["corporate_legal", "multinational"], decisionMakerRoles: ["corporate_secretary", "hr"], reuses: "revenue-stack corporate_international" },
  { id: "airport_aviation_services", name: "Airport & Aviation Services", organizationTypes: ["fbo", "airport_vendor"], decisionMakerRoles: ["operations", "procurement"], reuses: null },
  { id: "family_office", name: "Family Office", organizationTypes: ["family_office"], decisionMakerRoles: ["principal", "advisor"], reuses: "high-value-assets private client" },
  { id: "private_wealth", name: "Private Wealth", organizationTypes: ["wealth_manager"], decisionMakerRoles: ["advisor"], reuses: "high-value-assets private client" },
  { id: "executive_concierge", name: "Executive Concierge", organizationTypes: ["concierge", "executive_office"], decisionMakerRoles: ["executive_assistant", "principal"], reuses: "revenue-stack executive_concierge" },
];

export function getVertical(id: VerticalId): VerticalConfig | null {
  return VERTICAL_REGISTRY.find((v) => v.id === id) ?? null;
}

export const VERTICAL_COUNT = VERTICAL_REGISTRY.length;
