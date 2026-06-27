import { DESTINATIONS } from "@/data/destinations";
import { getCountryExecutionIntelligence } from "@/data/country-execution-intelligence";

export type ReceivingAuthorityType =
  | "foreign_court"
  | "civil_registry"
  | "comune"
  | "bank"
  | "university"
  | "immigration_authority"
  | "customs_authority"
  | "corporate_registry"
  | "real_estate_registry"
  | "maritime_registry"
  | "equine_registry"
  | "gemstone_lab"
  | "auction_house"
  | "insurance_carrier"
  | "consulate"
  | "private_buyer"
  | "private_seller"
  | "foreign_counsel"
  | "unknown";

export type ReceivingAuthorityRequirement = {
  countrySlug: string;
  authorityType: ReceivingAuthorityType;
  documentSlugs: string[];
  publicSummary: string;
  questionsToAskClient: string[];
  requiredProofs: string[];
  ronAcceptanceRisk: "low" | "medium" | "high" | "unknown";
  translationRisk: "none" | "possible" | "likely" | "authority_specific";
  wetInkRisk: "low" | "medium" | "high" | "unknown";
  operatorReviewRequired: boolean;
};

export const REQUIRED_RECEIVING_AUTHORITY_TYPES: ReceivingAuthorityType[] = [
  "foreign_court",
  "civil_registry",
  "comune",
  "bank",
  "university",
  "immigration_authority",
  "customs_authority",
  "corporate_registry",
  "real_estate_registry",
  "maritime_registry",
  "equine_registry",
  "gemstone_lab",
  "auction_house",
  "insurance_carrier",
  "consulate",
  "private_buyer",
  "private_seller",
  "foreign_counsel",
  "unknown",
];

const DOCUMENTS_BY_AUTHORITY: Record<ReceivingAuthorityType, string[]> = {
  foreign_court: ["affidavit", "power-of-attorney", "court-record"],
  civil_registry: ["birth-certificate", "marriage-certificate", "death-certificate"],
  comune: ["birth-certificate", "marriage-certificate", "citizenship-record"],
  bank: ["bank-letter", "power-of-attorney", "corporate-authorization"],
  university: ["transcript", "diploma", "academic-record"],
  immigration_authority: ["background-check", "civil-record", "affidavit"],
  customs_authority: ["commercial-invoice", "ownership-declaration", "authorization"],
  corporate_registry: ["corporate-authorization", "certificate-of-good-standing", "power-of-attorney"],
  real_estate_registry: ["deed", "power-of-attorney", "seller-authorization"],
  maritime_registry: ["vessel-bill-of-sale", "ownership-declaration", "seller-authorization"],
  equine_registry: ["equine-transfer", "ownership-declaration", "veterinary-record"],
  gemstone_lab: ["valuation-letter", "ownership-declaration", "chain-of-custody-record"],
  auction_house: ["consignment-authorization", "ownership-declaration", "insurance-record"],
  insurance_carrier: ["claim-support-record", "ownership-declaration", "affidavit"],
  consulate: ["power-of-attorney", "corporate-authorization", "civil-record"],
  private_buyer: ["bill-of-sale", "ownership-declaration", "identity-affidavit"],
  private_seller: ["seller-authorization", "bill-of-sale", "power-of-attorney"],
  foreign_counsel: ["power-of-attorney", "affidavit", "corporate-authorization"],
  unknown: ["power-of-attorney", "affidavit", "civil-record"],
};

function buildRequirement(destination: (typeof DESTINATIONS)[number], authorityType: ReceivingAuthorityType): ReceivingAuthorityRequirement {
  const intelligence = getCountryExecutionIntelligence(destination.slug, destination.name);
  const consularRisk = intelligence.routeType === "consular_legalization" || authorityType === "consulate";
  const translationRisk = intelligence.executionFlags.some((flag) => /translation/i.test(flag));
  return {
    countrySlug: destination.slug,
    authorityType,
    documentSlugs: DOCUMENTS_BY_AUTHORITY[authorityType],
    publicSummary: `${intelligence.displayName} ${authorityType.replaceAll("_", " ")} matters require document-type review, receiving-authority instructions, notarial readiness review, and controlled release coordination before shipment.`,
    questionsToAskClient: [
      "Who is the receiving authority or receiving party?",
      "What document type and intended use are involved?",
      "Has the receiving authority requested wet ink, translation, or courier delivery?",
    ],
    requiredProofs: ["Document copy", "Receiving-authority instructions if available", "Signer identity and capacity details"],
    ronAcceptanceRisk: consularRisk ? "high" : "medium",
    translationRisk: translationRisk ? "likely" : "authority_specific",
    wetInkRisk: consularRisk ? "high" : "medium",
    operatorReviewRequired: true,
  };
}

export const RECEIVING_AUTHORITY_REQUIREMENTS: ReceivingAuthorityRequirement[] = DESTINATIONS.flatMap((destination) =>
  REQUIRED_RECEIVING_AUTHORITY_TYPES.map((authorityType) => buildRequirement(destination, authorityType)),
);

export function getReceivingAuthorityRequirements(countrySlug: string, documentSlug?: string): ReceivingAuthorityRequirement[] {
  return RECEIVING_AUTHORITY_REQUIREMENTS.filter((requirement) =>
    requirement.countrySlug === countrySlug && (!documentSlug || requirement.documentSlugs.includes(documentSlug)),
  );
}
