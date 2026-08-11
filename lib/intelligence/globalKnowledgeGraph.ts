export type KnowledgeNodeType =
  | "matter"
  | "country"
  | "jurisdiction"
  | "document"
  | "use_case"
  | "authority"
  | "service"
  | "contact"
  | "organization"
  | "partner";

export type KnowledgeEdgeType =
  | "matter_destination"
  | "matter_document"
  | "matter_use_case"
  | "matter_authority"
  | "matter_service"
  | "matter_contact"
  | "matter_organization"
  | "matter_partner"
  | "document_country"
  | "document_use_case"
  | "document_authority"
  | "country_authority"
  | "service_document"
  | "service_country"
  | "organization_contact"
  | "partner_country"
  | "related";

export interface KnowledgeNode {
  id: string;
  type: KnowledgeNodeType;
  label: string;
  canonicalRef?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface KnowledgeEdge {
  id: string;
  type: KnowledgeEdgeType;
  from: string;
  to: string;
  source: "canonical_record" | "verified_registry" | "operator_confirmed";
  metadata?: Record<string, string | number | boolean | null>;
}

export interface GlobalKnowledgeGraph {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  nodeCount: number;
  edgeCount: number;
}

const normalizeId = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export function knowledgeNodeId(type: KnowledgeNodeType, value: string): string {
  return `${type}:${normalizeId(value)}`;
}

/**
 * Canonical graph constructor. It does not scrape, invent, or infer entities.
 * Callers must supply nodes/edges from canonical records, verified registries,
 * or operator-confirmed facts. Duplicate IDs collapse deterministically.
 */
export function createGlobalKnowledgeGraph(input: {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}): GlobalKnowledgeGraph {
  const nodesById = new Map<string, KnowledgeNode>();
  for (const node of input.nodes) {
    if (!node.id.trim() || !node.label.trim()) continue;
    nodesById.set(node.id, node);
  }

  const edgesById = new Map<string, KnowledgeEdge>();
  for (const edge of input.edges) {
    if (!edge.id.trim()) continue;
    if (!nodesById.has(edge.from) || !nodesById.has(edge.to)) continue;
    edgesById.set(edge.id, edge);
  }

  const nodes = [...nodesById.values()].sort((a, b) => a.id.localeCompare(b.id));
  const edges = [...edgesById.values()].sort((a, b) => a.id.localeCompare(b.id));

  return { nodes, edges, nodeCount: nodes.length, edgeCount: edges.length };
}

export interface MatterGraphInput {
  matterId: string;
  destinationCountry?: string | null;
  originJurisdiction?: string | null;
  documentType?: string | null;
  useCase?: string | null;
  receivingAuthority?: string | null;
  services?: string[];
  contactId?: string | null;
  organizationId?: string | null;
  partnerId?: string | null;
}

/**
 * Projects one canonical Matter into graph nodes/edges. This is relationship
 * projection only; it never changes the Matter or makes compliance decisions.
 */
export function matterToKnowledgeGraph(input: MatterGraphInput): GlobalKnowledgeGraph {
  const matterId = knowledgeNodeId("matter", input.matterId);
  const nodes: KnowledgeNode[] = [
    { id: matterId, type: "matter", label: input.matterId, canonicalRef: input.matterId },
  ];
  const edges: KnowledgeEdge[] = [];

  const connect = (
    type: KnowledgeNodeType,
    value: string | null | undefined,
    edgeType: KnowledgeEdgeType,
  ) => {
    const clean = value?.trim();
    if (!clean) return;
    const id = knowledgeNodeId(type, clean);
    nodes.push({ id, type, label: clean, canonicalRef: clean });
    edges.push({
      id: `${matterId}->${id}:${edgeType}`,
      type: edgeType,
      from: matterId,
      to: id,
      source: "canonical_record",
    });
  };

  connect("country", input.destinationCountry, "matter_destination");
  connect("jurisdiction", input.originJurisdiction, "related");
  connect("document", input.documentType, "matter_document");
  connect("use_case", input.useCase, "matter_use_case");
  connect("authority", input.receivingAuthority, "matter_authority");
  connect("contact", input.contactId, "matter_contact");
  connect("organization", input.organizationId, "matter_organization");
  connect("partner", input.partnerId, "matter_partner");

  for (const service of input.services ?? []) {
    connect("service", service, "matter_service");
  }

  return createGlobalKnowledgeGraph({ nodes, edges });
}

export function mergeKnowledgeGraphs(...graphs: GlobalKnowledgeGraph[]): GlobalKnowledgeGraph {
  return createGlobalKnowledgeGraph({
    nodes: graphs.flatMap((graph) => graph.nodes),
    edges: graphs.flatMap((graph) => graph.edges),
  });
}

export function relatedNodes(
  graph: GlobalKnowledgeGraph,
  nodeId: string,
  edgeType?: KnowledgeEdgeType,
): KnowledgeNode[] {
  const ids = new Set<string>();
  for (const edge of graph.edges) {
    if (edgeType && edge.type !== edgeType) continue;
    if (edge.from === nodeId) ids.add(edge.to);
    if (edge.to === nodeId) ids.add(edge.from);
  }
  return graph.nodes.filter((node) => ids.has(node.id));
}
