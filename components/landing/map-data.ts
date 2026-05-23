export interface InternationalNode {
  id: string;
  name: string;
  coordinates: { x: number; y: number }; // percentage position in SVG viewBox 0-100 × 0-56
  seoTarget: string;
  schemaContext: {
    destinationCountry: string;
    legalFramework: string;
  };
  laneContext: {
    title: string;
    channel: string;
    reviewProtocol: string;
  };
}

export const FLORIDA_ORIGIN: InternationalNode = {
  id: "florida",
  name: "Florida",
  coordinates: { x: 24, y: 28 },
  seoTarget: "/",
  schemaContext: {
    destinationCountry: "US-FL",
    legalFramework: "Florida Department of State · Division of Corporations",
  },
  laneContext: {
    title: "Florida Department of State Route",
    channel: "State Authentication Channel",
    reviewProtocol: "Document execution origin. All apostille coordination routes from Florida.",
  },
};

export const DESTINATION_NODES: InternationalNode[] = [
  {
    id: "mexico",
    name: "Mexico",
    coordinates: { x: 18, y: 34 },
    seoTarget: "/jurisdictions/mexico-hague-convention-routing",
    schemaContext: {
      destinationCountry: "MX",
      legalFramework: "Hague Apostille Convention · Accession 1995",
    },
    laneContext: {
      title: "Hague Convention Routing",
      channel: "State Authentication Channel",
      reviewProtocol: "Destination-specific review applied to multi-page corporate instruments.",
    },
  },
  {
    id: "brazil",
    name: "Brazil",
    coordinates: { x: 33, y: 47 },
    seoTarget: "/jurisdictions/brazil-hague-convention-routing",
    schemaContext: {
      destinationCountry: "BR",
      legalFramework: "Hague Apostille Convention · Accession 2016",
    },
    laneContext: {
      title: "Hague Convention Routing",
      channel: "State Authentication Channel",
      reviewProtocol: "Validation of notary seals against target consular guidelines.",
    },
  },
  {
    id: "spain",
    name: "Spain",
    coordinates: { x: 48, y: 22 },
    seoTarget: "/jurisdictions/spain-international-release-coordination",
    schemaContext: {
      destinationCountry: "ES",
      legalFramework: "Hague Apostille Convention · EU Direct Recognition",
    },
    laneContext: {
      title: "Hague Convention Routing",
      channel: "State Authentication Channel",
      reviewProtocol: "Civil registry verification and international release coordination.",
    },
  },
  {
    id: "italy",
    name: "Italy",
    coordinates: { x: 54, y: 21 },
    seoTarget: "/jurisdictions/italy-apostille-coordination",
    schemaContext: {
      destinationCountry: "IT",
      legalFramework: "Hague Apostille Convention · EU Direct Recognition",
    },
    laneContext: {
      title: "Hague Convention Routing",
      channel: "Accelerated State Handoff",
      reviewProtocol: "Liaison monitoring through final international release sequence.",
    },
  },
  {
    id: "uae",
    name: "UAE",
    coordinates: { x: 70, y: 31 },
    seoTarget: "/jurisdictions/uae-consular-authentication-track",
    schemaContext: {
      destinationCountry: "AE",
      legalFramework: "Hague Apostille Convention · Accession 2021",
    },
    laneContext: {
      title: "Consular Authentication Track",
      channel: "Embassy / Consular Review",
      reviewProtocol: "Heightened chain-of-custody coordination for consular destination review.",
    },
  },
];

export const ALL_MAP_NODES = [FLORIDA_ORIGIN, ...DESTINATION_NODES];
