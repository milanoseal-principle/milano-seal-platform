export type AllianceGraphNodeType = "Matter" | "Partner" | "Organization" | "Jurisdiction" | "Country" | "Procurement" | "Intelligence" | "QA";

export interface AllianceGraphNode {
  id: string;
  type: AllianceGraphNodeType;
  label: string;
}

export interface AllianceGraphEdge {
  from: string;
  to: string;
  label: string;
}

export const ALLIANCE_INTELLIGENCE_GRAPH = {
  nodes: [
    { id: "matter", type: "Matter", label: "Canonical Matter" },
    { id: "partner", type: "Partner", label: "Verified Alliance Partner" },
    { id: "jurisdiction", type: "Jurisdiction", label: "Execution Jurisdiction" },
    { id: "country", type: "Country", label: "Destination Country" },
    { id: "qa", type: "QA", label: "QA Rules" },
    { id: "intelligence", type: "Intelligence", label: "Global Document Intelligence™" },
  ] satisfies AllianceGraphNode[],
  edges: [
    { from: "matter", to: "partner", label: "dispatch readiness" },
    { from: "matter", to: "jurisdiction", label: "execution authority" },
    { from: "matter", to: "country", label: "destination use" },
    { from: "partner", to: "qa", label: "QA accuracy" },
    { from: "qa", to: "intelligence", label: "completed matter feedback" },
  ] satisfies AllianceGraphEdge[],
} as const;
