export interface JurisdictionProfile {
  slug: string;
  name: string;
  countryCode: string;
  routeType: "Hague Convention Routing" | "Consular Authentication Track";
  filingChannel: string;
  reviewProtocol: string;
  commonDocuments: string[];
  executionSequence: string[];
  disclaimer: string;
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
}

export const JURISDICTION_PROFILES: JurisdictionProfile[] = [
  {
    slug: "italy-apostille-coordination",
    name: "Italy",
    countryCode: "IT",
    routeType: "Hague Convention Routing",
    filingChannel: "Florida Department of State Route",
    reviewProtocol:
      "Liaison monitoring through final international release sequence. Documents reviewed against Italian destination-specific requirements prior to state submission.",
    commonDocuments: [
      "Power of Attorney",
      "Affidavit",
      "Corporate Authorization",
      "Birth Certificate Apostille",
      "Diploma Authentication",
    ],
    executionSequence: [
      "Document scope review and preparation coordination",
      "Remote online notarization or in-person execution",
      "Florida Department of State apostille submission",
      "State authentication channel routing",
      "International release to Italy",
    ],
    disclaimer:
      "This routing profile reflects the general state authentication path for documents originating in Florida and destined for Italy. Destination-specific review requirements may apply. Milano Seal coordinates the execution and state filing sequence; acceptance by receiving institutions is determined by those institutions.",
    seo: {
      title: "Italy Document Execution Route — Apostille Coordination",
      description:
        "Florida-origin apostille coordination for documents destined for Italy. Hague Convention routing via the Florida Department of State. Remote online notarization available.",
      keywords: [
        "Italy apostille",
        "apostille for Italy",
        "Florida apostille Italy",
        "Hague Convention Italy",
        "international document execution Italy",
        "notarization Italy",
      ],
    },
  },
  {
    slug: "spain-international-release-coordination",
    name: "Spain",
    countryCode: "ES",
    routeType: "Hague Convention Routing",
    filingChannel: "Florida Department of State Route",
    reviewProtocol:
      "Civil registry verification and international release coordination. Documents reviewed for execution integrity prior to state-facing submission.",
    commonDocuments: [
      "Power of Attorney",
      "Affidavit",
      "Marriage Certificate Apostille",
      "Corporate Authorization",
      "Academic Credentials",
    ],
    executionSequence: [
      "Document scope review and preparation",
      "Remote online notarization coordination",
      "Florida Department of State apostille routing",
      "State authentication channel",
      "International release sequence to Spain",
    ],
    disclaimer:
      "This routing profile reflects the general state authentication path for documents originating in Florida and destined for Spain. Civil registry and consular review requirements vary by document type and receiving institution. Milano Seal coordinates the execution and state filing sequence.",
    seo: {
      title: "Spain Document Execution Route — International Release Coordination",
      description:
        "Florida-origin apostille and international release coordination for documents destined for Spain. Hague Convention routing. Civil registry review available.",
      keywords: [
        "Spain apostille",
        "apostille for Spain",
        "Florida apostille Spain",
        "Hague Convention Spain",
        "international document Spain",
        "notarization Spain",
      ],
    },
  },
  {
    slug: "brazil-hague-convention-routing",
    name: "Brazil",
    countryCode: "BR",
    routeType: "Hague Convention Routing",
    filingChannel: "Florida Department of State Route",
    reviewProtocol:
      "Validation of notary seals against Brazilian destination-specific guidelines. Brazil acceded to the Hague Apostille Convention in 2016.",
    commonDocuments: [
      "Power of Attorney",
      "Affidavit",
      "Corporate Documents",
      "Birth Certificate",
      "Academic Records",
    ],
    executionSequence: [
      "Document scope review and intake",
      "Notary execution coordination",
      "Florida Department of State authentication submission",
      "State authentication channel routing",
      "International release to Brazil",
    ],
    disclaimer:
      "Brazil acceded to the Hague Apostille Convention in 2016. This routing profile reflects the general apostille path for Florida-origin documents. Destination-specific review requirements apply per receiving institution. Milano Seal coordinates the execution and state filing sequence.",
    seo: {
      title: "Brazil Document Execution Route — Hague Convention Routing",
      description:
        "Florida-origin apostille coordination for documents destined for Brazil. Hague Convention routing via the Florida Department of State. Brazil acceded 2016.",
      keywords: [
        "Brazil apostille",
        "apostille for Brazil",
        "Florida apostille Brazil",
        "Hague Convention Brazil",
        "international document Brazil",
        "notarization Brazil",
      ],
    },
  },
  {
    slug: "mexico-hague-convention-routing",
    name: "Mexico",
    countryCode: "MX",
    routeType: "Hague Convention Routing",
    filingChannel: "State Authentication Channel",
    reviewProtocol:
      "Destination-specific review applied to multi-page corporate instruments and personal legal documents. Mexico participates in the Hague Apostille Convention.",
    commonDocuments: [
      "Power of Attorney",
      "Corporate Authorization",
      "Birth Certificate",
      "Marriage Records",
      "Affidavit",
    ],
    executionSequence: [
      "Document review and preparation coordination",
      "Notary execution",
      "Florida Department of State authentication route",
      "State-facing submission",
      "International release to Mexico",
    ],
    disclaimer:
      "This routing profile reflects the general state authentication path for documents originating in Florida and destined for Mexico. Destination-specific review requirements vary by document category and receiving entity. Milano Seal coordinates the execution and state filing sequence.",
    seo: {
      title: "Mexico Document Execution Route — Hague Convention Routing",
      description:
        "Florida-origin apostille coordination for documents destined for Mexico. Hague Convention routing via the Florida Department of State. Corporate and personal documents.",
      keywords: [
        "Mexico apostille",
        "apostille for Mexico",
        "Florida apostille Mexico",
        "Hague Convention Mexico",
        "international document Mexico",
        "notarization Mexico",
      ],
    },
  },
  {
    slug: "uae-consular-authentication-track",
    name: "UAE",
    countryCode: "AE",
    routeType: "Consular Authentication Track",
    filingChannel: "Embassy / Consular Review",
    reviewProtocol:
      "Heightened chain-of-custody coordination for consular destination review. The UAE acceded to the Hague Apostille Convention in 2021; prior and complex matters may require embassy / consular review.",
    commonDocuments: [
      "Power of Attorney",
      "Commercial Agreements",
      "Corporate Documents",
      "Affidavit",
      "Background Check Documents",
    ],
    executionSequence: [
      "Document scope review and intake",
      "Notary execution with chain-of-custody documentation",
      "Florida Department of State authentication",
      "Embassy / consular review coordination where required",
      "Destination release to UAE",
    ],
    disclaimer:
      "The UAE acceded to the Hague Apostille Convention in 2021. Depending on document type, date of execution, and receiving institution requirements, the consular authentication track may apply. Milano Seal coordinates the full execution and authentication sequence; consular review timelines are determined by the relevant authority.",
    seo: {
      title: "UAE Document Execution Route — Consular Authentication Track",
      description:
        "Florida-origin document execution and consular authentication coordination for the UAE. Hague Convention routing available. Chain-of-custody control. Remote online notarization.",
      keywords: [
        "UAE apostille",
        "apostille UAE",
        "Florida apostille UAE",
        "UAE document authentication",
        "consular authentication UAE",
        "international document UAE",
      ],
    },
  },
  {
    slug: "florida-origin-document-execution",
    name: "Florida",
    countryCode: "US-FL",
    routeType: "Hague Convention Routing",
    filingChannel: "Florida Department of State Route",
    reviewProtocol:
      "All apostille coordination routes from Florida. The Milano Seal™ operates as a Florida-commissioned notary executing documents for domestic and international release.",
    commonDocuments: [
      "Power of Attorney",
      "Affidavit",
      "Name Discrepancy Affidavit",
      "Corporate Authorization",
      "Travel Consent",
    ],
    executionSequence: [
      "Document scope review and secure intake",
      "Remote online notarization or in-person execution",
      "Florida Department of State filing and apostille submission",
      "Authentication and apostille issuance",
      "International or domestic release coordination",
    ],
    disclaimer:
      "The Milano Seal™ operates under Florida Notary Commission #668288. All apostille submissions route through the Florida Department of State. Acceptance by receiving institutions is determined by those institutions.",
    seo: {
      title: "Florida Document Execution — Apostille & International Release Coordination",
      description:
        "Florida-based international document execution and apostille coordination. Remote online notarization available. Florida Department of State apostille routing for global destinations.",
      keywords: [
        "Florida apostille",
        "Florida notary apostille",
        "Florida document execution",
        "Florida RON",
        "Florida Department of State apostille",
        "international document Florida",
      ],
    },
  },
];
