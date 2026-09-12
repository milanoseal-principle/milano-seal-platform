// Milano Seal — Revenue Copy System (public-safe conversion copy)
// Primary domain: https://www.themilanoseal.com

export type MilanoRevenueAudience =
  | "client"
  | "international_lawyer"
  | "private_client"
  | "family_office"
  | "yacht_broker"
  | "luxury_real_estate"
  | "equine"
  | "gemstone_diamond_jewelry"
  | "alliance_notary"
  | "virtual_assistant"
  | "operator";

export type MilanoRevenuePath =
  | "controlled_intake"
  | "deposit_unlock"
  | "ron_schedule"
  | "client_route_report"
  | "lawyer_client_pack"
  | "lawyer_monthly_access"
  | "private_client_review"
  | "concierge_execution"
  | "alliance_application"
  | "va_application";

export type MilanoRevenueCopyBlock = {
  audience: MilanoRevenueAudience;
  path: MilanoRevenuePath;
  headline: string;
  subheadline: string;
  benefitBullets: string[];
  ctaLabel: string;
  ctaHref: string;
  complianceLine: string;
};

const BOUNDARY =
  "The Milano Seal is not a law firm and does not provide legal advice. Routing snapshots remain subject to receiving-authority review.";

export const MILANO_REVENUE_COPY_BLOCKS: MilanoRevenueCopyBlock[] = [
  {
    audience: "client",
    path: "controlled_intake",
    headline: "Get your international document executed, apostilled, and released with control.",
    subheadline:
      "The Milano Seal guides your U.S.-origin document from intake through notarization/RON, apostille or authentication routing, deposit-gated scheduling, final-balance release control, and tracked international delivery.",
    benefitBullets: [
      "Know which route applies before execution begins",
      "Upload documents for controlled review",
      "Verify the 50% deposit to unlock scheduling",
      "Schedule RON, mobile, or in-person execution when eligible",
      "Verify the final 50% before international release and shipping",
      "Track apostille/authentication and release status",
    ],
    ctaLabel: "Start Controlled Intake",
    ctaHref: "/intake",
    complianceLine: BOUNDARY,
  },
  {
    audience: "international_lawyer",
    path: "lawyer_client_pack",
    headline: "Cross-border document execution support for international counsel.",
    subheadline:
      "The Milano Seal gives international counsel one U.S. execution point for Matter intake, route review, notarization/RON, apostille or authentication coordination, controlled custody, final payment clearance, and international release.",
    benefitBullets: [
      "Structure the U.S. execution route before the client repeats information",
      "Carry destination, document, origin, signer posture, and known authority into secure intake",
      "Keep legal strategy and document substance with counsel",
      "Verify the 50% deposit before scheduling or RON",
      "Verify the final 50% before international release and shipping",
      "Track controlled release and final packet readiness",
    ],
    ctaLabel: "Open Professional Execution",
    ctaHref: "/professional",
    complianceLine: BOUNDARY,
  },
  {
    audience: "private_client",
    path: "private_client_review",
    headline: "Private-client document execution for international matters.",
    subheadline:
      "The Milano Seal supports HNWI/UHNWI clients, family offices, private-client advisors, and cross-border professionals with controlled document execution for assets, residency, citizenship, banking, estate, real estate, and luxury transactions.",
    benefitBullets: [
      "Private-client intake and route review",
      "RON/mobile/in-person execution coordination",
      "Apostille/authentication routing",
      "Controlled final release",
      "Custody-tracked delivery",
    ],
    ctaLabel: "Request Private Client Review",
    ctaHref: "/access?interest=private-client",
    complianceLine: BOUNDARY,
  },
  {
    audience: "yacht_broker",
    path: "controlled_intake",
    headline: "International yacht and marine document execution.",
    subheadline:
      "The Milano Seal helps yacht brokers, maritime attorneys, buyers, sellers, and vessel transaction teams execute, notarize, route, and release U.S.-origin marine transaction documents for use abroad.",
    benefitBullets: [
      "Bills of sale and ownership declarations",
      "POAs and seller/buyer authorizations",
      "Corporate authorization documents",
      "Apostille/authentication routing",
      "Courier and release tracking",
    ],
    ctaLabel: "Start Yacht Document Intake",
    ctaHref: "/industries/yacht-brokers-cross-border",
    complianceLine: BOUNDARY,
  },
  {
    audience: "luxury_real_estate",
    path: "controlled_intake",
    headline: "Cross-border real estate document execution.",
    subheadline:
      "The Milano Seal supports international buyers, sellers, brokers, attorneys, and escrow teams with U.S.-origin real estate documents that need notarization, apostille/authentication routing, and controlled release for use abroad.",
    benefitBullets: [
      "POAs and closing authorizations",
      "Seller/buyer declarations",
      "Entity authorization documents",
      "Escrow support documents",
      "Release and delivery tracking",
    ],
    ctaLabel: "Start Real Estate Document Intake",
    ctaHref: "/industries/international-luxury-real-estate",
    complianceLine: BOUNDARY,
  },
  {
    audience: "equine",
    path: "controlled_intake",
    headline: "Equine and bloodstock transaction document execution.",
    subheadline:
      "The Milano Seal helps equine attorneys, brokers, owners, trainers, buyers, sellers, and bloodstock professionals execute ownership, agency, transport, sale, and authorization documents for international use.",
    benefitBullets: [
      "Bills of sale",
      "Agency authorizations",
      "Ownership declarations",
      "POAs",
      "Apostille/authentication route review",
    ],
    ctaLabel: "Start Equine Document Intake",
    ctaHref: "/industries/equine-cross-border",
    complianceLine: BOUNDARY,
  },
  {
    audience: "gemstone_diamond_jewelry",
    path: "controlled_intake",
    headline: "High-value asset document execution for global transactions.",
    subheadline:
      "The Milano Seal supports gemstone dealers, diamond professionals, jewelry houses, private collectors, insurers, attorneys, and advisors with controlled execution for provenance, ownership, authorization, insurance, and transaction documents.",
    benefitBullets: [
      "Provenance declarations",
      "Ownership declarations",
      "Bills of sale",
      "Insurance support documents",
      "Corporate authorization letters",
      "Controlled release tracking",
    ],
    ctaLabel: "Request Luxury Asset Document Review",
    ctaHref: "/industries/gemstones-diamonds-jewelry",
    complianceLine: BOUNDARY,
  },
  {
    audience: "alliance_notary",
    path: "alliance_application",
    headline: "Join the international document execution network.",
    subheadline:
      "Approved alliance notaries support Milano Seal matters after the deposit, signer details, certificate readiness, route requirements, and scheduling readiness are confirmed.",
    benefitBullets: [
      "Receive approved assignment opportunities",
      "Support RON, mobile, or in-person execution",
      "Work within a controlled document route",
      "Avoid unclear signer or certificate instructions",
      "Build international notary execution experience",
    ],
    ctaLabel: "Apply for Alliance Access",
    ctaHref: "/alliance/apply",
    complianceLine: BOUNDARY,
  },
  {
    audience: "virtual_assistant",
    path: "va_application",
    headline: "Support the execution queue behind international document matters.",
    subheadline:
      "Virtual assistants help The Milano Seal review intake details, organize uploads, identify missing fields, confirm country/document inputs, and escalate incomplete matters to operators.",
    benefitBullets: [
      "Intake review support",
      "Document upload organization",
      "Country/document routing checks",
      "Missing-field review",
      "Operator escalation support",
    ],
    ctaLabel: "Apply for VA Support Role",
    ctaHref: "/va/apply",
    complianceLine: BOUNDARY,
  },
];

export function getRevenueCopyForAudience(
  audience: MilanoRevenueAudience,
): MilanoRevenueCopyBlock | undefined {
  return MILANO_REVENUE_COPY_BLOCKS.find((b) => b.audience === audience);
}

export function getRevenueCopyForPath(
  path: MilanoRevenuePath,
): MilanoRevenueCopyBlock | undefined {
  return MILANO_REVENUE_COPY_BLOCKS.find((b) => b.path === path);
}

export const MILANO_PUBLIC_PROMISE =
  "The Milano Seal helps clients, international lawyers, private-client advisors, yacht brokers, luxury real estate professionals, equine professionals, gemstone, diamond, and fine jewelry teams prepare, notarize, route, apostille/authenticate, release, and track U.S.-origin documents for use abroad.";

export const MILANO_PAYMENT_SCHEDULING_LINE =
  "For split-payment Matters, a verified 50% Wise deposit unlocks scheduling and eligible RON/execution. The final 50% must be verified before controlled international release and shipping. Full-payment Matters remain governed by the same verification gates.";
