/**
 * maritimeDocumentRegistry — maritime/logistics document families. Public copy
 * must never claim every document of a type requires notarization or apostille;
 * requirements depend on the specific document, jurisdiction, and intended use.
 */

export type MaritimeDocumentFamily =
  | "power_of_attorney"
  | "customs_broker_authorization"
  | "corporate_authorization"
  | "affidavit"
  | "commercial_declaration"
  | "certificate"
  | "vessel_document"
  | "crew_document"
  | "cargo_document"
  | "bill_of_lading_support"
  | "import_export_document"
  | "banking_document"
  | "insurance_document"
  | "claim_document"
  | "marine_finance_document"
  | "litigation_support_document"
  | "translation_packet"
  | "apostille_packet"
  | "consular_legalization_packet"
  // High-value asset expansion (from the archive intelligence)
  | "uscg_bill_of_sale"
  | "preferred_ship_mortgage"
  | "vessel_bill_of_sale"
  | "certificate_of_incumbency"
  | "builders_certificate"
  | "vessel_registration_packet"
  | "foreign_registry_packet"
  | "ownership_transfer_packet"
  | "vessel_finance_packet"
  | "llc_authorization_document"
  | "unknown";

export interface MaritimeDocumentEntry {
  family: MaritimeDocumentFamily;
  label: string;
  commonParties: string[];
  reviewNotes: string; // general, review-dependent — never universal requirements
}

export const MARITIME_DOCUMENT_REGISTRY: MaritimeDocumentEntry[] = [
  { family: "uscg_bill_of_sale", label: "USCG Bill of Sale (e.g. Form CG-1340)", commonParties: ["buyer", "seller", "documentation agent"], reviewNotes: "Execution, notarization, and apostille needs depend on the transaction, parties, and receiving registry." },
  { family: "preferred_ship_mortgage", label: "Preferred Ship Mortgage", commonParties: ["owner", "lender"], reviewNotes: "Lender and registry requirements vary; review before quoting." },
  { family: "vessel_bill_of_sale", label: "Vessel Bill of Sale", commonParties: ["buyer", "seller", "broker"], reviewNotes: "Notarization/witness requirements depend on jurisdiction and receiving party." },
  { family: "certificate_of_incumbency", label: "Certificate of Incumbency", commonParties: ["corporate secretary", "registry"], reviewNotes: "Often used abroad; apostille/legalization is destination-dependent." },
  { family: "corporate_authorization", label: "Corporate Authorization / Resolution", commonParties: ["corporate officers"], reviewNotes: "Authority and authentication requirements are review-dependent." },
  { family: "power_of_attorney", label: "Power of Attorney (maritime)", commonParties: ["principal", "agent"], reviewNotes: "Witness/apostille needs depend on destination and receiving authority." },
  { family: "builders_certificate", label: "Builder's Certificate", commonParties: ["builder", "owner"], reviewNotes: "Used in custom-build and first-registration matters; requirements vary." },
  { family: "foreign_registry_packet", label: "Foreign Registry Packet", commonParties: ["owner", "registry", "counsel"], reviewNotes: "Legalization pathway depends on the destination registry." },
  { family: "customs_broker_authorization", label: "Customs Broker Authorization / POA", commonParties: ["importer", "customs broker"], reviewNotes: "Requirements set by the broker and receiving authority." },
  { family: "commercial_declaration", label: "Commercial Declaration", commonParties: ["exporter", "importer"], reviewNotes: "Review-dependent; no customs conclusions provided." },
];

export function getMaritimeDocument(family: MaritimeDocumentFamily): MaritimeDocumentEntry | null {
  return MARITIME_DOCUMENT_REGISTRY.find((d) => d.family === family) ?? null;
}
