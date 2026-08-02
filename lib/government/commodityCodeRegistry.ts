// Illustrative commodity / NAICS category entries relevant to notarial and
// document-execution services. NOTE: These codes are ILLUSTRATIVE ONLY and must
// be verified per procurement portal before selection — each agency portal may
// use different NIGP/NAICS versions and category mappings.

export interface CommodityCodeEntry {
  code: string;
  label: string;
  system: "NIGP" | "NAICS";
}

export const COMMODITY_CODE_REGISTRY: CommodityCodeEntry[] = [
  { code: "961-53", label: "Notary Public Services", system: "NIGP" },
  { code: "946-00", label: "Legal / Document Support Services", system: "NIGP" },
  { code: "958-00", label: "Consulting & Professional Services", system: "NIGP" },
  { code: "915-00", label: "Communication & Records Services", system: "NIGP" },
  { code: "541120", label: "Offices of Notaries", system: "NAICS" },
  { code: "561410", label: "Document Preparation Services", system: "NAICS" },
  { code: "561499", label: "All Other Business Support Services", system: "NAICS" },
  { code: "541199", label: "All Other Legal Services", system: "NAICS" },
];

export function getCommodityCodes(): CommodityCodeEntry[] {
  return COMMODITY_CODE_REGISTRY;
}

export function getCommodityCodesBySystem(
  system: CommodityCodeEntry["system"],
): CommodityCodeEntry[] {
  return COMMODITY_CODE_REGISTRY.filter((c) => c.system === system);
}
