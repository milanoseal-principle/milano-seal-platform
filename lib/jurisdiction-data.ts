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
    slug: "saudi-arabia-consular-authentication",
    name: "Saudi Arabia",
    countryCode: "SA",
    routeType: "Consular Authentication Track",
    filingChannel: "Embassy / Consular Review",
    reviewProtocol:
      "Multi-tiered chain-of-custody coordination through state and federal authentication desks. Destination-specific formatting review applied to corporate and commercial instruments prior to embassy-facing submission.",
    commonDocuments: [
      "Power of Attorney",
      "Corporate Authorization",
      "Commercial Agreements",
      "Board Resolutions",
      "Certificates of Origin",
    ],
    executionSequence: [
      "Document scope review and preparation coordination",
      "Remote online notarization or in-person execution",
      "Florida Department of State authentication",
      "Federal-level authentication review via U.S. Department of State",
      "Embassy / consular review coordination and destination release to Saudi Arabia",
    ],
    disclaimer:
      "Saudi Arabia requires a multi-tier authentication sequence for Florida-origin documents. Embassy review timelines are determined by the relevant consular authority. Milano Seal coordinates the execution, state, and federal authentication sequence; acceptance by receiving institutions is determined by those institutions.",
    seo: {
      title: "Saudi Arabia Consular Authentication Track — Document Execution Coordination",
      description:
        "Florida-origin document execution and consular authentication coordination for Saudi Arabia. Multi-tier state, federal, and embassy review sequence. Chain-of-custody control.",
      keywords: [
        "Saudi Arabia consular authentication",
        "Saudi Arabia document authentication",
        "Florida documents Saudi Arabia",
        "embassy authentication Saudi Arabia",
        "consular legalization Saudi Arabia",
        "international document Saudi Arabia",
      ],
    },
  },
  {
    slug: "china-consular-authentication-track",
    name: "China",
    countryCode: "CN",
    routeType: "Consular Authentication Track",
    filingChannel: "Embassy / Consular Review",
    reviewProtocol:
      "Destination-specific formatting review and chain-of-custody coordination for corporate and civil instruments. Federal-level authentication review applied prior to consular submission.",
    commonDocuments: [
      "Power of Attorney",
      "Corporate Bylaws",
      "Affidavit",
      "Appointment Letters",
      "Commercial Contracts",
    ],
    executionSequence: [
      "Document scope review and preparation coordination",
      "Remote online notarization or in-person execution",
      "Florida Department of State authentication",
      "Federal-level authentication review via U.S. Department of State",
      "Embassy / consular review coordination and destination release to China",
    ],
    disclaimer:
      "China requires a multi-tier authentication sequence for Florida-origin documents. Consular review requirements vary by document type and receiving institution. Milano Seal coordinates the execution, state, and federal authentication sequence; acceptance by receiving institutions is determined by those institutions.",
    seo: {
      title: "China Consular Authentication Track — Document Execution Coordination",
      description:
        "Florida-origin document execution and consular authentication coordination for China. Multi-tier state, federal, and consular review sequence. Destination-specific review.",
      keywords: [
        "China consular authentication",
        "China document authentication",
        "Florida documents China",
        "embassy authentication China",
        "consular legalization China",
        "international document China",
      ],
    },
  },
  {
    slug: "vietnam-consular-authentication",
    name: "Vietnam",
    countryCode: "VN",
    routeType: "Consular Authentication Track",
    filingChannel: "Embassy / Consular Review",
    reviewProtocol:
      "Consular layout assessment and destination-specific review for civil and commercial instruments. Chain-of-custody coordination through state and federal authentication channels.",
    commonDocuments: [
      "Power of Attorney",
      "Commercial Contracts",
      "Corporate Authorization",
      "Personal Civil Records",
      "Distributor Authorization Letters",
    ],
    executionSequence: [
      "Document scope review and preparation coordination",
      "Remote online notarization or in-person execution",
      "Florida Department of State authentication",
      "Federal-level authentication review via U.S. Department of State",
      "Embassy / consular review coordination and destination release to Vietnam",
    ],
    disclaimer:
      "Vietnam requires a multi-tier authentication sequence for Florida-origin documents. Consular processing windows vary based on current embassy operation constraints. Milano Seal coordinates the execution, state, and federal authentication sequence; acceptance by receiving institutions is determined by those institutions.",
    seo: {
      title: "Vietnam Consular Authentication Track — Document Execution Coordination",
      description:
        "Florida-origin document execution and consular authentication coordination for Vietnam. Multi-tier state, federal, and consular review sequence. Civil and commercial instruments.",
      keywords: [
        "Vietnam consular authentication",
        "Vietnam document authentication",
        "Florida documents Vietnam",
        "embassy authentication Vietnam",
        "consular legalization Vietnam",
        "international document Vietnam",
      ],
    },
  },
  {
    slug: "qatar-consular-authentication",
    name: "Qatar",
    countryCode: "QA",
    routeType: "Consular Authentication Track",
    filingChannel: "Embassy / Consular Review",
    reviewProtocol:
      "Chain-of-custody coordination for corporate and commercial instruments. Federal-level authentication review applied prior to embassy-facing submission.",
    commonDocuments: [
      "Power of Attorney",
      "Corporate Authorization",
      "Commercial Agreements",
      "Affidavit",
      "Employment Documents",
    ],
    executionSequence: [
      "Document scope review and preparation coordination",
      "Remote online notarization or in-person execution",
      "Florida Department of State authentication",
      "Federal-level authentication review via U.S. Department of State",
      "Embassy / consular review coordination and destination release to Qatar",
    ],
    disclaimer:
      "Qatar requires a multi-tier authentication sequence for Florida-origin documents. Embassy review timelines are determined by the relevant consular authority. Milano Seal coordinates the execution, state, and federal authentication sequence; acceptance by receiving institutions is determined by those institutions.",
    seo: {
      title: "Qatar Consular Authentication Track — Document Execution Coordination",
      description:
        "Florida-origin document execution and consular authentication coordination for Qatar. Multi-tier state, federal, and embassy review sequence. Chain-of-custody control.",
      keywords: [
        "Qatar consular authentication",
        "Qatar document authentication",
        "Florida documents Qatar",
        "embassy authentication Qatar",
        "consular legalization Qatar",
        "international document Qatar",
      ],
    },
  },
  {
    slug: "kuwait-consular-authentication",
    name: "Kuwait",
    countryCode: "KW",
    routeType: "Consular Authentication Track",
    filingChannel: "Embassy / Consular Review",
    reviewProtocol:
      "Destination-specific review and chain-of-custody coordination through state and federal authentication channels. Corporate and civil instruments reviewed prior to embassy-facing submission.",
    commonDocuments: [
      "Power of Attorney",
      "Corporate Authorization",
      "Commercial Agreements",
      "Affidavit",
      "Personal Civil Records",
    ],
    executionSequence: [
      "Document scope review and preparation coordination",
      "Remote online notarization or in-person execution",
      "Florida Department of State authentication",
      "Federal-level authentication review via U.S. Department of State",
      "Embassy / consular review coordination and destination release to Kuwait",
    ],
    disclaimer:
      "Kuwait requires a multi-tier authentication sequence for Florida-origin documents. Embassy review timelines are determined by the relevant consular authority. Milano Seal coordinates the execution, state, and federal authentication sequence; acceptance by receiving institutions is determined by those institutions.",
    seo: {
      title: "Kuwait Consular Authentication Track — Document Execution Coordination",
      description:
        "Florida-origin document execution and consular authentication coordination for Kuwait. Multi-tier state, federal, and embassy review sequence. Chain-of-custody control.",
      keywords: [
        "Kuwait consular authentication",
        "Kuwait document authentication",
        "Florida documents Kuwait",
        "embassy authentication Kuwait",
        "consular legalization Kuwait",
        "international document Kuwait",
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
