export type NodeType =
  | "HAGUE"
  | "CONSULAR"
  | "RON_ORIGIN"
  | "APOSTILLE"
  | "CITIZENSHIP"
  | "CORPORATE"
  | "PRIVATE_CLIENT"
  | "REAL_ESTATE";

export interface InternationalNode {
  id: string;
  name: string;
  nodeType: NodeType;
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
  nodeType: "RON_ORIGIN",
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
    nodeType: "HAGUE",
    coordinates: { x: 18, y: 34 },
    seoTarget: "/countries/mexico",
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
    nodeType: "HAGUE",
    coordinates: { x: 33, y: 47 },
    seoTarget: "/countries/brazil",
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
    nodeType: "HAGUE",
    coordinates: { x: 48, y: 22 },
    seoTarget: "/countries/spain",
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
    nodeType: "HAGUE",
    coordinates: { x: 54, y: 21 },
    seoTarget: "/countries/italy",
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
    nodeType: "HAGUE",
    coordinates: { x: 70, y: 31 },
    seoTarget: "/countries/uae",
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
  {
    id: "portugal",
    name: "Portugal",
    nodeType: "HAGUE",
    coordinates: { x: 45, y: 23 },
    seoTarget: "/countries/portugal",
    schemaContext: {
      destinationCountry: "PT",
      legalFramework: "Hague Apostille Convention · Original Member 1968",
    },
    laneContext: {
      title: "Hague Convention Routing",
      channel: "State Authentication Channel",
      reviewProtocol: "Lusophone bridge route — Portugal IRN registry coordination.",
    },
  },
  {
    id: "greece",
    name: "Greece",
    nodeType: "CITIZENSHIP",
    coordinates: { x: 57, y: 24 },
    seoTarget: "/countries/greece",
    schemaContext: {
      destinationCountry: "GR",
      legalFramework: "Hague Apostille Convention · Member 1985",
    },
    laneContext: {
      title: "Hague Convention Routing",
      channel: "Hellenic Ministry Coordination",
      reviewProtocol: "Diaspora citizenship restoration — Hellenic Ministry of Interior registry.",
    },
  },
];

export const ALL_MAP_NODES = [FLORIDA_ORIGIN, ...DESTINATION_NODES];
