export type GovernmentGraphNodeType = "Agency" | "Department" | "Buyer" | "Attorney" | "Contract" | "Vendor" | "Opportunity" | "Industry" | "Partner" | "Referral" | "Matter" | "Revenue";
export interface GovernmentGraphNode { id: string; type: GovernmentGraphNodeType; label: string; }
export interface GovernmentGraphEdge { from: string; to: string; label: string; }
export interface GovernmentKnowledgeGraph { nodes: GovernmentGraphNode[]; edges: GovernmentGraphEdge[]; }
export function buildProcurementKnowledgeGraph(): GovernmentKnowledgeGraph { return { nodes: [{ id: "milano-seal", type: "Vendor", label: "Milano Seal" }, { id: "public-sector", type: "Industry", label: "Public Sector" }], edges: [{ from: "milano-seal", to: "public-sector", label: "Procurement Alignment" }] }; }
